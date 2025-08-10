"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSearchDemo = runSearchDemo;
const search_1 = require("../services/search");
const embedding_manager_1 = require("../services/embedding-manager");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const embeddings_1 = require("../services/embeddings");
const environment_1 = __importDefault(require("../config/environment"));
const logger_1 = __importDefault(require("../utils/logger"));
async function runSearchDemo() {
    try {
        logger_1.default.info('Starting Redis AI Platform Multi-Modal Search Demo');
        // Initialize Redis connection
        const redisManager = (0, redis_1.createRedisManager)(environment_1.default.redis);
        await redisManager.connect();
        await redisManager.createVectorIndex(environment_1.default.vectorIndex);
        // Initialize embedding manager and search engine
        const embeddingManager = (0, embedding_manager_1.createEmbeddingManager)({
            primaryProvider: 'local',
            enableCrossModal: true,
            batchSize: 10,
        });
        const searchEngine = (0, search_1.createSearchEngine)({
            enableCrossModal: true,
            enableSemanticExpansion: true,
            maxResults: 10,
            rankingStrategy: 'general',
        });
        logger_1.default.info('Search system initialized successfully');
        // Demo 1: Set up diverse content for searching
        logger_1.default.info('Demo 1: Setting up diverse content for multi-modal search');
        const demoContents = [
            // Text content about Redis and AI
            (0, embeddings_1.createContent)('redis-ai-guide', types_1.ContentType.TEXT, 'Redis AI Platform leverages Redis as a high-performance real-time data layer for artificial intelligence applications. It provides vector search capabilities, semantic caching, and collaborative AI workspaces that enable next-generation AI experiences.', {
                title: 'Redis AI Platform: Complete Guide',
                description: 'Comprehensive guide to building AI applications with Redis',
                tags: ['redis', 'ai', 'platform', 'vector-search', 'guide'],
                source: 'documentation/redis-ai-guide.md',
            }),
            // Code examples
            (0, embeddings_1.createContent)('vector-search-code', types_1.ContentType.CODE, `
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
        `, {
                title: 'Vector Search Implementation',
                description: 'TypeScript code showing how to implement vector search',
                tags: ['typescript', 'vector-search', 'redis', 'implementation'],
                source: 'examples/vector-search.ts',
                language: 'typescript',
            }),
            // More text content about machine learning
            (0, embeddings_1.createContent)('ml-embeddings-text', types_1.ContentType.TEXT, 'Vector embeddings are numerical representations of data that capture semantic meaning. In machine learning, embeddings enable similarity search, clustering, and recommendation systems by representing complex data in high-dimensional vector spaces.', {
                title: 'Understanding Vector Embeddings in ML',
                description: 'Deep dive into vector embeddings and their applications',
                tags: ['machine-learning', 'embeddings', 'vectors', 'similarity'],
                source: 'articles/ml-embeddings.md',
            }),
            // Database operations code
            (0, embeddings_1.createContent)('redis-operations-code', types_1.ContentType.CODE, `
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
        `, {
                title: 'Redis Vector Database Operations',
                description: 'JavaScript implementation of vector database operations',
                tags: ['javascript', 'redis', 'database', 'vector-operations'],
                source: 'lib/vector-database.js',
                language: 'javascript',
            }),
            // AI concepts text
            (0, embeddings_1.createContent)('ai-concepts-text', types_1.ContentType.TEXT, 'Artificial Intelligence systems process information through various techniques including natural language processing, computer vision, and machine learning. Modern AI applications leverage vector databases for efficient similarity search and semantic understanding.', {
                title: 'Core AI Concepts and Applications',
                description: 'Overview of fundamental AI concepts and their applications',
                tags: ['artificial-intelligence', 'nlp', 'computer-vision', 'concepts'],
                source: 'guides/ai-concepts.md',
            }),
            // Search algorithm code
            (0, embeddings_1.createContent)('search-algorithm-code', types_1.ContentType.CODE, `
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
        `, {
                title: 'Semantic Search Algorithm',
                description: 'Implementation of semantic search with cross-modal capabilities',
                tags: ['algorithm', 'semantic-search', 'cross-modal', 'ranking'],
                source: 'algorithms/semantic-search.js',
                language: 'javascript',
            }),
        ];
        // Process all demo content
        logger_1.default.info('Processing demo content...');
        const embeddings = await embeddingManager.processBatchContent(demoContents);
        logger_1.default.info(`Processed ${embeddings.length} content items successfully`);
        // Demo 2: Basic text search
        logger_1.default.info('Demo 2: Basic text search');
        const textQuery = (0, search_1.createSearchQuery)('Redis vector database operations', [types_1.ContentType.TEXT]);
        const textResults = await searchEngine.search(textQuery);
        logger_1.default.info('Text search results:', {
            query: textQuery.query,
            resultsFound: textResults.results.length,
            averageScore: textResults.analytics.averageScore.toFixed(3),
            queryTime: `${textResults.analytics.queryTime}ms`,
        });
        textResults.results.slice(0, 3).forEach((result, index) => {
            logger_1.default.info(`  ${index + 1}. ${result.content.metadata.title} (Score: ${result.relevanceScore.toFixed(3)})`);
        });
        // Demo 3: Multi-modal search
        logger_1.default.info('Demo 3: Multi-modal search across text and code');
        const multiModalQuery = (0, search_1.createSearchQuery)('vector search implementation', [types_1.ContentType.TEXT, types_1.ContentType.CODE]);
        const multiModalResults = await searchEngine.search(multiModalQuery);
        logger_1.default.info('Multi-modal search results:', {
            query: multiModalQuery.query,
            resultsFound: multiModalResults.results.length,
            resultsByModality: multiModalResults.analytics.resultsByModality,
            crossModalMatches: multiModalResults.analytics.crossModalMatches,
            queryTime: `${multiModalResults.analytics.queryTime}ms`,
        });
        multiModalResults.results.slice(0, 5).forEach((result, index) => {
            logger_1.default.info(`  ${index + 1}. [${result.type.toUpperCase()}] ${result.content.metadata.title} (Score: ${result.relevanceScore.toFixed(3)})`);
            if (result.crossModalMatches.length > 0) {
                logger_1.default.info(`     Cross-modal matches: ${result.crossModalMatches.length}`);
            }
        });
        // Demo 4: Semantic search with expansion
        logger_1.default.info('Demo 4: Semantic search with query expansion');
        const semanticQuery = (0, search_1.createSearchQuery)('AI machine learning', [types_1.ContentType.TEXT, types_1.ContentType.CODE]);
        const semanticResults = await searchEngine.search(semanticQuery);
        logger_1.default.info('Semantic search results:', {
            query: semanticQuery.query,
            resultsFound: semanticResults.results.length,
            suggestions: semanticResults.suggestions,
            queryTime: `${semanticResults.analytics.queryTime}ms`,
        });
        if (semanticResults.suggestions.length > 0) {
            logger_1.default.info('Search suggestions:');
            semanticResults.suggestions.forEach((suggestion, index) => {
                logger_1.default.info(`  ${index + 1}. "${suggestion}"`);
            });
        }
        // Demo 5: Filtered search
        logger_1.default.info('Demo 5: Filtered search with specific criteria');
        const filteredQuery = (0, search_1.createSearchQuery)('database', [types_1.ContentType.TEXT, types_1.ContentType.CODE], {
            filters: {
                tags: ['redis'],
                contentType: [types_1.ContentType.CODE],
            },
            threshold: 0.3,
        });
        const filteredResults = await searchEngine.search(filteredQuery);
        logger_1.default.info('Filtered search results:', {
            query: filteredQuery.query,
            filters: filteredQuery.filters,
            resultsFound: filteredResults.results.length,
            queryTime: `${filteredResults.analytics.queryTime}ms`,
        });
        filteredResults.results.forEach((result, index) => {
            logger_1.default.info(`  ${index + 1}. [${result.type.toUpperCase()}] ${result.content.metadata.title}`);
            logger_1.default.info(`     Tags: ${result.content.metadata.tags.join(', ')}`);
        });
        // Demo 6: Multi-strategy search
        logger_1.default.info('Demo 6: Multi-strategy search blending');
        const strategies = [
            {
                name: 'precise',
                config: { rankingStrategy: 'precise' },
                weight: 0.6,
            },
            {
                name: 'popular',
                config: { rankingStrategy: 'popular' },
                weight: 0.4,
            },
        ];
        const strategyQuery = (0, search_1.createSearchQuery)('vector embeddings', [types_1.ContentType.TEXT]);
        const strategyResults = await searchEngine.searchWithMultipleStrategies(strategyQuery, strategies);
        logger_1.default.info('Multi-strategy search results:', {
            query: strategyQuery.query,
            strategies: strategies.map(s => s.name),
            totalResults: strategyResults.results.length,
            strategyBreakdown: strategyResults.strategyBreakdown,
        });
        // Demo 7: Search analytics and performance
        logger_1.default.info('Demo 7: Search analytics and performance metrics');
        const searchStats = await searchEngine.getSearchStats();
        logger_1.default.info('Search system statistics:', {
            averageQueryTime: `${searchStats.averageQueryTime}ms`,
            cacheHitRate: `${(searchStats.cacheHitRate * 100).toFixed(1)}%`,
            crossModalStats: {
                totalRelationships: searchStats.crossModalStats.totalRelationships,
                averageConfidence: searchStats.crossModalStats.averageConfidence.toFixed(3),
            },
        });
        // Demo 8: Search explanation (for debugging)
        logger_1.default.info('Demo 8: Search result explanation');
        if (textResults.results.length > 0) {
            const topResult = textResults.results[0];
            const explanation = await searchEngine.explainSearch(textQuery, topResult.id);
            logger_1.default.info('Search explanation for top result:');
            logger_1.default.info(explanation);
        }
        // Demo 9: Cache performance test
        logger_1.default.info('Demo 9: Cache performance demonstration');
        const cacheTestQuery = (0, search_1.createSearchQuery)('Redis AI platform', [types_1.ContentType.TEXT]);
        // First search (no cache)
        const start1 = Date.now();
        const result1 = await searchEngine.search(cacheTestQuery);
        const time1 = Date.now() - start1;
        // Second search (should hit cache)
        const start2 = Date.now();
        const result2 = await searchEngine.search(cacheTestQuery);
        const time2 = Date.now() - start2;
        logger_1.default.info('Cache performance comparison:', {
            firstSearch: `${time1}ms (cache miss)`,
            secondSearch: `${time2}ms (cache hit: ${result2.analytics.cacheHit})`,
            speedup: `${(time1 / Math.max(time2, 1)).toFixed(1)}x faster`,
        });
        logger_1.default.info('Redis AI Platform Multi-Modal Search Demo completed successfully!');
        // Cleanup
        await redisManager.disconnect();
    }
    catch (error) {
        logger_1.default.error('Search demo failed:', {
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
//# sourceMappingURL=search-demo.js.map