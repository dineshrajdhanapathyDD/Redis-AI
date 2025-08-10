import { LocalEmbeddingProvider } from '../../../src/services/embeddings/local';
import { ContentType } from '../../../src/types';
import { createContent } from '../../../src/services/embeddings';

describe('LocalEmbeddingProvider', () => {
  let provider: LocalEmbeddingProvider;

  beforeEach(() => {
    provider = new LocalEmbeddingProvider({
      provider: 'local',
      model: 'tfidf',
      dimensions: 100,
    });
  });

  describe('initialization', () => {
    it('should initialize with correct configuration', () => {
      expect(provider.getDimensions()).toBe(100);
      expect(provider.getModel()).toBe('tfidf');
      expect(provider.getSupportedTypes()).toContain(ContentType.TEXT);
      expect(provider.getSupportedTypes()).toContain(ContentType.CODE);
    });

    it('should have initialized vocabulary', () => {
      const stats = provider.getVocabularyStats();
      expect(stats.size).toBeGreaterThan(0);
      expect(stats.documentCount).toBe(0);
      expect(stats.topWords).toContain('the');
    });
  });

  describe('embedding generation', () => {
    it('should generate embedding for text content', async () => {
      const content = createContent(
        'test-1',
        ContentType.TEXT,
        'This is a test document with some common words and unique terms.',
        {
          title: 'Test Document',
          tags: ['test', 'document'],
          source: 'test',
        }
      );

      const embedding = await provider.generateEmbedding(content);

      expect(embedding).toHaveLength(100);
      expect(embedding.every(val => Number.isFinite(val))).toBe(true);
      
      // Check that the vector is normalized (L2 norm should be close to 1)
      const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
      expect(norm).toBeCloseTo(1, 5);
    });

    it('should generate embedding for code content', async () => {
      const content = createContent(
        'test-2',
        ContentType.CODE,
        `function calculateSum(a, b) {
          return a + b;
        }
        
        const result = calculateSum(5, 3);
        console.log(result);`,
        {
          language: 'javascript',
          source: 'test.js',
        }
      );

      const embedding = await provider.generateEmbedding(content);

      expect(embedding).toHaveLength(100);
      expect(embedding.every(val => Number.isFinite(val))).toBe(true);
    });

    it('should handle empty content', async () => {
      const content = createContent(
        'test-3',
        ContentType.TEXT,
        '',
        { source: 'test' }
      );

      const embedding = await provider.generateEmbedding(content);

      expect(embedding).toHaveLength(100);
      expect(embedding.every(val => Number.isFinite(val))).toBe(true);
    });

    it('should throw error for unsupported content type', async () => {
      const content = createContent(
        'test-4',
        ContentType.IMAGE,
        'image data',
        { source: 'test' }
      );

      await expect(provider.generateEmbedding(content))
        .rejects.toThrow('Content type image not supported');
    });
  });

  describe('vocabulary management', () => {
    it('should update vocabulary with new words', async () => {
      const initialStats = provider.getVocabularyStats();
      
      const content = createContent(
        'test-5',
        ContentType.TEXT,
        'This document contains some very unique and uncommon terminology.',
        { source: 'test' }
      );

      await provider.generateEmbedding(content);

      const updatedStats = provider.getVocabularyStats();
      expect(updatedStats.documentCount).toBe(initialStats.documentCount + 1);
    });

    it('should export and import vocabulary', async () => {
      // Generate some embeddings to build vocabulary
      const contents = [
        createContent('test-6', ContentType.TEXT, 'First document with words', { source: 'test' }),
        createContent('test-7', ContentType.TEXT, 'Second document with different words', { source: 'test' }),
      ];

      for (const content of contents) {
        await provider.generateEmbedding(content);
      }

      // Export vocabulary
      const exportedData = provider.exportVocabulary();
      expect(exportedData.vocabulary.length).toBeGreaterThan(0);
      expect(exportedData.documentCount).toBe(2);

      // Create new provider and import vocabulary
      const newProvider = new LocalEmbeddingProvider({
        provider: 'local',
        model: 'tfidf',
        dimensions: 100,
      });

      newProvider.importVocabulary(exportedData);
      
      const importedStats = newProvider.getVocabularyStats();
      expect(importedStats.documentCount).toBe(2);
    });
  });

  describe('similarity and consistency', () => {
    it('should generate similar embeddings for similar content', async () => {
      const content1 = createContent(
        'test-8',
        ContentType.TEXT,
        'Machine learning is a subset of artificial intelligence.',
        { source: 'test' }
      );

      const content2 = createContent(
        'test-9',
        ContentType.TEXT,
        'Artificial intelligence includes machine learning as a subset.',
        { source: 'test' }
      );

      const embedding1 = await provider.generateEmbedding(content1);
      const embedding2 = await provider.generateEmbedding(content2);

      // Calculate cosine similarity
      let dotProduct = 0;
      let norm1 = 0;
      let norm2 = 0;

      for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        norm1 += embedding1[i] * embedding1[i];
        norm2 += embedding2[i] * embedding2[i];
      }

      const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
      
      // Similar content should have positive similarity
      expect(similarity).toBeGreaterThan(0);
    });

    it('should generate consistent embeddings for same content', async () => {
      const content = createContent(
        'test-10',
        ContentType.TEXT,
        'Consistent content for testing reproducibility.',
        { source: 'test' }
      );

      const embedding1 = await provider.generateEmbedding(content);
      const embedding2 = await provider.generateEmbedding(content);

      // Embeddings should be identical for same content
      for (let i = 0; i < embedding1.length; i++) {
        expect(embedding1[i]).toBeCloseTo(embedding2[i], 10);
      }
    });
  });
});