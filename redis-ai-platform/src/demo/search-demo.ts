import { createSearchEngine, createSearchQuery } from '../services/search';
import { createEmbeddingManager } from '../services/embedding-manager';
import { createRedisManager } from '../config/redis';
import { ContentType } from '../types';
import { createContent } from '../services/embeddings';
import config from '../config/environment';
import logger from '../utils/logger';

async function runSearchDemo() {
  try {
    logger.info('Starting Redis AI Platform Multi-Modal Search Demo');

    // Initialize Redis connection
    const redisManager = createRedisManager(config.redis);
    await redisManager.connect();
    await redisManager.createVectorIndex(config.vectorIndex);

    // Initialize embedding manager and search engine
    const embeddingManager = createEmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: true,
      batchSize: 10,
    });

    const searchEngine = createSearchEngine({
      enableCrossModal: true,
      enableSemanticExpansion: true,
      maxResults: 10,
      rankingStrategy: 'general',
    });

    logger.info('Search system initialized successfully');

    // Demo 1: Set up diverse content for searching
    logger.info('Demo 1: Setting up diverse content for multi-modal search');
    
    const demoContents = [
      // Text content about Redis and AI
      createContent(
        'redis-ai-guide',
        ContentType.TEXT,
        'Redis AI Platform leverages Redis as a high-performance real-time data layer for artificial intelligence applications. It provides vector search capabilities, semantic caching, and collaborative AI workspaces that enable next-generation AI experiences.',
        {
          title: 'Redis AI Platform: Complete Guide',
          description: 'Comprehensive guide to building AI applications with Redis',
          tags: ['redis', 'ai', 'platform', 'vector-search', 'guide'],
          source: 'documentation/redis-ai-guide.md',
        }
      ),

      // Code examples
      createContent(
        'vector-search-code',
        ContentType.CODE,
        `
        import { createSearchEngine } from './search';
        import { ContentType } from './types';
        
        async function performVectorSearch(query: string) {
          const searchEngine = createSearchEngine();
          
          const searchQuery = {
            query,
            modalities: [ContentType.TEXT, ContentType.CODE],
            limit: 10,
            threshold: 0.7
          };
          
          const results = await searchEngine.search(searchQuery);
          
          console.log(\`Found \${results.results.length} results\`);
          return results;
        }
        
        // Example usage
        performVectorSearch('Redis vector operations')
          .then(results => console.log(results))
          .catch(error => console.error(error));
        `,
        {
          title: 'Vector Search Implementation',
          description: 'TypeScript code showing how to implement vector search',
          tags: ['typescript', 'vector-search', 'redis', 'implementation'],
          source: 'examples/vector-search.ts',
          language: 'typescript',
        }
      ),

      // More text content about machine learning
      createContent(
        'ml-embeddings-text',
        ContentType.TEXT,
        'Vector embeddings are numerical representations of data that capture semantic meaning. In machine learning, embeddings enable similarity search, clustering, and recommendation systems by representing complex data in high-dimensional vector spaces.',
        {
          title: 'Understanding Vector Embeddings in ML',
          description: 'Deep dive into vector embeddings and their applications',
          tags: ['machine-learning', 'embeddings', 'vectors', 'similarity'],
          source: 'articles/ml-embeddings.md',
        }
      ),

      // Database operations code
      createContent(
        'redis-operations-code',
        ContentType.CODE,
        `
        const redis = require('redis');
        const client = redis.createClient();
        
        class VectorDatabase {
          async storeVector(id, vector, metadata = {}) {
            const document = {
              id,
              vector: vector,
              metadata: {
                ...metadata,
                timestamp: Date.now(),
                dimensions: vector.length
              }
            };
            
            await client.json.set(\`vector:\${id}\`, '$', document);
            console.log(\`Stored vector \${id} with \${vector.length} dimensions\`);
          }
          
          async searchSimilar(queryVector, limit = 10) {
            // Perform vector similarity search using Redis VSS
            const results = await client.ft.search(
              'vector_index',
              '*=>[KNN ' + limit + ' @vector $query_vector AS score]',
              {
                PARAMS: {
                  query_vector: Buffer.from(new Float32Array(queryVector).buffer)
                },
                RETURN: ['id', 'metadata', 'score'],
                SORTBY: 'score'
              }
            );
            
            return results.documents.map(doc => ({
              id: doc.value.id,
              score: parseFloat(doc.value.score),
              metadata: JSON.parse(doc.value.metadata)
            }));
          }
        }
        
        module.exports = VectorDatabase;
        `,
        {
          title: 'Redis Vector Database Operations',
          description: 'JavaScript implementation of vector database operations',
          tags: ['javascript', 'redis', 'database', 'vector-operations'],
          source: 'lib/vector-database.js',
          language: 'javascript',
        }
      ),

      // AI concepts text
      createContent(
        'ai-concepts-text',
        ContentType.TEXT,
        'Artificial Intelligence systems process information through various techniques including natural language processing, computer vision, and machine learning. Modern AI applications leverage vector databases for efficient similarity search and semantic understanding.',
        {
          title: 'Core AI Concepts and Applications',
          description: 'Overview of fundamental AI concepts and their applications',
          tags: ['artificial-intelligence', 'nlp', 'computer-vision', 'concepts'],
          source: 'guides/ai-concepts.md',
        }
      ),

      // Search algorithm code
      createContent(
        'search-algorithm-code',
        ContentType.CODE,
        `
        class SemanticSearchEngine {
          constructor(vectorDatabase, embeddingService) {
            this.vectorDB = vectorDatabase;
            this.embeddings = embeddingService;
          }
          
          async search(query, options = {}) {
            const {
              modalities = ['text'],
              limit = 10,
              threshold = 0.7,
              enableCrossModal = true
            } = options;
            
            // Generate query embedding
            const queryEmbedding = await this.embeddings.generateEmbedding(query);
            
            const results = [];
            
            // Search across each modality
            for (const modality of modalities) {
              const modalityResults = await this.vectorDB.searchByType(
                queryEmbedding,
                modality,
                { limit, threshold }
              );
              
              results.push(...modalityResults);
            }
            
            // Apply cross-modal enhancement
            if (enableCrossModal) {
              return this.enhanceCrossModal(results, queryEmbedding);
            }
            
            return this.rankResults(results);
          }
          
          rankResults(results) {
            return results
              .sort((a, b) => b.score - a.score)
              .slice(0, this.limit);
          }
        }
        `,
        {
          title: 'Semantic Search Algorithm',
          description: 'Implementation of semantic search with cross-modal capabilities',
          tags: ['algorithm', 'semantic-search', 'cross-modal', 'ranking'],
          source: 'algorithms/semantic-search.js',
          language: 'javascript',
        }
      ),
    ];

    // Process all demo content
    logger.info('Processing demo content...');
    const embeddings = await embeddingManager.processBatchContent(demoContents);
    logger.info(`Processed ${embeddings.length} content items successfully`);

    // Demo 2: Basic text search
    logger.info('Demo 2: Basic text search');
    
    const textQuery = createSearchQuery(
      'Redis vector database operations',
      [ContentType.TEXT]
    );

    const textResults = await searchEngine.search(textQuery);
    logger.info('Text search results:', {
      query: textQuery.query,
      resultsFound: textResults.results.length,
      averageScore: textResults.analytics.averageScore.toFixed(3),
      queryTime: `${textResults.analytics.queryTime}ms`,
    });

    textResults.results.slice(0, 3).forEach((result, index) => {
      logger.info(`  ${index + 1}. ${result.content.metadata.title} (Score: ${result.relevanceScore.toFixed(3)})`);
    });

    // Demo 3: Multi-modal search
    logger.info('Demo 3: Multi-modal search across text and code');
    
    const multiModalQuery = createSearchQuery(
      'vector search implementation',
      [ContentType.TEXT, ContentType.CODE]
    );

    const multiModalResults = await searchEngine.search(multiModalQuery);
    logger.info('Multi-modal search results:', {
      query: multiModalQuery.query,
      resultsFound: multiModalResults.results.length,
      resultsByModality: multiModalResults.analytics.resultsByModality,
      crossModalMatches: multiModalResults.analytics.crossModalMatches,
      queryTime: `${multiModalResults.analytics.queryTime}ms`,
    });

    multiModalResults.results.slice(0, 5).forEach((result, index) => {
      logger.info(`  ${index + 1}. [${result.type.toUpperCase()}] ${result.content.metadata.title} (Score: ${result.relevanceScore.toFixed(3)})`);
      if (result.crossModalMatches.length > 0) {
        logger.info(`     Cross-modal matches: ${result.crossModalMatches.length}`);
      }
    });

    // Demo 4: Semantic search with expansion
    logger.info('Demo 4: Semantic search with query expansion');
    
    const semanticQuery = createSearchQuery(
      'AI machine learning',
      [ContentType.TEXT, ContentType.CODE]
    );

    const semanticResults = await searchEngine.search(semanticQuery);
    logger.info('Semantic search results:', {
      query: semanticQuery.query,
      resultsFound: semanticResults.results.length,
      suggestions: semanticResults.suggestions,
      queryTime: `${semanticResults.analytics.queryTime}ms`,
    });

    if (semanticResults.suggestions.length > 0) {
      logger.info('Search suggestions:');
      semanticResults.suggestions.forEach((suggestion, index) => {
        logger.info(`  ${index + 1}. "${suggestion}"`);
      });
    }

    // Demo 5: Filtered search
    logger.info('Demo 5: Filtered search with specific criteria');
    
    const filteredQuery = createSearchQuery(
      'database',
      [ContentType.TEXT, ContentType.CODE],
      {
        filters: {
          tags: ['redis'],
          contentType: [ContentType.CODE],
        },
        threshold: 0.3,
      }
    );

    const filteredResults = await searchEngine.search(filteredQuery);
    logger.info('Filtered search results:', {
      query: filteredQuery.query,
      filters: filteredQuery.filters,
      resultsFound: filteredResults.results.length,
      queryTime: `${filteredResults.analytics.queryTime}ms`,
    });

    filteredResults.results.forEach((result, index) => {
      logger.info(`  ${index + 1}. [${result.type.toUpperCase()}] ${result.content.metadata.title}`);
      logger.info(`     Tags: ${result.content.metadata.tags.join(', ')}`);
    });

    // Demo 6: Multi-strategy search
    logger.info('Demo 6: Multi-strategy search blending');
    
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

    const strategyQuery = createSearchQuery('vector embeddings', [ContentType.TEXT]);
    const strategyResults = await searchEngine.searchWithMultipleStrategies(
      strategyQuery,
      strategies
    );

    logger.info('Multi-strategy search results:', {
      query: strategyQuery.query,
      strategies: strategies.map(s => s.name),
      totalResults: strategyResults.results.length,
      strategyBreakdown: strategyResults.strategyBreakdown,
    });

    // Demo 7: Search analytics and performance
    logger.info('Demo 7: Search analytics and performance metrics');
    
    const searchStats = await searchEngine.getSearchStats();
    logger.info('Search system statistics:', {
      averageQueryTime: `${searchStats.averageQueryTime}ms`,
      cacheHitRate: `${(searchStats.cacheHitRate * 100).toFixed(1)}%`,
      crossModalStats: {
        totalRelationships: searchStats.crossModalStats.totalRelationships,
        averageConfidence: searchStats.crossModalStats.averageConfidence.toFixed(3),
      },
    });

    // Demo 8: Search explanation (for debugging)
    logger.info('Demo 8: Search result explanation');
    
    if (textResults.results.length > 0) {
      const topResult = textResults.results[0];
      const explanation = await searchEngine.explainSearch(textQuery, topResult.id);
      logger.info('Search explanation for top result:');
      logger.info(explanation);
    }

    // Demo 9: Cache performance test
    logger.info('Demo 9: Cache performance demonstration');
    
    const cacheTestQuery = createSearchQuery('Redis AI platform', [ContentType.TEXT]);
    
    // First search (no cache)
    const start1 = Date.now();
    const result1 = await searchEngine.search(cacheTestQuery);
    const time1 = Date.now() - start1;
    
    // Second search (should hit cache)
    const start2 = Date.now();
    const result2 = await searchEngine.search(cacheTestQuery);
    const time2 = Date.now() - start2;
    
    logger.info('Cache performance comparison:', {
      firstSearch: `${time1}ms (cache miss)`,
      secondSearch: `${time2}ms (cache hit: ${result2.analytics.cacheHit})`,
      speedup: `${(time1 / Math.max(time2, 1)).toFixed(1)}x faster`,
    });

    logger.info('Redis AI Platform Multi-Modal Search Demo completed successfully!');
    
    // Cleanup
    await redisManager.disconnect();

  } catch (error) {
    logger.error('Search demo failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runSearchDemo().catch((error) => {
    console.error('Failed to run search demo:', error);
    process.exit(1);
  });
}

export { runSearchDemo };