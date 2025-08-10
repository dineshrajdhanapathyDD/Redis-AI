// Export all search components
export { MultiModalSearchEngine, SearchOptions, SearchAnalytics } from './multi-modal-search';
export { SearchResultRanker, ResultBlender, RankingConfig, RankingFeatures } from './result-ranker';
export { 
  CrossModalMatcher, 
  CrossModalConfig, 
  CrossModalRelationship, 
  CrossModalRelationshipType,
  createCrossModalMatcher 
} from './cross-modal-matcher';

import { MultiModalSearchEngine } from './multi-modal-search';
import { SearchResultRanker } from './result-ranker';
import { createCrossModalMatcher } from './cross-modal-matcher';
import { SearchQuery, SearchResult, ContentType } from '@/types';
import logger from '@/utils/logger';

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

export class SearchEngineOrchestrator {
  private multiModalEngine: MultiModalSearchEngine;
  private resultRanker: SearchResultRanker;
  private crossModalMatcher: ReturnType<typeof createCrossModalMatcher>;
  private config: SearchEngineConfig;

  constructor(config?: Partial<SearchEngineConfig>) {
    this.config = {
      enableCrossModal: true,
      enableSemanticExpansion: true,
      enablePersonalization: false, // Will be implemented in adaptive learning
      enableResultCaching: true,
      maxResults: 20,
      defaultThreshold: 0.3,
      rankingStrategy: 'general',
      crossModalConfig: {
        similarityThreshold: 0.4,
        maxMatchesPerType: 5,
        useSemanticBridging: true,
      },
      ...config,
    };

    this.multiModalEngine = new MultiModalSearchEngine();
    this.resultRanker = new SearchResultRanker();
    this.crossModalMatcher = createCrossModalMatcher(this.config.crossModalConfig);

    logger.info('Search engine orchestrator initialized', {
      config: this.config,
    });
  }

