"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEmbeddingDemo = runEmbeddingDemo;
const embedding_manager_1 = require("../services/embedding-manager");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const embeddings_1 = require("../services/embeddings");
const environment_1 = __importDefault(require("../config/environment"));
const logger_1 = __importDefault(require("../utils/logger"));
async function runEmbeddingDemo() {
    try {
        logger_1.default.info('Starting Redis AI Platform Embedding Demo');
        // Initialize Redis connection
        const redisManager = (0, redis_1.createRedisManager)(environment_1.default.redis);
        await redisManager.connect();
        await redisManager.createVectorIndex(environment_1.default.vectorIndex);
        // Initialize embedding manager
        const embeddingManager = (0, embedding_manager_1.createEmbeddingManager)({
            primaryProvider: 'local',
            enableCrossModal: true,
            batchSize: 10,
        });
        logger_1.default.info('Embedding system initialized successfully');
        // Demo 1: Process different types of content
        logger_1.default.info('Demo 1: Processing different content types');
        const demoContents = [
            (0, embeddings_1.createContent)('demo-text-1', types_1.ContentType.TEXT, 'Redis AI Platform leverages Redis as a high-performance real-time data layer for AI applications. It provides vector search, semantic caching, and collaborative AI workspaces.', {
                title: 'Redis AI Platform Overview',
                description: 'Introduction to the platform capabilities',
                tags: ['redis', 'ai', 'platform', 'vector-search'],
                source: 'documentation',
            }),
            (0, embeddings_1.createContent)('demo-code-1', types_1.ContentType.CODE, `
        import { createEmbeddingManager } from './embedding-manager';
        import { ContentType } from './types';
        
        async function processDocument(text: string) {
          const manager = createEmbeddingManager();
          const content = {
            id: 'doc-1',
            type: ContentType.TEXT,
            data: text,
            metadata: { source: 'user-input', tags: [] }
          };
          
          const embedding = await manager.processContent(content);
          console.log('Generated embedding:', embedding.id);
          return embedding;
        }
        `, {
                title: 'Embedding Processing Example',
                description: 'TypeScript code showing how to process content',
                tags: ['typescript', 'embedding', 'example'],
                source: 'example.ts',
                language: 'typescript',
            }),
            (0, embeddings_1.createContent)('demo-text-2', types_1.ContentType.TEXT, 'Machine learning models can understand and process natural language through vector embeddings. These embeddings capture semantic meaning and enable similarity search.', {
                title: 'Vector Embeddings in ML',
                description: 'Explanation of vector embeddings in machine learning',
                tags: ['machine-learning', 'embeddings', 'nlp', 'vectors'],
                source: 'ml-guide',
            }),
            (0, embeddings_1.createContent)('demo-code-2', types_1.ContentType.CODE, `
        const redis = require('redis');
        const client = redis.createClient();
        
        async function storeVector(id, vector) {
          await client.json.set(\`vector:\${id}\`, '$', {
            id,
            vector,
            timestamp: Date.now()
          });
          
          console.log('Vector stored successfully');
        }
        `, {
                title: 'Redis Vector Storage',
                description: 'JavaScript code for storing vectors in Redis',
                tags: ['javascript', 'redis', 'vector-storage'],
                source: 'storage.js',
                language: 'javascript',
            }),
        ];
        // Process content in batch
        const embeddings = await embeddingManager.processBatchContent(demoContents);
        logger_1.default.info(`Processed ${embeddings.length} embeddings successfully`);
        // Demo 2: Semantic search
        logger_1.default.info('Demo 2: Performing semantic search');
        const searchQueries = [
            'How does Redis help with AI applications?',
            'Show me code examples for vector storage',
            'What are embeddings in machine learning?',
        ];
        for (const query of searchQueries) {
            logger_1.default.info(`Searching for: "${query}"`);
            const searchResults = await embeddingManager.searchSimilarContent({
                query,
                modalities: [types_1.ContentType.TEXT, types_1.ContentType.CODE],
                limit: 3,
                threshold: 0.1,
            });
            logger_1.default.info(`Found ${searchResults.length} relevant results:`);
            searchResults.forEach((result, index) => {
                logger_1.default.info(`  ${index + 1}. ${result.content.metadata.title || 'Untitled'} (Score: ${result.relevanceScore.toFixed(3)})`);
            });
        }
        // Demo 3: Find similar embeddings
        logger_1.default.info('Demo 3: Finding similar embeddings');
        if (embeddings.length > 0) {
            const sourceEmbedding = embeddings[0];
            logger_1.default.info(`Finding embeddings similar to: ${sourceEmbedding.contentId}`);
            const similarEmbeddings = await embeddingManager.findSimilarEmbeddings(sourceEmbedding.id, 3, 0.5);
            logger_1.default.info(`Found ${similarEmbeddings.length} similar embeddings:`);
            similarEmbeddings.forEach((embedding, index) => {
                logger_1.default.info(`  ${index + 1}. ${embedding.contentId} (Type: ${embedding.contentType})`);
            });
        }
        // Demo 4: System statistics
        logger_1.default.info('Demo 4: System statistics');
        const stats = await embeddingManager.getEmbeddingStats();
        logger_1.default.info('Embedding system statistics:', {
            totalEmbeddings: stats.totalEmbeddings,
            averageDimensions: stats.averageDimensions,
            embeddingsByType: stats.embeddingsByType,
            availableProviders: stats.providers.map(p => `${p.contentType}: ${p.model}`),
        });
        // Demo 5: Cross-modal relationships (if enabled)
        logger_1.default.info('Demo 5: Cross-modal relationships');
        if (embeddings.length > 1) {
            const textEmbedding = embeddings.find(e => e.contentType === types_1.ContentType.TEXT);
            const codeEmbedding = embeddings.find(e => e.contentType === types_1.ContentType.CODE);
            if (textEmbedding && codeEmbedding) {
                await embeddingManager.updateEmbeddingRelationships(textEmbedding.id);
                // Retrieve updated embedding to see relationships
                const updatedEmbedding = await embeddingManager.findSimilarEmbeddings(textEmbedding.id, 1);
                if (updatedEmbedding.length > 0) {
                    logger_1.default.info('Cross-modal relationships established:', {
                        embeddingId: textEmbedding.id,
                        similarIds: updatedEmbedding[0].relationships.similarIds.length,
                        crossModalIds: updatedEmbedding[0].relationships.crossModalIds.length,
                    });
                }
            }
        }
        logger_1.default.info('Redis AI Platform Embedding Demo completed successfully!');
        // Cleanup
        await redisManager.disconnect();
    }
    catch (error) {
        logger_1.default.error('Demo failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runEmbeddingDemo().catch((error) => {
        console.error('Failed to run embedding demo:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=embedding-demo.js.map