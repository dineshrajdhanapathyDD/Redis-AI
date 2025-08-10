"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheManager = void 0;
exports.getCacheManager = getCacheManager;
exports.createCacheManager = createCacheManager;
const semantic_cache_1 = require("./semantic-cache");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class CacheManager {
    semanticCache = (0, semantic_cache_1.getSemanticCache)();
    config;
    queryNormalizer = new QueryNormalizer();
    constructor(config) {
        this.config = {
            enableSemanticCaching: true,
            enableResponseCaching: true,
            enableQueryNormalization: true,
            cacheByModel: true,
            cacheByContext: false,
            minResponseQuality: 0.7,
            maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
            warmupEnabled: true,
            ...config,
        };
        logger_1.default.info('Cache manager initialized', { config: this.config });
    }
    async get(request, model) {
        try {
            if (!this.config.enableSemanticCaching) {
                return { hit: false, source: 'none' };
            }
            // Generate cache key
            const cacheKey = this.generateCacheKey(request, model);
            // Try semantic cache first
            const semanticHit = await this.semanticCache.get(cacheKey.normalized, cacheKey.context);
            if (semanticHit) {
                // Validate cache hit quality and age
                if (this.isValidCacheHit(semanticHit)) {
                    logger_1.default.debug('Cache hit', {
                        requestId: request.id,
                        similarity: semanticHit.similarity.toFixed(3),
                        timeSaved: semanticHit.timeSaved,
                        costSaved: semanticHit.costSaved,
                    });
                    return {
                        hit: true,
                        response: semanticHit.entry.response,
                        similarity: semanticHit.similarity,
                        timeSaved: semanticHit.timeSaved,
                        costSaved: semanticHit.costSaved,
                        source: semanticHit.isExact ? 'exact' : 'semantic',
                    };
                }
            }
            return { hit: false, source: 'none' };
        }
        catch (error) {
            logger_1.default.error('Failed to get from cache', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return { hit: false, source: 'none' };
        }
    }
    async set(request, response, metadata) {
        try {
            if (!this.config.enableResponseCaching) {
                return;
            }
            // Check quality threshold
            const quality = metadata.quality || this.estimateResponseQuality(response);
            if (quality < this.config.minResponseQuality) {
                logger_1.default.debug('Response quality too low for caching', {
                    requestId: request.id,
                    quality: quality.toFixed(3),
                    threshold: this.config.minResponseQuality,
                });
                return;
            }
            // Generate cache key
            const cacheKey = this.generateCacheKey(request, metadata.model);
            // Prepare cache metadata
            const cacheMetadata = {
                model: metadata.model,
                responseTime: metadata.responseTime,
                tokenUsage: metadata.tokenUsage,
                cost: metadata.cost,
                quality,
                tags: this.extractTags(request),
                context: cacheKey.context || [],
            };
            // Store in semantic cache
            await this.semanticCache.set(cacheKey.normalized, response, cacheMetadata, cacheKey.context);
            logger_1.default.debug('Response cached', {
                requestId: request.id,
                model: metadata.model,
                quality: quality.toFixed(3),
                cost: metadata.cost,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to set cache', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async warmup(queries) {
        if (!this.config.warmupEnabled) {
            return;
        }
        logger_1.default.info('Starting cache warmup', { queryCount: queries.length });
        try {
            const warmupQueries = queries.map(q => {
                const request = {
                    id: `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    content: q.query,
                    type: q.type,
                    metadata: {
                        priority: 'low',
                        maxLatency: 10000,
                        maxCost: 1.0,
                        requiredCapabilities: [],
                        timestamp: new Date(),
                    },
                };
                const cacheKey = this.generateCacheKey(request, q.model);
                return cacheKey.normalized;
            });
            await this.semanticCache.warmup(warmupQueries);
            logger_1.default.info('Cache warmup completed', {
                queriesProcessed: queries.length,
            });
        }
        catch (error) {
            logger_1.default.error('Cache warmup failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async invalidate(pattern, model) {
        try {
            let invalidationPattern = pattern;
            if (model && this.config.cacheByModel) {
                invalidationPattern = pattern ? `${model}:${pattern}` : model;
            }
            const deletedCount = await this.semanticCache.invalidate(invalidationPattern);
            logger_1.default.info('Cache invalidated', {
                pattern: invalidationPattern,
                deletedCount,
            });
            return deletedCount;
        }
        catch (error) {
            logger_1.default.error('Failed to invalidate cache', {
                pattern,
                model,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return 0;
        }
    }
    async getStats() {
        try {
            const semanticStats = await this.semanticCache.getStats();
            const performance = {
                hitRate: semanticStats.hitRate,
                averageTimeSaved: semanticStats.totalTimeSaved / Math.max(semanticStats.totalEntries, 1),
                totalCostSaved: semanticStats.totalCostSaved,
                cacheEfficiency: this.calculateCacheEfficiency(semanticStats),
            };
            return {
                semantic: semanticStats,
                performance,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get cache stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                semantic: {},
                performance: {
                    hitRate: 0,
                    averageTimeSaved: 0,
                    totalCostSaved: 0,
                    cacheEfficiency: 0,
                },
            };
        }
    }
    async optimize() {
        try {
            return await this.semanticCache.optimize();
        }
        catch (error) {
            logger_1.default.error('Failed to optimize cache', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                entriesEvicted: 0,
                storageReclaimed: 0,
                optimizationTime: 0,
            };
        }
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger_1.default.info('Cache manager configuration updated', { config: this.config });
    }
    generateCacheKey(request, model) {
        let query = request.content;
        // Normalize query if enabled
        if (this.config.enableQueryNormalization) {
            query = this.queryNormalizer.normalize(query, request.type);
        }
        // Extract context
        let context = [];
        if (this.config.cacheByContext && request.context) {
            context = this.extractContextKeys(request.context);
        }
        // Create normalized key
        let normalized = query;
        if (model && this.config.cacheByModel) {
            normalized = `${model}:${normalized}`;
        }
        if (context.length > 0) {
            normalized = `${normalized}:${context.join(':')}`;
        }
        return {
            query: request.content,
            model,
            context,
            requestType: request.type,
            normalized,
        };
    }
    extractContextKeys(context) {
        const keys = [];
        if (context.userId) {
            keys.push(`user:${context.userId}`);
        }
        if (context.sessionId) {
            keys.push(`session:${context.sessionId}`);
        }
        if (context.workspaceId) {
            keys.push(`workspace:${context.workspaceId}`);
        }
        return keys;
    }
    extractTags(request) {
        const tags = [request.type];
        if (request.metadata.requiredCapabilities) {
            tags.push(...request.metadata.requiredCapabilities);
        }
        if (request.metadata.priority) {
            tags.push(`priority:${request.metadata.priority}`);
        }
        return tags;
    }
    isValidCacheHit(hit) {
        // Check age
        const age = Date.now() - hit.entry.createdAt.getTime();
        if (age > this.config.maxCacheAge) {
            return false;
        }
        // Check quality
        if (hit.entry.metadata.quality < this.config.minResponseQuality) {
            return false;
        }
        return true;
    }
    estimateResponseQuality(response) {
        // Simple quality estimation based on response characteristics
        let quality = 0.5; // Base quality
        if (typeof response === 'object' && response.content) {
            const content = response.content;
            // Length factor
            if (content.length > 100)
                quality += 0.1;
            if (content.length > 500)
                quality += 0.1;
            // Completeness factor
            if (!content.includes('...') && !content.includes('[truncated]')) {
                quality += 0.1;
            }
            // Structure factor
            if (content.includes('\n') || content.includes('.')) {
                quality += 0.1;
            }
            // Error indicators
            if (content.toLowerCase().includes('error') ||
                content.toLowerCase().includes('sorry')) {
                quality -= 0.2;
            }
        }
        return Math.max(0, Math.min(1, quality));
    }
    calculateCacheEfficiency(stats) {
        if (stats.totalEntries === 0)
            return 0;
        const hitRate = stats.hitRate;
        const avgSimilarity = stats.averageSimilarity;
        const storageEfficiency = Math.min(stats.totalEntries / 10000, 1); // Normalize to 10k entries
        return (hitRate * 0.5 + avgSimilarity * 0.3 + storageEfficiency * 0.2);
    }
    async cleanup() {
        await this.semanticCache.cleanup();
        logger_1.default.info('Cache manager cleanup completed');
    }
}
exports.CacheManager = CacheManager;
class QueryNormalizer {
    normalize(query, requestType) {
        let normalized = query.trim().toLowerCase();
        // Remove extra whitespace
        normalized = normalized.replace(/\s+/g, ' ');
        // Remove common stop words for certain request types
        if (requestType === types_1.AIRequestType.QUESTION_ANSWERING) {
            normalized = this.removeStopWords(normalized);
        }
        // Normalize punctuation
        normalized = normalized.replace(/[.,!?;:]+/g, '');
        // Handle code normalization
        if (requestType === types_1.AIRequestType.CODE_GENERATION) {
            normalized = this.normalizeCodeQuery(normalized);
        }
        return normalized;
    }
    removeStopWords(text) {
        const stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'must', 'can', 'what', 'how', 'when', 'where',
            'why', 'who', 'which', 'that', 'this', 'these', 'those',
        ];
        const words = text.split(' ');
        const filtered = words.filter(word => !stopWords.includes(word));
        return filtered.join(' ');
    }
    normalizeCodeQuery(text) {
        // Normalize common code-related terms
        const codeNormalizations = {
            'javascript': 'js',
            'typescript': 'ts',
            'python': 'py',
            'function': 'func',
            'method': 'func',
            'variable': 'var',
            'constant': 'const',
        };
        let normalized = text;
        for (const [original, replacement] of Object.entries(codeNormalizations)) {
            normalized = normalized.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
        }
        return normalized;
    }
}
// Singleton instance
let cacheManager = null;
function getCacheManager() {
    if (!cacheManager) {
        cacheManager = new CacheManager();
    }
    return cacheManager;
}
function createCacheManager(config) {
    cacheManager = new CacheManager(config);
    return cacheManager;
}
//# sourceMappingURL=cache-manager.js.map