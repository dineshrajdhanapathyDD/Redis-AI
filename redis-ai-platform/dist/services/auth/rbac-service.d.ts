import { Redis } from 'ioredis';
import { Role, Permission, WorkspacePermissions, WorkspaceRole, WorkspacePermission, AccessControlList } from './types';
export declare class RBACService {
    private redis;
    constructor(redis: Redis);
    /**
     * Initialize default roles and permissions
     */
    initializeDefaultRoles(): Promise<void>;
    /**
     * Create a new role
     */
    createRole(role: Role): Promise<void>;
    /**
     * Get role by ID
     */
    getRole(roleId: string): Promise<Role | null>;
    /**
     * Get role by name
     */
    getRoleByName(roleName: string): Promise<Role | null>;
    /**
     * Update role
     */
    updateRole(role: Role): Promise<void>;
    /**
     * Delete role
     */
    deleteRole(roleId: string): Promise<void>;
    /**
     * Assign role to user
     */
    assignRoleToUser(userId: string, roleId: string): Promise<void>;
    /**
     * Remove role from user
     */
    removeRoleFromUser(userId: string, roleId: string): Promise<void>;
    /**
     * Get user roles
     */
    getUserRoles(userId: string): Promise<Role[]>;
    /**
     * Get user permissions (aggregated from roles)
     */
    getUserPermissions(userId: string): Promise<Permission[]>;
    /**
     * Check if user has permission
     */
    hasPermission(userId: string, resource: string, action: string, context?: Record<string, any>): Promise<boolean>;
    /**
     * Set workspace permissions for user
     */
    setWorkspacePermissions(workspaceId: string, userId: string, role: WorkspaceRole, permissions: WorkspacePermission[], grantedBy: string): Promise<void>;
    /**
     * Get workspace permissions for user
     */
    getWorkspacePermissions(workspaceId: string, userId: string): Promise<WorkspacePermissions | null>;
    /**
     * Check workspace permission
     */
    hasWorkspacePermission(workspaceId: string, userId: string, permission: WorkspacePermission): Promise<boolean>;
    /**
     * Remove user from workspace
     */
    removeUserFromWorkspace(workspaceId: string, userId: string, removedBy: string): Promise<void>;
    /**
     * Get all workspace members
     */
    getWorkspaceMembers(workspaceId: string): Promise<WorkspacePermissions[]>;
    /**
     * Create access control list for resource
     */
    createACL(acl: AccessControlList): Promise<void>;
    /**
     * Check ACL permission
     */
    checkACLPermission(resourceType: string, resourceId: string, userId: string, permission: string, context?: Record<string, any>): Promise<boolean>;
    /**
     * Evaluate permission conditions
     */
    private evaluateConditions;
    /**
     * Get role permissions based on workspace role
     */
    private getRolePermissions;
    /**
     * Get default system roles
     */
    private getDefaultRoles;
    /**
     * Log audit event
     */
    private logAuditEvent;
}
//# sourceMappingURL=rbac-service.d.ts.map