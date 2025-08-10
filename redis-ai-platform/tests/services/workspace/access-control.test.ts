import { Redis } from 'ioredis';
import { AccessControl, ResourceType, AccessRequest, ConditionType, ConditionOperator, AuditAction } from '../../../src/services/workspace/access-control';
import { CollaboratorRole, Permission } from '../../../src/services/workspace/workspace-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('AccessControl', () => {
  let redis: jest.Mocked<Redis>;
  let accessControl: AccessControl;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    accessControl = new AccessControl(redis);

    // Setup default mocks
    redis.get = jest.fn().mockResolvedValue(null);
    redis.setex = jest.fn().mockResolvedValue('OK');
    redis.hget = jest.fn().mockResolvedValue(null);
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.del = jest.fn().mockResolvedValue(1);
    redis.keys = jest.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkAccess', () => {
    it('should grant access when user has required permission', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        collaborators: [{
          userId: 'user123',
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ, Permission.WRITE]
        }]
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Default role-based access');
    });

    it('should deny access when workspace not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'nonexistent',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Workspace not found');
    });

    it('should deny access when user is not a collaborator', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        collaborators: [{
          userId: 'user456',
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ, Permission.WRITE]
        }]
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('User is not a collaborator');
    });

    it('should deny access when user lacks required permission', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        collaborators: [{
          userId: 'user123',
          role: CollaboratorRole.VIEWER,
          permissions: [Permission.READ]
        }]
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.WRITE
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(false);
      expect(result.reason).toBe('Role viewer does not have write permission');
    });

    it('should use cached result when available', async () => {
      const cachedResult = {
        granted: true,
        reason: 'Cached result'
      };

      redis.get = jest.fn().mockResolvedValue(JSON.stringify(cachedResult));

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ
      };

      const result = await accessControl.checkAccess(request);

      expect(result).toEqual(cachedResult);
      expect(redis.hget).not.toHaveBeenCalled(); // Should not fetch workspace data
    });

    it('should evaluate access policy conditions', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        collaborators: [{
          userId: 'user123',
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ, Permission.WRITE]
        }]
      };

      const mockPolicy = {
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permissions: [{
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.WRITE],
          conditions: [{
            type: ConditionType.USER_ATTRIBUTE,
            value: 'user123',
            operator: ConditionOperator.EQUALS
          }]
        }],
        inheritanceRules: []
      };

      redis.hget = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(mockWorkspace))
        .mockResolvedValueOnce(JSON.stringify(mockPolicy));

      const request: AccessRequest = {
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.WRITE
      };

      const result = await accessControl.checkAccess(request);

      expect(result.granted).toBe(true);
      expect(result.reason).toBe('Policy evaluation successful');
    });
  });

  describe('createAccessPolicy', () => {
    it('should create access policy successfully', async () => {
      const policy = {
        workspaceId: 'ws_123',
        resourceType: ResourceType.KNOWLEDGE,
        permissions: [{
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ, Permission.WRITE]
        }],
        inheritanceRules: []
      };

      await accessControl.createAccessPolicy(policy);

      expect(redis.hset).toHaveBeenCalledWith(
        'access_policy:ws_123:knowledge:default',
        'data',
        JSON.stringify(policy)
      );
    });
  });

  describe('updateAccessPolicy', () => {
    it('should update existing access policy', async () => {
      const existingPolicy = {
        workspaceId: 'ws_123',
        resourceType: ResourceType.KNOWLEDGE,
        permissions: [{
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ]
        }],
        inheritanceRules: []
      };

      const updates = {
        permissions: [{
          role: CollaboratorRole.EDITOR,
          permissions: [Permission.READ, Permission.WRITE]
        }]
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(existingPolicy));

      await accessControl.updateAccessPolicy('ws_123', ResourceType.KNOWLEDGE, undefined, updates);

      expect(redis.hset).toHaveBeenCalledWith(
        'access_policy:ws_123:knowledge:default',
        'data',
        expect.stringContaining('"permissions":[{"role":"editor","permissions":["read","write"]}]')
      );
    });

    it('should throw error when policy not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      await expect(accessControl.updateAccessPolicy('ws_123', ResourceType.KNOWLEDGE, undefined, {})).rejects.toThrow('Access policy not found');
    });
  });

  describe('grantPermission', () => {
    it('should grant permission to user', async () => {
      await accessControl.grantPermission('ws_123', 'user123', Permission.WRITE, ResourceType.KNOWLEDGE);

      expect(redis.hset).toHaveBeenCalledWith(
        'access_policy:ws_123:knowledge:default',
        'data',
        expect.stringContaining('"permissions":[{"role":"viewer","permissions":["write"]')
      );
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/access_audit:ws_123:user123:audit_/),
        2592000,
        expect.stringContaining('"action":"permission_changed"')
      );
    });
  });

  describe('revokePermission', () => {
    it('should revoke permission from user', async () => {
      await accessControl.revokePermission('ws_123', 'user123', Permission.WRITE, ResourceType.KNOWLEDGE);

      expect(redis.del).toHaveBeenCalledWith('access_policy:ws_123:knowledge:default');
      expect(redis.setex).toHaveBeenCalledWith(
        expect.stringMatching(/access_audit:ws_123:user123:audit_/),
        2592000,
        expect.stringContaining('"action":"permission_changed"')
      );
    });
  });

  describe('getAuditLogs', () => {
    it('should return audit logs for workspace', async () => {
      const mockAuditLog = {
        id: 'audit_123',
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ,
        action: AuditAction.ACCESS_GRANTED,
        result: { granted: true, reason: 'Test' },
        timestamp: new Date()
      };

      redis.keys = jest.fn().mockResolvedValue(['access_audit:ws_123:user123:audit_123']);
      redis.get = jest.fn().mockResolvedValue(JSON.stringify(mockAuditLog));

      const logs = await accessControl.getAuditLogs('ws_123');

      expect(logs).toHaveLength(1);
      expect(logs[0].id).toBe('audit_123');
      expect(logs[0].action).toBe(AuditAction.ACCESS_GRANTED);
    });

    it('should return audit logs for specific user', async () => {
      const mockAuditLog = {
        id: 'audit_123',
        userId: 'user123',
        workspaceId: 'ws_123',
        resourceType: ResourceType.WORKSPACE,
        permission: Permission.READ,
        action: AuditAction.ACCESS_GRANTED,
        result: { granted: true, reason: 'Test' },
        timestamp: new Date()
      };

      redis.keys = jest.fn().mockResolvedValue(['access_audit:ws_123:user123:audit_123']);
      redis.get = jest.fn().mockResolvedValue(JSON.stringify(mockAuditLog));

      const logs = await accessControl.getAuditLogs('ws_123', 'user123');

      expect(logs).toHaveLength(1);
      expect(logs[0].userId).toBe('user123');
    });
  });
});