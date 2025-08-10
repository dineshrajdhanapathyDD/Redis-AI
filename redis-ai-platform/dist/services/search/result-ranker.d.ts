import { SearchResult, SearchQuery } from '@/types';
export interface RankingConfig {
    semanticWeight: number;
    modalityWeight: number;
    freshnessWeight: number;
    popularityWeight: number;
    crossModalWeight: number;
    metadataWeight: number;
}
export interface RankingFeatures {
    semanticScore: number;
    modalityPreference: number;
    freshnessScore: number;
    popularityScore: number;
    crossModalScore: number;
    metadataScore: number;
    finalScore: number;
}
export declare class SearchResultRanker {
    private defaultConfig;
    rankResults(results: SearchResult[], query: SearchQuery, config?: Partial<RankingConfig>): SearchResult[];
    private calculateRankingFeatures;
    private calculateModalityPreference;
    private calculateFreshnessScore;
    private calculatePopularityScore;
    private calculateCrossModalScore;
    private calculateMetadataScore;
    explainRanking(result: SearchResult, query: SearchQuery, config?: Partial<RankingConfig>): string;
    getOptimalConfig(useCase: 'general' | 'recent' | 'popular' | 'precise'): RankingConfig;
}
export declare class ResultBlender {
    blendResults(resultSets: Array<{
        results: SearchResult[];
        weight: number;
        strategy: string;
    }>, maxResults?: number): SearchResult[];
    diversifyResults(results: SearchResult[], diversityConfig: {
        modalityDiversity: number;
        contentDiversity: number;
        maxSimilarResults: number;
    }): SearchResult[];
    private generateContentKey;
}
//# sourceMappingURL=result-ranker.d.ts.map