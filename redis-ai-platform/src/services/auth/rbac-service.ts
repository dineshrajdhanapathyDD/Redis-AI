import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import {
  User,
  Role,
  Permission,
  PermissionCondition,
  WorkspacePermissions,
  WorkspaceRole,
  WorkspacePermission,
  AccessControlList,
  SecurityAuditLog,
} from './types';

export class RBACService {
  private redis: Redis;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  /**
   * Initialize default roles and permissions
   */
  async initializeDefaultRoles(): Promise<void> {
    try {
      const defaultRoles = this.getDefaultRoles();
      
      for (const role of defaultRoles) {
        await this.createRole(role);
      }

      logger.info('Default roles initialized');
    } catch (error) {
      logger.error('Error initializing default roles:', error);
      throw error;
    }
  }

  /**
   * Create a new role
   */
  async createRole(role: Role): Promise<void> {
    try {
      await this.redis.hset('roles', role.id, JSON.stringify(role));
      
      // Index role by name for quick lookup
      await this.redis.hset('roles_by_name', role.name, role.id);

      logger.info(`Role created: ${role.name}`);
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    try {
      const roleData = await this.redis.hget('roles', roleId);
      return roleData ? JSON.parse(roleData) : null;
    } catch (error) {
      logger.error('Error getting role:', error);
      return null;
    }
  }

  /**
   * Get role by name
   */
  async getRoleByName(roleName: string): Promise<Role | null> {
    try {
      const roleId = await this.redis.hget('roles_by_name', roleName);
      if (!roleId) return null;
      
      return await this.getRole(roleId);
    } catch (error) {
      logger.error('Error getting role by name:', error);
      return null;
    }
  }

  /**
   * Update role
   */
  async updateRole(role: Role): Promise<void> {
    try {
      role.updatedAt = new Date();
      await this.redis.hset('roles', role.id, JSON.stringify(role));
      
      logger.info(`Role updated: ${role.name}`);
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<void> {
    try {
      const role = await this.getRole(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      if (role.isSystem) {
        throw new Error('Cannot delete system role');
      }

      await this.redis.hdel('roles', roleId);
      await this.redis.hdel('roles_by_name', role.name);

      logger.info(`Role deleted: ${role.name}`);
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    try {
      const role = await this.getRole(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      await this.redis.sadd(`user_roles:${userId}`, roleId);
      
      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'assign_role',
        resource: 'role',
        resourceId: roleId,
        result: 'success',
        metadata: { roleName: role.name },
        severity: 'info',
      });

      logger.info(`Role ${role.name} assigned to user ${userId}`);
    } catch (error) {
      logger.error('Error assigning role to user:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    try {
      const role = await this.getRole(roleId);
      if (!role) {
        throw new Error('Role not found');
      }

      await this.redis.srem(`user_roles:${userId}`, roleId);
      
      // Log audit event
      await this.logAuditEvent({
        userId,
        action: 'remove_role',
        resource: 'role',
        resourceId: roleId,
        result: 'success',
        metadata: { roleName: role.name },
        severity: 'info',
      });

      logger.info(`Role ${role.name} removed from user ${userId}`);
    } catch (error) {
      logger.error('Error removing role from user:', error);
      throw error;
    }
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    try {
      const roleIds = await this.redis.smembers(`user_roles:${userId}`);
      const roles: Role[] = [];

      for (const roleId of roleIds) {
        const role = await this.getRole(roleId);
        if (role) {
          roles.push(role);
        }
      }

      return roles;
    } catch (error) {
      logger.error('Error getting user roles:', error);
      return [];
    }
  }

  /**
   * Get user permissions (aggregated from roles)
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const roles = await this.getUserRoles(userId);
      const permissionsMap = new Map<string, Permission>();

      for (const role of roles) {
        for (const permission of role.permissions) {
          const key = `${permission.resource}:${permission.action}`;
          permissionsMap.set(key, permission);
        }
      }

      return Array.from(permissionsMap.values());
    } catch (error) {
      logger.error('Error getting user permissions:', error);
      return [];
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const permissions = await this.getUserPermissions(userId);
      
      for (const permission of permissions) {
        if (permission.resource === resource && permission.action === action) {
          // Check conditions if they exist
          if (permission.conditions && permission.conditions.length > 0) {
            if (this.evaluateConditions(permission.conditions, context || {})) {
              return true;
            }
          } else {
            return true;
          }
        }
      }

      // Log permission denied
      await this.logAuditEvent({
        userId,
        action: 'permission_check',
        resource,
        resourceId: action,
        result: 'denied',
        reason: 'Insufficient permissions',
        metadata: { context },
        severity: 'warning',
      });

      return false;
    } catch (error) {
      logger.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Set workspace permissions for user
   */
  async setWorkspacePermissions(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole,
    permissions: WorkspacePermission[],
    grantedBy: string
  ): Promise<void> {
    try {
      const workspacePermissions: WorkspacePermissions = {
        workspaceId,
        userId,
        role,
        permissions,
        grantedBy,
        grantedAt: new Date(),
      };

      await this.redis.hset(
        `workspace_permissions:${workspaceId}`,
        userId,
        JSON.stringify(workspacePermissions)
      );

      // Log audit event
      await this.logAuditEvent({
        userId: grantedBy,
        action: 'set_workspace_permissions',
        resource: 'workspace',
        resourceId: workspaceId,
        result: 'success',
        metadata: { targetUserId: userId, role, permissions },
        severity: 'info',
      });

      logger.info(`Workspace permissions set for user ${userId} in workspace ${workspaceId}`);
    } catch (error) {
      logger.error('Error setting workspace permissions:', error);
      throw error;
    }
  }

  /**
   * Get workspace permissions for user
   */
  async getWorkspacePermissions(workspaceId: string, userId: string): Promise<WorkspacePermissions | null> {
    try {
      const permissionsData = await this.redis.hget(`workspace_permissions:${workspaceId}`, userId);
      return permissionsData ? JSON.parse(permissionsData) : null;
    } catch (error) {
      logger.error('Error getting workspace permissions:', error);
      return null;
    }
  }

  /**
   * Check workspace permission
   */
  async hasWorkspacePermission(
    workspaceId: string,
    userId: string,
    permission: WorkspacePermission
  ): Promise<boolean> {
    try {
      const workspacePermissions = await this.getWorkspacePermissions(workspaceId, userId);
      
      if (!workspacePermissions) {
        return false;
      }

      // Check if user has the specific permission
      if (workspacePermissions.permissions.includes(permission)) {
        return true;
      }

      // Check role-based permissions
      const rolePermissions = this.getRolePermissions(workspacePermissions.role);
      return rolePermissions.includes(permission);
    } catch (error) {
      logger.error('Error checking workspace permission:', error);
      return false;
    }
  }

  /**
   * Remove user from workspace
   */
  async removeUserFromWorkspace(workspaceId: string, userId: string, removedBy: string): Promise<void> {
    try {
      await this.redis.hdel(`workspace_permissions:${workspaceId}`, userId);

      // Log audit event
      await this.logAuditEvent({
        userId: removedBy,
        action: 'remove_user_from_workspace',
        resource: 'workspace',
        resourceId: workspaceId,
        result: 'success',
        metadata: { targetUserId: userId },
        severity: 'info',
      });

      logger.info(`User ${userId} removed from workspace ${workspaceId}`);
    } catch (error) {
      logger.error('Error removing user from workspace:', error);
      throw error;
    }
  }

  /**
   * Get all workspace members
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspacePermissions[]> {
    try {
      const membersData = await this.redis.hgetall(`workspace_permissions:${workspaceId}`);
      const members: WorkspacePermissions[] = [];

      for (const [userId, permissionsData] of Object.entries(membersData)) {
        members.push(JSON.parse(permissionsData));
      }

      return members;
    } catch (error) {
      logger.error('Error getting workspace members:', error);
      return [];
    }
  }

  /**
   * Create access control list for resource
   */
  async createACL(acl: AccessControlList): Promise<void> {
    try {
      const key = `acl:${acl.resourceType}:${acl.resourceId}`;
      await this.redis.set(key, JSON.stringify(acl));

      logger.info(`ACL created for ${acl.resourceType}:${acl.resourceId}`);
    } catch (error) {
      logger.error('Error creating ACL:', error);
      throw error;
    }
  }

  /**
   * Check ACL permission
   */
  async checkACLPermission(
    resourceType: string,
    resourceId: string,
    userId: string,
    permission: string,
    context?: Record<string, any>
  ): Promise<boolean> {
    try {
      const key = `acl:${resourceType}:${resourceId}`;
      const aclData = await this.redis.get(key);
      
      if (!aclData) {
        return false;
      }

      const acl: AccessControlList = JSON.parse(aclData);
      const userRoles = await this.getUserRoles(userId);
      const userRoleIds = userRoles.map(role => role.id);

      for (const aclPermission of acl.permissions) {
        // Check if permission matches user or user's roles
        const hasUserPermission = aclPermission.userId === userId;
        const hasRolePermission = aclPermission.roleId && userRoleIds.includes(aclPermission.roleId);

        if (hasUserPermission || hasRolePermission) {
          // Check if the specific permission is granted
          if (aclPermission.permissions.includes(permission)) {
            // Check conditions if they exist
            if (aclPermission.conditions && aclPermission.conditions.length > 0) {
              return this.evaluateConditions(aclPermission.conditions, context || {});
            }
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      logger.error('Error checking ACL permission:', error);
      return false;
    }
  }

  /**
   * Evaluate permission conditions
   */
  private evaluateConditions(conditions: PermissionCondition[], context: Record<string, any>): boolean {
    for (const condition of conditions) {
      const contextValue = context[condition.field];
      
      switch (condition.operator) {
        case 'eq':
          if (contextValue !== condition.value) return false;
          break;
        case 'ne':
          if (contextValue === condition.value) return false;
          break;
        case 'in':
          if (!Array.isArray(condition.value) || !condition.value.includes(contextValue)) return false;
          break;
        case 'nin':
          if (Array.isArray(condition.value) && condition.value.includes(contextValue)) return false;
          break;
        case 'gt':
          if (contextValue <= condition.value) return false;
          break;
        case 'gte':
          if (contextValue < condition.value) return false;
          break;
        case 'lt':
          if (contextValue >= condition.value) return false;
          break;
        case 'lte':
          if (contextValue > condition.value) return false;
          break;
        case 'contains':
          if (typeof contextValue !== 'string' || !contextValue.includes(condition.value)) return false;
          break;
        case 'startsWith':
          if (typeof contextValue !== 'string' || !contextValue.startsWith(condition.value)) return false;
          break;
        case 'endsWith':
          if (typeof contextValue !== 'string' || !contextValue.endsWith(condition.value)) return false;
          break;
        default:
          return false;
      }
    }
    
    return true;
  }

  /**
   * Get role permissions based on workspace role
   */
  private getRolePermissions(role: WorkspaceRole): WorkspacePermission[] {
    switch (role) {
      case WorkspaceRole.OWNER:
        return Object.values(WorkspacePermission);
      case WorkspaceRole.ADMIN:
        return [
          WorkspacePermission.READ,
          WorkspacePermission.WRITE,
          WorkspacePermission.DELETE,
          WorkspacePermission.INVITE,
          WorkspacePermission.MANAGE_MEMBERS,
          WorkspacePermission.VIEW_ANALYTICS,
        ];
      case WorkspaceRole.MEMBER:
        return [
          WorkspacePermission.READ,
          WorkspacePermission.WRITE,
          WorkspacePermission.INVITE,
        ];
      case WorkspaceRole.VIEWER:
        return [WorkspacePermission.READ];
      case WorkspaceRole.GUEST:
        return [WorkspacePermission.READ];
      default:
        return [];
    }
  }

  /**
   * Get default system roles
   */
  private getDefaultRoles(): Role[] {
    const now = new Date();
    
    return [
      {
        id: 'admin',
        name: 'Administrator',
        description: 'Full system access',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        permissions: [
          {
            id: 'admin_all',
            name: 'Admin All',
            resource: '*',
            action: '*',
            description: 'Full administrative access',
          },
        ],
      },
      {
        id: 'user',
        name: 'User',
        description: 'Standard user access',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        permissions: [
          {
            id: 'user_read',
            name: 'User Read',
            resource: 'user',
            action: 'read',
            description: 'Read user data',
          },
          {
            id: 'user_update',
            name: 'User Update',
            resource: 'user',
            action: 'update',
            description: 'Update own user data',
            conditions: [
              {
                field: 'userId',
                operator: 'eq',
                value: '{{user.id}}',
              },
            ],
          },
        ],
      },
      {
        id: 'guest',
        name: 'Guest',
        description: 'Limited read-only access',
        isSystem: true,
        createdAt: now,
        updatedAt: now,
        permissions: [
          {
            id: 'guest_read',
            name: 'Guest Read',
            resource: 'public',
            action: 'read',
            description: 'Read public data',
          },
        ],
      },
    ];
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp'>): Promise<void> {
    try {
      const auditEvent: SecurityAuditLog = {
        id: require('crypto').randomUUID(),
        timestamp: new Date(),
        ...event,
      };

      await this.redis.lpush('security_audit_log', JSON.stringify(auditEvent));
      await this.redis.ltrim('security_audit_log', 0, 9999); // Keep last 10k events

      if (event.userId) {
        await this.redis.lpush(`security_audit_log:${event.userId}`, JSON.stringify(auditEvent));
        await this.redis.ltrim(`security_audit_log:${event.userId}`, 0, 999); // Keep last 1k events per user
      }
    } catch (error) {
      logger.error('Error logging audit event:', error);
    }
  }
}