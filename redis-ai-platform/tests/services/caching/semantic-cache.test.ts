import { createSemanticCache } from '../../../src/services/caching/semantic-cache';
import { createEmbeddingManager } from '../../../src/services/embedding-manager';
import { AIRequestType } from '../../../src/types';
import { createCacheableRequest } from '../../../src/services/caching';

describe('SemanticCache', () => {
  let semanticCache: ReturnType<typeof createSemanticCache>;
  let embeddingManager: ReturnType<typeof createEmbeddingManager>;

  beforeAll(async () => {
    // Initialize embedding manager for cache dependencies
    embeddingManager = createEmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: false,
    });

    semanticCache = createSemanticCache({
      similarityThreshold: 0.8,
      maxCacheSize: 100,
      defaultTTL: 60000, // 1 minute for testing
      enableEviction: true,
      evictionPolicy: 'lru',
    });
  });

  afterAll(async () => {
    await semanticCache.cleanup();
  });

  describe('basic caching operations', () => {
    it('should cache and retrieve responses', async () => {
      const query = 'What is Redis and how does it work?';
      const response = {
        content: 'Redis is an in-memory data structure store used as a database, cache, and message broker.',
        model: 'test-model',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };

      const metadata = {
        model: 'test-model',
        responseTime: 1500,
        tokenUsage: response.usage,
        cost: 0.005,
        quality: 0.9,
        tags: ['redis', 'database'],
        context: [],
      };

      // Cache the response
      await semanticCache.set(query, response, metadata);

      // Retrieve the cached response
      const cacheHit = await semanticCache.get(query);

      expect(cacheHit).toBeDefined();
      expect(cacheHit?.entry.response.content).toBe(response.content);
      expect(cacheHit?.similarity).toBeGreaterThan(0.9);
      expect(cacheHit?.isExact).toBe(true);
      expect(cacheHit?.timeSaved).toBe(1500);
      expect(cacheHit?.costSaved).toBe(0.005);
    });

    it('should find semantically similar queries', async () => {
      const originalQuery = 'Explain vector databases and their use cases';
      const similarQuery = 'What are vector databases used for?';

      const response = {
        content: 'Vector databases store and query high-dimensional vectors for AI applications.',
        model: 'test-model',
        usage: { promptTokens: 15, completionTokens: 25, totalTokens: 40 },
      };

      const metadata = {
        model: 'test-model',
        responseTime: 2000,
        tokenUsage: response.usage,
        cost: 0.008,
        quality: 0.85,
        tags: ['vector', 'database', 'ai'],
        context: [],
      };

      // Cache original query
      await semanticCache.set(originalQuery, response, metadata);

      // Try to get similar query
      const cacheHit = await semanticCache.get(similarQuery);

      expect(cacheHit).toBeDefined();
      expect(cacheHit?.similarity).toBeGreaterThan(0.7);
      expect(cacheHit?.isExact).toBe(false);
      expect(cacheHit?.entry.response.content).toBe(response.content);
    });

    it('should return null for dissimilar queries', async () => {
      const query1 = 'How to cook pasta?';
      const query2 = 'What is machine learning?';

      const response = {
        content: 'Boil water, add pasta, cook for 8-10 minutes.',
        model: 'test-model',
        usage: { promptTokens: 8, completionTokens: 12, totalTokens: 20 },
      };

      const metadata = {
        model: 'test-model',
        responseTime: 1000,
        tokenUsage: response.usage,
        cost: 0.003,
        quality: 0.8,
        tags: ['cooking', 'pasta'],
        context: [],
      };

      await semanticCache.set(query1, response, metadata);

      const cacheHit = await semanticCache.get(query2);
      expect(cacheHit).toBeNull();
    });
  });

  describe('cache eviction', () => {
    it('should evict entries when cache is full', async () => {
      // Fill cache to capacity
      for (let i = 0; i < 105; i++) {
        const query = `Test query number ${i}`;
        const response = { content: `Response ${i}`, model: 'test-model' };
        const metadata = {
          model: 'test-model',
          responseTime: 1000,
          tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          cost: 0.001,
          quality: 0.8,
          tags: ['test'],
          context: [],
        };

        await semanticCache.set(query, response, metadata);
      }

      const stats = await semanticCache.getStats();
      expect(stats.totalEntries).toBeLessThanOrEqual(100);
      expect(stats.evictionCount).toBeGreaterThan(0);
    });

    it('should respect TTL and evict expired entries', async () => {
      const shortTTLCache = createSemanticCache({
        defaultTTL: 100, // 100ms
        enableEviction: true,
      });

      const query = 'Short TTL test query';
      const response = { content: 'This will expire soon', model: 'test-model' };
      const metadata = {
        model: 'test-model',
        responseTime: 1000,
        tokenUsage: { promptTokens: 5, completionTokens: 5, totalTokens: 10 },
        cost: 0.001,
        quality: 0.8,
        tags: ['test'],
        context: [],
      };

      await shortTTLCache.set(query, response, metadata);

      // Should be available immediately
      let cacheHit = await shortTTLCache.get(query);
      expect(cacheHit).toBeDefined();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired now
      cacheHit = await shortTTLCache.get(query);
      expect(cacheHit).toBeNull();

      await shortTTLCache.cleanup();
    });
  });

  describe('quality filtering', () => {
    it('should not cache low quality responses', async () => {
      const query = 'Test low quality response';
      const response = { content: 'Error: Unable to process', model: 'test-model' };
      const metadata = {
        model: 'test-model',
        responseTime: 500,
        tokenUsage: { promptTokens: 5, completionTokens: 3, totalTokens: 8 },
        cost: 0.001,
        quality: 0.3, // Below threshold
        tags: ['test'],
        context: [],
      };

      await semanticCache.set(query, response, metadata);

      const cacheHit = await semanticCache.get(query);
      expect(cacheHit).toBeNull();
    });

    it('should cache high quality responses', async () => {
      const query = 'Test high quality response';
      const response = {
        content: 'This is a comprehensive and well-structured response that provides valuable information.',
        model: 'test-model',
      };
      const metadata = {
        model: 'test-model',
        responseTime: 2000,
        tokenUsage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        cost: 0.005,
        quality: 0.95, // High quality
        tags: ['test'],
        context: [],
      };

      await semanticCache.set(query, response, metadata);

      const cacheHit = await semanticCache.get(query);
      expect(cacheHit).toBeDefined();
      expect(cacheHit?.entry.metadata.quality).toBe(0.95);
    });
  });

  describe('cache statistics', () => {
    it('should track cache statistics', async () => {
      const initialStats = await semanticCache.getStats();
      
      // Add some cache entries
      for (let i = 0; i < 5; i++) {
        const query = `Stats test query ${i}`;
        const response = { content: `Response ${i}`, model: 'test-model' };
        const metadata = {
          model: 'test-model',
          responseTime: 1000 + i * 100,
          tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          cost: 0.001 * (i + 1),
          quality: 0.8,
          tags: ['stats', 'test'],
          context: [],
        };

        await semanticCache.set(query, response, metadata);
      }

      // Test cache hits
      await semanticCache.get('Stats test query 0');
      await semanticCache.get('Stats test query 1');
      await semanticCache.get('Non-existent query');

      const finalStats = await semanticCache.getStats();
      
      expect(finalStats.totalEntries).toBeGreaterThan(initialStats.totalEntries);
      expect(finalStats.hitRate).toBeGreaterThan(0);
      expect(finalStats.totalTimeSaved).toBeGreaterThan(0);
      expect(finalStats.totalCostSaved).toBeGreaterThan(0);
    });
  });

  describe('cache optimization', () => {
    it('should optimize cache and reclaim storage', async () => {
      // Add entries that will be candidates for eviction
      for (let i = 0; i < 10; i++) {
        const query = `Optimization test query ${i}`;
        const response = { content: `Response ${i}`, model: 'test-model' };
        const metadata = {
          model: 'test-model',
          responseTime: 1000,
          tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          cost: 0.001,
          quality: 0.8,
          tags: ['optimization', 'test'],
          context: [],
        };

        await semanticCache.set(query, response, metadata);
      }

      const optimizationResult = await semanticCache.optimize();
      
      expect(optimizationResult).toBeDefined();
      expect(optimizationResult.optimizationTime).toBeGreaterThan(0);
      expect(typeof optimizationResult.entriesEvicted).toBe('number');
      expect(typeof optimizationResult.storageReclaimed).toBe('number');
    });
  });

  describe('cache invalidation', () => {
    it('should invalidate cache entries by pattern', async () => {
      // Add entries with specific patterns
      const queries = [
        'Redis database tutorial',
        'Redis caching guide',
        'MongoDB database tutorial',
        'PostgreSQL database guide',
      ];

      for (const query of queries) {
        const response = { content: `Response for: ${query}`, model: 'test-model' };
        const metadata = {
          model: 'test-model',
          responseTime: 1000,
          tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          cost: 0.001,
          quality: 0.8,
          tags: ['database'],
          context: [],
        };

        await semanticCache.set(query, response, metadata);
      }

      // Invalidate Redis-related entries
      const deletedCount = await semanticCache.invalidate('Redis');
      
      expect(deletedCount).toBeGreaterThan(0);

      // Verify Redis entries are gone
      const redisHit = await semanticCache.get('Redis database tutorial');
      expect(redisHit).toBeNull();

      // Verify other entries still exist
      const mongoHit = await semanticCache.get('MongoDB database tutorial');
      expect(mongoHit).toBeDefined();
    });

    it('should clear entire cache when no pattern provided', async () => {
      // Add some entries
      for (let i = 0; i < 3; i++) {
        const query = `Clear test query ${i}`;
        const response = { content: `Response ${i}`, model: 'test-model' };
        const metadata = {
          model: 'test-model',
          responseTime: 1000,
          tokenUsage: { promptTokens: 10, completionTokens: 10, totalTokens: 20 },
          cost: 0.001,
          quality: 0.8,
          tags: ['clear', 'test'],
          context: [],
        };

        await semanticCache.set(query, response, metadata);
      }

      // Clear entire cache
      const deletedCount = await semanticCache.invalidate();
      
      expect(deletedCount).toBeGreaterThan(0);

      // Verify cache is empty
      const stats = await semanticCache.getStats();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('cache warmup', () => {
    it('should warm up cache with provided queries', async () => {
      const warmupQueries = [
        'What is artificial intelligence?',
        'How does machine learning work?',
        'Explain neural networks',
      ];

      await semanticCache.warmup(warmupQueries);

      // Verify entries were created
      for (const query of warmupQueries) {
        const cacheHit = await semanticCache.get(query);
        expect(cacheHit).toBeDefined();
        expect(cacheHit?.entry.metadata.tags).toContain('warmup');
      }
    });
  });

  describe('error handling', () => {
    it('should handle invalid queries gracefully', async () => {
      const emptyQuery = '';
      const nullResponse = null;

      // Should not throw errors
      await expect(semanticCache.get(emptyQuery)).resolves.toBeNull();
      
      const metadata = {
        model: 'test-model',
        responseTime: 1000,
        tokenUsage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        cost: 0,
        quality: 0.8,
        tags: [],
        context: [],
      };

      await expect(semanticCache.set(emptyQuery, nullResponse, metadata))
        .resolves.not.toThrow();
    });

    it('should handle Redis connection errors gracefully', async () => {
      // This would test Redis connection failure scenarios
      // For now, just ensure methods don't throw
      const query = 'Error handling test';
      
      await expect(semanticCache.get(query)).resolves.toBeDefined();
      await expect(semanticCache.getStats()).resolves.toBeDefined();
    });
  });
});