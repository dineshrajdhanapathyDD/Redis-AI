import { Redis } from 'ioredis';
import { WorkspaceManager, WorkspaceConfig, CollaboratorRole, KnowledgeType, RelationshipType } from '../../../src/services/workspace/workspace-manager';
import { EmbeddingManager } from '../../../src/services/embedding-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock EmbeddingManager
jest.mock('../../../src/services/embedding-manager');
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;

describe('WorkspaceManager', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let workspaceManager: WorkspaceManager;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    workspaceManager = new WorkspaceManager(redis, embeddingManager);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.hget = jest.fn().mockResolvedValue(null);
    redis.keys = jest.fn().mockResolvedValue([]);
    redis.call = jest.fn().mockResolvedValue('OK');
    redis.publish = jest.fn().mockResolvedValue(1);
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkspace', () => {
    it('should create a new workspace successfully', async () => {
      const config: WorkspaceConfig = {
        name: 'Test Workspace',
        description: 'A test workspace',
        ownerId: 'user123',
        isPublic: false,
        maxCollaborators: 10,
        settings: {
          allowGuestAccess: false,
          autoSaveInterval: 30,
          knowledgeRetentionDays: 365,
          syncMode: 'realtime'
        }
      };

      const workspace = await workspaceManager.createWorkspace(config);

      expect(workspace).toBeDefined();
      expect(workspace.name).toBe(config.name);
      expect(workspace.ownerId).toBe(config.ownerId);
      expect(workspace.collaborators).toHaveLength(1);
      expect(workspace.collaborators[0].role).toBe(CollaboratorRole.OWNER);
      expect(redis.hset).toHaveBeenCalled();
      expect(redis.call).toHaveBeenCalledWith('FT.CREATE', expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String), expect.any(String));
    });

    it('should handle index creation errors gracefully', async () => {
      redis.call = jest.fn().mockRejectedValue(new Error('Index already exists'));

      const config: WorkspaceConfig = {
        name: 'Test Workspace',
        description: 'A test workspace',
        ownerId: 'user123',
        isPublic: false,
        maxCollaborators: 10,
        settings: {
          allowGuestAccess: false,
          autoSaveInterval: 30,
          knowledgeRetentionDays: 365,
          syncMode: 'realtime'
        }
      };

      await expect(workspaceManager.createWorkspace(config)).rejects.toThrow('Index already exists');
    });
  });

  describe('getWorkspace', () => {
    it('should return workspace when it exists', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        name: 'Test Workspace',
        ownerId: 'user123',
        collaborators: []
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      const result = await workspaceManager.getWorkspace('ws_123');

      expect(result).toEqual(mockWorkspace);
      expect(redis.hget).toHaveBeenCalledWith('workspace:ws_123', 'data');
    });

    it('should return null when workspace does not exist', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await workspaceManager.getWorkspace('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('joinWorkspace', () => {
    it('should add new collaborator to workspace', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        name: 'Test Workspace',
        ownerId: 'user123',
        collaborators: [{
          userId: 'user123',
          role: CollaboratorRole.OWNER,
          joinedAt: new Date(),
          lastActive: new Date(),
          permissions: [],
          contributions: 0
        }],
        updatedAt: new Date(),
        knowledgeGraph: { nodes: [], edges: [], lastUpdated: new Date() },
        sharedContext: {
          conversationHistory: [],
          activeTopics: [],
          recentInsights: [],
          collaborativeState: {
            activeUsers: [],
            currentFocus: '',
            sharedCursor: [],
            lockState: []
          }
        }
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      await workspaceManager.joinWorkspace('ws_123', 'user456', CollaboratorRole.EDITOR);

      expect(redis.hset).toHaveBeenCalled();
      expect(redis.publish).toHaveBeenCalled();
    });

    it('should throw error when workspace does not exist', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      await expect(workspaceManager.joinWorkspace('nonexistent', 'user456')).rejects.toThrow('Workspace nonexistent not found');
    });
  });

  describe('addKnowledge', () => {
    it('should add knowledge to workspace successfully', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        name: 'Test Workspace',
        ownerId: 'user123',
        collaborators: [{
          userId: 'user123',
          role: CollaboratorRole.OWNER,
          joinedAt: new Date(),
          lastActive: new Date(),
          permissions: [],
          contributions: 0
        }],
        updatedAt: new Date(),
        knowledgeGraph: { nodes: [], edges: [], lastUpdated: new Date() },
        sharedContext: {
          conversationHistory: [],
          activeTopics: [],
          recentInsights: [],
          collaborativeState: {
            activeUsers: [],
            currentFocus: '',
            sharedCursor: [],
            lockState: []
          }
        }
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      const knowledge = {
        type: KnowledgeType.INSIGHT,
        content: 'This is a test insight',
        metadata: {
          tags: ['test'],
          confidence: 0.9,
          source: 'user',
          version: 1
        },
        createdBy: 'user123'
      };

      const result = await workspaceManager.addKnowledge('ws_123', knowledge);

      expect(result).toBeDefined();
      expect(result.content).toBe(knowledge.content);
      expect(result.embeddings).toEqual([0.1, 0.2, 0.3]);
      expect(embeddingManager.generateEmbedding).toHaveBeenCalledWith(knowledge.content);
      expect(redis.hset).toHaveBeenCalledTimes(2); // Once for knowledge, once for workspace
      expect(redis.publish).toHaveBeenCalled();
    });
  });

  describe('queryKnowledge', () => {
    it('should query knowledge using vector similarity', async () => {
      const mockResults = [
        1, // Number of results
        'knowledge:ws_123:kn_123',
        ['content', 'Test content', 'type', 'insight', 'metadata', '{"tags":["test"]}', 'createdBy', 'user123', 'createdAt', '2023-01-01T00:00:00.000Z', 'score', '0.95']
      ];

      redis.call = jest.fn().mockResolvedValue(mockResults);

      const results = await workspaceManager.queryKnowledge('ws_123', 'test query');

      expect(results).toHaveLength(1);
      expect(results[0].content).toBe('Test content');
      expect(results[0].metadata.relevanceScore).toBe(0.95);
      expect(embeddingManager.generateEmbedding).toHaveBeenCalledWith('test query');
    });

    it('should handle query errors gracefully', async () => {
      redis.call = jest.fn().mockRejectedValue(new Error('Search failed'));

      const results = await workspaceManager.queryKnowledge('ws_123', 'test query');

      expect(results).toEqual([]);
    });
  });

  describe('addKnowledgeRelationship', () => {
    it('should add relationship between knowledge nodes', async () => {
      const mockWorkspace = {
        id: 'ws_123',
        name: 'Test Workspace',
        ownerId: 'user123',
        collaborators: [],
        updatedAt: new Date(),
        knowledgeGraph: { nodes: [], edges: [], lastUpdated: new Date() },
        sharedContext: {
          conversationHistory: [],
          activeTopics: [],
          recentInsights: [],
          collaborativeState: {
            activeUsers: [],
            currentFocus: '',
            sharedCursor: [],
            lockState: []
          }
        }
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockWorkspace));

      await workspaceManager.addKnowledgeRelationship('ws_123', 'kn_1', 'kn_2', RelationshipType.RELATES_TO, 0.8);

      expect(redis.hset).toHaveBeenCalled();
    });
  });

  describe('getWorkspacesByUser', () => {
    it('should return workspaces where user is a collaborator', async () => {
      const mockWorkspace1 = {
        id: 'ws_123',
        name: 'Workspace 1',
        collaborators: [{ userId: 'user123', role: CollaboratorRole.OWNER }],
        updatedAt: new Date('2023-01-02')
      };

      const mockWorkspace2 = {
        id: 'ws_456',
        name: 'Workspace 2',
        collaborators: [{ userId: 'user456', role: CollaboratorRole.EDITOR }],
        updatedAt: new Date('2023-01-01')
      };

      redis.keys = jest.fn().mockResolvedValue(['workspace:ws_123', 'workspace:ws_456']);
      redis.hget = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(mockWorkspace1))
        .mockResolvedValueOnce(JSON.stringify(mockWorkspace2));

      const results = await workspaceManager.getWorkspacesByUser('user123');

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('ws_123');
    });
  });
});