import { SearchResult, ContentType, SearchQuery } from '@/types';
import logger from '@/utils/logger';

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

export class SearchResultRanker {
  private defaultConfig: RankingConfig = {
    semanticWeight: 0.4,
    modalityWeight: 0.15,
    freshnessWeight: 0.1,
    popularityWeight: 0.1,
    crossModalWeight: 0.15,
    metadataWeight: 0.1,
  };

  rankResults(
    results: SearchResult[],
    query: SearchQuery,
    config: Partial<RankingConfig> = {}
  ): SearchResult[] {
    const rankingConfig = { ...this.defaultConfig, ...config };
    
    // Calculate ranking features for each result
    const rankedResults = results.map(result => {
      const features = this.calculateRankingFeatures(result, query, rankingConfig);
      
      return {
        ...result,
        relevanceScore: features.finalScore,
        rankingFeatures: features,
      };
    });

    // Sort by final score
    rankedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);

    logger.debug('Results ranked', {
      totalResults: results.length,
      topScore: rankedResults[0]?.relevanceScore || 0,
      averageScore: rankedResults.reduce((sum, r) => sum + r.relevanceScore, 0) / rankedResults.length,
      config: rankingConfig,
    });

    return rankedResults;
  }

  private calculateRankingFeatures(
    result: SearchResult,
    query: SearchQuery,
    config: RankingConfig
  ): RankingFeatures {
    // 1. Semantic Score (from vector similarity)
    const semanticScore = result.relevanceScore;

    // 2. Modality Preference Score
    const modalityPreference = this.calculateModalityPreference(result.type, query.modalities);

    // 3. Freshness Score
    const freshnessScore = this.calculateFreshnessScore(result);

    // 4. Popularity Score
    const popularityScore = this.calculatePopularityScore(result);

    // 5. Cross-Modal Score
    const crossModalScore = this.calculateCrossModalScore(result);

    // 6. Metadata Relevance Score
    const metadataScore = this.calculateMetadataScore(result, query);

    // Calculate weighted final score
    const finalScore = 
      semanticScore * config.semanticWeight +
      modalityPreference * config.modalityWeight +
      freshnessScore * config.freshnessWeight +
      popularityScore * config.popularityWeight +
      crossModalScore * config.crossModalWeight +
      metadataScore * config.metadataWeight;

    return {
      semanticScore,
      modalityPreference,
      freshnessScore,
      popularityScore,
      crossModalScore,
      metadataScore,
      finalScore: Math.min(finalScore, 1.0), // Cap at 1.0
    };
  }

  private calculateModalityPreference(
    contentType: ContentType,
    requestedModalities: ContentType[]
  ): number {
    const index = requestedModalities.indexOf(contentType);
    if (index === -1) return 0;
    
    // Higher score for earlier modalities in the request
    return 1.0 - (index / requestedModalities.length) * 0.5;
  }

  private calculateFreshnessScore(result: SearchResult): number {
    // This would use actual creation/update timestamps
    // For now, return a placeholder based on content metadata
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;
    
    // Simulate freshness based on content source
    const freshnessMap: Record<string, number> = {
      'recent': 1.0,
      'today': 0.9,
      'week': 0.7,
      'month': 0.5,
      'old': 0.2,
    };

    // Extract freshness hint from source or tags
    const source = result.content.metadata.source?.toLowerCase() || '';
    const tags = result.content.metadata.tags.map(tag => tag.toLowerCase());
    
    for (const [key, score] of Object.entries(freshnessMap)) {
      if (source.includes(key) || tags.some(tag => tag.includes(key))) {
        return score;
      }
    }

    return 0.5; // Default freshness score
  }

  private calculatePopularityScore(result: SearchResult): number {
    // This would use actual view counts, likes, or other popularity metrics
    // For now, simulate based on content characteristics
    
    let popularityScore = 0.5; // Base score

    // Boost for certain content types that tend to be more popular
    const popularityBoosts: Record<ContentType, number> = {
      [ContentType.TEXT]: 0.1,
      [ContentType.CODE]: 0.2,
      [ContentType.IMAGE]: 0.15,
      [ContentType.AUDIO]: 0.05,
      [ContentType.VIDEO]: 0.25,
    };

    popularityScore += popularityBoosts[result.type] || 0;

    // Boost for content with more tags (indicates more categorization)
    const tagBoost = Math.min(result.content.metadata.tags.length * 0.05, 0.2);
    popularityScore += tagBoost;

    // Boost for content with titles (indicates more structured content)
    if (result.content.metadata.title && result.content.metadata.title.length > 0) {
      popularityScore += 0.1;
    }

    return Math.min(popularityScore, 1.0);
  }

  private calculateCrossModalScore(result: SearchResult): number {
    if (result.crossModalMatches.length === 0) {
      return 0;
    }

    // Score based on number and quality of cross-modal matches
    const matchCount = result.crossModalMatches.length;
    const averageMatchScore = result.crossModalMatches.reduce(
      (sum, match) => sum + match.score, 0
    ) / matchCount;

    // Combine count and quality
    const countScore = Math.min(matchCount / 5, 1.0); // Normalize to max 5 matches
    const qualityScore = averageMatchScore;

    return (countScore * 0.4 + qualityScore * 0.6);
  }

  private calculateMetadataScore(result: SearchResult, query: SearchQuery): number {
    let metadataScore = 0;
    const queryTerms = query.query.toLowerCase().split(/\s+/);

    // Title relevance
    if (result.content.metadata.title) {
      const titleWords = result.content.metadata.title.toLowerCase().split(/\s+/);
      const titleMatches = titleWords.filter(word =>
        queryTerms.some(term => word.includes(term) || term.includes(word))
      );
      metadataScore += (titleMatches.length / Math.max(titleWords.length, 1)) * 0.5;
    }

    // Description relevance
    if (result.content.metadata.description) {
      const descWords = result.content.metadata.description.toLowerCase().split(/\s+/);
      const descMatches = descWords.filter(word =>
        queryTerms.some(term => word.includes(term) || term.includes(word))
      );
      metadataScore += (descMatches.length / Math.max(descWords.length, 1)) * 0.3;
    }

    // Tag relevance
    if (result.content.metadata.tags.length > 0) {
      const tagMatches = result.content.metadata.tags.filter(tag =>
        queryTerms.some(term => tag.toLowerCase().includes(term))
      );
      metadataScore += (tagMatches.length / result.content.metadata.tags.length) * 0.2;
    }

    return Math.min(metadataScore, 1.0);
  }

  // Method to explain ranking for debugging/transparency
  explainRanking(
    result: SearchResult,
    query: SearchQuery,
    config: Partial<RankingConfig> = {}
  ): string {
    const rankingConfig = { ...this.defaultConfig, ...config };
    const features = this.calculateRankingFeatures(result, query, rankingConfig);

    const explanation = [
      `Ranking explanation for result: ${result.id}`,
      `Final Score: ${features.finalScore.toFixed(3)}`,
      '',
      'Component Scores:',
      `  Semantic (${rankingConfig.semanticWeight}): ${features.semanticScore.toFixed(3)} → ${(features.semanticScore * rankingConfig.semanticWeight).toFixed(3)}`,
      `  Modality (${rankingConfig.modalityWeight}): ${features.modalityPreference.toFixed(3)} → ${(features.modalityPreference * rankingConfig.modalityWeight).toFixed(3)}`,
      `  Freshness (${rankingConfig.freshnessWeight}): ${features.freshnessScore.toFixed(3)} → ${(features.freshnessScore * rankingConfig.freshnessWeight).toFixed(3)}`,
      `  Popularity (${rankingConfig.popularityWeight}): ${features.popularityScore.toFixed(3)} → ${(features.popularityScore * rankingConfig.popularityWeight).toFixed(3)}`,
      `  Cross-Modal (${rankingConfig.crossModalWeight}): ${features.crossModalScore.toFixed(3)} → ${(features.crossModalScore * rankingConfig.crossModalWeight).toFixed(3)}`,
      `  Metadata (${rankingConfig.metadataWeight}): ${features.metadataScore.toFixed(3)} → ${(features.metadataScore * rankingConfig.metadataWeight).toFixed(3)}`,
    ].join('\n');

    return explanation;
  }

  // Method to get optimal ranking config for different use cases
  getOptimalConfig(useCase: 'general' | 'recent' | 'popular' | 'precise'): RankingConfig {
    const configs: Record<string, RankingConfig> = {
      general: this.defaultConfig,
      
      recent: {
        semanticWeight: 0.3,
        modalityWeight: 0.1,
        freshnessWeight: 0.4, // Emphasize freshness
        popularityWeight: 0.05,
        crossModalWeight: 0.1,
        metadataWeight: 0.05,
      },
      
      popular: {
        semanticWeight: 0.25,
        modalityWeight: 0.1,
        freshnessWeight: 0.05,
        popularityWeight: 0.4, // Emphasize popularity
        crossModalWeight: 0.1,
        metadataWeight: 0.1,
      },
      
      precise: {
        semanticWeight: 0.6, // Emphasize semantic similarity
        modalityWeight: 0.1,
        freshnessWeight: 0.05,
        popularityWeight: 0.05,
        crossModalWeight: 0.05,
        metadataWeight: 0.15, // Also emphasize metadata matching
      },
    };

    return configs[useCase] || this.defaultConfig;
  }
}

