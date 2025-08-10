"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrefetchService = void 0;
const ioredis_1 = require("ioredis");
const logger_1 = require("../../utils/logger");
class PrefetchService {
    config;
    accessPatterns = new Map();
    cache = new Map();
    currentCacheSize = 0;
    backgroundTask = null;
    metrics = {
        cacheHits: 0,
        cacheMisses: 0,
        prefetchHits: 0,
        prefetchMisses: 0,
        evictions: 0,
        backgroundRefreshes: 0
    };
    constructor(config) {
        this.config = config;
        if (config.enabled) {
            this.startBackgroundRefresh();
        }
    }
    async get(redis, key) {
        // Update access pattern
        this.updateAccessPattern(key);
        // Check cache first
        const cached = this.cache.get(key);
        if (cached && this.isValidCacheEntry(cached)) {
            this.metrics.cacheHits++;
            cached.accessCount++;
            return cached.data;
        }
        // Cache miss - fetch from Redis
        this.metrics.cacheMisses++;
        const data = await redis.get(key);
        if (data !== null) {
            this.setCacheEntry(key, data);
            this.triggerRelatedPrefetch(redis, key);
        }
        return data;
    }
    async mget(redis, keys) {
        const results = [];
        const keysToFetch = [];
        const keyIndexMap = new Map();
        // Check cache for each key
        keys.forEach((key, index) => {
            this.updateAccessPattern(key);
            const cached = this.cache.get(key);
            if (cached && this.isValidCacheEntry(cached)) {
                results[index] = cached.data;
                cached.accessCount++;
                this.metrics.cacheHits++;
            }
            else {
                keysToFetch.push(key);
                keyIndexMap.set(key, index);
                this.metrics.cacheMisses++;
            }
        });
        // Fetch missing keys from Redis
        if (keysToFetch.length > 0) {
            const fetchedData = await redis.mget(...keysToFetch);
            keysToFetch.forEach((key, fetchIndex) => {
                const originalIndex = keyIndexMap.get(key);
                const data = fetchedData[fetchIndex];
                results[originalIndex] = data;
                if (data !== null) {
                    this.setCacheEntry(key, data);
                }
            });
            // Trigger prefetch for related keys
            keysToFetch.forEach(key => {
                this.triggerRelatedPrefetch(redis, key);
            });
        }
        return results;
    }
    async hget(redis, hashKey, field) {
        const key = `${hashKey}:${field}`;
        this.updateAccessPattern(key);
        const cached = this.cache.get(key);
        if (cached && this.isValidCacheEntry(cached)) {
            this.metrics.cacheHits++;
            cached.accessCount++;
            return cached.data;
        }
        this.metrics.cacheMisses++;
        const data = await redis.hget(hashKey, field);
        if (data !== null) {
            this.setCacheEntry(key, data);
            this.triggerRelatedPrefetch(redis, key);
        }
        return data;
    }
    updateAccessPattern(key) {
        const now = Date.now();
        const pattern = this.accessPatterns.get(key) || {
            key,
            accessCount: 0,
            lastAccessed: now,
            accessFrequency: 0,
            predictedNextAccess: now,
            relatedKeys: []
        };
        pattern.accessCount++;
        // Calculate access frequency (accesses per hour)
        const timeSinceFirst = now - (pattern.lastAccessed - (pattern.accessCount - 1) * 3600000);
        pattern.accessFrequency = pattern.accessCount / Math.max(1, timeSinceFirst / 3600000);
        // Predict next access based on frequency
        pattern.predictedNextAccess = now + (3600000 / Math.max(1, pattern.accessFrequency));
        pattern.lastAccessed = now;
        this.accessPatterns.set(key, pattern);
        // Update related keys based on temporal proximity
        this.updateRelatedKeys(key, now);
    }
    updateRelatedKeys(key, timestamp) {
        const timeWindow = 60000; // 1 minute window
        const pattern = this.accessPatterns.get(key);
        // Find keys accessed within the time window
        for (const [otherKey, otherPattern] of this.accessPatterns.entries()) {
            if (otherKey !== key && Math.abs(otherPattern.lastAccessed - timestamp) < timeWindow) {
                if (!pattern.relatedKeys.includes(otherKey)) {
                    pattern.relatedKeys.push(otherKey);
                }
                if (!otherPattern.relatedKeys.includes(key)) {
                    otherPattern.relatedKeys.push(key);
                }
            }
        }
        // Limit related keys to prevent memory bloat
        pattern.relatedKeys = pattern.relatedKeys.slice(-10);
    }
    setCacheEntry(key, data, ttl) {
        const size = this.estimateSize(data);
        // Evict if necessary
        while (this.currentCacheSize + size > this.config.maxCacheSize && this.cache.size > 0) {
            this.evictLeastUseful();
        }
        const entry = {
            key,
            data,
            timestamp: Date.now(),
            accessCount: 1,
            size,
            ttl
        };
        this.cache.set(key, entry);
        this.currentCacheSize += size;
    }
    evictLeastUseful() {
        let leastUseful = null;
        let lowestScore = Infinity;
        for (const entry of this.cache.values()) {
            // Score based on recency, frequency, and size
            const age = Date.now() - entry.timestamp;
            const score = (age / entry.accessCount) * Math.log(entry.size);
            if (score < lowestScore) {
                lowestScore = score;
                leastUseful = entry;
            }
        }
        if (leastUseful) {
            this.cache.delete(leastUseful.key);
            this.currentCacheSize -= leastUseful.size;
            this.metrics.evictions++;
        }
    }
    isValidCacheEntry(entry) {
        if (entry.ttl && Date.now() - entry.timestamp > entry.ttl) {
            return false;
        }
        return true;
    }
    estimateSize(data) {
        if (typeof data === 'string') {
            return data.length * 2; // UTF-16 encoding
        }
        if (typeof data === 'number') {
            return 8;
        }
        if (typeof data === 'object' && data !== null) {
            return JSON.stringify(data).length * 2;
        }
        return 0;
    }
    async triggerRelatedPrefetch(redis, key) {
        if (!this.config.enabled)
            return;
        const pattern = this.accessPatterns.get(key);
        if (!pattern || pattern.relatedKeys.length === 0)
            return;
        // Prefetch related keys that are likely to be accessed soon
        const keysToPrefetch = pattern.relatedKeys.filter(relatedKey => {
            const relatedPattern = this.accessPatterns.get(relatedKey);
            if (!relatedPattern)
                return false;
            // Only prefetch if not already cached and likely to be accessed soon
            const cached = this.cache.get(relatedKey);
            if (cached && this.isValidCacheEntry(cached))
                return false;
            const timeSinceLastAccess = Date.now() - relatedPattern.lastAccessed;
            const expectedAccessTime = 3600000 / Math.max(1, relatedPattern.accessFrequency);
            return timeSinceLastAccess < expectedAccessTime * 2;
        });
        if (keysToPrefetch.length > 0) {
            // Prefetch in background
            setImmediate(async () => {
                try {
                    const prefetchedData = await redis.mget(...keysToPrefetch);
                    keysToPrefetch.forEach((prefetchKey, index) => {
                        const data = prefetchedData[index];
                        if (data !== null) {
                            this.setCacheEntry(prefetchKey, data);
                            this.metrics.prefetchHits++;
                        }
                        else {
                            this.metrics.prefetchMisses++;
                        }
                    });
                }
                catch (error) {
                    logger_1.logger.warn('Prefetch failed:', error);
                }
            });
        }
    }
    startBackgroundRefresh() {
        this.backgroundTask = setInterval(async () => {
            await this.performBackgroundRefresh();
        }, this.config.backgroundRefreshInterval);
    }
    async performBackgroundRefresh() {
        // Find keys that need refreshing
        const now = Date.now();
        const keysToRefresh = [];
        for (const [key, pattern] of this.accessPatterns.entries()) {
            // Refresh if predicted to be accessed soon and not recently cached
            if (pattern.predictedNextAccess - now < this.config.backgroundRefreshInterval) {
                const cached = this.cache.get(key);
                if (!cached || now - cached.timestamp > this.config.backgroundRefreshInterval / 2) {
                    keysToRefresh.push(key);
                }
            }
        }
        if (keysToRefresh.length > 0) {
            try {
                // Create a temporary Redis connection for background refresh
                const redis = new ioredis_1.Redis({
                    host: process.env.REDIS_HOST || 'localhost',
                    port: parseInt(process.env.REDIS_PORT || '6379'),
                    lazyConnect: true
                });
                const refreshedData = await redis.mget(...keysToRefresh);
                keysToRefresh.forEach((key, index) => {
                    const data = refreshedData[index];
                    if (data !== null) {
                        this.setCacheEntry(key, data);
                        this.metrics.backgroundRefreshes++;
                    }
                });
                await redis.quit();
            }
            catch (error) {
                logger_1.logger.warn('Background refresh failed:', error);
            }
        }
        // Apply popularity decay
        this.applyPopularityDecay();
    }
    applyPopularityDecay() {
        const decayFactor = this.config.popularityDecayFactor;
        for (const pattern of this.accessPatterns.values()) {
            pattern.accessFrequency *= decayFactor;
            // Remove patterns that have become irrelevant
            if (pattern.accessFrequency < 0.01 && Date.now() - pattern.lastAccessed > 86400000) {
                this.accessPatterns.delete(pattern.key);
            }
        }
    }
    getMetrics() {
        const hitRate = this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0;
        const prefetchEfficiency = this.metrics.prefetchHits / (this.metrics.prefetchHits + this.metrics.prefetchMisses) || 0;
        return {
            ...this.metrics,
            hitRate,
            prefetchEfficiency,
            cacheSize: this.cache.size,
            cacheSizeBytes: this.currentCacheSize,
            accessPatterns: this.accessPatterns.size
        };
    }
    clear() {
        this.cache.clear();
        this.accessPatterns.clear();
        this.currentCacheSize = 0;
    }
    stop() {
        if (this.backgroundTask) {
            clearInterval(this.backgroundTask);
            this.backgroundTask = null;
        }
    }
}
exports.PrefetchService = PrefetchService;
//# sourceMappingURL=prefetch-service.js.map