import { getEmbeddingManager } from '../embedding-manager';
import { VectorStorageService } from '../vector-storage';
import { 
  SearchQuery, 
  SearchResult, 
  ContentType, 
  Content, 
  CrossModalMatch,
  SearchFilters,
  SearchResultMetadata 
} from '@/types';
import logger from '@/utils/logger';

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

export class MultiModalSearchEngine {
  private embeddingManager = getEmbeddingManager();
  private vectorStorage = new VectorStorageService();
  private searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  async search(
    query: SearchQuery,
    options: SearchOptions = {}
  ): Promise<{ results: SearchResult[]; analytics: SearchAnalytics }> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(query, options);
      const cachedResult = this.getCachedResult(cacheKey);
      
      if (cachedResult) {
        logger.debug('Search cache hit', { query: query.query, cacheKey });
        return {
          results: cachedResult,
          analytics: {
            queryTime: Date.now() - startTime,
            totalResults: cachedResult.length,
            resultsByModality: this.countResultsByModality(cachedResult),
            averageScore: this.calculateAverageScore(cachedResult),
            crossModalMatches: this.countCrossModalMatches(cachedResult),
            cacheHit: true,
          },
        };
      }

      // Expand query if semantic expansion is enabled
      const expandedQuery = options.enableSemanticExpansion 
        ? await this.expandQuery(query)
        : query;

      // Perform multi-modal search
      const searchResults = await this.performMultiModalSearch(expandedQuery, options);

      // Apply cross-modal enhancement if enabled
      const enhancedResults = options.enableCrossModal
        ? await this.enhanceCrossModalResults(searchResults, expandedQuery)
        : searchResults;

      // Apply result ranking and filtering
      const rankedResults = await this.rankAndFilterResults(
        enhancedResults,
        expandedQuery,
        options
      );

      // Apply diversity if requested
      const diversifiedResults = options.diversityFactor
        ? this.diversifyResults(rankedResults, options.diversityFactor)
        : rankedResults;

      // Limit results
      const finalResults = diversifiedResults.slice(0, options.maxResults || query.limit || 10);

      // Cache results
      this.cacheResults(cacheKey, finalResults);

      // Generate analytics
      const analytics: SearchAnalytics = {
        queryTime: Date.now() - startTime,
        totalResults: finalResults.length,
        resultsByModality: this.countResultsByModality(finalResults),
        averageScore: this.calculateAverageScore(finalResults),
        crossModalMatches: this.countCrossModalMatches(finalResults),
        cacheHit: false,
      };

      logger.info('Multi-modal search completed', {
        query: query.query,
        modalities: query.modalities,
        resultsCount: finalResults.length,
        queryTime: analytics.queryTime,
        crossModalEnabled: options.enableCrossModal,
      });

