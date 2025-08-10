import { Redis } from 'ioredis';
import { CollaboratorRole, Permission } from './workspace-manager';
export interface AccessPolicy {
    workspaceId: string;
    resourceType: ResourceType;
    resourceId?: string;
    permissions: PermissionRule[];
    inheritanceRules: InheritanceRule[];
}
export declare enum ResourceType {
    WORKSPACE = "workspace",
    KNOWLEDGE = "knowledge",
    MESSAGE = "message",
    INSIGHT = "insight",
    SETTINGS = "settings",
    COLLABORATOR = "collaborator"
}
export interface PermissionRule {
    role: CollaboratorRole;
    permissions: Permission[];
    conditions?: AccessCondition[];
}
export interface AccessCondition {
    type: ConditionType;
    value: any;
    operator: ConditionOperator;
}
export declare enum ConditionType {
    TIME_BASED = "time_based",
    LOCATION_BASED = "location_based",
    CONTENT_BASED = "content_based",
    USER_ATTRIBUTE = "user_attribute",
    RESOURCE_ATTRIBUTE = "resource_attribute"
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    IN = "in",
    NOT_IN = "not_in"
}
export interface InheritanceRule {
    parentResource: ResourceType;
    childResource: ResourceType;
    inheritedPermissions: Permission[];
}
export interface AccessRequest {
    userId: string;
    workspaceId: string;
    resourceType: ResourceType;
    resourceId?: string;
    permission: Permission;
    context?: AccessContext;
}
export interface AccessContext {
    timestamp: Date;
    userAgent?: string;
    ipAddress?: string;
    sessionId?: string;
    additionalData?: Record<string, any>;
}
export interface AccessResult {
    granted: boolean;
    reason: string;
    conditions?: AccessCondition[];
    expiresAt?: Date;
}
export interface AuditLog {
    id: string;
    userId: string;
    workspaceId: string;
    resourceType: ResourceType;
    resourceId?: string;
    permission: Permission;
    action: AuditAction;
    result: AccessResult;
    timestamp: Date;
    context?: AccessContext;
}
export declare enum AuditAction {
    ACCESS_GRANTED = "access_granted",
    ACCESS_DENIED = "access_denied",
    PERMISSION_CHANGED = "permission_changed",
    ROLE_CHANGED = "role_changed",
    POLICY_UPDATED = "policy_updated"
}
export declare class AccessControl {
    private redis;
    private readonly POLICY_PREFIX;
    private readonly AUDIT_PREFIX;
    private readonly CACHE_PREFIX;
    private readonly CACHE_TTL;
    constructor(redis: Redis);
    checkAccess(request: AccessRequest): Promise<AccessResult>;
    createAccessPolicy(policy: AccessPolicy): Promise<void>;
    updateAccessPolicy(workspaceId: string, resourceType: ResourceType, resourceId: string | undefined, updates: Partial<AccessPolicy>): Promise<void>;
    deleteAccessPolicy(workspaceId: string, resourceType: ResourceType, resourceId?: string): Promise<void>;
    grantPermission(workspaceId: string, userId: string, permission: Permission, resourceType?: ResourceType, resourceId?: string): Promise<void>;
    revokePermission(workspaceId: string, userId: string, permission: Permission, resourceType?: ResourceType, resourceId?: string): Promise<void>;
    getAuditLogs(workspaceId: string, userId?: string, limit?: number): Promise<AuditLog[]>;
    private getAccessPolicy;
    private evaluatePolicy;
    private evaluateCondition;
    private evaluateTimeCondition;
    private evaluateUserCondition;
    private evaluateContentCondition;
    private auditAccess;
    private storeAuditLog;
    private getWorkspace;
    private clearAccessCache;
    private clearUserAccessCache;
    private generateCacheKey;
    private generatePolicyKey;
    private generateAuditId;
}
//# sourceMappingURL=access-control.d.ts.map