import { VectorStorageService } from '../../src/services/vector-storage';
import { ContentType, VectorEmbedding } from '../../src/types';

describe('VectorStorageService', () => {
  let vectorStorage: VectorStorageService;
  let mockEmbedding: VectorEmbedding;

  beforeEach(() => {
    vectorStorage = new VectorStorageService('test_platform');
    
    mockEmbedding = {
      id: 'test-embedding-1',
      vector: Array(100).fill(0).map(() => Math.random()),
      contentId: 'test-content-1',
      contentType: ContentType.TEXT,
      metadata: {
        source: 'test',
        timestamp: new Date(),
        version: 1,
        tags: ['test', 'embedding'],
        model: 'test-model',
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
  });

  describe('embedding storage', () => {
    it('should store embedding successfully', async () => {
      await expect(vectorStorage.storeEmbedding(mockEmbedding))
        .resolves.not.toThrow();
    });

    it('should store batch embeddings successfully', async () => {
      const embeddings = [
        mockEmbedding,
        {
          ...mockEmbedding,
          id: 'test-embedding-2',
          contentId: 'test-content-2',
          contentType: ContentType.CODE,
        },
        {
          ...mockEmbedding,
          id: 'test-embedding-3',
          contentId: 'test-content-3',
          contentType: ContentType.IMAGE,
        },
      ];

      await expect(vectorStorage.storeBatchEmbeddings(embeddings))
        .resolves.not.toThrow();
    });
  });

  describe('embedding retrieval', () => {
    beforeEach(async () => {
      await vectorStorage.storeEmbedding(mockEmbedding);
    });

    it('should retrieve stored embedding', async () => {
      const retrieved = await vectorStorage.getEmbedding('test-embedding-1');
      
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-embedding-1');
      expect(retrieved?.contentId).toBe('test-content-1');
      expect(retrieved?.contentType).toBe(ContentType.TEXT);
      expect(retrieved?.vector).toHaveLength(100);
    });

    it('should return null for non-existent embedding', async () => {
      const retrieved = await vectorStorage.getEmbedding('non-existent-id');
      expect(retrieved).toBeNull();
    });

    it('should retrieve embeddings by content ID', async () => {
      // Store additional embedding with same content ID
      const additionalEmbedding = {
        ...mockEmbedding,
        id: 'test-embedding-1b',
      };
      await vectorStorage.storeEmbedding(additionalEmbedding);

      const embeddings = await vectorStorage.getEmbeddingsByContentId('test-content-1');
      
      expect(embeddings).toHaveLength(2);
      expect(embeddings.every(e => e.contentId === 'test-content-1')).toBe(true);
    });
  });

  describe('embedding deletion', () => {
    beforeEach(async () => {
      await vectorStorage.storeEmbedding(mockEmbedding);
    });

    it('should delete existing embedding', async () => {
      const deleted = await vectorStorage.deleteEmbedding('test-embedding-1');
      expect(deleted).toBe(true);

      // Verify deletion
      const retrieved = await vectorStorage.getEmbedding('test-embedding-1');
      expect(retrieved).toBeNull();
    });

    it('should return false for non-existent embedding deletion', async () => {
      const deleted = await vectorStorage.deleteEmbedding('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('vector similarity search', () => {
    beforeEach(async () => {
      // Store multiple embeddings for search testing
      const embeddings = [
        mockEmbedding,
        {
          ...mockEmbedding,
          id: 'test-embedding-2',
          contentId: 'test-content-2',
          contentType: ContentType.CODE,
          vector: Array(100).fill(0).map(() => Math.random()),
        },
        {
          ...mockEmbedding,
          id: 'test-embedding-3',
          contentId: 'test-content-3',
          contentType: ContentType.IMAGE,
          vector: Array(100).fill(0).map(() => Math.random()),
        },
      ];

      await vectorStorage.storeBatchEmbeddings(embeddings);
    });

    it('should search for similar vectors', async () => {
      const queryVector = Array(100).fill(0).map(() => Math.random());
      
      const results = await vectorStorage.searchSimilarVectors(queryVector, {
        limit: 5,
        threshold: 0.0, // Low threshold for testing
        includeMetadata: true,
      });

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeLessThanOrEqual(5);
      
      // Results should be sorted by score (descending)
      for (let i = 1; i < results.length; i++) {
        expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
      }
    });

    it('should search by content type', async () => {
      const queryVector = Array(100).fill(0).map(() => Math.random());
      
      const results = await vectorStorage.searchByContentType(
        queryVector,
        ContentType.TEXT,
        {
          limit: 5,
          threshold: 0.0,
          includeMetadata: true,
        }
      );

      expect(Array.isArray(results)).toBe(true);
      // Should only return TEXT content type results
      results.forEach(result => {
        expect(result.metadata?.contentType || ContentType.TEXT).toBe(ContentType.TEXT);
      });
    });

    it('should respect threshold parameter', async () => {
      const queryVector = Array(100).fill(0).map(() => Math.random());
      
      const highThresholdResults = await vectorStorage.searchSimilarVectors(queryVector, {
        limit: 10,
        threshold: 0.9, // Very high threshold
      });

      const lowThresholdResults = await vectorStorage.searchSimilarVectors(queryVector, {
        limit: 10,
        threshold: 0.0, // Very low threshold
      });

      expect(highThresholdResults.length).toBeLessThanOrEqual(lowThresholdResults.length);
    });
  });

  describe('relationship management', () => {
    beforeEach(async () => {
      await vectorStorage.storeEmbedding(mockEmbedding);
    });

    it('should update embedding relationships', async () => {
      const newRelationships = {
        parentId: 'parent-embedding-1',
        childIds: ['child-1', 'child-2'],
        similarIds: ['similar-1', 'similar-2'],
        crossModalIds: ['cross-modal-1'],
      };

      await vectorStorage.updateEmbeddingRelationships('test-embedding-1', newRelationships);

      const updated = await vectorStorage.getEmbedding('test-embedding-1');
      expect(updated?.relationships).toEqual(newRelationships);
      expect(updated?.updatedAt.getTime()).toBeGreaterThan(mockEmbedding.updatedAt.getTime());
    });
  });

  describe('storage statistics', () => {
    beforeEach(async () => {
      const embeddings = [
        { ...mockEmbedding, id: 'text-1', contentType: ContentType.TEXT },
        { ...mockEmbedding, id: 'text-2', contentType: ContentType.TEXT },
        { ...mockEmbedding, id: 'code-1', contentType: ContentType.CODE },
        { ...mockEmbedding, id: 'image-1', contentType: ContentType.IMAGE },
      ];

      await vectorStorage.storeBatchEmbeddings(embeddings);
    });

    it('should provide storage statistics', async () => {
      const stats = await vectorStorage.getStorageStats();

      expect(stats).toBeDefined();
      expect(stats.totalEmbeddings).toBeGreaterThan(0);
      expect(stats.embeddingsByType).toBeDefined();
      expect(stats.embeddingsByType[ContentType.TEXT]).toBeGreaterThanOrEqual(2);
      expect(stats.embeddingsByType[ContentType.CODE]).toBeGreaterThanOrEqual(1);
      expect(stats.embeddingsByType[ContentType.IMAGE]).toBeGreaterThanOrEqual(1);
      expect(stats.indexInfo).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should handle storage errors gracefully', async () => {
      // Test with invalid embedding data
      const invalidEmbedding = {
        ...mockEmbedding,
        vector: null as any, // Invalid vector
      };

      await expect(vectorStorage.storeEmbedding(invalidEmbedding))
        .rejects.toThrow();
    });

    it('should handle search errors gracefully', async () => {
      // Test with invalid query vector
      const invalidQueryVector = null as any;

      await expect(vectorStorage.searchSimilarVectors(invalidQueryVector))
        .rejects.toThrow();
    });
  });
});