import { createEmbeddingManager } from '../../src/services/embedding-manager';
import { ContentType } from '../../src/types';
import { createContent } from '../../src/services/embeddings';

describe('Embedding System Integration', () => {
  let embeddingManager: ReturnType<typeof createEmbeddingManager>;

  beforeAll(() => {
    embeddingManager = createEmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: true,
      batchSize: 5,
    });
  });

  it('should handle complete embedding workflow', async () => {
    // Step 1: Process different types of content
    const textContent = createContent(
      'integration-text-1',
      ContentType.TEXT,
      'Redis AI Platform provides advanced vector search capabilities for multi-modal content.',
      {
        title: 'Redis AI Platform Overview',
        description: 'Introduction to the Redis AI Platform features',
        tags: ['redis', 'ai', 'vector-search', 'platform'],
        source: 'documentation',
      }
    );

    const codeContent = createContent(
      'integration-code-1',
      ContentType.CODE,
      `
      import { createEmbeddingManager } from './embedding-manager';
      
      const manager = createEmbeddingManager();
      const embedding = await manager.processContent(content);
      console.log('Embedding generated:', embedding.id);
      `,
      {
        title: 'Embedding Manager Usage',
        description: 'Example code showing how to use the embedding manager',
        tags: ['typescript', 'embedding', 'example'],
        source: 'example.ts',
        language: 'typescript',
      }
    );

    // Step 2: Process content and generate embeddings
    const textEmbedding = await embeddingManager.processContent(textContent);
    const codeEmbedding = await embeddingManager.processContent(codeContent);

    expect(textEmbedding.contentType).toBe(ContentType.TEXT);
    expect(codeEmbedding.contentType).toBe(ContentType.CODE);
    expect(textEmbedding.vector.length).toEqual(codeEmbedding.vector.length);

    // Step 3: Search for similar content
    const searchQuery = {
      query: 'vector search and embeddings',
      modalities: [ContentType.TEXT, ContentType.CODE],
      limit: 10,
      threshold: 0.1,
    };

    const searchResults = await embeddingManager.searchSimilarContent(searchQuery);
    
    expect(searchResults.length).toBeGreaterThan(0);
    expect(searchResults.some(r => r.type === ContentType.TEXT)).toBe(true);

    // Step 4: Find similar embeddings
    const similarEmbeddings = await embeddingManager.findSimilarEmbeddings(
      textEmbedding.id,
      5,
      0.1
    );

    expect(Array.isArray(similarEmbeddings)).toBe(true);

    // Step 5: Get system statistics
    const stats = await embeddingManager.getEmbeddingStats();
    
    expect(stats.totalEmbeddings).toBeGreaterThanOrEqual(2);
    expect(stats.embeddingsByType[ContentType.TEXT]).toBeGreaterThanOrEqual(1);
    expect(stats.embeddingsByType[ContentType.CODE]).toBeGreaterThanOrEqual(1);
    expect(stats.providers.length).toBeGreaterThan(0);

    console.log('Integration test completed successfully:', {
      textEmbeddingId: textEmbedding.id,
      codeEmbeddingId: codeEmbedding.id,
      searchResultsCount: searchResults.length,
      similarEmbeddingsCount: similarEmbeddings.length,
      totalEmbeddings: stats.totalEmbeddings,
    });
  }, 30000); // 30 second timeout for integration test

  it('should handle batch processing efficiently', async () => {
    const batchContents = [
      createContent('batch-text-1', ContentType.TEXT, 'Redis provides high-performance data structures', { source: 'doc1' }),
      createContent('batch-text-2', ContentType.TEXT, 'Vector embeddings enable semantic search', { source: 'doc2' }),
      createContent('batch-text-3', ContentType.TEXT, 'AI models can understand natural language', { source: 'doc3' }),
      createContent('batch-code-1', ContentType.CODE, 'const client = redis.createClient();', { source: 'code1.js' }),
      createContent('batch-code-2', ContentType.CODE, 'await vectorStorage.storeEmbedding(embedding);', { source: 'code2.js' }),
    ];

    const startTime = Date.now();
    const embeddings = await embeddingManager.processBatchContent(batchContents);
    const processingTime = Date.now() - startTime;

    expect(embeddings.length).toBe(batchContents.length);
    expect(processingTime).toBeLessThan(10000); // Should complete within 10 seconds

    // Verify all embeddings are valid
    for (const embedding of embeddings) {
      expect(embedding.id).toBeDefined();
      expect(embedding.vector.length).toBeGreaterThan(0);
      expect(embedding.metadata.model).toBeDefined();
    }

    console.log('Batch processing completed:', {
      contentCount: batchContents.length,
      processingTime: `${processingTime}ms`,
      averageTimePerItem: `${Math.round(processingTime / batchContents.length)}ms`,
    });
  });

  it('should maintain embedding consistency', async () => {
    const content = createContent(
      'consistency-test',
      ContentType.TEXT,
      'This is a consistency test for embedding generation',
      { source: 'test' }
    );

    // Generate the same embedding multiple times
    const embedding1 = await embeddingManager.processContent({
      ...content,
      id: 'consistency-1',
    });
    
    const embedding2 = await embeddingManager.processContent({
      ...content,
      id: 'consistency-2',
    });

    // Embeddings should have the same dimensions
    expect(embedding1.vector.length).toBe(embedding2.vector.length);
    
    // Embeddings should be similar (but not necessarily identical due to randomness in local provider)
    const similarity = cosineSimilarity(embedding1.vector, embedding2.vector);
    expect(similarity).toBeGreaterThan(0.8); // Should be quite similar

    console.log('Consistency test results:', {
      embedding1Id: embedding1.id,
      embedding2Id: embedding2.id,
      similarity: similarity.toFixed(4),
      dimensions: embedding1.vector.length,
    });
  });
});

// Helper function to calculate cosine similarity
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}