import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { CollaboratorRole, Permission, Workspace } from './workspace-manager';

export interface AccessPolicy {
  workspaceId: string;
  resourceType: ResourceType;
  resourceId?: string;
  permissions: PermissionRule[];
  inheritanceRules: InheritanceRule[];
}

export enum ResourceType {
  WORKSPACE = 'workspace',
  KNOWLEDGE = 'knowledge',
  MESSAGE = 'message',
  INSIGHT = 'insight',
  SETTINGS = 'settings',
  COLLABORATOR = 'collaborator'
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

export enum ConditionType {
  TIME_BASED = 'time_based',
  LOCATION_BASED = 'location_based',
  CONTENT_BASED = 'content_based',
  USER_ATTRIBUTE = 'user_attribute',
  RESOURCE_ATTRIBUTE = 'resource_attribute'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  IN = 'in',
  NOT_IN = 'not_in'
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

export enum AuditAction {
  ACCESS_GRANTED = 'access_granted',
  ACCESS_DENIED = 'access_denied',
  PERMISSION_CHANGED = 'permission_changed',
  ROLE_CHANGED = 'role_changed',
  POLICY_UPDATED = 'policy_updated'
}

export class AccessControl {
  private redis: Redis;
  private readonly POLICY_PREFIX = 'access_policy';
  private readonly AUDIT_PREFIX = 'access_audit';
  private readonly CACHE_PREFIX = 'access_cache';
  private readonly CACHE_TTL = 300; // 5 minutes

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async checkAccess(request: AccessRequest): Promise<AccessResult> {
    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResult = await this.redis.get(cacheKey);
    
    if (cachedResult) {
      const result = JSON.parse(cachedResult) as AccessResult;
      if (!result.expiresAt || new Date() < new Date(result.expiresAt)) {
        return result;
      }
    }

    // Get workspace and user role
    const workspace = await this.getWorkspace(request.workspaceId);
    if (!workspace) {
      const result: AccessResult = {
        granted: false,
        reason: 'Workspace not found'
      };
      await this.auditAccess(request, result, AuditAction.ACCESS_DENIED);
      return result;
    }

    const collaborator = workspace.collaborators.find(c => c.userId === request.userId);
    if (!collaborator) {
      const result: AccessResult = {
        granted: false,
        reason: 'User is not a collaborator'
      };
      await this.auditAccess(request, result, AuditAction.ACCESS_DENIED);
      return result;
    }

    // Check basic role permissions
    if (!collaborator.permissions.includes(request.permission)) {
      const result: AccessResult = {
        granted: false,
        reason: `Role ${collaborator.role} does not have ${request.permission} permission`
      };
      await this.auditAccess(request, result, AuditAction.ACCESS_DENIED);
      return result;
    }

    // Get and evaluate access policy
    const policy = await this.getAccessPolicy(request.workspaceId, request.resourceType, request.resourceId);
    const result = await this.evaluatePolicy(policy, request, collaborator.role);

    // Cache the result
    await this.redis.setex(cacheKey, this.CACHE_TTL, JSON.stringify(result));

    // Audit the access
    const auditAction = result.granted ? AuditAction.ACCESS_GRANTED : AuditAction.ACCESS_DENIED;
    await this.auditAccess(request, result, auditAction);

    return result;
  }

  async createAccessPolicy(policy: AccessPolicy): Promise<void> {
    const policyKey = this.generatePolicyKey(policy.workspaceId, policy.resourceType, policy.resourceId);
    await this.redis.hset(policyKey, 'data', JSON.stringify(policy));
    
    logger.info(`Created access policy for ${policy.resourceType} in workspace ${policy.workspaceId}`);
  }

  async updateAccessPolicy(workspaceId: string, resourceType: ResourceType, resourceId: string | undefined, updates: Partial<AccessPolicy>): Promise<void> {
    const policy = await this.getAccessPolicy(workspaceId, resourceType, resourceId);
    if (!policy) {
      throw new Error('Access policy not found');
    }

    const updatedPolicy = { ...policy, ...updates };
    const policyKey = this.generatePolicyKey(workspaceId, resourceType, resourceId);
    await this.redis.hset(policyKey, 'data', JSON.stringify(updatedPolicy));

    // Clear related cache entries
    await this.clearAccessCache(workspaceId, resourceType, resourceId);

    logger.info(`Updated access policy for ${resourceType} in workspace ${workspaceId}`);
  }