export class ResultBlender {
  // Blend results from multiple search strategies
  blendResults(
    resultSets: Array<{ results: SearchResult[]; weight: number; strategy: string }>,
    maxResults: number = 20
  ): SearchResult[] {
    const resultMap = new Map<string, {
      result: SearchResult;
      scores: Array<{ score: number; weight: number; strategy: string }>;
    }>();

    // Collect all results and their scores from different strategies
    for (const { results, weight, strategy } of resultSets) {
      for (const result of results) {
        const existing = resultMap.get(result.id);
        
        if (existing) {
          existing.scores.push({
            score: result.relevanceScore,
            weight,
            strategy,
          });
        } else {
          resultMap.set(result.id, {
            result: { ...result },
            scores: [{
              score: result.relevanceScore,
              weight,
              strategy,
            }],
          });
        }
      }
    }

    // Calculate blended scores
    const blendedResults = Array.from(resultMap.values()).map(({ result, scores }) => {
      // Calculate weighted average score
      const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
      const weightedScore = scores.reduce((sum, s) => sum + (s.score * s.weight), 0) / totalWeight;
      
      // Boost for appearing in multiple strategies
      const strategyBonus = scores.length > 1 ? 0.1 : 0;
      
      return {
        ...result,
        relevanceScore: Math.min(weightedScore + strategyBonus, 1.0),
        blendingInfo: {
          strategies: scores.map(s => s.strategy),
          originalScores: scores,
          blendedScore: weightedScore,
          strategyBonus,
        },
      };
    });

    // Sort by blended score and return top results
    blendedResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    logger.debug('Results blended', {
      totalUniqueResults: blendedResults.length,
      strategiesUsed: resultSets.map(rs => rs.strategy),
      topScore: blendedResults[0]?.relevanceScore || 0,
    });

    return blendedResults.slice(0, maxResults);
  }

