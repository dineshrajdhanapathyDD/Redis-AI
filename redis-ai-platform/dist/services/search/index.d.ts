export { MultiModalSearchEngine, SearchOptions, SearchAnalytics } from './multi-modal-search';
export { SearchResultRanker, ResultBlender, RankingConfig, RankingFeatures } from './result-ranker';
export { CrossModalMatcher, CrossModalConfig, CrossModalRelationship, CrossModalRelationshipType, createCrossModalMatcher } from './cross-modal-matcher';
import { SearchQuery, SearchResult, ContentType } from '@/types';
export interface SearchEngineConfig {
    enableCrossModal: boolean;
    enableSemanticExpansion: boolean;
    enablePersonalization: boolean;
    enableResultCaching: boolean;
    maxResults: number;
    defaultThreshold: number;
    rankingStrategy: 'general' | 'recent' | 'popular' | 'precise';
    crossModalConfig?: {
        similarityThreshold: number;
        maxMatchesPerType: number;
        useSemanticBridging: boolean;
    };
}
export declare class SearchEngineOrchestrator {
    private multiModalEngine;
    private resultRanker;
    private crossModalMatcher;
    private config;
    constructor(config?: Partial<SearchEngineConfig>);
    search(query: SearchQuery): Promise<{
        results: SearchResult[];
        analytics: {
            queryTime: number;
            totalResults: number;
            resultsByModality: Record<ContentType, number>;
            averageScore: number;
            crossModalMatches: number;
            cacheHit: boolean;
            rankingStrategy: string;
        };
        suggestions: string[];
    }>;
    searchWithMultipleStrategies(query: SearchQuery, strategies: Array<{
        name: string;
        config: Partial<SearchEngineConfig>;
        weight: number;
    }>): Promise<{
        results: SearchResult[];
        analytics: any;
        strategyBreakdown: Array<{
            strategy: string;
            results: number;
            avgScore: number;
        }>;
    }>;
    private normalizeQuery;
    private generateSearchSuggestions;
    getSearchStats(): Promise<{
        totalSearches: number;
        averageQueryTime: number;
        popularQueries: string[];
        modalityUsage: Record<ContentType, number>;
        cacheHitRate: number;
        crossModalStats: any;
    }>;
    warmupSearchCache(commonQueries: SearchQuery[]): Promise<void>;
    clearAllCaches(): void;
    updateConfig(newConfig: Partial<SearchEngineConfig>): void;
    explainSearch(query: SearchQuery, resultId: string): Promise<string>;
}
export declare function createSearchEngine(config?: Partial<SearchEngineConfig>): SearchEngineOrchestrator;
export declare function createSearchQuery(query: string, modalities?: ContentType[], options?: {
    limit?: number;
    threshold?: number;
    filters?: any;
}): SearchQuery;
export declare function isValidSearchQuery(query: SearchQuery): boolean;
//# sourceMappingURL=index.d.ts.map