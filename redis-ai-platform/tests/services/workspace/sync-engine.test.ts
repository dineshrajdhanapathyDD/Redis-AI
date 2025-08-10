import { Redis } from 'ioredis';
import { SyncEngine, SyncEventType, ConflictType, ConflictStrategy, ResolutionAction } from '../../../src/services/workspace/sync-engine';
import { WorkspaceManager, UserStatus } from '../../../src/services/workspace/workspace-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock WorkspaceManager
jest.mock('../../../src/services/workspace/workspace-manager');
const MockedWorkspaceManager = WorkspaceManager as jest.MockedClass<typeof WorkspaceManager>;

describe('SyncEngine', () => {
  let redis: jest.Mocked<Redis>;
  let workspaceManager: jest.Mocked<WorkspaceManager>;
  let syncEngine: SyncEngine;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    workspaceManager = new MockedWorkspaceManager(redis, {} as any) as jest.Mocked<WorkspaceManager>;
    syncEngine = new SyncEngine(redis, workspaceManager);

    // Setup default mocks
    redis.subscribe = jest.fn().mockResolvedValue(1);
    redis.unsubscribe = jest.fn().mockResolvedValue(1);
    redis.publish = jest.fn().mockResolvedValue(1);
    redis.setex = jest.fn().mockResolvedValue('OK');
    redis.get = jest.fn().mockResolvedValue(null);
    redis.set = jest.fn().mockResolvedValue('OK');
    redis.del = jest.fn().mockResolvedValue(1);
    redis.keys = jest.fn().mockResolvedValue([]);
    redis.on = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('subscribeToWorkspace', () => {
    it('should subscribe user to workspace sync', async () => {
      const callback = jest.fn();

      await syncEngine.subscribeToWorkspace('ws_123', 'user123', callback);

      expect(redis.subscribe).toHaveBeenCalledWith('sync:ws_123');
      expect(redis.setex).toHaveBeenCalledWith(
        'presence:ws_123:user123',
        300,
        expect.stringContaining('"status":"online"')
      );
      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        expect.stringContaining('"type":"user_status_changed"')
      );
    });

    it('should not resubscribe to Redis channel if already subscribed', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await syncEngine.subscribeToWorkspace('ws_123', 'user123', callback1);
      await syncEngine.subscribeToWorkspace('ws_123', 'user456', callback2);

      expect(redis.subscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('unsubscribeFromWorkspace', () => {
    it('should unsubscribe user from workspace sync', async () => {
      const callback = jest.fn();
      
      // First subscribe
      await syncEngine.subscribeToWorkspace('ws_123', 'user123', callback);
      
      // Then unsubscribe
      await syncEngine.unsubscribeFromWorkspace('ws_123', 'user123');

      expect(redis.unsubscribe).toHaveBeenCalledWith('sync:ws_123');
      expect(redis.setex).toHaveBeenCalledWith(
        'presence:ws_123:user123',
        300,
        expect.stringContaining('"status":"offline"')
      );
    });

    it('should not unsubscribe from Redis channel if other users are still subscribed', async () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();

      await syncEngine.subscribeToWorkspace('ws_123', 'user123', callback1);
      await syncEngine.subscribeToWorkspace('ws_123', 'user456', callback2);
      
      await syncEngine.unsubscribeFromWorkspace('ws_123', 'user123');

      expect(redis.unsubscribe).not.toHaveBeenCalled();
    });
  });

  describe('publishEvent', () => {
    it('should publish sync event to Redis channel', async () => {
      const event = {
        type: SyncEventType.CONTENT_CHANGED,
        workspaceId: 'ws_123',
        userId: 'user123',
        timestamp: new Date(),
        data: { content: 'updated content' }
      };

      await syncEngine.publishEvent(event);

      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        JSON.stringify(event)
      );
    });
  });

  describe('updateUserPresence', () => {
    it('should update user presence and notify others', async () => {
      await syncEngine.updateUserPresence('ws_123', 'user123', UserStatus.ONLINE, 'editing document');

      expect(redis.setex).toHaveBeenCalledWith(
        'presence:ws_123:user123',
        300,
        expect.stringContaining('"status":"online"')
      );
      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        expect.stringContaining('"type":"user_status_changed"')
      );
    });
  });

  describe('updateCursorPosition', () => {
    it('should update cursor position and notify others', async () => {
      const position = { x: 100, y: 200, elementId: 'element1' };

      await syncEngine.updateCursorPosition('ws_123', 'user123', position);

      expect(redis.setex).toHaveBeenCalledWith(
        'cursor:ws_123:user123',
        30,
        expect.stringContaining('"position":{"x":100,"y":200,"elementId":"element1"}')
      );
      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        expect.stringContaining('"type":"cursor_moved"')
      );
    });
  });

  describe('acquireLock', () => {
    it('should acquire lock successfully when available', async () => {
      redis.set = jest.fn().mockResolvedValue('OK');

      const result = await syncEngine.acquireLock('ws_123', 'resource1', 'user123', 'write');

      expect(result).toBe(true);
      expect(redis.set).toHaveBeenCalledWith(
        'lock:ws_123:resource1',
        expect.stringContaining('"lockedBy":"user123"'),
        'EX',
        300,
        'NX'
      );
      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        expect.stringContaining('"type":"lock_acquired"')
      );
    });

    it('should fail to acquire lock when already locked', async () => {
      redis.set = jest.fn().mockResolvedValue(null);

      const result = await syncEngine.acquireLock('ws_123', 'resource1', 'user123', 'write');

      expect(result).toBe(false);
    });
  });

  describe('releaseLock', () => {
    it('should release lock when user owns it', async () => {
      const lockData = {
        resourceId: 'resource1',
        lockedBy: 'user123',
        lockedAt: new Date(),
        lockType: 'write'
      };

      redis.get = jest.fn().mockResolvedValue(JSON.stringify(lockData));

      await syncEngine.releaseLock('ws_123', 'resource1', 'user123');

      expect(redis.del).toHaveBeenCalledWith('lock:ws_123:resource1');
      expect(redis.publish).toHaveBeenCalledWith(
        'sync:ws_123',
        expect.stringContaining('"type":"lock_released"')
      );
    });

    it('should not release lock when user does not own it', async () => {
      const lockData = {
        resourceId: 'resource1',
        lockedBy: 'user456',
        lockedAt: new Date(),
        lockType: 'write'
      };

      redis.get = jest.fn().mockResolvedValue(JSON.stringify(lockData));

      await syncEngine.releaseLock('ws_123', 'resource1', 'user123');

      expect(redis.del).not.toHaveBeenCalled();
    });
  });

  describe('detectConflict', () => {
    it('should detect conflict when trying to modify locked resource', async () => {
      const lockData = {
        resourceId: 'resource1',
        lockedBy: 'user456',
        lockedAt: new Date(),
        lockType: 'write'
      };

      redis.get = jest.fn().mockResolvedValue(JSON.stringify(lockData));
      redis.setex = jest.fn().mockResolvedValue('OK');

      const conflict = await syncEngine.detectConflict('ws_123', 'resource1', 'user123', 'edit', { content: 'new content' });

      expect(conflict).toBeDefined();
      expect(conflict!.conflictType).toBe(ConflictType.LOCK_VIOLATION);
      expect(conflict!.participants).toHaveLength(2);
    });

    it('should not detect conflict when no lock exists', async () => {
      redis.get = jest.fn().mockResolvedValue(null);

      const conflict = await syncEngine.detectConflict('ws_123', 'resource1', 'user123', 'edit', { content: 'new content' });

      expect(conflict).toBeNull();
    });
  });

  describe('resolveConflict', () => {
    it('should resolve conflict with given resolution', async () => {
      const conflict = {
        id: 'conflict_123',
        resourceId: 'resource1',
        conflictType: ConflictType.CONCURRENT_EDIT,
        participants: [
          { userId: 'user123', action: 'edit', timestamp: new Date(), data: {} },
          { userId: 'user456', action: 'edit', timestamp: new Date(), data: {} }
        ],
        timestamp: new Date(),
        resolved: false
      };

      // Mock the conflict exists in local cache
      (syncEngine as any).conflicts.set('ws_123', [conflict]);

      const resolution = {
        action: ResolutionAction.ACCEPT_LAST,
        notify: true
      };

      await syncEngine.resolveConflict('ws_123', 'conflict_123', resolution);

      expect(redis.setex).toHaveBeenCalledWith(
        'conflict:ws_123:conflict_123',
        86400,
        expect.stringContaining('"resolved":true')
      );
      expect(redis.publish).toHaveBeenCalledTimes(2); // Once for each participant
    });

    it('should throw error when conflict not found', async () => {
      const resolution = {
        action: ResolutionAction.ACCEPT_LAST
      };

      await expect(syncEngine.resolveConflict('ws_123', 'nonexistent', resolution)).rejects.toThrow('Conflict nonexistent not found');
    });
  });

  describe('getActiveUsers', () => {
    it('should return active users from Redis', async () => {
      const presenceData1 = {
        userId: 'user123',
        status: UserStatus.ONLINE,
        lastSeen: new Date(),
        currentActivity: 'editing'
      };

      const presenceData2 = {
        userId: 'user456',
        status: UserStatus.AWAY,
        lastSeen: new Date(),
        currentActivity: 'idle'
      };

      redis.keys = jest.fn().mockResolvedValue(['presence:ws_123:user123', 'presence:ws_123:user456']);
      redis.get = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(presenceData1))
        .mockResolvedValueOnce(JSON.stringify(presenceData2));

      const activeUsers = await syncEngine.getActiveUsers('ws_123');

      expect(activeUsers).toHaveLength(2);
      expect(activeUsers[0].userId).toBe('user123');
      expect(activeUsers[1].userId).toBe('user456');
    });

    it('should filter out offline users', async () => {
      const presenceData1 = {
        userId: 'user123',
        status: UserStatus.ONLINE,
        lastSeen: new Date(),
        currentActivity: 'editing'
      };

      const presenceData2 = {
        userId: 'user456',
        status: UserStatus.OFFLINE,
        lastSeen: new Date(),
        currentActivity: ''
      };

      redis.keys = jest.fn().mockResolvedValue(['presence:ws_123:user123', 'presence:ws_123:user456']);
      redis.get = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(presenceData1))
        .mockResolvedValueOnce(JSON.stringify(presenceData2));

      const activeUsers = await syncEngine.getActiveUsers('ws_123');

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].userId).toBe('user123');
    });
  });
});