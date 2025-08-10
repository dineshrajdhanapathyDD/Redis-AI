import { Redis } from 'ioredis';
import { QueryOptimizationConfig } from './types';
interface QueryPlan {
    originalQuery: any;
    optimizedQuery: any;
    estimatedCost: number;
    executionStrategy: 'parallel' | 'sequential' | 'hybrid';
    indexHints: string[];
    cacheStrategy: 'none' | 'partial' | 'full';
}
export declare class QueryOptimizer {
    private config;
    private queryCache;
    private metrics;
    constructor(config: QueryOptimizationConfig);
    optimizeVectorSearch(redis: Redis, query: any): Promise<QueryPlan>;
    executeOptimizedQuery(redis: Redis, plan: QueryPlan): Promise<any>;
    private generateOptimizationPlan;
    private rewriteQuery;
    private generateIndexHints;
    private executeQuery;
    private buildSearchParams;
    private parseSearchResult;
    private estimateQueryCost;
    private calculateCacheTTL;
    private generateQueryKey;
    getMetrics(): any;
    clearCache(): void;
}
export {};
//# sourceMappingURL=query-optimizer.d.ts.map