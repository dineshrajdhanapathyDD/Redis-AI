"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticCache = void 0;
exports.getSemanticCache = getSemanticCache;
exports.createSemanticCache = createSemanticCache;
const redis_1 = require("@/config/redis");
const embedding_manager_1 = require("../embedding-manager");
const vector_storage_1 = require("../vector-storage");
const types_1 = require("@/types");
const embeddings_1 = require("../embeddings");
const logger_1 = __importDefault(require("@/utils/logger"));
class SemanticCache {
    redisManager = (0, redis_1.getRedisManager)();
    embeddingManager = (0, embedding_manager_1.getEmbeddingManager)();
    vectorStorage = new vector_storage_1.VectorStorageService('semantic_cache');
    config;
    stats;
    evictionTimer;
    constructor(config) {
        this.config = {
            similarityThreshold: 0.85,
            maxCacheSize: 10000,
            defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
            enableEviction: true,
            evictionPolicy: 'hybrid',
            compressionEnabled: true,
            warmupQueries: [],
            qualityThreshold: 0.7,
            ...config,
        };
        this.stats = {
            totalEntries: 0,
            hitRate: 0,
            missRate: 0,
            averageSimilarity: 0,
            totalTimeSaved: 0,
            totalCostSaved: 0,
            storageUsed: 0,
            evictionCount: 0,
            topQueries: [],
        };
        this.startEvictionTimer();
        logger_1.default.info('Semantic cache initialized', { config: this.config });
    }
    async get(query, context) {
        const startTime = Date.now();
        try {
            // Generate query embedding
            const queryContent = (0, embeddings_1.createContent)(`cache_query_${Date.now()}`, types_1.ContentType.TEXT, query, {
                title: 'Cache Query',
                tags: context || [],
                source: 'semantic-cache',
            });
            const queryEmbedding = await this.embeddingManager.processContent(queryContent);
            // Search for similar cached entries
            const similarEntries = await this.vectorStorage.searchSimilarVectors(queryEmbedding.vector, {
                limit: 5,
                threshold: this.config.similarityThreshold,
                includeMetadata: true,
                includeVectors: false,
            });
            if (similarEntries.length === 0) {
                this.updateStats('miss');
                return null;
            }
            // Get the best match
            const bestMatch = similarEntries[0];
            const cacheEntry = await this.getCacheEntry(bestMatch.id);
            if (!cacheEntry) {
                this.updateStats('miss');
                return null;
            }
            // Check if entry is still valid (TTL)
            if (this.isExpired(cacheEntry)) {
                await this.evictEntry(cacheEntry.id);
                this.updateStats('miss');
                return null;
            }
            // Update access statistics
            await this.updateAccessStats(cacheEntry);
            const similarity = bestMatch.score;
            const isExact = similarity > 0.99;
            const timeSaved = cacheEntry.metadata.responseTime;
            const costSaved = cacheEntry.metadata.cost;
            this.updateStats('hit', similarity, timeSaved, costSaved);
            const cacheHit = {
                entry: cacheEntry,
                similarity,
                isExact,
                timeSaved,
                costSaved,
            };
            logger_1.default.debug('Cache hit', {
                query: query.substring(0, 100),
                similarity: similarity.toFixed(3),
                timeSaved,
                costSaved,
                isExact,
            });
            return cacheHit;
        }
        catch (error) {
            logger_1.default.error('Failed to get from semantic cache', {
                query: query.substring(0, 100),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async set(query, response, metadata, context) {
        try {
            // Check quality threshold
            if (metadata.quality < this.config.qualityThreshold) {
                logger_1.default.debug('Response quality too low for caching', {
                    quality: metadata.quality,
                    threshold: this.config.qualityThreshold,
                });
                return;
            }
            // Check cache size limit
            if (this.stats.totalEntries >= this.config.maxCacheSize) {
                await this.evictEntries(1);
            }
            // Generate query embedding
            const queryContent = (0, embeddings_1.createContent)(`cache_query_${Date.now()}`, types_1.ContentType.TEXT, query, {
                title: 'Cache Query',
                tags: context || [],
                source: 'semantic-cache',
            });
            const queryEmbedding = await this.embeddingManager.processContent(queryContent);
            // Create cache entry
            const cacheEntry = {
                id: `cache_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                queryHash: this.hashQuery(query),
                query,
                queryEmbedding: queryEmbedding.vector,
                response: this.config.compressionEnabled ? this.compressResponse(response) : response,
                metadata,
                createdAt: new Date(),
                lastAccessed: new Date(),
                accessCount: 0,
                ttl: this.config.defaultTTL,
            };
            // Store in Redis
            await this.storeCacheEntry(cacheEntry);
            // Store embedding for similarity search
            const embeddingForStorage = {
                ...queryEmbedding,
                id: cacheEntry.id,
                contentId: cacheEntry.id,
                metadata: {
                    ...queryEmbedding.metadata,
                    source: 'semantic-cache',
                    tags: [...(queryEmbedding.metadata.tags || []), ...(context || [])],
                },
            };
            await this.vectorStorage.storeEmbedding(embeddingForStorage);
            this.stats.totalEntries++;
            logger_1.default.debug('Response cached', {
                cacheId: cacheEntry.id,
                query: query.substring(0, 100),
                model: metadata.model,
                cost: metadata.cost,
                quality: metadata.quality,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to set semantic cache', {
                query: query.substring(0, 100),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async invalidate(pattern) {
        try {
            const client = this.redisManager.getClient();
            let deletedCount = 0;
            if (pattern) {
                // Invalidate entries matching pattern
                const keys = await client.keys(`semantic_cache:entry:*`);
                for (const key of keys) {
                    const entry = await client.json.get(key);
                    if (entry && typeof entry === 'object' && 'query' in entry) {
                        const cacheEntry = entry;
                        if (cacheEntry.query.includes(pattern)) {
                            await this.evictEntry(cacheEntry.id);
                            deletedCount++;
                        }
                    }
                }
            }
            else {
                // Clear entire cache
                const keys = await client.keys(`semantic_cache:*`);
                if (keys.length > 0) {
                    await client.del(keys);
                    deletedCount = keys.length;
                }
                this.stats.totalEntries = 0;
                this.stats.evictionCount += deletedCount;
            }
            logger_1.default.info('Cache invalidated', {
                pattern: pattern || 'all',
                deletedCount,
            });
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate cache', {
                pattern,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async warmup(queries) {
        logger_1.default.info('Starting cache warmup', { queryCount: queries.length });
        try {
            for (const query of queries) {
                // Check if already cached
                const existing = await this.get(query);
                if (existing) {
                    continue;
                }
                // Generate a mock response for warmup
                const mockResponse = {
                    content: `Warmup response for: ${query}`,
                    model: 'warmup-model',
                    usage: {
                        promptTokens: Math.floor(query.length / 4),
                        completionTokens: 50,
                        totalTokens: Math.floor(query.length / 4) + 50,
                    },
                };
                const mockMetadata = {
                    model: 'warmup-model',
                    responseTime: 1000,
                    tokenUsage: mockResponse.usage,
                    cost: 0.001,
                    quality: 0.8,
                    tags: ['warmup'],
                    context: [],
                };
                await this.set(query, mockResponse, mockMetadata);
            }
            logger_1.default.info('Cache warmup completed', {
                queriesProcessed: queries.length,
                totalEntries: this.stats.totalEntries,
            });
        }
        catch (error) {
            logger_1.default.error('Cache warmup failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getStats() {
        try {
            const client = this.redisManager.getClient();
            // Update storage usage
            const keys = await client.keys('semantic_cache:*');
            let totalSize = 0;
            for (const key of keys.slice(0, 100)) { // Sample for performance
                const size = await client.memory.usage(key);
                totalSize += size || 0;
            }
            this.stats.storageUsed = totalSize;
            // Update top queries
            await this.updateTopQueries();
            return { ...this.stats };
        }
        catch (error) {
            logger_1.default.error('Failed to get cache stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return this.stats;
        }
    }
    async optimize() {
        const startTime = Date.now();
        let entriesEvicted = 0;
        let storageReclaimed = 0;
        try {
            logger_1.default.info('Starting cache optimization');
            // Remove expired entries
            const expiredEntries = await this.findExpiredEntries();
            for (const entryId of expiredEntries) {
                const sizeBefore = await this.getEntrySize(entryId);
                await this.evictEntry(entryId);
                storageReclaimed += sizeBefore;
                entriesEvicted++;
            }
            // Apply eviction policy if over size limit
            if (this.stats.totalEntries > this.config.maxCacheSize) {
                const toEvict = this.stats.totalEntries - this.config.maxCacheSize;
                const evicted = await this.evictEntries(toEvict);
                entriesEvicted += evicted.length;
                for (const entryId of evicted) {
                    storageReclaimed += await this.getEntrySize(entryId);
                }
            }
            // Compress responses if enabled
            if (this.config.compressionEnabled) {
                await this.compressExistingEntries();
            }
            const optimizationTime = Date.now() - startTime;
            logger_1.default.info('Cache optimization completed', {
                entriesEvicted,
                storageReclaimed,
                optimizationTime,
            });
            return {
                entriesEvicted,
                storageReclaimed,
                optimizationTime,
            };
        }
        catch (error) {
            logger_1.default.error('Cache optimization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                entriesEvicted: 0,
                storageReclaimed: 0,
                optimizationTime: Date.now() - startTime,
            };
        }
    }
    async getCacheEntry(entryId) {
        try {
            const client = this.redisManager.getClient();
            const key = `semantic_cache:entry:${entryId}`;
            const entry = await client.json.get(key);
            if (!entry)
                return null;
            const cacheEntry = entry;
            // Decompress response if needed
            if (this.config.compressionEnabled && this.isCompressed(cacheEntry.response)) {
                cacheEntry.response = this.decompressResponse(cacheEntry.response);
            }
            return cacheEntry;
        }
        catch (error) {
            logger_1.default.error('Failed to get cache entry', {
                entryId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return null;
        }
    }
    async storeCacheEntry(entry) {
        const client = this.redisManager.getClient();
        const key = `semantic_cache:entry:${entry.id}`;
        await client.json.set(key, '$', entry);
        // Set TTL
        if (entry.ttl > 0) {
            await client.expire(key, Math.floor(entry.ttl / 1000));
        }
    }
    async updateAccessStats(entry) {
        try {
            const client = this.redisManager.getClient();
            const key = `semantic_cache:entry:${entry.id}`;
            await client.json.set(key, '$.lastAccessed', new Date().toISOString());
            await client.json.numIncrBy(key, '$.accessCount', 1);
        }
        catch (error) {
            logger_1.default.debug('Failed to update access stats', {
                entryId: entry.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async evictEntry(entryId) {
        try {
            const client = this.redisManager.getClient();
            // Remove cache entry
            await client.del(`semantic_cache:entry:${entryId}`);
            // Remove vector embedding
            await this.vectorStorage.deleteEmbedding(entryId);
            this.stats.totalEntries = Math.max(0, this.stats.totalEntries - 1);
            this.stats.evictionCount++;
        }
        catch (error) {
            logger_1.default.error('Failed to evict cache entry', {
                entryId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async evictEntries(count) {
        try {
            const candidates = await this.getEvictionCandidates(count);
            for (const entryId of candidates) {
                await this.evictEntry(entryId);
            }
            logger_1.default.debug('Evicted cache entries', {
                count: candidates.length,
                policy: this.config.evictionPolicy,
            });
            return candidates;
        }
        catch (error) {
            logger_1.default.error('Failed to evict cache entries', {
                count,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    async getEvictionCandidates(count) {
        const client = this.redisManager.getClient();
        const keys = await client.keys('semantic_cache:entry:*');
        const entries = [];
        // Score entries based on eviction policy
        for (const key of keys) {
            const entry = await client.json.get(key);
            if (!entry)
                continue;
            let score = 0;
            switch (this.config.evictionPolicy) {
                case 'lru':
                    score = new Date(entry.lastAccessed).getTime();
                    break;
                case 'lfu':
                    score = entry.accessCount;
                    break;
                case 'semantic-relevance':
                    score = await this.calculateSemanticRelevance(entry);
                    break;
                case 'hybrid':
                    const recency = (Date.now() - new Date(entry.lastAccessed).getTime()) / (24 * 60 * 60 * 1000);
                    const frequency = entry.accessCount;
                    const quality = entry.metadata.quality;
                    score = (frequency * quality) / (recency + 1);
                    break;
            }
            entries.push({ id: entry.id, score });
        }
        // Sort by score (ascending for eviction)
        entries.sort((a, b) => a.score - b.score);
        return entries.slice(0, count).map(e => e.id);
    }
    async calculateSemanticRelevance(entry) {
        // Calculate relevance based on recent query patterns
        // This is a simplified implementation
        const recentQueries = await this.getRecentQueries(100);
        let totalSimilarity = 0;
        let count = 0;
        for (const recentQuery of recentQueries) {
            const similarity = this.calculateCosineSimilarity(entry.queryEmbedding, recentQuery.embedding);
            totalSimilarity += similarity;
            count++;
        }
        return count > 0 ? totalSimilarity / count : 0;
    }
    calculateCosineSimilarity(a, b) {
        if (a.length !== b.length)
            return 0;
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
        if (normA === 0 || normB === 0)
            return 0;
        return dotProduct / (normA * normB);
    }
    async getRecentQueries(limit) {
        // This would implement actual recent query tracking
        // For now, return empty array
        return [];
    }
    isExpired(entry) {
        if (entry.ttl <= 0)
            return false;
        return Date.now() - entry.createdAt.getTime() > entry.ttl;
    }
    async findExpiredEntries() {
        const client = this.redisManager.getClient();
        const keys = await client.keys('semantic_cache:entry:*');
        const expiredIds = [];
        for (const key of keys) {
            const entry = await client.json.get(key);
            if (entry && this.isExpired(entry)) {
                expiredIds.push(entry.id);
            }
        }
        return expiredIds;
    }
    async getEntrySize(entryId) {
        try {
            const client = this.redisManager.getClient();
            const key = `semantic_cache:entry:${entryId}`;
            return await client.memory.usage(key) || 0;
        }
        catch {
            return 0;
        }
    }
    async compressExistingEntries() {
        // Implementation for compressing existing cache entries
        // This would iterate through entries and compress large responses
    }
    compressResponse(response) {
        // Simple compression implementation
        if (typeof response === 'string' && response.length > 1000) {
            return {
                _compressed: true,
                data: Buffer.from(response).toString('base64'),
            };
        }
        return response;
    }
    decompressResponse(response) {
        if (response && response._compressed) {
            return Buffer.from(response.data, 'base64').toString();
        }
        return response;
    }
    isCompressed(response) {
        return response && response._compressed === true;
    }
    hashQuery(query) {
        // Simple hash implementation
        let hash = 0;
        for (let i = 0; i < query.length; i++) {
            const char = query.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(36);
    }
    updateStats(type, similarity, timeSaved, costSaved) {
        const totalRequests = this.stats.hitRate + this.stats.missRate + 1;
        if (type === 'hit') {
            this.stats.hitRate = (this.stats.hitRate + 1) / totalRequests;
            this.stats.missRate = this.stats.missRate / totalRequests;
            if (similarity) {
                this.stats.averageSimilarity =
                    (this.stats.averageSimilarity + similarity) / 2;
            }
            if (timeSaved) {
                this.stats.totalTimeSaved += timeSaved;
            }
            if (costSaved) {
                this.stats.totalCostSaved += costSaved;
            }
        }
        else {
            this.stats.hitRate = this.stats.hitRate / totalRequests;
            this.stats.missRate = (this.stats.missRate + 1) / totalRequests;
        }
    }
    async updateTopQueries() {
        // Implementation for tracking and updating top queries
        // This would analyze access patterns and update the topQueries array
    }
    startEvictionTimer() {
        if (!this.config.enableEviction)
            return;
        this.evictionTimer = setInterval(async () => {
            try {
                await this.optimize();
            }
            catch (error) {
                logger_1.default.error('Eviction timer failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, 5 * 60 * 1000); // Run every 5 minutes
    }
    async cleanup() {
        if (this.evictionTimer) {
            clearInterval(this.evictionTimer);
        }
        logger_1.default.info('Semantic cache cleanup completed');
    }
}
exports.SemanticCache = SemanticCache;
// Singleton instance
let semanticCache = null;
function getSemanticCache() {
    if (!semanticCache) {
        semanticCache = new SemanticCache();
    }
    return semanticCache;
}
function createSemanticCache(config) {
    semanticCache = new SemanticCache(config);
    return semanticCache;
}
//# sourceMappingURL=semantic-cache.js.map