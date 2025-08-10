import { getSemanticCache, SemanticCache, CacheEntry, CacheHit } from './semantic-cache';
import { AIRequest, AIRequestType } from '@/types';
import logger from '@/utils/logger';

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

export class CacheManager {
  private semanticCache = getSemanticCache();
  private config: CacheManagerConfig;
  private queryNormalizer = new QueryNormalizer();

  constructor(config?: Partial<CacheManagerConfig>) {
    this.config = {
      enableSemanticCaching: true,
      enableResponseCaching: true,
      enableQueryNormalization: true,
      cacheByModel: true,
      cacheByContext: false,
      minResponseQuality: 0.7,
      maxCacheAge: 24 * 60 * 60 * 1000, // 24 hours
      warmupEnabled: true,
      ...config,
    };

    logger.info('Cache manager initialized', { config: this.config });
  }

  async get(request: AIRequest, model?: string): Promise<CacheResult> {
    try {
      if (!this.config.enableSemanticCaching) {
        return { hit: false, source: 'none' };
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(request, model);
      
      // Try semantic cache first
      const semanticHit = await this.semanticCache.get(
        cacheKey.normalized,
        cacheKey.context
      );

      if (semanticHit) {
        // Validate cache hit quality and age
        if (this.isValidCacheHit(semanticHit)) {
          logger.debug('Cache hit', {
            requestId: request.id,
            similarity: semanticHit.similarity.toFixed(3),
            timeSaved: semanticHit.timeSaved,
            costSaved: semanticHit.costSaved,
          });

          return {
            hit: true,
            response: semanticHit.entry.response,
            similarity: semanticHit.similarity,
            timeSaved: semanticHit.timeSaved,
            costSaved: semanticHit.costSaved,
            source: semanticHit.isExact ? 'exact' : 'semantic',
          };
        }
      }

      return { hit: false, source: 'none' };

    } catch (error) {
      logger.error('Failed to get from cache', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { hit: false, source: 'none' };
    }
  }

  async set(
    request: AIRequest,
    response: any,
    metadata: {
      model: string;
      responseTime: number;
      tokenUsage: any;
      cost: number;
      quality?: number;
    }
  ): Promise<void> {
    try {
      if (!this.config.enableResponseCaching) {
        return;
      }

      // Check quality threshold
      const quality = metadata.quality || this.estimateResponseQuality(response);
      if (quality < this.config.minResponseQuality) {
        logger.debug('Response quality too low for caching', {
          requestId: request.id,
          quality: quality.toFixed(3),
          threshold: this.config.minResponseQuality,
        });
        return;
      }

      // Generate cache key
      const cacheKey = this.generateCacheKey(request, metadata.model);

      // Prepare cache metadata
      const cacheMetadata = {
        model: metadata.model,
        responseTime: metadata.responseTime,
        tokenUsage: metadata.tokenUsage,
        cost: metadata.cost,
        quality,
        tags: this.extractTags(request),
        context: cacheKey.context || [],
      };

      // Store in semantic cache
      await this.semanticCache.set(
        cacheKey.normalized,
        response,
        cacheMetadata,
        cacheKey.context
      );

      logger.debug('Response cached', {
        requestId: request.id,
        model: metadata.model,
        quality: quality.toFixed(3),
        cost: metadata.cost,
      });

    } catch (error) {
      logger.error('Failed to set cache', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async warmup(queries: Array<{
    query: string;
    type: AIRequestType;
    expectedResponse?: any;
    model?: string;
  }>): Promise<void> {
    if (!this.config.warmupEnabled) {
      return;
    }

    logger.info('Starting cache warmup', { queryCount: queries.length });

    try {
      const warmupQueries = queries.map(q => {
        const request: AIRequest = {
          id: `warmup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: q.query,
          type: q.type,
          metadata: {
            priority: 'low',
            maxLatency: 10000,
            maxCost: 1.0,
            requiredCapabilities: [],
            timestamp: new Date(),
          },
        };

        const cacheKey = this.generateCacheKey(request, q.model);
        return cacheKey.normalized;
      });

      await this.semanticCache.warmup(warmupQueries);

      logger.info('Cache warmup completed', {
        queriesProcessed: queries.length,
      });

    } catch (error) {
      logger.error('Cache warmup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async invalidate(pattern?: string, model?: string): Promise<number> {
    try {
      let invalidationPattern = pattern;

      if (model && this.config.cacheByModel) {
        invalidationPattern = pattern ? `${model}:${pattern}` : model;
      }

      const deletedCount = await this.semanticCache.invalidate(invalidationPattern);

      logger.info('Cache invalidated', {
        pattern: invalidationPattern,
        deletedCount,
      });

      return deletedCount;

    } catch (error) {
      logger.error('Failed to invalidate cache', {
        pattern,
        model,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  async getStats(): Promise<{
    semantic: any;
    performance: {
      hitRate: number;
      averageTimeSaved: number;
      totalCostSaved: number;
      cacheEfficiency: number;
    };
  }> {
    try {
      const semanticStats = await this.semanticCache.getStats();
      
      const performance = {
        hitRate: semanticStats.hitRate,
        averageTimeSaved: semanticStats.totalTimeSaved / Math.max(semanticStats.totalEntries, 1),
        totalCostSaved: semanticStats.totalCostSaved,
        cacheEfficiency: this.calculateCacheEfficiency(semanticStats),
      };

      return {
        semantic: semanticStats,
        performance,
      };

    } catch (error) {
      logger.error('Failed to get cache stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        semantic: {},
        performance: {
          hitRate: 0,
          averageTimeSaved: 0,
          totalCostSaved: 0,
          cacheEfficiency: 0,
        },
      };
    }
  }

  async optimize(): Promise<{
    entriesEvicted: number;
    storageReclaimed: number;
    optimizationTime: number;
  }> {
    try {
      return await this.semanticCache.optimize();
    } catch (error) {
      logger.error('Failed to optimize cache', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        entriesEvicted: 0,
        storageReclaimed: 0,
        optimizationTime: 0,
      };
    }
  }

  updateConfig(newConfig: Partial<CacheManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Cache manager configuration updated', { config: this.config });
  }

  private generateCacheKey(request: AIRequest, model?: string): CacheKey {
    let query = request.content;
    
    // Normalize query if enabled
    if (this.config.enableQueryNormalization) {
      query = this.queryNormalizer.normalize(query, request.type);
    }

    // Extract context
    let context: string[] = [];
    if (this.config.cacheByContext && request.context) {
      context = this.extractContextKeys(request.context);
    }

    // Create normalized key
    let normalized = query;
    
    if (model && this.config.cacheByModel) {
      normalized = `${model}:${normalized}`;
    }
    
    if (context.length > 0) {
      normalized = `${normalized}:${context.join(':')}`;
    }

    return {
      query: request.content,
      model,
      context,
      requestType: request.type,
      normalized,
    };
  }

  private extractContextKeys(context: any): string[] {
    const keys: string[] = [];
    
    if (context.userId) {
      keys.push(`user:${context.userId}`);
    }
    
    if (context.sessionId) {
      keys.push(`session:${context.sessionId}`);
    }
    
    if (context.workspaceId) {
      keys.push(`workspace:${context.workspaceId}`);
    }

    return keys;
  }

  private extractTags(request: AIRequest): string[] {
    const tags: string[] = [request.type];
    
    if (request.metadata.requiredCapabilities) {
      tags.push(...request.metadata.requiredCapabilities);
    }
    
    if (request.metadata.priority) {
      tags.push(`priority:${request.metadata.priority}`);
    }

    return tags;
  }

  private isValidCacheHit(hit: CacheHit): boolean {
    // Check age
    const age = Date.now() - hit.entry.createdAt.getTime();
    if (age > this.config.maxCacheAge) {
      return false;
    }

    // Check quality
    if (hit.entry.metadata.quality < this.config.minResponseQuality) {
      return false;
    }

    return true;
  }

  private estimateResponseQuality(response: any): number {
    // Simple quality estimation based on response characteristics
    let quality = 0.5; // Base quality

    if (typeof response === 'object' && response.content) {
      const content = response.content;
      
      // Length factor
      if (content.length > 100) quality += 0.1;
      if (content.length > 500) quality += 0.1;
      
      // Completeness factor
      if (!content.includes('...') && !content.includes('[truncated]')) {
        quality += 0.1;
      }
      
      // Structure factor
      if (content.includes('\n') || content.includes('.')) {
        quality += 0.1;
      }
      
      // Error indicators
      if (content.toLowerCase().includes('error') || 
          content.toLowerCase().includes('sorry')) {
        quality -= 0.2;
      }
    }

    return Math.max(0, Math.min(1, quality));
  }

  private calculateCacheEfficiency(stats: any): number {
    if (stats.totalEntries === 0) return 0;
    
    const hitRate = stats.hitRate;
    const avgSimilarity = stats.averageSimilarity;
    const storageEfficiency = Math.min(stats.totalEntries / 10000, 1); // Normalize to 10k entries
    
    return (hitRate * 0.5 + avgSimilarity * 0.3 + storageEfficiency * 0.2);
  }

  async cleanup(): Promise<void> {
    await this.semanticCache.cleanup();
    logger.info('Cache manager cleanup completed');
  }
}

class QueryNormalizer {
  normalize(query: string, requestType: AIRequestType): string {
    let normalized = query.trim().toLowerCase();

    // Remove extra whitespace
    normalized = normalized.replace(/\s+/g, ' ');

    // Remove common stop words for certain request types
    if (requestType === AIRequestType.QUESTION_ANSWERING) {
      normalized = this.removeStopWords(normalized);
    }

    // Normalize punctuation
    normalized = normalized.replace(/[.,!?;:]+/g, '');

    // Handle code normalization
    if (requestType === AIRequestType.CODE_GENERATION) {
      normalized = this.normalizeCodeQuery(normalized);
    }

    return normalized;
  }

  private removeStopWords(text: string): string {
    const stopWords = [
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'can', 'what', 'how', 'when', 'where',
      'why', 'who', 'which', 'that', 'this', 'these', 'those',
    ];

    const words = text.split(' ');
    const filtered = words.filter(word => !stopWords.includes(word));
    return filtered.join(' ');
  }

  private normalizeCodeQuery(text: string): string {
    // Normalize common code-related terms
    const codeNormalizations: Record<string, string> = {
      'javascript': 'js',
      'typescript': 'ts',
      'python': 'py',
      'function': 'func',
      'method': 'func',
      'variable': 'var',
      'constant': 'const',
    };

    let normalized = text;
    for (const [original, replacement] of Object.entries(codeNormalizations)) {
      normalized = normalized.replace(new RegExp(`\\b${original}\\b`, 'gi'), replacement);
    }

    return normalized;
  }
}

// Singleton instance
let cacheManager: CacheManager | null = null;

export function getCacheManager(): CacheManager {
  if (!cacheManager) {
    cacheManager = new CacheManager();
  }
  return cacheManager;
}

export function createCacheManager(config?: Partial<CacheManagerConfig>): CacheManager {
  cacheManager = new CacheManager(config);
  return cacheManager;
}