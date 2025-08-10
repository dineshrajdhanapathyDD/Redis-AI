import { Redis } from 'ioredis';
import { PrefetchConfig } from './types';
export declare class PrefetchService {
    private config;
    private accessPatterns;
    private cache;
    private currentCacheSize;
    private backgroundTask;
    private metrics;
    constructor(config: PrefetchConfig);
    get(redis: Redis, key: string): Promise<any>;
    mget(redis: Redis, keys: string[]): Promise<any[]>;
    hget(redis: Redis, hashKey: string, field: string): Promise<any>;
    private updateAccessPattern;
    private updateRelatedKeys;
    private setCacheEntry;
    private evictLeastUseful;
    private isValidCacheEntry;
    private estimateSize;
    private triggerRelatedPrefetch;
    private startBackgroundRefresh;
    private performBackgroundRefresh;
    private applyPopularityDecay;
    getMetrics(): any;
    clear(): void;
    stop(): void;
}
//# sourceMappingURL=prefetch-service.d.ts.map