  async deleteAccessPolicy(workspaceId: string, resourceType: ResourceType, resourceId?: string): Promise<void> {
    const policyKey = this.generatePolicyKey(workspaceId, resourceType, resourceId);
    await this.redis.del(policyKey);

    // Clear related cache entries
    await this.clearAccessCache(workspaceId, resourceType, resourceId);

    logger.info(`Deleted access policy for ${resourceType} in workspace ${workspaceId}`);
  }

  async grantPermission(workspaceId: string, userId: string, permission: Permission, resourceType?: ResourceType, resourceId?: string): Promise<void> {
    // This would typically update the user's role or create a specific permission grant
    // For now, we'll create a temporary permission policy
    
    const policy: AccessPolicy = {
      workspaceId,
      resourceType: resourceType || ResourceType.WORKSPACE,
      resourceId,
      permissions: [{
        role: CollaboratorRole.VIEWER, // Base role
        permissions: [permission],
        conditions: [{
          type: ConditionType.USER_ATTRIBUTE,
          value: userId,
          operator: ConditionOperator.EQUALS
        }]
      }],
      inheritanceRules: []
    };

    await this.createAccessPolicy(policy);

    // Audit the permission grant
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId,
      workspaceId,
      resourceType: resourceType || ResourceType.WORKSPACE,
      resourceId,
      permission,
      action: AuditAction.PERMISSION_CHANGED,
      result: { granted: true, reason: 'Permission granted' },
      timestamp: new Date()
    };

    await this.storeAuditLog(auditLog);
    logger.info(`Granted ${permission} permission to user ${userId} in workspace ${workspaceId}`);
  }

  async revokePermission(workspaceId: string, userId: string, permission: Permission, resourceType?: ResourceType, resourceId?: string): Promise<void> {
    // Remove specific permission policy
    await this.deleteAccessPolicy(workspaceId, resourceType || ResourceType.WORKSPACE, resourceId);

    // Clear user's access cache
    await this.clearUserAccessCache(workspaceId, userId);

    // Audit the permission revocation
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId,
      workspaceId,
      resourceType: resourceType || ResourceType.WORKSPACE,
      resourceId,
      permission,
      action: AuditAction.PERMISSION_CHANGED,
      result: { granted: false, reason: 'Permission revoked' },
      timestamp: new Date()
    };

    await this.storeAuditLog(auditLog);
    logger.info(`Revoked ${permission} permission from user ${userId} in workspace ${workspaceId}`);
  }

