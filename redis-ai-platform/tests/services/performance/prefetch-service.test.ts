import { PrefetchService } from '../../../src/services/performance/prefetch-service';
import { PrefetchConfig } from '../../../src/services/performance/types';

// Mock Redis
const mockRedis = {
  get: jest.fn(),
  mget: jest.fn(),
  hget: jest.fn(),
  quit: jest.fn().mockResolvedValue(undefined)
};

// Mock Redis constructor
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => mockRedis)
  };
});

describe('PrefetchService', () => {
  let prefetchService: PrefetchService;
  let config: PrefetchConfig;

  beforeEach(() => {
    config = {
      enabled: true,
      maxCacheSize: 1000000, // 1MB
      prefetchThreshold: 0.8,
      backgroundRefreshInterval: 60000,
      popularityDecayFactor: 0.95
    };
    
    prefetchService = new PrefetchService(config);
    
    // Reset mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    prefetchService.stop();
  });

  describe('caching', () => {
    it('should cache retrieved values', async () => {
      mockRedis.get.mockResolvedValue('cached-value');

      // First call should hit Redis
      const result1 = await prefetchService.get(mockRedis as any, 'test-key');
      expect(result1).toBe('cached-value');
      expect(mockRedis.get).toHaveBeenCalledWith('test-key');

      // Second call should hit cache
      mockRedis.get.mockClear();
      const result2 = await prefetchService.get(mockRedis as any, 'test-key');
      expect(result2).toBe('cached-value');
      expect(mockRedis.get).not.toHaveBeenCalled();
    });

    it('should handle cache misses', async () => {
      mockRedis.get.mockResolvedValue(null);

      const result = await prefetchService.get(mockRedis as any, 'missing-key');
      expect(result).toBeNull();
      expect(mockRedis.get).toHaveBeenCalledWith('missing-key');
    });

    it('should batch multiple get requests', async () => {
      mockRedis.mget.mockResolvedValue(['value1', 'value2', 'value3']);

      const keys = ['key1', 'key2', 'key3'];
      const results = await prefetchService.mget(mockRedis as any, keys);

      expect(results).toEqual(['value1', 'value2', 'value3']);
      expect(mockRedis.mget).toHaveBeenCalledWith(...keys);
    });

    it('should handle mixed cache hits and misses in mget', async () => {
      // Pre-cache one value
      mockRedis.get.mockResolvedValue('cached-value');
      await prefetchService.get(mockRedis as any, 'key1');

      // Now test mget with mixed hits/misses
      mockRedis.mget.mockResolvedValue(['value2', 'value3']);

      const results = await prefetchService.mget(mockRedis as any, ['key1', 'key2', 'key3']);

      expect(results).toEqual(['cached-value', 'value2', 'value3']);
      expect(mockRedis.mget).toHaveBeenCalledWith('key2', 'key3');
    });
  });

  describe('access pattern tracking', () => {
    it('should track access patterns', async () => {
      mockRedis.get.mockResolvedValue('value');

      // Access the same key multiple times
      await prefetchService.get(mockRedis as any, 'frequent-key');
      await prefetchService.get(mockRedis as any, 'frequent-key');
      await prefetchService.get(mockRedis as any, 'frequent-key');

      const metrics = prefetchService.getMetrics();
      expect(metrics.accessPatterns).toBe(1);
      expect(metrics.cacheHits).toBe(2); // First miss, then 2 hits
    });

    it('should identify related keys', async () => {
      mockRedis.get.mockResolvedValue('value');

      // Access related keys in quick succession
      await prefetchService.get(mockRedis as any, 'user:123');
      await prefetchService.get(mockRedis as any, 'profile:123');
      await prefetchService.get(mockRedis as any, 'settings:123');

      const metrics = prefetchService.getMetrics();
      expect(metrics.accessPatterns).toBe(3);
    });
  });

  describe('hash operations', () => {
    it('should handle hash get operations', async () => {
      mockRedis.hget.mockResolvedValue('hash-value');

      const result = await prefetchService.hget(mockRedis as any, 'hash-key', 'field');
      expect(result).toBe('hash-value');
      expect(mockRedis.hget).toHaveBeenCalledWith('hash-key', 'field');

      // Second call should hit cache
      mockRedis.hget.mockClear();
      const result2 = await prefetchService.hget(mockRedis as any, 'hash-key', 'field');
      expect(result2).toBe('hash-value');
      expect(mockRedis.hget).not.toHaveBeenCalled();
    });
  });

  describe('cache eviction', () => {
    it('should evict least useful entries when cache is full', async () => {
      // Create a service with very small cache
      const smallCacheService = new PrefetchService({
        ...config,
        maxCacheSize: 100 // Very small cache
      });

      mockRedis.get.mockResolvedValue('x'.repeat(50)); // 50 byte value

      // Fill cache beyond capacity
      await smallCacheService.get(mockRedis as any, 'key1');
      await smallCacheService.get(mockRedis as any, 'key2');
      await smallCacheService.get(mockRedis as any, 'key3'); // Should trigger eviction

      const metrics = smallCacheService.getMetrics();
      expect(metrics.evictions).toBeGreaterThan(0);

      smallCacheService.stop();
    });
  });

  describe('metrics', () => {
    it('should track cache hit rate', async () => {
      mockRedis.get.mockResolvedValue('value');

      // First access - cache miss
      await prefetchService.get(mockRedis as any, 'test-key');
      
      // Second access - cache hit
      await prefetchService.get(mockRedis as any, 'test-key');

      const metrics = prefetchService.getMetrics();
      expect(metrics.cacheHits).toBe(1);
      expect(metrics.cacheMisses).toBe(1);
      expect(metrics.hitRate).toBe(0.5);
    });

    it('should track cache size', async () => {
      mockRedis.get.mockResolvedValue('test-value');

      await prefetchService.get(mockRedis as any, 'key1');
      await prefetchService.get(mockRedis as any, 'key2');

      const metrics = prefetchService.getMetrics();
      expect(metrics.cacheSize).toBe(2);
      expect(metrics.cacheSizeBytes).toBeGreaterThan(0);
    });
  });

  describe('disabled prefetching', () => {
    it('should work with prefetching disabled', async () => {
      const disabledService = new PrefetchService({
        ...config,
        enabled: false
      });

      mockRedis.get.mockResolvedValue('value');

      const result = await disabledService.get(mockRedis as any, 'test-key');
      expect(result).toBe('value');

      disabledService.stop();
    });
  });
});