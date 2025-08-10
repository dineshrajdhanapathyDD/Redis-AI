import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { logger } from '../../utils/logger';
import { WorkspaceManager, ActiveUser, UserStatus, CursorPosition, LockState } from './workspace-manager';

export interface SyncEvent {
  type: SyncEventType;
  workspaceId: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

export enum SyncEventType {
  USER_JOINED = 'user_joined',
  USER_LEFT = 'user_left',
  USER_STATUS_CHANGED = 'user_status_changed',
  CURSOR_MOVED = 'cursor_moved',
  CONTENT_CHANGED = 'content_changed',
  KNOWLEDGE_ADDED = 'knowledge_added',
  KNOWLEDGE_UPDATED = 'knowledge_updated',
  KNOWLEDGE_DELETED = 'knowledge_deleted',
  LOCK_ACQUIRED = 'lock_acquired',
  LOCK_RELEASED = 'lock_released',
  SETTINGS_UPDATED = 'settings_updated',
  MESSAGE_SENT = 'message_sent',
  INSIGHT_GENERATED = 'insight_generated'
}

export interface SyncSubscription {
  workspaceId: string;
  userId: string;
  callback: (event: SyncEvent) => void;
}

export interface ConflictResolution {
  strategy: ConflictStrategy;
  resolver?: (conflicts: Conflict[]) => Resolution;
}

export enum ConflictStrategy {
  LAST_WRITE_WINS = 'last_write_wins',
  FIRST_WRITE_WINS = 'first_write_wins',
  MERGE = 'merge',
  MANUAL = 'manual'
}

export interface Conflict {
  id: string;
  resourceId: string;
  conflictType: ConflictType;
  participants: ConflictParticipant[];
  timestamp: Date;
  resolved: boolean;
}

export enum ConflictType {
  CONCURRENT_EDIT = 'concurrent_edit',
  LOCK_VIOLATION = 'lock_violation',
  VERSION_MISMATCH = 'version_mismatch',
  PERMISSION_CONFLICT = 'permission_conflict'
}

export interface ConflictParticipant {
  userId: string;
  action: string;
  timestamp: Date;
  data: any;
}

export interface Resolution {
  action: ResolutionAction;
  data?: any;
  notify?: boolean;
}

export enum ResolutionAction {
  ACCEPT_FIRST = 'accept_first',
  ACCEPT_LAST = 'accept_last',
  MERGE_CHANGES = 'merge_changes',
  REJECT_ALL = 'reject_all',
  MANUAL_RESOLVE = 'manual_resolve'
}

export class SyncEngine extends EventEmitter {
  private redis: Redis;
  private workspaceManager: WorkspaceManager;
  private subscriptions: Map<string, SyncSubscription[]> = new Map();
  private activeUsers: Map<string, Map<string, ActiveUser>> = new Map();
  private locks: Map<string, Map<string, LockState>> = new Map();
  private conflicts: Map<string, Conflict[]> = new Map();
  private readonly SYNC_CHANNEL_PREFIX = 'sync';
  private readonly USER_PRESENCE_PREFIX = 'presence';
  private readonly LOCK_PREFIX = 'lock';
  private readonly CONFLICT_PREFIX = 'conflict';

  constructor(redis: Redis, workspaceManager: WorkspaceManager) {
    super();
    this.redis = redis;
    this.workspaceManager = workspaceManager;
    this.setupRedisSubscriptions();
    this.startPresenceHeartbeat();
  }

  async subscribeToWorkspace(workspaceId: string, userId: string, callback: (event: SyncEvent) => void): Promise<void> {
    const subscription: SyncSubscription = {
      workspaceId,
      userId,
      callback
    };

    if (!this.subscriptions.has(workspaceId)) {
      this.subscriptions.set(workspaceId, []);
      // Subscribe to Redis channel for this workspace
      await this.redis.subscribe(`${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`);
    }

    this.subscriptions.get(workspaceId)!.push(subscription);

    // Update user presence
    await this.updateUserPresence(workspaceId, userId, UserStatus.ONLINE);

    logger.info(`User ${userId} subscribed to workspace ${workspaceId} sync`);
  }

