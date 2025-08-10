import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { WorkspaceManager, ActiveUser, UserStatus, CursorPosition } from './workspace-manager';
export interface SyncEvent {
    type: SyncEventType;
    workspaceId: string;
    userId: string;
    timestamp: Date;
    data?: any;
}
export declare enum SyncEventType {
    USER_JOINED = "user_joined",
    USER_LEFT = "user_left",
    USER_STATUS_CHANGED = "user_status_changed",
    CURSOR_MOVED = "cursor_moved",
    CONTENT_CHANGED = "content_changed",
    KNOWLEDGE_ADDED = "knowledge_added",
    KNOWLEDGE_UPDATED = "knowledge_updated",
    KNOWLEDGE_DELETED = "knowledge_deleted",
    LOCK_ACQUIRED = "lock_acquired",
    LOCK_RELEASED = "lock_released",
    SETTINGS_UPDATED = "settings_updated",
    MESSAGE_SENT = "message_sent",
    INSIGHT_GENERATED = "insight_generated"
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
export declare enum ConflictStrategy {
    LAST_WRITE_WINS = "last_write_wins",
    FIRST_WRITE_WINS = "first_write_wins",
    MERGE = "merge",
    MANUAL = "manual"
}
export interface Conflict {
    id: string;
    resourceId: string;
    conflictType: ConflictType;
    participants: ConflictParticipant[];
    timestamp: Date;
    resolved: boolean;
}
export declare enum ConflictType {
    CONCURRENT_EDIT = "concurrent_edit",
    LOCK_VIOLATION = "lock_violation",
    VERSION_MISMATCH = "version_mismatch",
    PERMISSION_CONFLICT = "permission_conflict"
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
export declare enum ResolutionAction {
    ACCEPT_FIRST = "accept_first",
    ACCEPT_LAST = "accept_last",
    MERGE_CHANGES = "merge_changes",
    REJECT_ALL = "reject_all",
    MANUAL_RESOLVE = "manual_resolve"
}
export declare class SyncEngine extends EventEmitter {
    private redis;
    private workspaceManager;
    private subscriptions;
    private activeUsers;
    private locks;
    private conflicts;
    private readonly SYNC_CHANNEL_PREFIX;
    private readonly USER_PRESENCE_PREFIX;
    private readonly LOCK_PREFIX;
    private readonly CONFLICT_PREFIX;
    constructor(redis: Redis, workspaceManager: WorkspaceManager);
    subscribeToWorkspace(workspaceId: string, userId: string, callback: (event: SyncEvent) => void): Promise<void>;
    unsubscribeFromWorkspace(workspaceId: string, userId: string): Promise<void>;
    publishEvent(event: SyncEvent): Promise<void>;
    updateUserPresence(workspaceId: string, userId: string, status: UserStatus, activity?: string): Promise<void>;
    updateCursorPosition(workspaceId: string, userId: string, position: CursorPosition['position']): Promise<void>;
    acquireLock(workspaceId: string, resourceId: string, userId: string, lockType: 'read' | 'write'): Promise<boolean>;
    releaseLock(workspaceId: string, resourceId: string, userId: string): Promise<void>;
    detectConflict(workspaceId: string, resourceId: string, userId: string, action: string, data: any): Promise<Conflict | null>;
    resolveConflict(workspaceId: string, conflictId: string, resolution: Resolution): Promise<void>;
    getActiveUsers(workspaceId: string): Promise<ActiveUser[]>;
    private setupRedisSubscriptions;
    private handleSyncEvent;
    private startPresenceHeartbeat;
    private storeConflict;
    private generateConflictId;
}
//# sourceMappingURL=sync-engine.d.ts.map