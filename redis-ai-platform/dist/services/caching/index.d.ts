export { SemanticCache, getSemanticCache, createSemanticCache } from './semantic-cache';
export { CacheManager, getCacheManager, createCacheManager } from './cache-manager';
import { AIRequest, AIRequestType } from '@/types';
export interface CachingServiceConfig {
    enableSemanticCaching: boolean;
    enableResponseCaching: boolean;
    enableQueryNormalization: boolean;
    enableWarmup: boolean;
    similarityThreshold: number;
    maxCacheSize: number;
    defaultTTL: number;
    minResponseQuality: number;
}
export declare class CachingService {
    private cacheManager;
    private semanticCache;
    private config;
    constructor(config?: Partial<CachingServiceConfig>);
    getCachedResponse(request: AIRequest, model?: string): Promise<{
        hit: boolean;
        response?: any;
        similarity?: number;
        timeSaved?: number;
        costSaved?: number;
        source?: 'semantic' | 'exact' | 'none';
    }>;
    cacheResponse(request: AIRequest, response: any, metadata: {
        model: string;
        responseTime: number;
        tokenUsage: any;
        cost: number;
        quality?: number;
    }): Promise<void>;
    warmupCache(queries: Array<{
        query: string;
        type: AIRequestType;
        expectedResponse?: any;
        model?: string;
    }>): Promise<void>;
    invalidateCache(pattern?: string, model?: string): Promise<number>;
    getCacheStats(): Promise<{
        semantic: any;
        performance: {
            hitRate: number;
            averageTimeSaved: number;
            totalCostSaved: number;
            cacheEfficiency: number;
        };
        config: CachingServiceConfig;
    }>;
    optimizeCache(): Promise<{
        entriesEvicted: number;
        storageReclaimed: number;
        optimizationTime: number;
    }>;
    updateConfiguration(newConfig: Partial<CachingServiceConfig>): void;
    cleanup(): Promise<void>;
}
export declare function createCachingService(config?: Partial<CachingServiceConfig>): CachingService;
export declare function createCacheableRequest(content: string, type: AIRequestType, options?: {
    id?: string;
    context?: any;
    metadata?: any;
}): AIRequest;
export declare function calculateCacheKey(request: AIRequest, model?: string): string;
export declare function estimateResponseQuality(response: any): number;
export declare function getCachingService(): CachingService;
export declare function createCachingServiceSingleton(config?: Partial<CachingServiceConfig>): CachingService;
//# sourceMappingURL=index.d.ts.map