      return { results: finalResults, analytics };

    } catch (error) {
      logger.error('Multi-modal search failed', {
        query: query.query,
        modalities: query.modalities,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private async performMultiModalSearch(
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // Generate query embedding
    const queryContent: Content = {
      id: `query_${Date.now()}`,
      type: ContentType.TEXT,
      data: query.query,
      metadata: {
        title: 'Search Query',
        description: '',
        tags: [],
        source: 'search',
      },
    };

    const queryEmbedding = await this.embeddingManager.processContent(queryContent);

    // Search across each requested modality
    for (const modality of query.modalities) {
      try {
        const modalityResults = await this.vectorStorage.searchByContentType(
          queryEmbedding.vector,
          modality,
          {
            limit: (query.limit || 10) * 2, // Get more results for better ranking
            threshold: query.threshold || 0.3,
            includeMetadata: true,
            includeVectors: false,
          }
        );

        // Convert vector results to search results
        for (const vectorResult of modalityResults) {
          const embedding = await this.vectorStorage.getEmbedding(vectorResult.id);
          if (embedding && this.passesFilters(embedding, query.filters)) {
            const searchResult: SearchResult = {
              id: embedding.contentId,
              content: await this.reconstructContent(embedding),
              type: embedding.contentType,
              relevanceScore: vectorResult.score,
              crossModalMatches: [],
              metadata: {
                searchTime: 0,
                totalResults: 0,
                appliedFilters: query.filters || {},
                suggestions: [],
              },
            };

            results.push(searchResult);
          }
        }
      } catch (error) {
        logger.warn('Failed to search modality', {
          modality,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  private async enhanceCrossModalResults(
    results: SearchResult[],
    query: SearchQuery
  ): Promise<SearchResult[]> {
    const enhancedResults = [...results];

    // Generate query embedding for cross-modal matching
    const queryContent: Content = {
      id: `cross_modal_query_${Date.now()}`,
      type: ContentType.TEXT,
      data: query.query,
      metadata: {
        title: 'Cross-Modal Query',
        description: '',
        tags: [],
        source: 'search',
      },
    };

    const queryEmbedding = await this.embeddingManager.processContent(queryContent);

    // Find cross-modal matches for each result
    for (const result of enhancedResults) {
      const crossModalMatches: CrossModalMatch[] = [];

      // Search for related content in other modalities
      const otherModalities = Object.values(ContentType).filter(
        type => type !== result.type && query.modalities.includes(type)
      );

      for (const modality of otherModalities) {
        try {
          const crossModalResults = await this.vectorStorage.searchByContentType(
            queryEmbedding.vector,
            modality,
            {
              limit: 3,
              threshold: 0.4, // Lower threshold for cross-modal
              includeMetadata: true,
            }
          );

          for (const crossResult of crossModalResults) {
            crossModalMatches.push({
              contentId: crossResult.id,
              type: modality,
              score: crossResult.score,
              relationship: 'semantic_similarity',
            });
          }
        } catch (error) {
          logger.debug('Cross-modal search failed for modality', {
            modality,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      result.crossModalMatches = crossModalMatches;
    }

    return enhancedResults;
  }

  private async rankAndFilterResults(
    results: SearchResult[],
    query: SearchQuery,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    // Apply minimum score filter
    let filteredResults = results.filter(
      result => result.relevanceScore >= (options.minScore || query.threshold || 0.3)
    );

    // Enhanced ranking algorithm
    filteredResults = filteredResults.map(result => {
      let enhancedScore = result.relevanceScore;

      // Boost score based on cross-modal matches
      if (result.crossModalMatches.length > 0) {
        const crossModalBoost = Math.min(result.crossModalMatches.length * 0.1, 0.3);
        enhancedScore += crossModalBoost;
      }

      // Boost score based on metadata relevance
      const metadataBoost = this.calculateMetadataRelevance(result, query);
      enhancedScore += metadataBoost;

      // Apply content type preferences (if any)
      const typeBoost = this.calculateContentTypeBoost(result.type, query.modalities);
      enhancedScore += typeBoost;

      return {
        ...result,
        relevanceScore: Math.min(enhancedScore, 1.0), // Cap at 1.0
      };
    });

    // Sort by enhanced relevance score
    filteredResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return filteredResults;
  }

  private diversifyResults(results: SearchResult[], diversityFactor: number): SearchResult[] {
    if (diversityFactor <= 0 || results.length <= 1) {
      return results;
    }

    const diversifiedResults: SearchResult[] = [];
    const remainingResults = [...results];
    const modalityCount = new Map<ContentType, number>();

    // Initialize modality counts
    for (const type of Object.values(ContentType)) {
      modalityCount.set(type, 0);
    }

    while (remainingResults.length > 0 && diversifiedResults.length < results.length) {
      let bestIndex = 0;
      let bestScore = -1;

      // Find the best result considering diversity
      for (let i = 0; i < remainingResults.length; i++) {
        const result = remainingResults[i];
        const currentCount = modalityCount.get(result.type) || 0;
        
        // Calculate diversity-adjusted score
        const diversityPenalty = currentCount * diversityFactor;
        const adjustedScore = result.relevanceScore - diversityPenalty;

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestIndex = i;
        }
      }

      // Add the best result and update counts
      const selectedResult = remainingResults.splice(bestIndex, 1)[0];
      diversifiedResults.push(selectedResult);
      modalityCount.set(selectedResult.type, (modalityCount.get(selectedResult.type) || 0) + 1);
    }

    return diversifiedResults;
  }

  private async expandQuery(query: SearchQuery): Promise<SearchQuery> {
    try {
      // Simple query expansion using synonyms and related terms
      const expandedTerms = await this.generateQueryExpansions(query.query);
      
      const expandedQuery = {
        ...query,
        query: `${query.query} ${expandedTerms.join(' ')}`,
      };

      logger.debug('Query expanded', {
        original: query.query,
        expanded: expandedQuery.query,
        expansions: expandedTerms,
      });

      return expandedQuery;
    } catch (error) {
      logger.warn('Query expansion failed, using original query', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return query;
    }
  }

  private async generateQueryExpansions(query: string): Promise<string[]> {
    // Simple expansion based on common synonyms and related terms
    const expansions: string[] = [];
    const words = query.toLowerCase().split(/\s+/);

    const synonymMap: Record<string, string[]> = {
      'search': ['find', 'lookup', 'query', 'discover'],
      'code': ['programming', 'script', 'function', 'algorithm'],
      'data': ['information', 'content', 'records', 'dataset'],
      'ai': ['artificial intelligence', 'machine learning', 'ml', 'neural'],
      'redis': ['database', 'cache', 'storage', 'memory'],
      'vector': ['embedding', 'similarity', 'semantic', 'numerical'],
    };

    for (const word of words) {
      if (synonymMap[word]) {
        expansions.push(...synonymMap[word].slice(0, 2)); // Limit expansions
      }
    }

    return expansions.slice(0, 5); // Limit total expansions
  }

  private passesFilters(embedding: any, filters?: SearchFilters): boolean {
    if (!filters) return true;

    // Content type filter
    if (filters.contentType && !filters.contentType.includes(embedding.contentType)) {
      return false;
    }

    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const embeddingTags = embedding.metadata.tags || [];
      const hasMatchingTag = filters.tags.some(tag => 
        embeddingTags.some((embTag: string) => 
          embTag.toLowerCase().includes(tag.toLowerCase())
        )
      );
      if (!hasMatchingTag) return false;
    }

    // Source filter
    if (filters.source && embedding.metadata.source !== filters.source) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const embeddingDate = new Date(embedding.createdAt);
      if (embeddingDate < filters.dateRange.start || embeddingDate > filters.dateRange.end) {
        return false;
      }
    }

    return true;
  }

  private async reconstructContent(embedding: any): Promise<Content> {
    // In a real implementation, this would fetch the actual content
    // For now, we'll create a minimal content object
    return {
      id: embedding.contentId,
      type: embedding.contentType,
      data: '', // Would be populated from actual content store
      metadata: {
        title: embedding.metadata.title || 'Untitled',
        description: embedding.metadata.description || '',
        tags: embedding.metadata.tags || [],
        source: embedding.metadata.source || 'unknown',
      },
    };
  }

  private calculateMetadataRelevance(result: SearchResult, query: SearchQuery): number {
    let boost = 0;

    // Title relevance
    if (result.content.metadata.title) {
      const titleWords = result.content.metadata.title.toLowerCase().split(/\s+/);
      const queryWords = query.query.toLowerCase().split(/\s+/);
      const titleMatches = titleWords.filter(word => 
        queryWords.some(qWord => word.includes(qWord) || qWord.includes(word))
      );
      boost += (titleMatches.length / titleWords.length) * 0.2;
    }

    // Tag relevance
    if (result.content.metadata.tags.length > 0) {
      const queryWords = query.query.toLowerCase().split(/\s+/);
      const tagMatches = result.content.metadata.tags.filter(tag =>
        queryWords.some(qWord => tag.toLowerCase().includes(qWord))
      );
      boost += (tagMatches.length / result.content.metadata.tags.length) * 0.1;
    }

    return Math.min(boost, 0.3); // Cap metadata boost
  }

  private calculateContentTypeBoost(contentType: ContentType, requestedModalities: ContentType[]): number {
    // Boost results from explicitly requested modalities
    const modalityIndex = requestedModalities.indexOf(contentType);
    if (modalityIndex === 0) return 0.1; // First modality gets highest boost
    if (modalityIndex === 1) return 0.05; // Second modality gets medium boost
    return 0; // Other modalities get no boost
  }

  private generateCacheKey(query: SearchQuery, options: SearchOptions): string {
    const keyData = {
      query: query.query,
      modalities: query.modalities.sort(),
      limit: query.limit,
      threshold: query.threshold,
      filters: query.filters,
      options: {
        enableCrossModal: options.enableCrossModal,
        enableSemanticExpansion: options.enableSemanticExpansion,
        maxResults: options.maxResults,
        minScore: options.minScore,
      },
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  private getCachedResult(cacheKey: string): SearchResult[] | null {
    const cached = this.searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.results;
    }
    
    if (cached) {
      this.searchCache.delete(cacheKey); // Remove expired cache
    }
    
    return null;
  }

  private cacheResults(cacheKey: string, results: SearchResult[]): void {
    this.searchCache.set(cacheKey, {
      results: [...results], // Deep copy to prevent mutations
      timestamp: Date.now(),
    });

    // Clean up old cache entries periodically
    if (this.searchCache.size > 100) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.searchCache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.searchCache.delete(key);
      }
    }
  }

  private countResultsByModality(results: SearchResult[]): Record<ContentType, number> {
    const counts = {} as Record<ContentType, number>;
    
    for (const type of Object.values(ContentType)) {
      counts[type] = 0;
    }

    for (const result of results) {
      counts[result.type]++;
    }

    return counts;
  }

  private calculateAverageScore(results: SearchResult[]): number {
    if (results.length === 0) return 0;
    const totalScore = results.reduce((sum, result) => sum + result.relevanceScore, 0);
    return totalScore / results.length;
  }

  private countCrossModalMatches(results: SearchResult[]): number {
    return results.reduce((count, result) => count + result.crossModalMatches.length, 0);
  }

  // Public methods for search analytics and management
  async getSearchStats(): Promise<{
    cacheSize: number;
    cacheHitRate: number;
    averageQueryTime: number;
    popularQueries: string[];
  }> {
    // This would be implemented with proper analytics storage
    return {
      cacheSize: this.searchCache.size,
      cacheHitRate: 0.75, // Placeholder
      averageQueryTime: 150, // Placeholder
      popularQueries: [], // Placeholder
    };
  }

  clearCache(): void {
    this.searchCache.clear();
    logger.info('Search cache cleared');
  }

  async warmupCache(commonQueries: SearchQuery[]): Promise<void> {
    logger.info('Warming up search cache', { queryCount: commonQueries.length });
    
    for (const query of commonQueries) {
      try {
        await this.search(query, { enableCrossModal: true });
      } catch (error) {
        logger.warn('Failed to warm up cache for query', {
          query: query.query,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    
    logger.info('Search cache warmup completed');
  }
}