  async search(query: SearchQuery): Promise<{
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
  }> {
    const startTime = Date.now();

    try {
      // Validate and normalize query
      const normalizedQuery = this.normalizeQuery(query);

      // Perform multi-modal search
      const searchResult = await this.multiModalEngine.search(normalizedQuery, {
        enableCrossModal: this.config.enableCrossModal,
        enableSemanticExpansion: this.config.enableSemanticExpansion,
        enablePersonalization: this.config.enablePersonalization,
        maxResults: this.config.maxResults,
        minScore: normalizedQuery.threshold || this.config.defaultThreshold,
      });

      // Apply advanced ranking
      const rankingConfig = this.resultRanker.getOptimalConfig(this.config.rankingStrategy);
      const rankedResults = this.resultRanker.rankResults(
        searchResult.results,
        normalizedQuery,
        rankingConfig
      );

      // Generate search suggestions
      const suggestions = await this.generateSearchSuggestions(normalizedQuery, rankedResults);

      const totalTime = Date.now() - startTime;

      logger.info('Search completed', {
        query: normalizedQuery.query,
        modalities: normalizedQuery.modalities,
        resultsCount: rankedResults.length,
        totalTime,
        cacheHit: searchResult.analytics.cacheHit,
      });

      return {
        results: rankedResults,
        analytics: {
          ...searchResult.analytics,
          queryTime: totalTime,
          rankingStrategy: this.config.rankingStrategy,
        },
        suggestions,
      };

    } catch (error) {
      logger.error('Search failed', {
        query: query.query,
        modalities: query.modalities,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async searchWithMultipleStrategies(
    query: SearchQuery,
    strategies: Array<{
      name: string;
      config: Partial<SearchEngineConfig>;
      weight: number;
    }>
  ): Promise<{
    results: SearchResult[];
    analytics: any;
    strategyBreakdown: Array<{
      strategy: string;
      results: number;
      avgScore: number;
    }>;
  }> {
    const resultSets: Array<{
      results: SearchResult[];
      weight: number;
      strategy: string;
    }> = [];

    const strategyBreakdown: Array<{
      strategy: string;
      results: number;
      avgScore: number;
    }> = [];

    // Execute each search strategy
    for (const strategy of strategies) {
      try {
        // Create temporary orchestrator with strategy config
        const tempOrchestrator = new SearchEngineOrchestrator({
          ...this.config,
          ...strategy.config,
        });

        const strategyResult = await tempOrchestrator.search(query);
        
        resultSets.push({
          results: strategyResult.results,
          weight: strategy.weight,
          strategy: strategy.name,
        });

        strategyBreakdown.push({
          strategy: strategy.name,
          results: strategyResult.results.length,
          avgScore: strategyResult.analytics.averageScore,
        });

      } catch (error) {
        logger.warn('Strategy failed', {
          strategy: strategy.name,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Blend results from all strategies
    const blender = new (await import('./result-ranker')).ResultBlender();
    const blendedResults = blender.blendResults(resultSets, this.config.maxResults);

    return {
      results: blendedResults,
      analytics: {
        totalStrategies: strategies.length,
        successfulStrategies: resultSets.length,
        totalUniqueResults: blendedResults.length,
      },
      strategyBreakdown,
    };
  }

  private normalizeQuery(query: SearchQuery): SearchQuery {
    return {
      ...query,
      query: query.query.trim(),
      modalities: query.modalities.length > 0 ? query.modalities : [ContentType.TEXT],
      limit: query.limit || this.config.maxResults,
      threshold: query.threshold || this.config.defaultThreshold,
      filters: query.filters || {},
    };
  }

  private async generateSearchSuggestions(
    query: SearchQuery,
    results: SearchResult[]
  ): Promise<string[]> {
    const suggestions: string[] = [];

    try {
      // Extract common terms from top results
      const topResults = results.slice(0, 5);
      const termFrequency = new Map<string, number>();

      for (const result of topResults) {
        // Extract terms from title and tags
        const terms = [
          ...(result.content.metadata.title?.toLowerCase().split(/\s+/) || []),
          ...result.content.metadata.tags.map(tag => tag.toLowerCase()),
        ];

        for (const term of terms) {
          if (term.length > 2 && !query.query.toLowerCase().includes(term)) {
            termFrequency.set(term, (termFrequency.get(term) || 0) + 1);
          }
        }
      }

      // Generate suggestions based on term frequency
      const sortedTerms = Array.from(termFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([term]) => term);

      // Create query suggestions
      for (const term of sortedTerms) {
        suggestions.push(`${query.query} ${term}`);
      }

      // Add modality-specific suggestions
      if (query.modalities.length === 1) {
        const currentModality = query.modalities[0];
        const otherModalities = Object.values(ContentType).filter(
          type => type !== currentModality
        );

        if (otherModalities.length > 0) {
          suggestions.push(`Find ${otherModalities[0]} related to: ${query.query}`);
        }
      }

    } catch (error) {
      logger.debug('Failed to generate suggestions', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    return suggestions.slice(0, 5);
  }

  // Management and analytics methods
  async getSearchStats(): Promise<{
    totalSearches: number;
    averageQueryTime: number;
    popularQueries: string[];
    modalityUsage: Record<ContentType, number>;
    cacheHitRate: number;
    crossModalStats: any;
  }> {
    const [searchStats, crossModalStats] = await Promise.all([
      this.multiModalEngine.getSearchStats(),
      this.crossModalMatcher.getRelationshipStats(),
    ]);

    return {
      totalSearches: 0, // Would be tracked in a real implementation
      averageQueryTime: searchStats.averageQueryTime,
      popularQueries: searchStats.popularQueries,
      modalityUsage: {} as Record<ContentType, number>, // Would be tracked
      cacheHitRate: searchStats.cacheHitRate,
      crossModalStats,
    };
  }

  async warmupSearchCache(commonQueries: SearchQuery[]): Promise<void> {
    logger.info('Warming up search caches', { queryCount: commonQueries.length });

    await Promise.all([
      this.multiModalEngine.warmupCache(commonQueries),
      this.crossModalMatcher.buildCrossModalIndex(),
    ]);

    logger.info('Search cache warmup completed');
  }

  clearAllCaches(): void {
    this.multiModalEngine.clearCache();
    this.crossModalMatcher.clearCache();
    logger.info('All search caches cleared');
  }

  updateConfig(newConfig: Partial<SearchEngineConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.crossModalConfig) {
      this.crossModalMatcher.updateConfig(newConfig.crossModalConfig);
    }

    logger.info('Search engine configuration updated', { config: this.config });
  }

  // Method to explain search results for debugging
  async explainSearch(query: SearchQuery, resultId: string): Promise<string> {
    try {
      const searchResult = await this.search(query);
      const targetResult = searchResult.results.find(r => r.id === resultId);

      if (!targetResult) {
        return `Result ${resultId} not found in search results`;
      }

      const explanation = this.resultRanker.explainRanking(
        targetResult,
        query,
        this.resultRanker.getOptimalConfig(this.config.rankingStrategy)
      );

      return explanation;

    } catch (error) {
      return `Failed to explain search: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  }
}

// Factory function to create search engine with default configuration
export function createSearchEngine(config?: Partial<SearchEngineConfig>): SearchEngineOrchestrator {
  return new SearchEngineOrchestrator(config);
}

// Utility functions for search
export function createSearchQuery(
  query: string,
  modalities: ContentType[] = [ContentType.TEXT],
  options: {
    limit?: number;
    threshold?: number;
    filters?: any;
  } = {}
): SearchQuery {
  return {
    query,
    modalities,
    limit: options.limit || 10,
    threshold: options.threshold || 0.3,
    filters: options.filters,
  };
}

export function isValidSearchQuery(query: SearchQuery): boolean {
  return (
    typeof query.query === 'string' &&
    query.query.trim().length > 0 &&
    Array.isArray(query.modalities) &&
    query.modalities.length > 0 &&
    query.modalities.every(m => Object.values(ContentType).includes(m))
  );
}