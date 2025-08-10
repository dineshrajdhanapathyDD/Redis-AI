import { SearchQuery, SearchResult, ContentType } from '@/types';
export interface SearchOptions {
    enableCrossModal?: boolean;
    enableSemanticExpansion?: boolean;
    enablePersonalization?: boolean;
    maxResults?: number;
    minScore?: number;
    diversityFactor?: number;
}
export interface SearchAnalytics {
    queryTime: number;
    totalResults: number;
    resultsByModality: Record<ContentType, number>;
    averageScore: number;
    crossModalMatches: number;
    cacheHit: boolean;
}
export declare class MultiModalSearchEngine {
    private embeddingManager;
    private vectorStorage;
    private searchCache;
    private cacheTimeout;
    search(query: SearchQuery, options?: SearchOptions): Promise<{
        results: SearchResult[];
        analytics: SearchAnalytics;
    }>;
    private performMultiModalSearch;
    private enhanceCrossModalResults;
    private rankAndFilterResults;
    private diversifyResults;
    private expandQuery;
    private generateQueryExpansions;
    private passesFilters;
    private reconstructContent;
    private calculateMetadataRelevance;
    private calculateContentTypeBoost;
    private generateCacheKey;
    private getCachedResult;
    private cacheResults;
    private cleanupCache;
    private countResultsByModality;
    private calculateAverageScore;
    private countCrossModalMatches;
    getSearchStats(): Promise<{
        cacheSize: number;
        cacheHitRate: number;
        averageQueryTime: number;
        popularQueries: string[];
    }>;
    clearCache(): void;
    warmupCache(commonQueries: SearchQuery[]): Promise<void>;
}
//# sourceMappingURL=multi-modal-search.d.ts.map