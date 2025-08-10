import { RedisConnectionManager, createRedisManager } from '../../src/config/redis';
import { RedisConfig } from '../../src/config/redis';

describe('RedisConnectionManager', () => {
  let redisConfig: RedisConfig;
  let redisManager: RedisConnectionManager;

  beforeEach(() => {
    redisConfig = {
      host: 'localhost',
      port: 6379,
      db: 0,
      clusterEnabled: false,
      maxConnections: 10,
      connectionTimeout: 5000,
      commandTimeout: 3000,
      retryAttempts: 3,
      retryDelay: 1000,
    };
    redisManager = new RedisConnectionManager(redisConfig);
  });

  afterEach(async () => {
    if (redisManager.isClientConnected()) {
      await redisManager.disconnect();
    }
  });

  describe('connect', () => {
    it('should connect to Redis successfully', async () => {
      const client = await redisManager.connect();
      expect(client).toBeDefined();
      expect(redisManager.isClientConnected()).toBe(true);
    });

    it('should handle connection errors gracefully', async () => {
      // Mock connection failure
      const mockClient = {
        connect: jest.fn().mockRejectedValue(new Error('Connection failed')),
        on: jest.fn(),
      };
      
      jest.doMock('redis', () => ({
        createClient: jest.fn(() => mockClient),
      }));

      await expect(redisManager.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('ping', () => {
    it('should ping Redis successfully', async () => {
      await redisManager.connect();
      const result = await redisManager.ping();
      expect(result).toBe('PONG');
    });

    it('should throw error when not connected', async () => {
      expect(() => redisManager.ping()).toThrow('Redis client is not connected');
    });
  });

  describe('createVectorIndex', () => {
    it('should create vector index successfully', async () => {
      await redisManager.connect();
      
      const indexConfig = {
        indexName: 'test-index',
        prefix: 'test:',
        dimensions: 1536,
        algorithm: 'HNSW' as const,
        distanceMetric: 'COSINE' as const,
        m: 16,
        efConstruction: 200,
      };

      await expect(redisManager.createVectorIndex(indexConfig)).resolves.not.toThrow();
    });

    it('should handle existing index gracefully', async () => {
      await redisManager.connect();
      
      // Mock existing index
      const client = redisManager.getClient();
      (client.ft.info as jest.Mock).mockResolvedValue({ indexName: 'test-index' });

      const indexConfig = {
        indexName: 'test-index',
        prefix: 'test:',
        dimensions: 1536,
        algorithm: 'HNSW' as const,
        distanceMetric: 'COSINE' as const,
      };

      await expect(redisManager.createVectorIndex(indexConfig)).resolves.not.toThrow();
    });
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const manager1 = createRedisManager(redisConfig);
      const manager2 = createRedisManager(redisConfig);
      expect(manager1).toBe(manager2);
    });
  });
});