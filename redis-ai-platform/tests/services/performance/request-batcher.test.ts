import { RequestBatcher } from '../../../src/services/performance/request-batcher';
import { BatchRequest } from '../../../src/services/performance/types';

// Mock Redis
const mockRedis = {
  mget: jest.fn(),
  pipeline: jest.fn(() => ({
    set: jest.fn(),
    exec: jest.fn().mockResolvedValue([[null, 'OK']])
  })),
  get: jest.fn(),
  set: jest.fn()
};

describe('RequestBatcher', () => {
  let batcher: RequestBatcher;

  beforeEach(() => {
    batcher = new RequestBatcher({
      maxBatchSize: 10,
      maxWaitTimeMs: 100,
      maxConcurrentBatches: 3,
      priorityLevels: 3
    });
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('request batching', () => {
    it('should batch GET requests', async () => {
      mockRedis.mget.mockResolvedValue(['value1', 'value2']);

      const request1: BatchRequest = {
        id: '1',
        operation: 'GET',
        key: 'key1',
        priority: 1,
        timestamp: Date.now()
      };

      const request2: BatchRequest = {
        id: '2',
        operation: 'GET',
        key: 'key2',
        priority: 1,
        timestamp: Date.now()
      };

      const [result1, result2] = await Promise.all([
        batcher.execute(mockRedis as any, request1),
        batcher.execute(mockRedis as any, request2)
      ]);

      expect(result1.success).toBe(true);
      expect(result1.data).toBe('value1');
      expect(result2.success).toBe(true);
      expect(result2.data).toBe('value2');
      expect(mockRedis.mget).toHaveBeenCalledWith('key1', 'key2');
    });

    it('should batch SET requests using pipeline', async () => {
      const request1: BatchRequest = {
        id: '1',
        operation: 'SET',
        key: 'key1',
        data: 'value1',
        priority: 1,
        timestamp: Date.now()
      };

      const request2: BatchRequest = {
        id: '2',
        operation: 'SET',
        key: 'key2',
        data: 'value2',
        priority: 1,
        timestamp: Date.now()
      };

      const [result1, result2] = await Promise.all([
        batcher.execute(mockRedis as any, request1),
        batcher.execute(mockRedis as any, request2)
      ]);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(mockRedis.pipeline).toHaveBeenCalled();
    });

    it('should respect priority ordering', async () => {
      mockRedis.mget.mockResolvedValue(['high', 'low']);

      const lowPriorityRequest: BatchRequest = {
        id: 'low',
        operation: 'GET',
        key: 'low-key',
        priority: 0,
        timestamp: Date.now()
      };

      const highPriorityRequest: BatchRequest = {
        id: 'high',
        operation: 'GET',
        key: 'high-key',
        priority: 2,
        timestamp: Date.now()
      };

      // Submit low priority first, then high priority
      const lowPromise = batcher.execute(mockRedis as any, lowPriorityRequest);
      const highPromise = batcher.execute(mockRedis as any, highPriorityRequest);

      const [lowResult, highResult] = await Promise.all([lowPromise, highPromise]);

      expect(lowResult.success).toBe(true);
      expect(highResult.success).toBe(true);
      
      // High priority should be processed first
      expect(mockRedis.mget).toHaveBeenCalledWith('high-key', 'low-key');
    });

    it('should process batch when max size is reached', async () => {
      mockRedis.mget.mockResolvedValue(Array(5).fill('value'));

      const requests = Array(5).fill(null).map((_, i) => ({
        id: i.toString(),
        operation: 'GET',
        key: `key${i}`,
        priority: 1,
        timestamp: Date.now()
      }));

      const promises = requests.map(req => 
        batcher.execute(mockRedis as any, req as BatchRequest)
      );

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('metrics', () => {
    it('should track batching metrics', async () => {
      mockRedis.mget.mockResolvedValue(['value1', 'value2']);

      const request1: BatchRequest = {
        id: '1',
        operation: 'GET',
        key: 'key1',
        priority: 1,
        timestamp: Date.now()
      };

      const request2: BatchRequest = {
        id: '2',
        operation: 'GET',
        key: 'key2',
        priority: 1,
        timestamp: Date.now()
      };

      await Promise.all([
        batcher.execute(mockRedis as any, request1),
        batcher.execute(mockRedis as any, request2)
      ]);

      const metrics = batcher.getMetrics();
      expect(metrics.totalRequests).toBe(2);
      expect(metrics.batchedRequests).toBe(2);
      expect(metrics.batchCount).toBe(1);
      expect(metrics.batchingEfficiency).toBe(1);
    });
  });

  describe('error handling', () => {
    it('should handle Redis errors gracefully', async () => {
      mockRedis.mget.mockRejectedValue(new Error('Redis error'));

      const request: BatchRequest = {
        id: '1',
        operation: 'GET',
        key: 'key1',
        priority: 1,
        timestamp: Date.now()
      };

      await expect(batcher.execute(mockRedis as any, request)).rejects.toThrow('Redis error');
    });
  });
});