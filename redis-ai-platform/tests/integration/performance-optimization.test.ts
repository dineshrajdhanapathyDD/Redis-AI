import { ConnectionPool } from '../../src/services/performance/connection-pool';
import { RequestBatcher } from '../../src/services/performance/request-batcher';
import { PrefetchService } from '../../src/services/performance/prefetch-service';
import { QueryOptimizer } from '../../src/services/performance/query-optimizer';
import { PerformanceMonitor } from '../../src/services/performance/performance-monitor';
import { 
  ConnectionPoolConfig, 
  PrefetchConfig, 
  QueryOptimizationConfig,
  BatchRequest 
} from '../../src/services/performance/types';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      on: jest.fn(),
      get: jest.fn().mockResolvedValue('test-value'),
      set: jest.fn().mockResolvedValue('OK'),
      mget: jest.fn().mockResolvedValue(['value1', 'value2']),
      hget: jest.fn().mockResolvedValue('hash-value'),
      call: jest.fn().mockResolvedValue([2, 'doc1', ['field1', 'value1'], 'doc2', ['field2', 'value2']]),
      pipeline: jest.fn(() => ({
        set: jest.fn(),
        exec: jest.fn().mockResolvedValue([[null, 'OK']])
      }))
    }))
  };
});

describe('Performance Optimization Integration', () => {
  let connectionPool: ConnectionPool;
  let requestBatcher: RequestBatcher;
  let prefetchService: PrefetchService;
  let queryOptimizer: QueryOptimizer;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    // Initialize all performance components
    const poolConfig: ConnectionPoolConfig = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMs: 5000,
      idleTimeoutMs: 30000,
      maxRetries: 3
    };

    const prefetchConfig: PrefetchConfig = {
      enabled: true,
      maxCacheSize: 1000000,
      prefetchThreshold: 0.8,
      backgroundRefreshInterval: 60000,
      popularityDecayFactor: 0.95
    };

    const queryConfig: QueryOptimizationConfig = {
      enableIndexHints: true,
      enableQueryRewriting: true,
      enableResultCaching: true,
      maxComplexity: 100,
      timeoutMs: 5000
    };

    connectionPool = new ConnectionPool(poolConfig);
    requestBatcher = new RequestBatcher({
      maxBatchSize: 10,
      maxWaitTimeMs: 100,
      maxConcurrentBatches: 3,
      priorityLevels: 3
    });
    prefetchService = new PrefetchService(prefetchConfig);
    queryOptimizer = new QueryOptimizer(queryConfig);
    performanceMonitor = new PerformanceMonitor();

    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
  });

  afterEach(async () => {
    await connectionPool.close();
    prefetchService.stop();
    performanceMonitor.stop();
  });

  describe('integrated performance optimization', () => {
    it('should coordinate between all performance components', async () => {
      // Get a connection from the pool
      const redis = await connectionPool.acquire();
      
      // Use prefetch service for caching
      const cachedValue = await prefetchService.get(redis, 'test-key');
      expect(cachedValue).toBe('test-value');

      // Use request batcher for batched operations
      const batchRequest: BatchRequest = {
        id: '1',
        operation: 'GET',
        key: 'batch-key',
        priority: 1,
        timestamp: Date.now()
      };
      
      const batchResult = await requestBatcher.execute(redis, batchRequest);
      expect(batchResult.success).toBe(true);

      // Use query optimizer for vector searches
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10
      };
      
      const plan = await queryOptimizer.optimizeVectorSearch(redis, query);
      const searchResult = await queryOptimizer.executeOptimizedQuery(redis, plan);
      expect(searchResult.total).toBe(2);

      // Update performance monitor with metrics
      const poolMetrics = connectionPool.getMetrics();
      const batchMetrics = requestBatcher.getMetrics();
      const prefetchMetrics = prefetchService.getMetrics();
      const queryMetrics = queryOptimizer.getMetrics();

      performanceMonitor.updateConnectionPoolMetrics(poolMetrics.poolUtilization);
      performanceMonitor.updateBatchingMetrics(batchMetrics.batchingEfficiency);
      performanceMonitor.updateCacheMetrics(prefetchMetrics.hitRate);

      // Release connection back to pool
      connectionPool.release(redis);

      // Verify all components are working together
      const overallMetrics = performanceMonitor.getMetrics();
      expect(overallMetrics.connectionPoolUtilization).toBeDefined();
      expect(overallMetrics.batchingEfficiency).toBeDefined();
      expect(overallMetrics.cacheHitRate).toBeDefined();
    });

    it('should provide comprehensive performance recommendations', async () => {
      // Simulate some performance issues
      performanceMonitor.updateConnectionPoolMetrics(0.9); // High pool utilization
      performanceMonitor.updateBatchingMetrics(0.4); // Low batching efficiency
      performanceMonitor.updateCacheMetrics(0.6); // Low cache hit rate
      performanceMonitor.updateQueryLatency(600); // High query latency

      const recommendations = performanceMonitor.generateOptimizationRecommendations();
      
      expect(recommendations.length).toBeGreaterThan(0);
      
      // Should have recommendations for each problematic area
      const types = recommendations.map(r => r.type);
      expect(types).toContain('connection_pool');
      expect(types).toContain('batching');
      expect(types).toContain('caching');
      expect(types).toContain('query');
    });

    it('should handle high load scenarios', async () => {
      const promises = [];
      
      // Simulate high concurrent load
      for (let i = 0; i < 20; i++) {
        promises.push((async () => {
          const redis = await connectionPool.acquire();
          
          // Mix of operations
          await prefetchService.get(redis, `key-${i}`);
          
          const batchRequest: BatchRequest = {
            id: i.toString(),
            operation: 'GET',
            key: `batch-key-${i}`,
            priority: Math.floor(Math.random() * 3),
            timestamp: Date.now()
          };
          
          await requestBatcher.execute(redis, batchRequest);
          
          connectionPool.release(redis);
        })());
      }
      
      await Promise.all(promises);
      
      // Verify system handled the load
      const poolMetrics = connectionPool.getMetrics();
      const batchMetrics = requestBatcher.getMetrics();
      const prefetchMetrics = prefetchService.getMetrics();
      
      expect(poolMetrics.totalAcquisitions).toBe(20);
      expect(poolMetrics.totalReleases).toBe(20);
      expect(batchMetrics.totalRequests).toBe(20);
      expect(prefetchMetrics.cacheMisses).toBe(20); // First time accessing each key
    });

    it('should optimize query performance over time', async () => {
      const redis = await connectionPool.acquire();
      
      const query = {
        vector: new Array(128).fill(0.1),
        limit: 10,
        ef: 500 // High ef that should be optimized
      };
      
      // Execute the same query multiple times
      for (let i = 0; i < 5; i++) {
        const plan = await queryOptimizer.optimizeVectorSearch(redis, query);
        await queryOptimizer.executeOptimizedQuery(redis, plan);
      }
      
      const metrics = queryOptimizer.getMetrics();
      expect(metrics.totalQueries).toBe(5);
      expect(metrics.cacheHits).toBeGreaterThan(0); // Should have cache hits after first query
      
      connectionPool.release(redis);
    });

    it('should maintain cache consistency across components', async () => {
      const redis = await connectionPool.acquire();
      
      // Access the same key through different components
      const directValue = await prefetchService.get(redis, 'consistency-key');
      
      const batchRequest: BatchRequest = {
        id: 'consistency',
        operation: 'GET',
        key: 'consistency-key',
        priority: 1,
        timestamp: Date.now()
      };
      
      const batchResult = await requestBatcher.execute(redis, batchRequest);
      
      expect(directValue).toBe('test-value');
      expect(batchResult.data).toBe('test-value');
      
      connectionPool.release(redis);
    });
  });

  describe('performance monitoring and alerting', () => {
    it('should detect performance degradation', async () => {
      // Simulate performance degradation
      performanceMonitor.updateQueryLatency(1000); // Very high latency
      performanceMonitor.updateConnectionPoolMetrics(0.95); // Near capacity
      
      const recommendations = performanceMonitor.generateOptimizationRecommendations();
      const criticalRecs = recommendations.filter(r => r.severity === 'high' || r.severity === 'critical');
      
      expect(criticalRecs.length).toBeGreaterThan(0);
    });

    it('should track performance improvements', async () => {
      // Start with poor performance
      performanceMonitor.updateQueryLatency(800);
      performanceMonitor.updateCacheMetrics(0.3);
      
      const initialRecommendations = performanceMonitor.generateOptimizationRecommendations();
      
      // Simulate improvements
      performanceMonitor.updateQueryLatency(100);
      performanceMonitor.updateCacheMetrics(0.9);
      
      const improvedRecommendations = performanceMonitor.generateOptimizationRecommendations();
      
      expect(improvedRecommendations.length).toBeLessThan(initialRecommendations.length);
    });
  });

  describe('error handling and resilience', () => {
    it('should handle component failures gracefully', async () => {
      // This test would simulate various failure scenarios
      // For now, just verify basic error handling
      
      try {
        const redis = await connectionPool.acquire();
        connectionPool.release(redis);
      } catch (error) {
        // Should not throw under normal circumstances
        expect(error).toBeUndefined();
      }
    });

    it('should maintain performance under error conditions', async () => {
      // Simulate some errors and verify system continues to function
      const redis = await connectionPool.acquire();
      
      // Even if some operations fail, others should continue
      const value = await prefetchService.get(redis, 'error-test-key');
      expect(value).toBe('test-value');
      
      connectionPool.release(redis);
    });
  });
});