  async getAuditLogs(workspaceId: string, userId?: string, limit: number = 100): Promise<AuditLog[]> {
    const pattern = userId 
      ? `${this.AUDIT_PREFIX}:${workspaceId}:${userId}:*`
      : `${this.AUDIT_PREFIX}:${workspaceId}:*`;
    
    const keys = await this.redis.keys(pattern);
    const logs: AuditLog[] = [];

    for (const key of keys.slice(0, limit)) {
      const logData = await this.redis.get(key);
      if (logData) {
        logs.push(JSON.parse(logData));
      }
    }

    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async getAccessPolicy(workspaceId: string, resourceType: ResourceType, resourceId?: string): Promise<AccessPolicy | null> {
    const policyKey = this.generatePolicyKey(workspaceId, resourceType, resourceId);
    const policyData = await this.redis.hget(policyKey, 'data');
    
    if (!policyData) {
      // Try to get default policy for resource type
      const defaultPolicyKey = this.generatePolicyKey(workspaceId, resourceType);
      const defaultPolicyData = await this.redis.hget(defaultPolicyKey, 'data');
      return defaultPolicyData ? JSON.parse(defaultPolicyData) : null;
    }

    return JSON.parse(policyData);
  }

  private async evaluatePolicy(policy: AccessPolicy | null, request: AccessRequest, userRole: CollaboratorRole): Promise<AccessResult> {
    if (!policy) {
      // No specific policy, use default role-based access
      return {
        granted: true,
        reason: 'Default role-based access'
      };
    }

    // Find matching permission rule
    const matchingRule = policy.permissions.find(rule => 
      rule.role === userRole && rule.permissions.includes(request.permission)
    );

    if (!matchingRule) {
      return {
        granted: false,
        reason: 'No matching permission rule found'
      };
    }

    // Evaluate conditions if present
    if (matchingRule.conditions && matchingRule.conditions.length > 0) {
      for (const condition of matchingRule.conditions) {
        const conditionResult = await this.evaluateCondition(condition, request);
        if (!conditionResult) {
          return {
            granted: false,
            reason: `Access condition not met: ${condition.type}`,
            conditions: matchingRule.conditions
          };
        }
      }
    }

    return {
      granted: true,
      reason: 'Policy evaluation successful'
    };
  }

  private async evaluateCondition(condition: AccessCondition, request: AccessRequest): Promise<boolean> {
    switch (condition.type) {
      case ConditionType.TIME_BASED:
        return this.evaluateTimeCondition(condition, request);
      case ConditionType.USER_ATTRIBUTE:
        return this.evaluateUserCondition(condition, request);
      case ConditionType.CONTENT_BASED:
        return this.evaluateContentCondition(condition, request);
      default:
        return true; // Unknown condition types are ignored
    }
  }

  private evaluateTimeCondition(condition: AccessCondition, request: AccessRequest): boolean {
    const now = request.context?.timestamp || new Date();
    const conditionTime = new Date(condition.value);

    switch (condition.operator) {
      case ConditionOperator.GREATER_THAN:
        return now > conditionTime;
      case ConditionOperator.LESS_THAN:
        return now < conditionTime;
      default:
        return true;
    }
  }

  private evaluateUserCondition(condition: AccessCondition, request: AccessRequest): boolean {
    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return request.userId === condition.value;
      case ConditionOperator.NOT_EQUALS:
        return request.userId !== condition.value;
      case ConditionOperator.IN:
        return Array.isArray(condition.value) && condition.value.includes(request.userId);
      default:
        return true;
    }
  }

  private evaluateContentCondition(condition: AccessCondition, request: AccessRequest): boolean {
    // This would evaluate content-based conditions
    // Implementation depends on specific content attributes
    return true;
  }

  private async auditAccess(request: AccessRequest, result: AccessResult, action: AuditAction): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId: request.userId,
      workspaceId: request.workspaceId,
      resourceType: request.resourceType,
      resourceId: request.resourceId,
      permission: request.permission,
      action,
      result,
      timestamp: new Date(),
      context: request.context
    };

    await this.storeAuditLog(auditLog);
  }

  private async storeAuditLog(auditLog: AuditLog): Promise<void> {
    const auditKey = `${this.AUDIT_PREFIX}:${auditLog.workspaceId}:${auditLog.userId}:${auditLog.id}`;
    await this.redis.setex(auditKey, 2592000, JSON.stringify(auditLog)); // 30 days TTL
  }

  private async getWorkspace(workspaceId: string): Promise<Workspace | null> {
    // This should integrate with WorkspaceManager
    // For now, we'll return a mock implementation
    const workspaceData = await this.redis.hget(`workspace:${workspaceId}`, 'data');
    return workspaceData ? JSON.parse(workspaceData) : null;
  }

  private async clearAccessCache(workspaceId: string, resourceType: ResourceType, resourceId?: string): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}:${workspaceId}:${resourceType}:${resourceId || '*'}:*`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private async clearUserAccessCache(workspaceId: string, userId: string): Promise<void> {
    const pattern = `${this.CACHE_PREFIX}:${workspaceId}:*:*:${userId}`;
    const keys = await this.redis.keys(pattern);
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }
  }

  private generateCacheKey(request: AccessRequest): string {
    return `${this.CACHE_PREFIX}:${request.workspaceId}:${request.resourceType}:${request.resourceId || 'default'}:${request.userId}:${request.permission}`;
  }

  private generatePolicyKey(workspaceId: string, resourceType: ResourceType, resourceId?: string): string {
    return `${this.POLICY_PREFIX}:${workspaceId}:${resourceType}:${resourceId || 'default'}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}