  // Diversify results to avoid too many similar results
  diversifyResults(
    results: SearchResult[],
    diversityConfig: {
      modalityDiversity: number; // 0-1, how much to enforce modality diversity
      contentDiversity: number;  // 0-1, how much to enforce content diversity
      maxSimilarResults: number; // Maximum similar results to include
    }
  ): SearchResult[] {
    const diversified: SearchResult[] = [];
    const modalityCount = new Map<ContentType, number>();
    const contentSimilarity = new Map<string, number>();

    for (const result of results) {
      let shouldInclude = true;
      
      // Check modality diversity
      const currentModalityCount = modalityCount.get(result.type) || 0;
      const modalityPenalty = currentModalityCount * diversityConfig.modalityDiversity;
      
      // Check content diversity (simplified - would use actual content similarity)
      const contentKey = this.generateContentKey(result);
      const similarContentCount = contentSimilarity.get(contentKey) || 0;
      
      if (similarContentCount >= diversityConfig.maxSimilarResults) {
        shouldInclude = false;
      }
      
      // Apply diversity penalty to score
      const diversityAdjustedScore = result.relevanceScore - modalityPenalty * 0.1;
      
      if (shouldInclude && diversityAdjustedScore > 0.1) {
        diversified.push({
          ...result,
          relevanceScore: diversityAdjustedScore,
        });
        
        modalityCount.set(result.type, currentModalityCount + 1);
        contentSimilarity.set(contentKey, similarContentCount + 1);
      }
    }

    logger.debug('Results diversified', {
      originalCount: results.length,
      diversifiedCount: diversified.length,
      modalityDistribution: Object.fromEntries(modalityCount),
    });

    return diversified;
  }

  private generateContentKey(result: SearchResult): string {
    // Generate a key for content similarity grouping
    // This is simplified - in practice would use content hashing or clustering
    const title = result.content.metadata.title?.toLowerCase() || '';
    const tags = result.content.metadata.tags.join(' ').toLowerCase();
    const source = result.content.metadata.source?.toLowerCase() || '';
    
    return `${result.type}:${title.substring(0, 20)}:${tags.substring(0, 30)}:${source}`;
  }
}