import { EmbeddingManager } from '../../src/services/embedding-manager';
import { ContentType } from '../../src/types';
import { createContent } from '../../src/services/embeddings';

describe('EmbeddingManager', () => {
  let embeddingManager: EmbeddingManager;

  beforeEach(() => {
    embeddingManager = new EmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: false, // Disable for testing
      batchSize: 10,
    });
  });

  describe('content processing', () => {
    it('should process text content successfully', async () => {
      const content = createContent(
        'test-content-1',
        ContentType.TEXT,
        'This is a test document for the Redis AI Platform embedding system.',
        {
          title: 'Test Document',
          description: 'A test document for embedding generation',
          tags: ['test', 'embedding', 'redis', 'ai'],
          source: 'test-suite',
        }
      );

      const embedding = await embeddingManager.processContent(content);

      expect(embedding).toBeDefined();
      expect(embedding.id).toBeDefined();
      expect(embedding.contentId).toBe('test-content-1');
      expect(embedding.contentType).toBe(ContentType.TEXT);
      expect(Array.isArray(embedding.vector)).toBe(true);
      expect(embedding.vector.length).toBeGreaterThan(0);
      expect(embedding.metadata.model).toBeDefined();
      expect(embedding.metadata.dimensions).toBeGreaterThan(0);
    });

    it('should process code content successfully', async () => {
      const content = createContent(
        'test-code-1',
        ContentType.CODE,
        `
        function calculateEmbedding(text) {
          // This is a sample JavaScript function
          const words = text.split(' ');
          return words.map(word => word.length);
        }
        
        export default calculateEmbedding;
        `,
        {
          title: 'Sample Function',
          description: 'A sample JavaScript function for testing',
          tags: ['javascript', 'function', 'embedding'],
          source: 'test.js',
          language: 'javascript',
        }
      );

      const embedding = await embeddingManager.processContent(content);

      expect(embedding).toBeDefined();
      expect(embedding.contentType).toBe(ContentType.CODE);
      expect(embedding.vector.length).toBeGreaterThan(0);
    });
  });

  describe('batch processing', () => {
    it('should process multiple contents in batch', async () => {
      const contents = [
        createContent('batch-1', ContentType.TEXT, 'First document about Redis', { source: 'test' }),
        createContent('batch-2', ContentType.TEXT, 'Second document about AI', { source: 'test' }),
        createContent('batch-3', ContentType.CODE, 'const redis = require("redis");', { 
          source: 'test.js',
          language: 'javascript',
        }),
      ];

      const embeddings = await embeddingManager.processBatchContent(contents);

      expect(embeddings).toHaveLength(3);
      expect(embeddings[0].contentType).toBe(ContentType.TEXT);
      expect(embeddings[1].contentType).toBe(ContentType.TEXT);
      expect(embeddings[2].contentType).toBe(ContentType.CODE);
      
      // All embeddings should have valid vectors
      embeddings.forEach(embedding => {
        expect(Array.isArray(embedding.vector)).toBe(true);
        expect(embedding.vector.length).toBeGreaterThan(0);
      });
    });
  });

  describe('similarity search', () => {
    beforeEach(async () => {
      // Process some content for searching
      const contents = [
        createContent('search-1', ContentType.TEXT, 'Redis is a fast in-memory database', { source: 'test' }),
        createContent('search-2', ContentType.TEXT, 'AI and machine learning with vectors', { source: 'test' }),
        createContent('search-3', ContentType.CODE, 'redis.set("key", "value")', { source: 'test.js' }),
      ];

      await embeddingManager.processBatchContent(contents);
    });

    it('should find similar content', async () => {
      const searchQuery = {
        query: 'database storage system',
        modalities: [ContentType.TEXT],
        limit: 5,
        threshold: 0.1, // Low threshold for testing
      };

      const results = await embeddingManager.searchSimilarContent(searchQuery);

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);
      
      // Results should be sorted by relevance
      for (let i = 1; i < results.length; i++) {
        expect(results[i].relevanceScore).toBeLessThanOrEqual(results[i - 1].relevanceScore);
      }
    });
  });

  describe('embedding statistics', () => {
    it('should provide embedding statistics', async () => {
      const stats = await embeddingManager.getEmbeddingStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalEmbeddings).toBe('number');
      expect(typeof stats.averageDimensions).toBe('number');
      expect(Array.isArray(stats.providers)).toBe(true);
      expect(stats.embeddingsByType).toBeDefined();
    });
  });
});