"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessControl = exports.AuditAction = exports.ConditionOperator = exports.ConditionType = exports.ResourceType = void 0;
const logger_1 = require("../../utils/logger");
const workspace_manager_1 = require("./workspace-manager");
var ResourceType;
(function (ResourceType) {
    ResourceType["WORKSPACE"] = "workspace";
    ResourceType["KNOWLEDGE"] = "knowledge";
    ResourceType["MESSAGE"] = "message";
    ResourceType["INSIGHT"] = "insight";
    ResourceType["SETTINGS"] = "settings";
    ResourceType["COLLABORATOR"] = "collaborator";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["TIME_BASED"] = "time_based";
    ConditionType["LOCATION_BASED"] = "location_based";
    ConditionType["CONTENT_BASED"] = "content_based";
    ConditionType["USER_ATTRIBUTE"] = "user_attribute";
    ConditionType["RESOURCE_ATTRIBUTE"] = "resource_attribute";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["NOT_EQUALS"] = "not_equals";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["IN"] = "in";
    ConditionOperator["NOT_IN"] = "not_in";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["ACCESS_GRANTED"] = "access_granted";
    AuditAction["ACCESS_DENIED"] = "access_denied";
    AuditAction["PERMISSION_CHANGED"] = "permission_changed";
    AuditAction["ROLE_CHANGED"] = "role_changed";
    AuditAction["POLICY_UPDATED"] = "policy_updated";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
class AccessControl {
    redis;
    POLICY_PREFIX = 'access_policy';
    AUDIT_PREFIX = 'access_audit';
    CACHE_PREFIX = 'access_cache';
    CACHE_TTL = 300; // 5 minutes
    constructor(redis) {
        this.redis = redis;
    }
    async checkAccess(request) {
        // Check cache first
        const cacheKey = this.generateCacheKey(request);
        const cachedResult = await this.redis.get(cacheKey);
        if (cachedResult) {
            const result = JSON.parse(cachedResult);
            if (!result.expiresAt || new Date() < new Date(result.expiresAt)) {
                return result;
            }
        }
        // Get workspace and user role
        const workspace = await this.getWorkspace(request.workspaceId);
        if (!workspace) {
            const result = {
                granted: false,
                reason: 'Workspace not found'
            };
            await this.auditAccess(request, result, AuditAction.ACCESS_DENIED);
            return result;
        }
        const collaborator = workspace.collaborators.find(c => c.userId === request.userId);
        if (!collaborator) {
            const result = {
                granted: false,
                reason: 'User is not a collaborator'
            };
            await this.auditAccess(request, result, AuditAction.ACCESS_DENIED);
            return result;
        }
        // Check basic role permissions
        if (!collaborator.permissions.includes(request.permission)) {
            const result = {
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
    async createAccessPolicy(policy) {
        const policyKey = this.generatePolicyKey(policy.workspaceId, policy.resourceType, policy.resourceId);
        await this.redis.hset(policyKey, 'data', JSON.stringify(policy));
        logger_1.logger.info(`Created access policy for ${policy.resourceType} in workspace ${policy.workspaceId}`);
    }
    async updateAccessPolicy(workspaceId, resourceType, resourceId, updates) {
        const policy = await this.getAccessPolicy(workspaceId, resourceType, resourceId);
        if (!policy) {
            throw new Error('Access policy not found');
        }
        const updatedPolicy = { ...policy, ...updates };
        const policyKey = this.generatePolicyKey(workspaceId, resourceType, resourceId);
        await this.redis.hset(policyKey, 'data', JSON.stringify(updatedPolicy));
        // Clear related cache entries
        await this.clearAccessCache(workspaceId, resourceType, resourceId);
        logger_1.logger.info(`Updated access policy for ${resourceType} in workspace ${workspaceId}`);
    }
    async deleteAccessPolicy(workspaceId, resourceType, resourceId) {
        const policyKey = this.generatePolicyKey(workspaceId, resourceType, resourceId);
        await this.redis.del(policyKey);
        // Clear related cache entries
        await this.clearAccessCache(workspaceId, resourceType, resourceId);
        logger_1.logger.info(`Deleted access policy for ${resourceType} in workspace ${workspaceId}`);
    }
    async grantPermission(workspaceId, userId, permission, resourceType, resourceId) {
        // This would typically update the user's role or create a specific permission grant
        // For now, we'll create a temporary permission policy
        const policy = {
            workspaceId,
            resourceType: resourceType || ResourceType.WORKSPACE,
            resourceId,
            permissions: [{
                    role: workspace_manager_1.CollaboratorRole.VIEWER, // Base role
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
        const auditLog = {
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
        logger_1.logger.info(`Granted ${permission} permission to user ${userId} in workspace ${workspaceId}`);
    }
    async revokePermission(workspaceId, userId, permission, resourceType, resourceId) {
        // Remove specific permission policy
        await this.deleteAccessPolicy(workspaceId, resourceType || ResourceType.WORKSPACE, resourceId);
        // Clear user's access cache
        await this.clearUserAccessCache(workspaceId, userId);
        // Audit the permission revocation
        const auditLog = {
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
        logger_1.logger.info(`Revoked ${permission} permission from user ${userId} in workspace ${workspaceId}`);
    }
    async getAuditLogs(workspaceId, userId, limit = 100) {
        const pattern = userId
            ? `${this.AUDIT_PREFIX}:${workspaceId}:${userId}:*`
            : `${this.AUDIT_PREFIX}:${workspaceId}:*`;
        const keys = await this.redis.keys(pattern);
        const logs = [];
        for (const key of keys.slice(0, limit)) {
            const logData = await this.redis.get(key);
            if (logData) {
                logs.push(JSON.parse(logData));
            }
        }
        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getAccessPolicy(workspaceId, resourceType, resourceId) {
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
    async evaluatePolicy(policy, request, userRole) {
        if (!policy) {
            // No specific policy, use default role-based access
            return {
                granted: true,
                reason: 'Default role-based access'
            };
        }
        // Find matching permission rule
        const matchingRule = policy.permissions.find(rule => rule.role === userRole && rule.permissions.includes(request.permission));
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
    async evaluateCondition(condition, request) {
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
    evaluateTimeCondition(condition, request) {
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
    evaluateUserCondition(condition, request) {
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
    evaluateContentCondition(condition, request) {
        // This would evaluate content-based conditions
        // Implementation depends on specific content attributes
        return true;
    }
    async auditAccess(request, result, action) {
        const auditLog = {
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
    async storeAuditLog(auditLog) {
        const auditKey = `${this.AUDIT_PREFIX}:${auditLog.workspaceId}:${auditLog.userId}:${auditLog.id}`;
        await this.redis.setex(auditKey, 2592000, JSON.stringify(auditLog)); // 30 days TTL
    }
    async getWorkspace(workspaceId) {
        // This should integrate with WorkspaceManager
        // For now, we'll return a mock implementation
        const workspaceData = await this.redis.hget(`workspace:${workspaceId}`, 'data');
        return workspaceData ? JSON.parse(workspaceData) : null;
    }
    async clearAccessCache(workspaceId, resourceType, resourceId) {
        const pattern = `${this.CACHE_PREFIX}:${workspaceId}:${resourceType}:${resourceId || '*'}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    async clearUserAccessCache(workspaceId, userId) {
        const pattern = `${this.CACHE_PREFIX}:${workspaceId}:*:*:${userId}`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
    }
    generateCacheKey(request) {
        return `${this.CACHE_PREFIX}:${request.workspaceId}:${request.resourceType}:${request.resourceId || 'default'}:${request.userId}:${request.permission}`;
    }
    generatePolicyKey(workspaceId, resourceType, resourceId) {
        return `${this.POLICY_PREFIX}:${workspaceId}:${resourceType}:${resourceId || 'default'}`;
    }
    generateAuditId() {
        return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AccessControl = AccessControl;
//# sourceMappingURL=access-control.js.map