  async unsubscribeFromWorkspace(workspaceId: string, userId: string): Promise<void> {
    const subscriptions = this.subscriptions.get(workspaceId);
    if (!subscriptions) return;

    // Remove user's subscriptions
    const updatedSubscriptions = subscriptions.filter(s => s.userId !== userId);
    
    if (updatedSubscriptions.length === 0) {
      // No more subscribers, unsubscribe from Redis channel
      await this.redis.unsubscribe(`${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`);
      this.subscriptions.delete(workspaceId);
    } else {
      this.subscriptions.set(workspaceId, updatedSubscriptions);
    }

    // Update user presence
    await this.updateUserPresence(workspaceId, userId, UserStatus.OFFLINE);

    logger.info(`User ${userId} unsubscribed from workspace ${workspaceId} sync`);
  }

  async publishEvent(event: SyncEvent): Promise<void> {
    const channel = `${this.SYNC_CHANNEL_PREFIX}:${event.workspaceId}`;
    await this.redis.publish(channel, JSON.stringify(event));
  }

  async updateUserPresence(workspaceId: string, userId: string, status: UserStatus, activity?: string): Promise<void> {
    const presenceKey = `${this.USER_PRESENCE_PREFIX}:${workspaceId}:${userId}`;
    const presence = {
      userId,
      status,
      lastSeen: new Date(),
      currentActivity: activity || ''
    };

    await this.redis.setex(presenceKey, 300, JSON.stringify(presence)); // 5 minute TTL

    // Update local cache
    if (!this.activeUsers.has(workspaceId)) {
      this.activeUsers.set(workspaceId, new Map());
    }
    this.activeUsers.get(workspaceId)!.set(userId, presence);

    // Notify other users
    await this.publishEvent({
      type: SyncEventType.USER_STATUS_CHANGED,
      workspaceId,
      userId,
      timestamp: new Date(),
      data: { status, activity }
    });
  }

  async updateCursorPosition(workspaceId: string, userId: string, position: CursorPosition['position']): Promise<void> {
    const cursorPosition: CursorPosition = {
      userId,
      position,
      timestamp: new Date()
    };

    // Store cursor position with short TTL
    const cursorKey = `cursor:${workspaceId}:${userId}`;
    await this.redis.setex(cursorKey, 30, JSON.stringify(cursorPosition));

    // Notify other users (throttled to avoid spam)
    await this.publishEvent({
      type: SyncEventType.CURSOR_MOVED,
      workspaceId,
      userId,
      timestamp: new Date(),
      data: cursorPosition
    });
  }

  async acquireLock(workspaceId: string, resourceId: string, userId: string, lockType: 'read' | 'write'): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}:${workspaceId}:${resourceId}`;
    const lockData = {
      resourceId,
      lockedBy: userId,
      lockedAt: new Date(),
      lockType
    };

    // Try to acquire lock with expiration
    const acquired = await this.redis.set(lockKey, JSON.stringify(lockData), 'EX', 300, 'NX');
    
    if (acquired === 'OK') {
      // Update local cache
      if (!this.locks.has(workspaceId)) {
        this.locks.set(workspaceId, new Map());
      }
      this.locks.get(workspaceId)!.set(resourceId, lockData);

      // Notify other users
      await this.publishEvent({
        type: SyncEventType.LOCK_ACQUIRED,
        workspaceId,
        userId,
        timestamp: new Date(),
        data: { resourceId, lockType }
      });

      logger.info(`Lock acquired on ${resourceId} by ${userId} in workspace ${workspaceId}`);
      return true;
    }

    return false;
  }

  async releaseLock(workspaceId: string, resourceId: string, userId: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}:${workspaceId}:${resourceId}`;
    
