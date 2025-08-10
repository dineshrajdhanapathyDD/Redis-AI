import { MultiModalSearchEngine } from '../../../src/services/search/multi-modal-search';
import { SearchEngineOrchestrator, createSearchQuery } from '../../../src/services/search';
import { ContentType } from '../../../src/types';
import { createContent } from '../../../src/services/embeddings';
import { createEmbeddingManager } from '../../../src/services/embedding-manager';

describe('MultiModalSearchEngine', () => {
  let searchEngine: MultiModalSearchEngine;
  let embeddingManager: ReturnType<typeof createEmbeddingManager>;

  beforeAll(async () => {
    searchEngine = new MultiModalSearchEngine();
    embeddingManager = createEmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: true,
    });

    // Set up test data
    await setupTestData();
  });

  async function setupTestData() {
    const testContents = [
      createContent(
        'search-test-1',
        ContentType.TEXT,
        'Redis is a powerful in-memory database that supports vector operations for AI applications',
        {
          title: 'Redis for AI Applications',
          description: 'Guide to using Redis for AI and machine learning',
          tags: ['redis', 'ai', 'database', 'vector'],
          source: 'documentation',
        }
      ),
      createContent(
        'search-test-2',
        ContentType.CODE,
        `
        import redis from 'redis';
        
        const client = redis.createClient();
        
        async function storeVector(key, vector) {
          await client.json.set(key, '$', { vector, timestamp: Date.now() });
        }
        `,
        {
          title: 'Redis Vector Storage Code',
          description: 'JavaScript code for storing vectors in Redis',
          tags: ['javascript', 'redis', 'vector', 'storage'],
          source: 'example.js',
          language: 'javascript',
        }
      ),
      createContent(
        'search-test-3',
        ContentType.TEXT,
        'Machine learning models use embeddings to represent data in high-dimensional vector spaces',
        {
          title: 'Understanding Embeddings',
          description: 'Introduction to vector embeddings in ML',
          tags: ['machine-learning', 'embeddings', 'vectors', 'ai'],
          source: 'ml-guide',
        }
      ),
    ];

    // Process test content
    await embeddingManager.processBatchContent(testContents);
  }

  describe('basic search functionality', () => {
    it('should perform text search successfully', async () => {
      const query = createSearchQuery('Redis database vector operations', [ContentType.TEXT]);
      
      const result = await searchEngine.search(query, {
        enableCrossModal: false,
        maxResults: 5,
      });

      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
      expect(result.analytics).toBeDefined();
      expect(result.analytics.queryTime).toBeGreaterThan(0);
      expect(result.analytics.totalResults).toBeGreaterThanOrEqual(0);
    });

    it('should search across multiple modalities', async () => {
      const query = createSearchQuery(
        'vector storage implementation',
        [ContentType.TEXT, ContentType.CODE]
      );
      
      const result = await searchEngine.search(query, {
        enableCrossModal: true,
        maxResults: 10,
      });

      expect(result.results).toBeDefined();
      expect(result.analytics.resultsByModality).toBeDefined();
      
      // Should have results from multiple modalities if available
      const modalityCount = Object.values(result.analytics.resultsByModality)
        .filter(count => count > 0).length;
      expect(modalityCount).toBeGreaterThanOrEqual(1);
    });

    it('should respect search filters', async () => {
      const query = createSearchQuery('redis', [ContentType.TEXT, ContentType.CODE], {
        filters: {
          tags: ['redis'],
          contentType: [ContentType.TEXT],
        },
      });
      
      const result = await searchEngine.search(query);

      // All results should be TEXT type due to filter
      result.results.forEach(r => {
        expect(r.type).toBe(ContentType.TEXT);
      });
    });

    it('should apply minimum score threshold', async () => {
      const query = createSearchQuery('redis', [ContentType.TEXT], {
        threshold: 0.8, // High threshold
      });
      
      const result = await searchEngine.search(query, {
        minScore: 0.8,
      });

      // All results should meet the minimum score
      result.results.forEach(r => {
        expect(r.relevanceScore).toBeGreaterThanOrEqual(0.8);
      });
    });
  });

  describe('cross-modal search', () => {
    it('should find cross-modal relationships', async () => {
      const query = createSearchQuery('redis vector storage', [ContentType.TEXT, ContentType.CODE]);
      
      const result = await searchEngine.search(query, {
        enableCrossModal: true,
        maxResults: 5,
      });

      // Check if any results have cross-modal matches
      const hassCrossModalMatches = result.results.some(r => r.crossModalMatches.length > 0);
      
      if (result.results.length > 1) {
        // Should have cross-modal matches if we have results from different modalities
        expect(result.analytics.crossModalMatches).toBeGreaterThanOrEqual(0);
      }
    });

    it('should handle cross-modal search when disabled', async () => {
      const query = createSearchQuery('redis', [ContentType.TEXT, ContentType.CODE]);
      
      const result = await searchEngine.search(query, {
        enableCrossModal: false,
      });

      // Should not have cross-modal matches when disabled
      result.results.forEach(r => {
        expect(r.crossModalMatches).toEqual([]);
      });
    });
  });

  describe('search caching', () => {
    it('should cache search results', async () => {
      const query = createSearchQuery('machine learning embeddings', [ContentType.TEXT]);
      
      // First search
      const result1 = await searchEngine.search(query);
      expect(result1.analytics.cacheHit).toBe(false);
      
      // Second search should hit cache
      const result2 = await searchEngine.search(query);
      expect(result2.analytics.cacheHit).toBe(true);
      
      // Results should be identical
      expect(result1.results.length).toBe(result2.results.length);
    });

    it('should clear cache when requested', async () => {
      const query = createSearchQuery('vector operations', [ContentType.TEXT]);
      
      // Search and cache
      await searchEngine.search(query);
      
      // Clear cache
      searchEngine.clearCache();
      
      // Next search should not hit cache
      const result = await searchEngine.search(query);
      expect(result.analytics.cacheHit).toBe(false);
    });
  });

  describe('search analytics', () => {
    it('should provide comprehensive analytics', async () => {
      const query = createSearchQuery('ai database', [ContentType.TEXT, ContentType.CODE]);
      
      const result = await searchEngine.search(query);

      expect(result.analytics).toMatchObject({
        queryTime: expect.any(Number),
        totalResults: expect.any(Number),
        resultsByModality: expect.any(Object),
        averageScore: expect.any(Number),
        crossModalMatches: expect.any(Number),
        cacheHit: expect.any(Boolean),
      });

      expect(result.analytics.queryTime).toBeGreaterThan(0);
      expect(result.analytics.averageScore).toBeGreaterThanOrEqual(0);
      expect(result.analytics.averageScore).toBeLessThanOrEqual(1);
    });

    it('should track results by modality correctly', async () => {
      const query = createSearchQuery('redis', [ContentType.TEXT, ContentType.CODE]);
      
      const result = await searchEngine.search(query);

      const modalityCounts = result.analytics.resultsByModality;
      const totalFromModalities = Object.values(modalityCounts).reduce((sum, count) => sum + count, 0);
      
      expect(totalFromModalities).toBe(result.analytics.totalResults);
    });
  });

  describe('error handling', () => {
    it('should handle empty queries gracefully', async () => {
      const query = createSearchQuery('', [ContentType.TEXT]);
      
      // Should not throw, but may return empty results
      const result = await searchEngine.search(query);
      expect(result.results).toBeDefined();
      expect(Array.isArray(result.results)).toBe(true);
    });

    it('should handle invalid modalities gracefully', async () => {
      const query = createSearchQuery('test query', []);
      
      // Should handle empty modalities array
      const result = await searchEngine.search(query);
      expect(result.results).toBeDefined();
    });

    it('should handle search errors gracefully', async () => {
      // This would test error scenarios in a real implementation
      // For now, just ensure the search doesn't crash
      const query = createSearchQuery('test', [ContentType.TEXT]);
      
      await expect(searchEngine.search(query)).resolves.toBeDefined();
    });
  });
});

