"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStorageService = void 0;
const redis_1 = require("@/config/redis");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class VectorStorageService {
    redisManager = (0, redis_1.getRedisManager)();
    indexPrefix;
    constructor(indexPrefix = 'ai_platform') {
        this.indexPrefix = indexPrefix;
    }
    async storeEmbedding(embedding) {
        try {
            const client = this.redisManager.getClient();
            const key = this.getEmbeddingKey(embedding.id);
            // Prepare the document for Redis
            const document = {
                id: embedding.id,
                vector: embedding.vector,
                contentId: embedding.contentId,
                contentType: embedding.contentType,
                metadata: JSON.stringify(embedding.metadata),
                relationships: JSON.stringify(embedding.relationships),
                createdAt: embedding.createdAt.toISOString(),
                updatedAt: embedding.updatedAt.toISOString(),
            };
            // Store the embedding document
            await client.json.set(key, '$', document);
            logger_1.default.debug('Embedding stored successfully', {
                embeddingId: embedding.id,
                contentId: embedding.contentId,
                contentType: embedding.contentType,
                dimensions: embedding.vector.length,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to store embedding', {
                embeddingId: embedding.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async storeBatchEmbeddings(embeddings) {
        try {
            const client = this.redisManager.getClient();
            const pipeline = client.multi();
            for (const embedding of embeddings) {
                const key = this.getEmbeddingKey(embedding.id);
                const document = {
                    id: embedding.id,
                    vector: embedding.vector,
                    contentId: embedding.contentId,
                    contentType: embedding.contentType,
                    metadata: JSON.stringify(embedding.metadata),
                    relationships: JSON.stringify(embedding.relationships),
                    createdAt: embedding.createdAt.toISOString(),
                    updatedAt: embedding.updatedAt.toISOString(),
                };
                pipeline.json.set(key, '$', document);
            }
            await pipeline.exec();
            logger_1.default.info('Batch embeddings stored successfully', {
                count: embeddings.length,
                contentTypes: [...new Set(embeddings.map(e => e.contentType))],
            });
        }
        catch (error) {
            logger_1.default.error('Failed to store batch embeddings', {
                count: embeddings.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getEmbedding(embeddingId) {
        try {
            const client = this.redisManager.getClient();
            const key = this.getEmbeddingKey(embeddingId);
            const document = await client.json.get(key);
            if (!document) {
                return null;
            }
            return this.parseEmbeddingDocument(document);
        }
        catch (error) {
            logger_1.default.error('Failed to get embedding', {
                embeddingId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async deleteEmbedding(embeddingId) {
        try {
            const client = this.redisManager.getClient();
            const key = this.getEmbeddingKey(embeddingId);
            const result = await client.del(key);
            logger_1.default.debug('Embedding deleted', {
                embeddingId,
                deleted: result > 0,
            });
            return result > 0;
        }
        catch (error) {
            logger_1.default.error('Failed to delete embedding', {
                embeddingId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async searchSimilarVectors(queryVector, options = {}) {
        try {
            const client = this.redisManager.getClient();
            const indexName = `${this.indexPrefix}:vectors`;
            const { limit = 10, threshold = 0.7, includeMetadata = true, includeVectors = false, } = options;
            // Build the search query
            const searchQuery = `*=>[KNN ${limit} @vector $query_vector AS score]`;
            const searchParams = {
                query_vector: Buffer.from(new Float32Array(queryVector).buffer),
            };
            // Execute the search
            const searchResult = await client.ft.search(indexName, searchQuery, {
                PARAMS: searchParams,
                RETURN: includeVectors ?
                    ['id', 'contentId', 'contentType', 'metadata', 'vector', 'score'] :
                    ['id', 'contentId', 'contentType', 'metadata', 'score'],
                SORTBY: 'score',
                LIMIT: { from: 0, size: limit },
            });
            // Process results
            const results = [];
            for (const doc of searchResult.documents) {
                const score = parseFloat(doc.value.score);
                // Filter by threshold
                if (score >= threshold) {
                    const result = {
                        id: doc.value.id,
                        score,
                    };
                    if (includeMetadata && doc.value.metadata) {
                        result.metadata = JSON.parse(doc.value.metadata);
                    }
                    if (includeVectors) {
                        // Reconstruct the full embedding if needed
                        const embedding = await this.getEmbedding(doc.value.id);
                        if (embedding) {
                            result.embedding = embedding;
                        }
                    }
                    results.push(result);
                }
            }
            logger_1.default.debug('Vector similarity search completed', {
                queryDimensions: queryVector.length,
                totalResults: searchResult.total,
                filteredResults: results.length,
                threshold,
                limit,
            });
            return results;
        }
        catch (error) {
            logger_1.default.error('Failed to search similar vectors', {
                queryDimensions: queryVector.length,
                options,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async searchByContentType(queryVector, contentType, options = {}) {
        try {
            const client = this.redisManager.getClient();
            const indexName = `${this.indexPrefix}:vectors`;
            const { limit = 10, threshold = 0.7, includeMetadata = true, includeVectors = false, } = options;
            // Build the search query with content type filter
            const searchQuery = `@contentType:{${contentType}}=>[KNN ${limit} @vector $query_vector AS score]`;
            const searchParams = {
                query_vector: Buffer.from(new Float32Array(queryVector).buffer),
            };
            // Execute the search
            const searchResult = await client.ft.search(indexName, searchQuery, {
                PARAMS: searchParams,
                RETURN: includeVectors ?
                    ['id', 'contentId', 'contentType', 'metadata', 'vector', 'score'] :
                    ['id', 'contentId', 'contentType', 'metadata', 'score'],
                SORTBY: 'score',
                LIMIT: { from: 0, size: limit },
            });
            // Process results (same as searchSimilarVectors)
            const results = [];
            for (const doc of searchResult.documents) {
                const score = parseFloat(doc.value.score);
                if (score >= threshold) {
                    const result = {
                        id: doc.value.id,
                        score,
                    };
                    if (includeMetadata && doc.value.metadata) {
                        result.metadata = JSON.parse(doc.value.metadata);
                    }
                    if (includeVectors) {
                        const embedding = await this.getEmbedding(doc.value.id);
                        if (embedding) {
                            result.embedding = embedding;
                        }
                    }
                    results.push(result);
                }
            }
            logger_1.default.debug('Content type vector search completed', {
                contentType,
                queryDimensions: queryVector.length,
                totalResults: searchResult.total,
                filteredResults: results.length,
                threshold,
                limit,
            });
            return results;
        }
        catch (error) {
            logger_1.default.error('Failed to search vectors by content type', {
                contentType,
                queryDimensions: queryVector.length,
                options,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getEmbeddingsByContentId(contentId) {
        try {
            const client = this.redisManager.getClient();
            const indexName = `${this.indexPrefix}:vectors`;
            // Search for embeddings with the specific content ID
            const searchResult = await client.ft.search(indexName, `@contentId:{${contentId}}`, {
                RETURN: ['id', 'contentId', 'contentType', 'metadata', 'vector', 'relationships', 'createdAt', 'updatedAt'],
            });
            const embeddings = [];
            for (const doc of searchResult.documents) {
                const embedding = this.parseEmbeddingDocument(doc.value);
                embeddings.push(embedding);
            }
            logger_1.default.debug('Retrieved embeddings by content ID', {
                contentId,
                count: embeddings.length,
            });
            return embeddings;
        }
        catch (error) {
            logger_1.default.error('Failed to get embeddings by content ID', {
                contentId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async updateEmbeddingRelationships(embeddingId, relationships) {
        try {
            const client = this.redisManager.getClient();
            const key = this.getEmbeddingKey(embeddingId);
            // Update only the relationships field
            await client.json.set(key, '$.relationships', relationships);
            await client.json.set(key, '$.updatedAt', new Date().toISOString());
            logger_1.default.debug('Embedding relationships updated', {
                embeddingId,
                relationships,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to update embedding relationships', {
                embeddingId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getStorageStats() {
        try {
            const client = this.redisManager.getClient();
            const indexName = `${this.indexPrefix}:vectors`;
            // Get index information
            const indexInfo = await this.redisManager.getIndexInfo(indexName);
            // Count embeddings by type
            const embeddingsByType = {};
            let totalEmbeddings = 0;
            for (const contentType of Object.values(types_1.ContentType)) {
                try {
                    const searchResult = await client.ft.search(indexName, `@contentType:{${contentType}}`, {
                        LIMIT: { from: 0, size: 0 }, // Only get count
                    });
                    embeddingsByType[contentType] = searchResult.total;
                    totalEmbeddings += searchResult.total;
                }
                catch (error) {
                    embeddingsByType[contentType] = 0;
                }
            }
            logger_1.default.debug('Storage stats retrieved', {
                totalEmbeddings,
                embeddingsByType,
            });
            return {
                totalEmbeddings,
                embeddingsByType,
                indexInfo,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get storage stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    getEmbeddingKey(embeddingId) {
        return `${this.indexPrefix}:embedding:${embeddingId}`;
    }
    parseEmbeddingDocument(document) {
        return {
            id: document.id,
            vector: Array.isArray(document.vector) ? document.vector : JSON.parse(document.vector),
            contentId: document.contentId,
            contentType: document.contentType,
            metadata: typeof document.metadata === 'string' ?
                JSON.parse(document.metadata) : document.metadata,
            relationships: typeof document.relationships === 'string' ?
                JSON.parse(document.relationships) : document.relationships,
            createdAt: new Date(document.createdAt),
            updatedAt: new Date(document.updatedAt),
        };
    }
}
exports.VectorStorageService = VectorStorageService;
//# sourceMappingURL=vector-storage.js.map