    // Check if user owns the lock
    const lockData = await this.redis.get(lockKey);
    if (lockData) {
      const lock = JSON.parse(lockData) as LockState;
      if (lock.lockedBy === userId) {
        await this.redis.del(lockKey);
        
        // Update local cache
        const workspaceLocks = this.locks.get(workspaceId);
        if (workspaceLocks) {
          workspaceLocks.delete(resourceId);
        }

        // Notify other users
        await this.publishEvent({
          type: SyncEventType.LOCK_RELEASED,
          workspaceId,
          userId,
          timestamp: new Date(),
          data: { resourceId }
        });

        logger.info(`Lock released on ${resourceId} by ${userId} in workspace ${workspaceId}`);
      }
    }
  }

  async detectConflict(workspaceId: string, resourceId: string, userId: string, action: string, data: any): Promise<Conflict | null> {
    // Check for existing locks
    const lockKey = `${this.LOCK_PREFIX}:${workspaceId}:${resourceId}`;
    const lockData = await this.redis.get(lockKey);
    
    if (lockData) {
      const lock = JSON.parse(lockData) as LockState;
      if (lock.lockedBy !== userId && lock.lockType === 'write') {
        // Conflict detected: trying to modify locked resource
        const conflict: Conflict = {
          id: this.generateConflictId(),
          resourceId,
          conflictType: ConflictType.LOCK_VIOLATION,
          participants: [
            {
              userId: lock.lockedBy,
              action: 'lock',
              timestamp: lock.lockedAt,
              data: lock
            },
            {
              userId,
              action,
              timestamp: new Date(),
              data
            }
          ],
          timestamp: new Date(),
          resolved: false
        };

        await this.storeConflict(workspaceId, conflict);
        return conflict;
      }
    }

    return null;
  }

  async resolveConflict(workspaceId: string, conflictId: string, resolution: Resolution): Promise<void> {
    const conflicts = this.conflicts.get(workspaceId) || [];
    const conflict = conflicts.find(c => c.id === conflictId);
    
    if (!conflict) {
      throw new Error(`Conflict ${conflictId} not found`);
    }

    conflict.resolved = true;

    // Apply resolution based on strategy
    switch (resolution.action) {
      case ResolutionAction.ACCEPT_LAST:
        // Accept the most recent change
        break;
      case ResolutionAction.ACCEPT_FIRST:
        // Accept the first change, reject others
        break;
      case ResolutionAction.MERGE_CHANGES:
        // Attempt to merge changes
        break;
      case ResolutionAction.REJECT_ALL:
        // Reject all conflicting changes
        break;
    }

    // Store resolved conflict
    await this.storeConflict(workspaceId, conflict);

    if (resolution.notify) {
      // Notify participants
      for (const participant of conflict.participants) {
        await this.publishEvent({
          type: SyncEventType.CONTENT_CHANGED,
          workspaceId,
          userId: participant.userId,
          timestamp: new Date(),
          data: { conflictId, resolution }
        });
      }
    }

    logger.info(`Conflict ${conflictId} resolved in workspace ${workspaceId}`);
  }

  async getActiveUsers(workspaceId: string): Promise<ActiveUser[]> {
    const users: ActiveUser[] = [];
    const presenceKeys = await this.redis.keys(`${this.USER_PRESENCE_PREFIX}:${workspaceId}:*`);
    
    for (const key of presenceKeys) {
      const presenceData = await this.redis.get(key);
      if (presenceData) {
        users.push(JSON.parse(presenceData));
      }
    }

    return users.filter(user => user.status !== UserStatus.OFFLINE);
  }

  private setupRedisSubscriptions(): void {
    this.redis.on('message', (channel: string, message: string) => {
      try {
        const event = JSON.parse(message) as SyncEvent;
        this.handleSyncEvent(event);
      } catch (error) {
        logger.error(`Failed to parse sync event: ${error.message}`);
      }
    });
  }

  private handleSyncEvent(event: SyncEvent): void {
    const subscriptions = this.subscriptions.get(event.workspaceId);
    if (!subscriptions) return;

    // Notify all subscribers except the event originator
    for (const subscription of subscriptions) {
      if (subscription.userId !== event.userId) {
        try {
          subscription.callback(event);
        } catch (error) {
          logger.error(`Sync callback error: ${error.message}`);
        }
      }
    }

    // Emit event for local handling
    this.emit('syncEvent', event);
  }

  private startPresenceHeartbeat(): void {
    setInterval(async () => {
      // Update presence for all active users
      for (const [workspaceId, users] of this.activeUsers) {
        for (const [userId, user] of users) {
          if (user.status === UserStatus.ONLINE) {
            await this.updateUserPresence(workspaceId, userId, user.status, user.currentActivity);
          }
        }
      }
    }, 60000); // Update every minute
  }

  private async storeConflict(workspaceId: string, conflict: Conflict): Promise<void> {
    const conflictKey = `${this.CONFLICT_PREFIX}:${workspaceId}:${conflict.id}`;
    await this.redis.setex(conflictKey, 86400, JSON.stringify(conflict)); // 24 hour TTL

    // Update local cache
    if (!this.conflicts.has(workspaceId)) {
      this.conflicts.set(workspaceId, []);
    }
    
    const conflicts = this.conflicts.get(workspaceId)!;
    const existingIndex = conflicts.findIndex(c => c.id === conflict.id);
    if (existingIndex >= 0) {
      conflicts[existingIndex] = conflict;
    } else {
      conflicts.push(conflict);
    }
  }

  private generateConflictId(): string {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}