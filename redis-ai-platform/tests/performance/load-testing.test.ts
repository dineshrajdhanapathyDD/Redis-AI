import { Redis } from 'ioredis';
import { performance } from 'perf_hooks';
import { EmbeddingManager } from '../../src/services/embedding-manager';
import { VectorStorage } from '../../src/services/vector-storage';
import { MultiModalSearch } from '../../src/services/search/multi-modal-search';
import { CacheManager } from '../../src/services/caching/cache-manager';
import { MonitoringService } from '../../src/services/monitoring/monitoring-service';
import { logger } from '../../src/utils/logger';

interface PerformanceMetrics {
  operation: string;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  throughput: number;
  successRate: number;
  errorCount: number;
  memoryUsage: {
    before: NodeJS.MemoryUsage;
    after: NodeJS.MemoryUsage;
    peak: NodeJS.MemoryUsage;
  };
}

interface LoadTestConfig {
  concurrency: number;
  duration: number; // seconds
  rampUpTime: number; // seconds
  operations: string[];
  dataSize: 'small' | 'medium' | 'large';
}

class LoadTester {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private vectorStorage: VectorStorage;
  private multiModalSearch: MultiModalSearch;
  private cacheManager: CacheManager;
  private monitoring: MonitoringService;
  private metrics: Map<string, number[]> = new Map();
  private errors: Map<string, number> = new Map();

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    this.embeddingManager = new EmbeddingManager({
      defaultProvider: 'local',
      providers: {
        local: { type: 'local', modelPath: './models/test-model' },
      },
    });

    this.vectorStorage = new VectorStorage(this.redis, {
      defaultIndex: 'load_test_index',
      dimensions: 384,
      similarity: 'cosine',
    });

    this.multiModalSearch = new MultiModalSearch(this.embeddingManager, this.vectorStorage, this.redis);

    this.cacheManager = new CacheManager(this.redis, {
      ttl: 3600,
      maxSize: 10000,
      enableSemanticCache: true,
    });

