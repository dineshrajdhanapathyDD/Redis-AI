"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncEngine = exports.ResolutionAction = exports.ConflictType = exports.ConflictStrategy = exports.SyncEventType = void 0;
const events_1 = require("events");
const logger_1 = require("../../utils/logger");
const workspace_manager_1 = require("./workspace-manager");
var SyncEventType;
(function (SyncEventType) {
    SyncEventType["USER_JOINED"] = "user_joined";
    SyncEventType["USER_LEFT"] = "user_left";
    SyncEventType["USER_STATUS_CHANGED"] = "user_status_changed";
    SyncEventType["CURSOR_MOVED"] = "cursor_moved";
    SyncEventType["CONTENT_CHANGED"] = "content_changed";
    SyncEventType["KNOWLEDGE_ADDED"] = "knowledge_added";
    SyncEventType["KNOWLEDGE_UPDATED"] = "knowledge_updated";
    SyncEventType["KNOWLEDGE_DELETED"] = "knowledge_deleted";
    SyncEventType["LOCK_ACQUIRED"] = "lock_acquired";
    SyncEventType["LOCK_RELEASED"] = "lock_released";
    SyncEventType["SETTINGS_UPDATED"] = "settings_updated";
    SyncEventType["MESSAGE_SENT"] = "message_sent";
    SyncEventType["INSIGHT_GENERATED"] = "insight_generated";
})(SyncEventType || (exports.SyncEventType = SyncEventType = {}));
var ConflictStrategy;
(function (ConflictStrategy) {
    ConflictStrategy["LAST_WRITE_WINS"] = "last_write_wins";
    ConflictStrategy["FIRST_WRITE_WINS"] = "first_write_wins";
    ConflictStrategy["MERGE"] = "merge";
    ConflictStrategy["MANUAL"] = "manual";
})(ConflictStrategy || (exports.ConflictStrategy = ConflictStrategy = {}));
var ConflictType;
(function (ConflictType) {
    ConflictType["CONCURRENT_EDIT"] = "concurrent_edit";
    ConflictType["LOCK_VIOLATION"] = "lock_violation";
    ConflictType["VERSION_MISMATCH"] = "version_mismatch";
    ConflictType["PERMISSION_CONFLICT"] = "permission_conflict";
})(ConflictType || (exports.ConflictType = ConflictType = {}));
var ResolutionAction;
(function (ResolutionAction) {
    ResolutionAction["ACCEPT_FIRST"] = "accept_first";
    ResolutionAction["ACCEPT_LAST"] = "accept_last";
    ResolutionAction["MERGE_CHANGES"] = "merge_changes";
    ResolutionAction["REJECT_ALL"] = "reject_all";
    ResolutionAction["MANUAL_RESOLVE"] = "manual_resolve";
})(ResolutionAction || (exports.ResolutionAction = ResolutionAction = {}));
class SyncEngine extends events_1.EventEmitter {
    redis;
    workspaceManager;
    subscriptions = new Map();
    activeUsers = new Map();
    locks = new Map();
    conflicts = new Map();
    SYNC_CHANNEL_PREFIX = 'sync';
    USER_PRESENCE_PREFIX = 'presence';
    LOCK_PREFIX = 'lock';
    CONFLICT_PREFIX = 'conflict';
    constructor(redis, workspaceManager) {
        super();
        this.redis = redis;
        this.workspaceManager = workspaceManager;
        this.setupRedisSubscriptions();
        this.startPresenceHeartbeat();
    }
    async subscribeToWorkspace(workspaceId, userId, callback) {
        const subscription = {
            workspaceId,
            userId,
            callback
        };
        if (!this.subscriptions.has(workspaceId)) {
            this.subscriptions.set(workspaceId, []);
            // Subscribe to Redis channel for this workspace
            await this.redis.subscribe(`${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`);
        }
        this.subscriptions.get(workspaceId).push(subscription);
        // Update user presence
        await this.updateUserPresence(workspaceId, userId, workspace_manager_1.UserStatus.ONLINE);
        logger_1.logger.info(`User ${userId} subscribed to workspace ${workspaceId} sync`);
    }
    async unsubscribeFromWorkspace(workspaceId, userId) {
        const subscriptions = this.subscriptions.get(workspaceId);
        if (!subscriptions)
            return;
        // Remove user's subscriptions
        const updatedSubscriptions = subscriptions.filter(s => s.userId !== userId);
        if (updatedSubscriptions.length === 0) {
            // No more subscribers, unsubscribe from Redis channel
            await this.redis.unsubscribe(`${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`);
            this.subscriptions.delete(workspaceId);
        }
        else {
            this.subscriptions.set(workspaceId, updatedSubscriptions);
        }
        // Update user presence
        await this.updateUserPresence(workspaceId, userId, workspace_manager_1.UserStatus.OFFLINE);
        logger_1.logger.info(`User ${userId} unsubscribed from workspace ${workspaceId} sync`);
    }
    async publishEvent(event) {
        const channel = `${this.SYNC_CHANNEL_PREFIX}:${event.workspaceId}`;
        await this.redis.publish(channel, JSON.stringify(event));
    }
    async updateUserPresence(workspaceId, userId, status, activity) {
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
        this.activeUsers.get(workspaceId).set(userId, presence);
        // Notify other users
        await this.publishEvent({
            type: SyncEventType.USER_STATUS_CHANGED,
            workspaceId,
            userId,
            timestamp: new Date(),
            data: { status, activity }
        });
    }
    async updateCursorPosition(workspaceId, userId, position) {
        const cursorPosition = {
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
    async acquireLock(workspaceId, resourceId, userId, lockType) {
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
            this.locks.get(workspaceId).set(resourceId, lockData);
            // Notify other users
            await this.publishEvent({
                type: SyncEventType.LOCK_ACQUIRED,
                workspaceId,
                userId,
                timestamp: new Date(),
                data: { resourceId, lockType }
            });
            logger_1.logger.info(`Lock acquired on ${resourceId} by ${userId} in workspace ${workspaceId}`);
            return true;
        }
        return false;
    }
    async releaseLock(workspaceId, resourceId, userId) {
        const lockKey = `${this.LOCK_PREFIX}:${workspaceId}:${resourceId}`;
        // Check if user owns the lock
        const lockData = await this.redis.get(lockKey);
        if (lockData) {
            const lock = JSON.parse(lockData);
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
                logger_1.logger.info(`Lock released on ${resourceId} by ${userId} in workspace ${workspaceId}`);
            }
        }
    }
    async detectConflict(workspaceId, resourceId, userId, action, data) {
        // Check for existing locks
        const lockKey = `${this.LOCK_PREFIX}:${workspaceId}:${resourceId}`;
        const lockData = await this.redis.get(lockKey);
        if (lockData) {
            const lock = JSON.parse(lockData);
            if (lock.lockedBy !== userId && lock.lockType === 'write') {
                // Conflict detected: trying to modify locked resource
                const conflict = {
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
    async resolveConflict(workspaceId, conflictId, resolution) {
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
        logger_1.logger.info(`Conflict ${conflictId} resolved in workspace ${workspaceId}`);
    }
    async getActiveUsers(workspaceId) {
        const users = [];
        const presenceKeys = await this.redis.keys(`${this.USER_PRESENCE_PREFIX}:${workspaceId}:*`);
        for (const key of presenceKeys) {
            const presenceData = await this.redis.get(key);
            if (presenceData) {
                users.push(JSON.parse(presenceData));
            }
        }
        return users.filter(user => user.status !== workspace_manager_1.UserStatus.OFFLINE);
    }
    setupRedisSubscriptions() {
        this.redis.on('message', (channel, message) => {
            try {
                const event = JSON.parse(message);
                this.handleSyncEvent(event);
            }
            catch (error) {
                logger_1.logger.error(`Failed to parse sync event: ${error.message}`);
            }
        });
    }
    handleSyncEvent(event) {
        const subscriptions = this.subscriptions.get(event.workspaceId);
        if (!subscriptions)
            return;
        // Notify all subscribers except the event originator
        for (const subscription of subscriptions) {
            if (subscription.userId !== event.userId) {
                try {
                    subscription.callback(event);
                }
                catch (error) {
                    logger_1.logger.error(`Sync callback error: ${error.message}`);
                }
            }
        }
        // Emit event for local handling
        this.emit('syncEvent', event);
    }
    startPresenceHeartbeat() {
        setInterval(async () => {
            // Update presence for all active users
            for (const [workspaceId, users] of this.activeUsers) {
                for (const [userId, user] of users) {
                    if (user.status === workspace_manager_1.UserStatus.ONLINE) {
                        await this.updateUserPresence(workspaceId, userId, user.status, user.currentActivity);
                    }
                }
            }
        }, 60000); // Update every minute
    }
    async storeConflict(workspaceId, conflict) {
        const conflictKey = `${this.CONFLICT_PREFIX}:${workspaceId}:${conflict.id}`;
        await this.redis.setex(conflictKey, 86400, JSON.stringify(conflict)); // 24 hour TTL
        // Update local cache
        if (!this.conflicts.has(workspaceId)) {
            this.conflicts.set(workspaceId, []);
        }
        const conflicts = this.conflicts.get(workspaceId);
        const existingIndex = conflicts.findIndex(c => c.id === conflict.id);
        if (existingIndex >= 0) {
            conflicts[existingIndex] = conflict;
        }
        else {
            conflicts.push(conflict);
        }
    }
    generateConflictId() {
        return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.SyncEngine = SyncEngine;
//# sourceMappingURL=sync-engine.js.map