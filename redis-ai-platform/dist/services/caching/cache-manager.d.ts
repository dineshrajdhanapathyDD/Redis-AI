import { AIRequest, AIRequestType } from '@/types';
export interface CacheManagerConfig {
    enableSemanticCaching: boolean;
    enableResponseCaching: boolean;
    enableQueryNormalization: boolean;
    cacheByModel: boolean;
    cacheByContext: boolean;
    minResponseQuality: number;
    maxCacheAge: number;
    warmupEnabled: boolean;
}
export interface CacheKey {
    query: string;
    model?: string;
    context?: string[];
    requestType: AIRequestType;
    normalized: string;
}
export interface CacheResult {
    hit: boolean;
    response?: any;
    similarity?: number;
    timeSaved?: number;
    costSaved?: number;
    source: 'semantic' | 'exact' | 'none';
}
export declare class CacheManager {
    private semanticCache;
    private config;
    private queryNormalizer;
    constructor(config?: Partial<CacheManagerConfig>);
    get(request: AIRequest, model?: string): Promise<CacheResult>;
    set(request: AIRequest, response: any, metadata: {
        model: string;
        responseTime: number;
        tokenUsage: any;
        cost: number;
        quality?: number;
    }): Promise<void>;
    warmup(queries: Array<{
        query: string;
        type: AIRequestType;
        expectedResponse?: any;
        model?: string;
    }>): Promise<void>;
    invalidate(pattern?: string, model?: string): Promise<number>;
    getStats(): Promise<{
        semantic: any;
        performance: {
            hitRate: number;
            averageTimeSaved: number;
            totalCostSaved: number;
            cacheEfficiency: number;
        };
    }>;
    optimize(): Promise<{
        entriesEvicted: number;
        storageReclaimed: number;
        optimizationTime: number;
    }>;
    updateConfig(newConfig: Partial<CacheManagerConfig>): void;
    private generateCacheKey;
    private extractContextKeys;
    private extractTags;
    private isValidCacheHit;
    private estimateResponseQuality;
    private calculateCacheEfficiency;
    cleanup(): Promise<void>;
}
export declare function getCacheManager(): CacheManager;
export declare function createCacheManager(config?: Partial<CacheManagerConfig>): CacheManager;
//# sourceMappingURL=cache-manager.d.ts.map