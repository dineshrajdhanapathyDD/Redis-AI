"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CachingService = exports.createCacheManager = exports.getCacheManager = exports.CacheManager = exports.createSemanticCache = exports.getSemanticCache = exports.SemanticCache = void 0;
exports.createCachingService = createCachingService;
exports.createCacheableRequest = createCacheableRequest;
exports.calculateCacheKey = calculateCacheKey;
exports.estimateResponseQuality = estimateResponseQuality;
exports.getCachingService = getCachingService;
exports.createCachingServiceSingleton = createCachingServiceSingleton;
// Export all caching components
var semantic_cache_1 = require("./semantic-cache");
Object.defineProperty(exports, "SemanticCache", { enumerable: true, get: function () { return semantic_cache_1.SemanticCache; } });
Object.defineProperty(exports, "getSemanticCache", { enumerable: true, get: function () { return semantic_cache_1.getSemanticCache; } });
Object.defineProperty(exports, "createSemanticCache", { enumerable: true, get: function () { return semantic_cache_1.createSemanticCache; } });
var cache_manager_1 = require("./cache-manager");
Object.defineProperty(exports, "CacheManager", { enumerable: true, get: function () { return cache_manager_1.CacheManager; } });
Object.defineProperty(exports, "getCacheManager", { enumerable: true, get: function () { return cache_manager_1.getCacheManager; } });
Object.defineProperty(exports, "createCacheManager", { enumerable: true, get: function () { return cache_manager_1.createCacheManager; } });
const cache_manager_2 = require("./cache-manager");
const semantic_cache_2 = require("./semantic-cache");
const logger_1 = __importDefault(require("@/utils/logger"));
class CachingService {
    cacheManager = (0, cache_manager_2.getCacheManager)();
    semanticCache = (0, semantic_cache_2.getSemanticCache)();
    config;
    constructor(config) {
        this.config = {
            enableSemanticCaching: true,
            enableResponseCaching: true,
            enableQueryNormalization: true,
            enableWarmup: true,
            similarityThreshold: 0.85,
            maxCacheSize: 10000,
            defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
            minResponseQuality: 0.7,
            ...config,
        };
        // Update cache manager configuration
        this.cacheManager.updateConfig({
            enableSemanticCaching: this.config.enableSemanticCaching,
            enableResponseCaching: this.config.enableResponseCaching,
            enableQueryNormalization: this.config.enableQueryNormalization,
            minResponseQuality: this.config.minResponseQuality,
            warmupEnabled: this.config.enableWarmup,
        });
        logger_1.default.info('Caching service initialized', { config: this.config });
    }
    async getCachedResponse(request, model) {
        try {
            if (!this.config.enableSemanticCaching) {
                return { hit: false, source: 'none' };
            }
            const result = await this.cacheManager.get(request, model);
            if (result.hit) {
                logger_1.default.debug('Cache hit for request', {
                    requestId: request.id,
                    source: result.source,
                    similarity: result.similarity?.toFixed(3),
                    timeSaved: result.timeSaved,
                    costSaved: result.costSaved,
                });
            }
            return result;
        }
        catch (error) {
            logger_1.default.error('Failed to get cached response', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return { hit: false, source: 'none' };
        }
    }
    async cacheResponse(request, response, metadata) {
        try {
            if (!this.config.enableResponseCaching) {
                return;
            }
            await this.cacheManager.set(request, response, metadata);
            logger_1.default.debug('Response cached successfully', {
                requestId: request.id,
                model: metadata.model,
                cost: metadata.cost,
                quality: metadata.quality,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to cache response', {
                requestId: request.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async warmupCache(queries) {
        try {
            if (!this.config.enableWarmup) {
                logger_1.default.info('Cache warmup disabled');
                return;
            }
            await this.cacheManager.warmup(queries);
            logger_1.default.info('Cache warmup completed successfully', {
                queryCount: queries.length,
            });
        }
        catch (error) {
            logger_1.default.error('Cache warmup failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async invalidateCache(pattern, model) {
        try {
            const deletedCount = await this.cacheManager.invalidate(pattern, model);
            logger_1.default.info('Cache invalidated', {
                pattern,
                model,
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
    async getCacheStats() {
        try {
            const stats = await this.cacheManager.getStats();
            return {
                ...stats,
                config: this.config,
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
                config: this.config,
            };
        }
    }
    async optimizeCache() {
        try {
            const result = await this.cacheManager.optimize();
            logger_1.default.info('Cache optimization completed', {
                entriesEvicted: result.entriesEvicted,
                storageReclaimed: result.storageReclaimed,
                optimizationTime: result.optimizationTime,
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Cache optimization failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                entriesEvicted: 0,
                storageReclaimed: 0,
                optimizationTime: 0,
            };
        }
    }
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Update cache manager configuration
        this.cacheManager.updateConfig({
            enableSemanticCaching: this.config.enableSemanticCaching,
            enableResponseCaching: this.config.enableResponseCaching,
            enableQueryNormalization: this.config.enableQueryNormalization,
            minResponseQuality: this.config.minResponseQuality,
            warmupEnabled: this.config.enableWarmup,
        });
        logger_1.default.info('Caching service configuration updated', { config: this.config });
    }
    async cleanup() {
        await this.cacheManager.cleanup();
        logger_1.default.info('Caching service cleanup completed');
    }
}
exports.CachingService = CachingService;
// Factory function to create caching service
function createCachingService(config) {
    return new CachingService(config);
}
// Utility functions for caching
function createCacheableRequest(content, type, options = {}) {
    return {
        id: options.id || `cache_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        type,
        context: options.context,
        metadata: {
            priority: 'medium',
            maxLatency: 10000,
            maxCost: 1.0,
            requiredCapabilities: [],
            timestamp: new Date(),
            ...options.metadata,
        },
    };
}
function calculateCacheKey(request, model) {
    const parts = [
        request.content.toLowerCase().trim(),
        request.type,
    ];
    if (model) {
        parts.push(model);
    }
    if (request.context?.userId) {
        parts.push(`user:${request.context.userId}`);
    }
    return parts.join('|');
}
function estimateResponseQuality(response) {
    if (!response)
        return 0;
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
// Singleton instance
let cachingService = null;
function getCachingService() {
    if (!cachingService) {
        cachingService = new CachingService();
    }
    return cachingService;
}
function createCachingServiceSingleton(config) {
    cachingService = new CachingService(config);
    return cachingService;
}
//# sourceMappingURL=index.js.map