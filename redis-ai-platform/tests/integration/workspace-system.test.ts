import { Redis } from 'ioredis';
import { WorkspaceService, WorkspaceConfig, CollaboratorRole, KnowledgeType, UserStatus, ResourceType, Permission } from '../../src/services/workspace';
import { EmbeddingManager } from '../../src/services/embedding-manager';

describe('Workspace System Integration', () => {
  let redis: Redis;
  let embeddingManager: EmbeddingManager;
  let workspaceService: WorkspaceService;

  beforeAll(async () => {
    // Use test Redis instance
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 15, // Use separate database for tests
    });

    embeddingManager = new EmbeddingManager(redis);
    workspaceService = new WorkspaceService(redis, embeddingManager);

    // Clear test database
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await redis.flushdb();
  });

  describe('Complete Workspace Workflow', () => {
    it('should handle complete collaborative workspace scenario', async () => {
      // Step 1: Create workspace
      const workspaceConfig: WorkspaceConfig = {
        name: 'Integration Test Workspace',
        description: 'Testing complete workspace functionality',
        ownerId: 'owner@test.com',
        isPublic: false,
        maxCollaborators: 5,
        settings: {
          allowGuestAccess: false,
          autoSaveInterval: 30,
          knowledgeRetentionDays: 365,
          syncMode: 'realtime'
        }
      };

      const workspace = await workspaceService.manager.createWorkspace(workspaceConfig);
      expect(workspace).toBeDefined();
      expect(workspace.name).toBe(workspaceConfig.name);

      // Step 2: Add collaborators
      await workspaceService.manager.joinWorkspace(workspace.id, 'editor@test.com', CollaboratorRole.EDITOR);
      await workspaceService.manager.joinWorkspace(workspace.id, 'viewer@test.com', CollaboratorRole.VIEWER);

      const updatedWorkspace = await workspaceService.manager.getWorkspace(workspace.id);
      expect(updatedWorkspace?.collaborators).toHaveLength(3);

      // Step 3: Set up real-time collaboration
      const events: any[] = [];
      const eventCallback = (event: any) => events.push(event);

      await workspaceService.sync.subscribeToWorkspace(workspace.id, 'editor@test.com', eventCallback);
      await workspaceService.sync.subscribeToWorkspace(workspace.id, 'viewer@test.com', eventCallback);

      // Step 4: Test presence and cursor updates
      await workspaceService.sync.updateUserPresence(workspace.id, 'editor@test.com', UserStatus.ONLINE, 'editing');
      await workspaceService.sync.updateCursorPosition(workspace.id, 'editor@test.com', { x: 100, y: 200 });

      const activeUsers = await workspaceService.sync.getActiveUsers(workspace.id);
      expect(activeUsers).toHaveLength(2);
      expect(activeUsers.find(u => u.userId === 'editor@test.com')?.status).toBe(UserStatus.ONLINE);

      // Step 5: Test knowledge management
      const knowledge = {
        type: KnowledgeType.INSIGHT,
        content: 'Integration testing reveals the importance of end-to-end workflows in collaborative systems.',
        metadata: {
          tags: ['testing', 'integration', 'collaboration'],
          confidence: 0.9,
          source: 'integration-test',
          version: 1
        },
        createdBy: 'editor@test.com'
      };

      const knowledgeNode = await workspaceService.manager.addKnowledge(workspace.id, knowledge);
      expect(knowledgeNode).toBeDefined();
      expect(knowledgeNode.content).toBe(knowledge.content);

      // Step 6: Test knowledge search
      const searchResults = await workspaceService.manager.queryKnowledge(workspace.id, 'integration testing', 5);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].content).toContain('Integration testing');

      // Step 7: Test access control
      const accessRequest = {
        userId: 'editor@test.com',
        workspaceId: workspace.id,
        resourceType: ResourceType.KNOWLEDGE,
        permission: Permission.WRITE
      };

      const accessResult = await workspaceService.access.checkAccess(accessRequest);
      expect(accessResult.granted).toBe(true);

      // Test viewer access (should have read but not write)
      const viewerAccessRequest = {
        userId: 'viewer@test.com',
        workspaceId: workspace.id,
        resourceType: ResourceType.KNOWLEDGE,
        permission: Permission.WRITE
      };

      const viewerAccessResult = await workspaceService.access.checkAccess(viewerAccessRequest);
      expect(viewerAccessResult.granted).toBe(false);

      // Step 8: Test locking mechanism
      const lockAcquired = await workspaceService.sync.acquireLock(workspace.id, 'knowledge1', 'editor@test.com', 'write');
      expect(lockAcquired).toBe(true);

      const lockConflict = await workspaceService.sync.acquireLock(workspace.id, 'knowledge1', 'viewer@test.com', 'write');
      expect(lockConflict).toBe(false);

      // Step 9: Test conflict detection and resolution
      const conflict = await workspaceService.sync.detectConflict(workspace.id, 'knowledge1', 'viewer@test.com', 'edit', { content: 'conflicting edit' });
      expect(conflict).toBeDefined();
      expect(conflict?.conflictType).toBe('lock_violation');

      if (conflict) {
        await workspaceService.sync.resolveConflict(workspace.id, conflict.id, {
          action: 'accept_first' as any,
          notify: true
        });
      }

      // Step 10: Clean up
      await workspaceService.sync.releaseLock(workspace.id, 'knowledge1', 'editor@test.com');
      await workspaceService.sync.unsubscribeFromWorkspace(workspace.id, 'editor@test.com');
      await workspaceService.sync.unsubscribeFromWorkspace(workspace.id, 'viewer@test.com');
    }, 30000); // 30 second timeout for integration test

    it('should handle concurrent user operations', async () => {
      // Create workspace
      const workspace = await workspaceService.manager.createWorkspace({
        name: 'Concurrent Test Workspace',
        description: 'Testing concurrent operations',
        ownerId: 'owner@test.com',
        isPublic: false,
        maxCollaborators: 10,
        settings: {
          allowGuestAccess: false,
          autoSaveInterval: 30,
          knowledgeRetentionDays: 365,
          syncMode: 'realtime'
        }
      });

      // Add multiple collaborators
      const users = ['user1@test.com', 'user2@test.com', 'user3@test.com'];
      
      await Promise.all(users.map(userId => 
        workspaceService.manager.joinWorkspace(workspace.id, userId, CollaboratorRole.EDITOR)
      ));

      // Subscribe all users to sync
      const eventCallbacks = users.map(userId => {
        const events: any[] = [];
        const callback = (event: any) => events.push(event);
        return { userId, callback, events };
      });

      await Promise.all(eventCallbacks.map(({ userId, callback }) =>
        workspaceService.sync.subscribeToWorkspace(workspace.id, userId, callback)
      ));

      // Simulate concurrent knowledge additions
      const knowledgePromises = users.map((userId, index) => 
        workspaceService.manager.addKnowledge(workspace.id, {
          type: KnowledgeType.INSIGHT,
          content: `Concurrent insight ${index + 1} from ${userId}`,
          metadata: {
            tags: ['concurrent', 'test'],
            confidence: 0.8,
            source: 'concurrent-test',
            version: 1
          },
          createdBy: userId
        })
      );

      const knowledgeNodes = await Promise.all(knowledgePromises);
      expect(knowledgeNodes).toHaveLength(3);

      // Test concurrent presence updates
      await Promise.all(users.map(userId =>
        workspaceService.sync.updateUserPresence(workspace.id, userId, UserStatus.ONLINE, 'concurrent testing')
      ));

      const activeUsers = await workspaceService.sync.getActiveUsers(workspace.id);
      expect(activeUsers).toHaveLength(3);

      // Test concurrent access checks
      const accessPromises = users.map(userId =>
        workspaceService.access.checkAccess({
          userId,
          workspaceId: workspace.id,
          resourceType: ResourceType.KNOWLEDGE,
          permission: Permission.READ
        })
      );

      const accessResults = await Promise.all(accessPromises);
      expect(accessResults.every(result => result.granted)).toBe(true);

      // Clean up
      await Promise.all(eventCallbacks.map(({ userId }) =>
        workspaceService.sync.unsubscribeFromWorkspace(workspace.id, userId)
      ));
    }, 30000);

    it('should maintain data consistency across operations', async () => {
      // Create workspace
      const workspace = await workspaceService.manager.createWorkspace({
        name: 'Consistency Test Workspace',
        description: 'Testing data consistency',
        ownerId: 'owner@test.com',
        isPublic: false,
        maxCollaborators: 5,
        settings: {
          allowGuestAccess: false,
          autoSaveInterval: 30,
          knowledgeRetentionDays: 365,
          syncMode: 'realtime'
        }
      });

      // Add knowledge and verify it's stored correctly
      const knowledge = {
        type: KnowledgeType.DECISION,
        content: 'We decided to implement comprehensive integration testing to ensure system reliability.',
        metadata: {
          tags: ['decision', 'testing', 'reliability'],
          confidence: 0.95,
          source: 'team-decision',
          version: 1
        },
        createdBy: 'owner@test.com'
      };

      const knowledgeNode = await workspaceService.manager.addKnowledge(workspace.id, knowledge);

      // Verify knowledge can be retrieved
      const retrievedWorkspace = await workspaceService.manager.getWorkspace(workspace.id);
      expect(retrievedWorkspace?.knowledgeGraph.nodes).toHaveLength(1);
      expect(retrievedWorkspace?.knowledgeGraph.nodes[0].id).toBe(knowledgeNode.id);

      // Verify knowledge can be searched
      const searchResults = await workspaceService.manager.queryKnowledge(workspace.id, 'integration testing');
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].id).toBe(knowledgeNode.id);

      // Add collaborator and verify workspace state
      await workspaceService.manager.joinWorkspace(workspace.id, 'collaborator@test.com', CollaboratorRole.EDITOR);

      const updatedWorkspace = await workspaceService.manager.getWorkspace(workspace.id);
      expect(updatedWorkspace?.collaborators).toHaveLength(2);
      expect(updatedWorkspace?.knowledgeGraph.nodes).toHaveLength(1); // Knowledge should still be there

      // Update workspace settings and verify persistence
      await workspaceService.manager.updateWorkspaceSettings(workspace.id, {
        autoSaveInterval: 60,
        allowGuestAccess: true
      });

      const settingsUpdatedWorkspace = await workspaceService.manager.getWorkspace(workspace.id);
      expect(settingsUpdatedWorkspace?.settings.autoSaveInterval).toBe(60);
      expect(settingsUpdatedWorkspace?.settings.allowGuestAccess).toBe(true);
      expect(settingsUpdatedWorkspace?.collaborators).toHaveLength(2); // Collaborators should still be there
      expect(settingsUpdatedWorkspace?.knowledgeGraph.nodes).toHaveLength(1); // Knowledge should still be there
    });
  });
});