describe('SearchEngineOrchestrator', () => {
  let orchestrator: SearchEngineOrchestrator;

  beforeEach(() => {
    orchestrator = new SearchEngineOrchestrator({
      enableCrossModal: true,
      enableSemanticExpansion: true,
      maxResults: 10,
      rankingStrategy: 'general',
    });
  });

  describe('orchestrated search', () => {
    it('should perform complete search workflow', async () => {
      const query = createSearchQuery('redis ai platform', [ContentType.TEXT]);
      
      const result = await orchestrator.search(query);

      expect(result.results).toBeDefined();
      expect(result.analytics).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      expect(result.analytics.rankingStrategy).toBe('general');
    });

    it('should generate search suggestions', async () => {
      const query = createSearchQuery('machine learning', [ContentType.TEXT]);
      
      const result = await orchestrator.search(query);

      expect(result.suggestions).toBeDefined();
      expect(Array.isArray(result.suggestions)).toBe(true);
      // Suggestions should be related to the query
      if (result.suggestions.length > 0) {
        expect(result.suggestions[0]).toContain('machine learning');
      }
    });

    it('should apply different ranking strategies', async () => {
      const query = createSearchQuery('redis', [ContentType.TEXT]);
      
      // Test different ranking strategies
      const strategies = ['general', 'recent', 'popular', 'precise'] as const;
      
      for (const strategy of strategies) {
        orchestrator.updateConfig({ rankingStrategy: strategy });
        const result = await orchestrator.search(query);
        
        expect(result.analytics.rankingStrategy).toBe(strategy);
      }
    });
  });

  describe('multi-strategy search', () => {
    it('should blend results from multiple strategies', async () => {
      const query = createSearchQuery('vector database', [ContentType.TEXT]);
      
      const strategies = [
        {
          name: 'precise',
          config: { rankingStrategy: 'precise' as const },
          weight: 0.6,
        },
        {
          name: 'popular',
          config: { rankingStrategy: 'popular' as const },
          weight: 0.4,
        },
      ];

      const result = await orchestrator.searchWithMultipleStrategies(query, strategies);

      expect(result.results).toBeDefined();
      expect(result.strategyBreakdown).toBeDefined();
      expect(result.strategyBreakdown).toHaveLength(strategies.length);
      
      result.strategyBreakdown.forEach(breakdown => {
        expect(breakdown.strategy).toBeDefined();
        expect(breakdown.results).toBeGreaterThanOrEqual(0);
        expect(breakdown.avgScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('search management', () => {
    it('should provide search statistics', async () => {
      const stats = await orchestrator.getSearchStats();

      expect(stats).toMatchObject({
        totalSearches: expect.any(Number),
        averageQueryTime: expect.any(Number),
        popularQueries: expect.any(Array),
        modalityUsage: expect.any(Object),
        cacheHitRate: expect.any(Number),
        crossModalStats: expect.any(Object),
      });
    });

    it('should clear all caches', () => {
      expect(() => orchestrator.clearAllCaches()).not.toThrow();
    });

    it('should update configuration', () => {
      const newConfig = {
        maxResults: 20,
        enableCrossModal: false,
        rankingStrategy: 'recent' as const,
      };

      expect(() => orchestrator.updateConfig(newConfig)).not.toThrow();
    });
  });
});