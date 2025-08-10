export interface CacheEntry {
    id: string;
    queryHash: string;
    query: string;
    queryEmbedding: number[];
    response: any;
    metadata: CacheEntryMetadata;
    createdAt: Date;
    lastAccessed: Date;
    accessCount: number;
    ttl: number;
}
export interface CacheEntryMetadata {
    model: string;
    responseTime: number;
    tokenUsage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    cost: number;
    quality: number;
    tags: string[];
    context: string[];
}
export interface CacheHit {
    entry: CacheEntry;
    similarity: number;
    isExact: boolean;
    timeSaved: number;
    costSaved: number;
}
export interface CacheStats {
    totalEntries: number;
    hitRate: number;
    missRate: number;
    averageSimilarity: number;
    totalTimeSaved: number;
    totalCostSaved: number;
    storageUsed: number;
    evictionCount: number;
    topQueries: Array<{
        query: string;
        count: number;
    }>;
}
export interface SemanticCacheConfig {
    similarityThreshold: number;
    maxCacheSize: number;
    defaultTTL: number;
    enableEviction: boolean;
    evictionPolicy: 'lru' | 'lfu' | 'semantic-relevance' | 'hybrid';
    compressionEnabled: boolean;
    warmupQueries: string[];
    qualityThreshold: number;
}
export declare class SemanticCache {
    private redisManager;
    private embeddingManager;
    private vectorStorage;
    private config;
    private stats;
    private evictionTimer?;
    constructor(config?: Partial<SemanticCacheConfig>);
    get(query: string, context?: string[]): Promise<CacheHit | null>;
    set(query: string, response: any, metadata: CacheEntryMetadata, context?: string[]): Promise<void>;
    invalidate(pattern?: string): Promise<number>;
    warmup(queries: string[]): Promise<void>;
    getStats(): Promise<CacheStats>;
    optimize(): Promise<{
        entriesEvicted: number;
        storageReclaimed: number;
        optimizationTime: number;
    }>;
    private getCacheEntry;
    private storeCacheEntry;
    private updateAccessStats;
    private evictEntry;
    private evictEntries;
    private getEvictionCandidates;
    private calculateSemanticRelevance;
    private calculateCosineSimilarity;
    private getRecentQueries;
    private isExpired;
    private findExpiredEntries;
    private getEntrySize;
    private compressExistingEntries;
    private compressResponse;
    private decompressResponse;
    private isCompressed;
    private hashQuery;
    private updateStats;
    private updateTopQueries;
    private startEvictionTimer;
    cleanup(): Promise<void>;
}
export declare function getSemanticCache(): SemanticCache;
export declare function createSemanticCache(config?: Partial<SemanticCacheConfig>): SemanticCache;
//# sourceMappingURL=semantic-cache.d.ts.map