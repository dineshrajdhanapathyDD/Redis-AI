import { EmbeddingService } from '../../../src/services/embeddings/base';
import { LocalEmbeddingProvider } from '../../../src/services/embeddings/local';
import { ContentType } from '../../../src/types';
import { createContent } from '../../../src/services/embeddings';

describe('EmbeddingService', () => {
  let embeddingService: EmbeddingService;
  let localProvider: LocalEmbeddingProvider;

  beforeEach(() => {
    embeddingService = new EmbeddingService();
    localProvider = new LocalEmbeddingProvider({
      provider: 'local',
      model: 'tfidf',
      dimensions: 100,
    });
  });

  describe('provider registration', () => {
    it('should register provider for content type', () => {
      embeddingService.registerProvider(ContentType.TEXT, localProvider);
      
      const providers = embeddingService.getAvailableProviders();
      expect(providers).toHaveLength(1);
      expect(providers[0].contentType).toBe(ContentType.TEXT);
      expect(providers[0].model).toBe('tfidf');
    });

    it('should set default provider', () => {
      embeddingService.setDefaultProvider(localProvider);
      
      const providers = embeddingService.getAvailableProviders();
      expect(providers.length).toBeGreaterThan(0);
      expect(providers.some(p => p.provider.includes('default'))).toBe(true);
    });
  });

  describe('embedding generation', () => {
    beforeEach(() => {
      embeddingService.registerProvider(ContentType.TEXT, localProvider);
    });

    it('should generate embedding for text content', async () => {
      const content = createContent(
        'test-content-1',
        ContentType.TEXT,
        'This is a test document for embedding generation.',
        {
          title: 'Test Document',
          tags: ['test', 'embedding'],
          source: 'test',
        }
      );

      const embedding = await embeddingService.generateEmbedding(content);

      expect(embedding).toBeDefined();
      expect(embedding.id).toBeDefined();
      expect(embedding.vector).toHaveLength(100);
      expect(embedding.contentId).toBe('test-content-1');
      expect(embedding.contentType).toBe(ContentType.TEXT);
      expect(embedding.metadata.model).toBe('tfidf');
      expect(embedding.metadata.dimensions).toBe(100);
    });

    it('should throw error for unsupported content type', async () => {
      const content = createContent(
        'test-content-2',
        ContentType.IMAGE,
        'image data',
        { source: 'test' }
      );

      await expect(embeddingService.generateEmbedding(content))
        .rejects.toThrow('No embedding provider available for content type: image');
    });

    it('should validate generated embedding', async () => {
      const content = createContent(
        'test-content-3',
        ContentType.TEXT,
        'Test content for validation',
        { source: 'test' }
      );

      const embedding = await embeddingService.generateEmbedding(content);
      const isValid = await embeddingService.validateEmbedding(embedding);

      expect(isValid).toBe(true);
    });
  });

  describe('batch embedding generation', () => {
    beforeEach(() => {
      embeddingService.registerProvider(ContentType.TEXT, localProvider);
      embeddingService.registerProvider(ContentType.CODE, localProvider);
    });

    it('should generate embeddings for multiple contents', async () => {
      const contents = [
        createContent('content-1', ContentType.TEXT, 'First test document', { source: 'test' }),
        createContent('content-2', ContentType.TEXT, 'Second test document', { source: 'test' }),
        createContent('content-3', ContentType.CODE, 'function test() { return true; }', { 
          source: 'test.js',
          language: 'javascript',
        }),
      ];

      const embeddings = await embeddingService.generateBatchEmbeddings(contents);

      expect(embeddings).toHaveLength(3);
      expect(embeddings[0].contentType).toBe(ContentType.TEXT);
      expect(embeddings[1].contentType).toBe(ContentType.TEXT);
      expect(embeddings[2].contentType).toBe(ContentType.CODE);
      
      // All embeddings should have the same dimensions
      embeddings.forEach(embedding => {
        expect(embedding.vector).toHaveLength(100);
      });
    });

    it('should handle mixed success and failure in batch', async () => {
      const contents = [
        createContent('content-1', ContentType.TEXT, 'Valid text content', { source: 'test' }),
        createContent('content-2', ContentType.IMAGE, 'Invalid image content', { source: 'test' }),
        createContent('content-3', ContentType.TEXT, 'Another valid text content', { source: 'test' }),
      ];

      const embeddings = await embeddingService.generateBatchEmbeddings(contents);

      // Should return embeddings for valid contents only
      expect(embeddings.length).toBeLessThan(contents.length);
      expect(embeddings.every(e => e.contentType === ContentType.TEXT)).toBe(true);
    });
  });

  describe('embedding validation', () => {
    it('should validate correct embedding structure', async () => {
      const validEmbedding = {
        id: 'test-embedding-1',
        vector: Array(100).fill(0).map(() => Math.random()),
        contentId: 'test-content-1',
        contentType: ContentType.TEXT,
        metadata: {
          source: 'test',
          timestamp: new Date(),
          version: 1,
          tags: ['test'],
          model: 'tfidf',
          dimensions: 100,
        },
        relationships: {
          childIds: [],
          similarIds: [],
          crossModalIds: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isValid = await embeddingService.validateEmbedding(validEmbedding);
      expect(isValid).toBe(true);
    });

    it('should reject embedding with invalid vector', async () => {
      const invalidEmbedding = {
        id: 'test-embedding-2',
        vector: [1, 2, NaN, 4, 5], // Contains NaN
        contentId: 'test-content-2',
        contentType: ContentType.TEXT,
        metadata: {
          source: 'test',
          timestamp: new Date(),
          version: 1,
          tags: ['test'],
          model: 'tfidf',
          dimensions: 5,
        },
        relationships: {
          childIds: [],
          similarIds: [],
          crossModalIds: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isValid = await embeddingService.validateEmbedding(invalidEmbedding);
      expect(isValid).toBe(false);
    });

    it('should reject embedding with empty vector', async () => {
      const invalidEmbedding = {
        id: 'test-embedding-3',
        vector: [], // Empty vector
        contentId: 'test-content-3',
        contentType: ContentType.TEXT,
        metadata: {
          source: 'test',
          timestamp: new Date(),
          version: 1,
          tags: ['test'],
          model: 'tfidf',
          dimensions: 0,
        },
        relationships: {
          childIds: [],
          similarIds: [],
          crossModalIds: [],
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const isValid = await embeddingService.validateEmbedding(invalidEmbedding);
      expect(isValid).toBe(false);
    });
  });
});