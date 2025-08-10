import { QueryOptimizer } from '../../../src/services/performance/query-optimizer';
import { QueryOptimizationConfig } from '../../../src/services/performance/types';

// Mock Redis
const mockRedis = {
  call: jest.fn()
};

describe('QueryOptimizer', () => {
  let optimizer: QueryOptimizer;
  let config: QueryOptimizationConfig;

  beforeEach(() => {
    config = {
      enableIndexHints: true,
      enableQueryRewriting: true,
      enableResultCaching: true,
      maxComplexity: 100,
      timeoutMs: 5000
    };
    
    optimizer = new QueryOptimizer(config);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('query optimization', () => {
    it('should optimize vector search queries', async () => {
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10,
        ef: 200
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);

      expect(plan.originalQuery).toEqual(query);
      expect(plan.optimizedQuery).toBeDefined();
      expect(plan.estimatedCost).toBeGreaterThan(0);
      expect(plan.executionStrategy).toBeDefined();
    });

    it('should rewrite queries when enabled', async () => {
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10,
        ef: 500 // High ef value that should be optimized
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);

      // ef should be optimized to a lower value
      expect(plan.optimizedQuery.ef).toBeLessThan(query.ef);
      expect(plan.optimizedQuery.ef).toBe(Math.max(query.limit * 2, 100));
    });

    it('should add index hints when enabled', async () => {
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);

      expect(plan.indexHints).toBeDefined();
      expect(Array.isArray(plan.indexHints)).toBe(true);
    });

    it('should reject queries that exceed complexity limit', async () => {
      const complexQuery = {
        vector: new Array(10000).fill(0.1), // Very large vector
        limit: 1000
      };

      await expect(
        optimizer.optimizeVectorSearch(mockRedis as any, complexQuery)
      ).rejects.toThrow('Query complexity');
    });
  });

  describe('query execution', () => {
    it('should execute optimized queries', async () => {
      mockRedis.call.mockResolvedValue([2, 'doc1', ['field1', 'value1'], 'doc2', ['field2', 'value2']]);

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      const result = await optimizer.executeOptimizedQuery(mockRedis as any, plan);

      expect(result).toBeDefined();
      expect(result.total).toBe(2);
      expect(result.results).toHaveLength(2);
      expect(mockRedis.call).toHaveBeenCalledWith('FT.SEARCH', 'default', '*', 'LIMIT', '0', '10');
    });

    it('should handle empty search results', async () => {
      mockRedis.call.mockResolvedValue([0]);

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      const result = await optimizer.executeOptimizedQuery(mockRedis as any, plan);

      expect(result.total).toBe(0);
      expect(result.results).toHaveLength(0);
    });

    it('should handle Redis errors gracefully', async () => {
      mockRedis.call.mockRejectedValue(new Error('Redis search error'));

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      const plan = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      
      await expect(
        optimizer.executeOptimizedQuery(mockRedis as any, plan)
      ).rejects.toThrow('Redis search error');
    });
  });

  describe('result caching', () => {
    it('should cache query results when enabled', async () => {
      mockRedis.call.mockResolvedValue([1, 'doc1', ['field1', 'value1']]);

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      // First execution
      const plan1 = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      const result1 = await optimizer.executeOptimizedQuery(mockRedis as any, plan1);

      // Second execution should use cache
      mockRedis.call.mockClear();
      const plan2 = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      const result2 = await optimizer.executeOptimizedQuery(mockRedis as any, plan2);

      expect(result1).toEqual(result2);
      expect(mockRedis.call).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should not cache when caching is disabled', async () => {
      const noCacheOptimizer = new QueryOptimizer({
        ...config,
        enableResultCaching: false
      });

      mockRedis.call.mockResolvedValue([1, 'doc1', ['field1', 'value1']]);

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      // Execute twice
      const plan1 = await noCacheOptimizer.optimizeVectorSearch(mockRedis as any, query);
      await noCacheOptimizer.executeOptimizedQuery(mockRedis as any, plan1);

      const plan2 = await noCacheOptimizer.optimizeVectorSearch(mockRedis as any, query);
      await noCacheOptimizer.executeOptimizedQuery(mockRedis as any, plan2);

      expect(mockRedis.call).toHaveBeenCalledTimes(2); // Called twice without caching
    });
  });

  describe('metrics', () => {
    it('should track optimization metrics', async () => {
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10,
        ef: 500 // Will be optimized
      };

      await optimizer.optimizeVectorSearch(mockRedis as any, query);

      const metrics = optimizer.getMetrics();
      expect(metrics.totalQueries).toBe(1);
      expect(metrics.optimizedQueries).toBe(1);
      expect(metrics.optimizationRate).toBe(1);
    });

    it('should track cache hit rate', async () => {
      mockRedis.call.mockResolvedValue([1, 'doc1', ['field1', 'value1']]);

      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      // Execute same query twice
      const plan1 = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      await optimizer.executeOptimizedQuery(mockRedis as any, plan1);

      const plan2 = await optimizer.optimizeVectorSearch(mockRedis as any, query);
      await optimizer.executeOptimizedQuery(mockRedis as any, plan2);

      const metrics = optimizer.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheHitRate).toBe(0.5);
    });
  });

  describe('complexity analysis', () => {
    it('should calculate query complexity correctly', async () => {
      const simpleQuery = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };

      const complexQuery = {
        vector: new Array(1024).fill(0.1),
        limit: 100
      };

      const simplePlan = await optimizer.optimizeVectorSearch(mockRedis as any, simpleQuery);
      const complexPlan = await optimizer.optimizeVectorSearch(mockRedis as any, complexQuery);

      expect(complexPlan.estimatedCost).toBeGreaterThan(simplePlan.estimatedCost);
    });
  });
});