    this.monitoring = new MonitoringService(this.redis, {
      metrics: { enabled: true, interval: 1, retention: 3600, aggregation: { enabled: true, intervals: [60] } },
      health: { enabled: true, interval: 30, timeout: 5, endpoints: [] },
      alerts: { enabled: true, rules: [], channels: [] },
      tracing: { enabled: true, sampleRate: 0.1, maxSpans: 1000, retention: 3600 },
      dashboard: { enabled: true, refreshInterval: 30, charts: [] },
    });
  }

  async initialize(): Promise<void> {
    await this.embeddingManager.initialize();
    await this.vectorStorage.initialize();
    await this.monitoring.initialize();
  }

  async runLoadTest(config: LoadTestConfig): Promise<Map<string, PerformanceMetrics>> {
    logger.info(`Starting load test with config:`, config);

    const results = new Map<string, PerformanceMetrics>();
    const startTime = performance.now();
    const endTime = startTime + (config.duration * 1000);

    // Prepare test data
    const testData = this.generateTestData(config.dataSize, 1000);

    // Ramp up workers
    const workers: Promise<void>[] = [];
    const workerStartInterval = (config.rampUpTime * 1000) / config.concurrency;

    for (let i = 0; i < config.concurrency; i++) {
      const workerDelay = i * workerStartInterval;
      workers.push(this.runWorker(i, config, testData, endTime, workerDelay));
    }

    // Wait for all workers to complete
    await Promise.all(workers);

    // Calculate metrics for each operation
    for (const operation of config.operations) {
      const times = this.metrics.get(operation) || [];
      const errorCount = this.errors.get(operation) || 0;
      const totalOperations = times.length + errorCount;

      if (times.length > 0) {
        const totalTime = times.reduce((sum, time) => sum + time, 0);
        const averageTime = totalTime / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const successRate = (times.length / totalOperations) * 100;
        const throughput = times.length / (config.duration);

        results.set(operation, {
          operation,
          totalTime,
          averageTime,
          minTime,
          maxTime,
          throughput,
          successRate,
          errorCount,
          memoryUsage: {
            before: process.memoryUsage(),
            after: process.memoryUsage(),
            peak: process.memoryUsage(),
          },
        });
      }
    }

    return results;
  }

  private async runWorker(
    workerId: number,
    config: LoadTestConfig,
    testData: any[],
    endTime: number,
    delay: number
  ): Promise<void> {
    // Wait for ramp-up delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    let operationIndex = 0;

    while (performance.now() < endTime) {
      const operation = config.operations[operationIndex % config.operations.length];
      const dataIndex = Math.floor(Math.random() * testData.length);
      const data = testData[dataIndex];

      try {
        const startTime = performance.now();
        await this.executeOperation(operation, data, workerId);
        const duration = performance.now() - startTime;

        // Record successful operation
        if (!this.metrics.has(operation)) {
          this.metrics.set(operation, []);
        }
        this.metrics.get(operation)!.push(duration);

      } catch (error) {
        // Record error
        const currentErrors = this.errors.get(operation) || 0;
        this.errors.set(operation, currentErrors + 1);
        logger.warn(`Worker ${workerId} operation ${operation} failed:`, error.message);
      }

      operationIndex++;

      // Small delay to prevent overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  private async executeOperation(operation: string, data: any, workerId: number): Promise<void> {
    switch (operation) {
      case 'embedding_generation':
        await this.embeddingManager.generateEmbedding(data.content, data.type);
        break;

      case 'vector_upsert':
        const embedding = await this.embeddingManager.generateEmbedding(data.content, data.type);
        await this.vectorStorage.upsert([{
          id: `load-test-${workerId}-${Date.now()}-${Math.random()}`,
          vector: embedding,
          metadata: data.metadata,
        }]);
        break;

      case 'vector_search':
        await this.vectorStorage.search({
          vector: data.queryVector,
          limit: 10,
          filters: data.filters,
        });
        break;

      case 'multimodal_search':
        await this.multiModalSearch.search({
          query: data.query,
          types: data.types,
          limit: 10,
          filters: data.filters,
        });
        break;

      case 'cache_set':
        await this.cacheManager.set(
          `load-test-${workerId}-${Date.now()}`,
          data.content,
          { ttl: 300 }
        );
        break;

      case 'cache_get':
        await this.cacheManager.get(data.cacheKey);
        break;

      case 'monitoring_record':
        await this.monitoring.recordPerformanceMetric({
          timestamp: Date.now(),
          endpoint: '/api/load-test',
          method: 'POST',
          responseTime: Math.random() * 200 + 50,
          statusCode: 200,
          requestSize: data.content.length,
          responseSize: 1024,
        });
        break;

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }

  private generateTestData(size: 'small' | 'medium' | 'large', count: number): any[] {
    const data: any[] = [];
    const contentSizes = {
      small: 100,
      medium: 1000,
      large: 10000,
    };

    const contentSize = contentSizes[size];

    for (let i = 0; i < count; i++) {
      const content = this.generateRandomContent(contentSize);
      const queryVector = Array.from({ length: 384 }, () => Math.random() - 0.5);

      data.push({
        content,
        type: 'text',
        query: content.substring(0, 50),
        queryVector,
        types: ['text'],
        filters: { category: `category-${i % 10}` },
        metadata: {
          id: `test-${i}`,
          category: `category-${i % 10}`,
          timestamp: Date.now(),
          size,
        },
        cacheKey: `cache-key-${i % 100}`, // Reuse some keys for cache hits
      });
    }

    return data;
  }

  private generateRandomContent(length: number): string {
    const words = [
      'artificial', 'intelligence', 'machine', 'learning', 'neural', 'network',
      'algorithm', 'data', 'science', 'technology', 'innovation', 'research',
      'development', 'analysis', 'optimization', 'performance', 'scalability',
      'efficiency', 'automation', 'processing', 'computation', 'modeling',
    ];

    let content = '';
    while (content.length < length) {
      const word = words[Math.floor(Math.random() * words.length)];
      content += word + ' ';
    }

    return content.substring(0, length);
  }

  async cleanup(): Promise<void> {
    // Clean up test data
    const keys = await this.redis.keys('load-test-*');
    if (keys.length > 0) {
      await this.redis.del(...keys);
    }

    await this.monitoring.stop();
    await this.redis.quit();
  }
}

describe('Load Testing Suite', () => {
  let loadTester: LoadTester;
  let isRedisAvailable = false;

  beforeAll(async () => {
    try {
      loadTester = new LoadTester();
      await loadTester.initialize();
      isRedisAvailable = true;
      logger.info('Load tester initialized');
    } catch (error) {
      logger.warn('Redis not available for load tests, skipping');
      isRedisAvailable = false;
    }
  });

  afterAll(async () => {
    if (isRedisAvailable && loadTester) {
      await loadTester.cleanup();
    }
  });

  describe('Embedding Generation Load Test', () => {
    it('should handle high-volume embedding generation', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 5,
        duration: 10, // 10 seconds
        rampUpTime: 2, // 2 seconds ramp-up
        operations: ['embedding_generation'],
        dataSize: 'small',
      };

      const results = await loadTester.runLoadTest(config);
      const embeddingResults = results.get('embedding_generation');

      expect(embeddingResults).toBeDefined();
      expect(embeddingResults!.successRate).toBeGreaterThan(90);
      expect(embeddingResults!.averageTime).toBeLessThan(1000); // Less than 1 second
      expect(embeddingResults!.throughput).toBeGreaterThan(1); // At least 1 operation per second

      logger.info('Embedding generation load test results:', embeddingResults);
    }, 30000);
  });

  describe('Vector Operations Load Test', () => {
    it('should handle high-volume vector operations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 3,
        duration: 15, // 15 seconds
        rampUpTime: 3, // 3 seconds ramp-up
        operations: ['vector_upsert', 'vector_search'],
        dataSize: 'medium',
      };

      const results = await loadTester.runLoadTest(config);

      for (const [operation, metrics] of results) {
        expect(metrics.successRate).toBeGreaterThan(85);
        expect(metrics.averageTime).toBeLessThan(2000); // Less than 2 seconds
        logger.info(`${operation} load test results:`, metrics);
      }
    }, 45000);
  });

  describe('Search Operations Load Test', () => {
    it('should handle high-volume search operations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 4,
        duration: 12, // 12 seconds
        rampUpTime: 2, // 2 seconds ramp-up
        operations: ['multimodal_search'],
        dataSize: 'small',
      };

      const results = await loadTester.runLoadTest(config);
      const searchResults = results.get('multimodal_search');

      expect(searchResults).toBeDefined();
      expect(searchResults!.successRate).toBeGreaterThan(90);
      expect(searchResults!.averageTime).toBeLessThan(1500); // Less than 1.5 seconds
      expect(searchResults!.throughput).toBeGreaterThan(2); // At least 2 searches per second

      logger.info('Multi-modal search load test results:', searchResults);
    }, 35000);
  });

  describe('Cache Operations Load Test', () => {
    it('should handle high-volume cache operations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 8,
        duration: 8, // 8 seconds
        rampUpTime: 1, // 1 second ramp-up
        operations: ['cache_set', 'cache_get'],
        dataSize: 'small',
      };

      const results = await loadTester.runLoadTest(config);

      for (const [operation, metrics] of results) {
        expect(metrics.successRate).toBeGreaterThan(95);
        expect(metrics.averageTime).toBeLessThan(100); // Less than 100ms
        expect(metrics.throughput).toBeGreaterThan(10); // At least 10 operations per second
        logger.info(`${operation} load test results:`, metrics);
      }
    }, 25000);
  });

  describe('Mixed Operations Load Test', () => {
    it('should handle mixed high-volume operations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 6,
        duration: 20, // 20 seconds
        rampUpTime: 4, // 4 seconds ramp-up
        operations: [
          'embedding_generation',
          'vector_upsert',
          'multimodal_search',
          'cache_set',
          'cache_get',
          'monitoring_record',
        ],
        dataSize: 'medium',
      };

      const results = await loadTester.runLoadTest(config);

      // Verify overall system performance under mixed load
      let totalOperations = 0;
      let totalErrors = 0;
      let averageSuccessRate = 0;

      for (const [operation, metrics] of results) {
        totalOperations += metrics.throughput * config.duration;
        totalErrors += metrics.errorCount;
        averageSuccessRate += metrics.successRate;
        
        expect(metrics.successRate).toBeGreaterThan(80); // At least 80% success rate
        logger.info(`${operation} mixed load test results:`, metrics);
      }

      averageSuccessRate /= results.size;
      const overallErrorRate = (totalErrors / (totalOperations + totalErrors)) * 100;

      expect(averageSuccessRate).toBeGreaterThan(85);
      expect(overallErrorRate).toBeLessThan(15);
      expect(totalOperations).toBeGreaterThan(100); // At least 100 operations total

      logger.info('Mixed operations load test summary:', {
        totalOperations,
        totalErrors,
        averageSuccessRate,
        overallErrorRate,
      });
    }, 60000);
  });

  describe('Stress Testing', () => {
    it('should handle extreme load conditions', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const config: LoadTestConfig = {
        concurrency: 10,
        duration: 15, // 15 seconds
        rampUpTime: 2, // 2 seconds ramp-up
        operations: ['embedding_generation', 'vector_search', 'cache_get'],
        dataSize: 'large',
      };

      const results = await loadTester.runLoadTest(config);

      // Under extreme load, we expect some degradation but system should remain stable
      for (const [operation, metrics] of results) {
        expect(metrics.successRate).toBeGreaterThan(70); // At least 70% success rate under stress
        expect(metrics.errorCount).toBeLessThan(100); // Reasonable error count
        logger.info(`${operation} stress test results:`, metrics);
      }

      // Verify system recovers after stress test
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds

      // Perform a simple operation to verify system is still responsive
      const testConfig: LoadTestConfig = {
        concurrency: 1,
        duration: 2,
        rampUpTime: 0,
        operations: ['cache_get'],
        dataSize: 'small',
      };

      const recoveryResults = await loadTester.runLoadTest(testConfig);
      const recoveryMetrics = recoveryResults.get('cache_get');

      expect(recoveryMetrics).toBeDefined();
      expect(recoveryMetrics!.successRate).toBeGreaterThan(95);

      logger.info('System recovery after stress test:', recoveryMetrics);
    }, 45000);
  });
});