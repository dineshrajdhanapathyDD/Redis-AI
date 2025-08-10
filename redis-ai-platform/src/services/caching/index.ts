// Export all caching components
export { SemanticCache, getSemanticCache, createSemanticCache } from './semantic-cache';
export { CacheManager, getCacheManager, createCacheManager } from './cache-manager';
import {
 getCacheManager } from './cache-manager';
import { getSemanticCache } from './semantic-cache';
import { AIRequest, AIRequestType } from '@/types';
import logger from '@/utils/logger';

export interface CachingServiceConfig {
  enableSemanticCaching: boolean;
  enableResponseCaching: boolean;
  enableQueryNormalization: boolean;
  enableWarmup: boolean;
  similarityThreshold: number;
  maxCacheSize: number;
  defaultTTL: number;
  minResponseQuality: number;
}

export class CachingService {
  private cacheManager = getCacheManager();
  private semanticCache = getSemanticCache();
  private config: CachingServiceConfig;

  constructor(config?: Partial<CachingServiceConfig>) {
    this.config = {
      enableSemanticCaching: true,
      enableResponseCaching: true,
      enableQueryNormalization: true,
      enableWarmup: true,
      similarityThreshold: 0.85,
      maxCacheSize: 10000,
      defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
      minResponseQuality: 0.7,
      ...config,
    };

    // Update cache manager configuration
    this.cacheManager.updateConfig({
      enableSemanticCaching: this.config.enableSemanticCaching,
      enableResponseCaching: this.config.enableResponseCaching,
      enableQueryNormalization: this.config.enableQueryNormalization,
      minResponseQuality: this.config.minResponseQuality,
      warmupEnabled: this.config.enableWarmup,
    });

    logger.info('Caching service initialized', { config: this.config });
  }

  async getCachedResponse(request: AIRequest, model?: string): Promise<{
    hit: boolean;
    response?: any;
    similarity?: number;
    timeSaved?: number;
    costSaved?: number;
    source?: 'semantic' | 'exact' | 'none';
  }> {
    try {
      if (!this.config.enableSemanticCaching) {
        return { hit: false, source: 'none' };
      }

      const result = await this.cacheManager.get(request, model);
      
      if (result.hit) {
        logger.debug('Cache hit for request', {
          requestId: request.id,
          source: result.source,
          similarity: result.similarity?.toFixed(3),
          timeSaved: result.timeSaved,
          costSaved: result.costSaved,
        });
      }

      return result;

    } catch (error) {
      logger.error('Failed to get cached response', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return { hit: false, source: 'none' };
    }
  }

  async cacheResponse(
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

      await this.cacheManager.set(request, response, metadata);

      logger.debug('Response cached successfully', {
        requestId: request.id,
        model: metadata.model,
        cost: metadata.cost,
        quality: metadata.quality,
      });

    } catch (error) {
      logger.error('Failed to cache response', {
        requestId: request.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async warmupCache(queries: Array<{
    query: string;
    type: AIRequestType;
    expectedResponse?: any;
    model?: string;
  }>): Promise<void> {
    try {
      if (!this.config.enableWarmup) {
        logger.info('Cache warmup disabled');
        return;
      }

      await this.cacheManager.warmup(queries);
      
      logger.info('Cache warmup completed successfully', {
        queryCount: queries.length,
      });

    } catch (error) {
      logger.error('Cache warmup failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async invalidateCache(pattern?: string, model?: string): Promise<number> {
    try {
      const deletedCount = await this.cacheManager.invalidate(pattern, model);
      
      logger.info('Cache invalidated', {
        pattern,
        model,
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

  async getCacheStats(): Promise<{
    semantic: any;
    performance: {
      hitRate: number;
      averageTimeSaved: number;
      totalCostSaved: number;
      cacheEfficiency: number;
    };
    config: CachingServiceConfig;
  }> {
    try {
      const stats = await this.cacheManager.getStats();
      
      return {
        ...stats,
        config: this.config,
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
        config: this.config,
      };
    }
  }

  async optimizeCache(): Promise<{
    entriesEvicted: number;
    storageReclaimed: number;
    optimizationTime: number;
  }> {
    try {
      const result = await this.cacheManager.optimize();
      
      logger.info('Cache optimization completed', {
        entriesEvicted: result.entriesEvicted,
        storageReclaimed: result.storageReclaimed,
        optimizationTime: result.optimizationTime,
      });

      return result;

    } catch (error) {
      logger.error('Cache optimization failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      return {
        entriesEvicted: 0,
        storageReclaimed: 0,
        optimizationTime: 0,
      };
    }
  }

  updateConfiguration(newConfig: Partial<CachingServiceConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update cache manager configuration
    this.cacheManager.updateConfig({
      enableSemanticCaching: this.config.enableSemanticCaching,
      enableResponseCaching: this.config.enableResponseCaching,
      enableQueryNormalization: this.config.enableQueryNormalization,
      minResponseQuality: this.config.minResponseQuality,
      warmupEnabled: this.config.enableWarmup,
    });

    logger.info('Caching service configuration updated', { config: this.config });
  }

  async cleanup(): Promise<void> {
    await this.cacheManager.cleanup();
    logger.info('Caching service cleanup completed');
  }
}

// Factory function to create caching service
export function createCachingService(config?: Partial<CachingServiceConfig>): CachingService {
  return new CachingService(config);
}

// Utility functions for caching
export function createCacheableRequest(
  content: string,
  type: AIRequestType,
  options: {
    id?: string;
    context?: any;
    metadata?: any;
  } = {}
): AIRequest {
  return {
    id: options.id || `cache_req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    content,
    type,
    context: options.context,
    metadata: {
      priority: 'medium',
      maxLatency: 10000,
      maxCost: 1.0,
      requiredCapabilities: [],
      timestamp: new Date(),
      ...options.metadata,
    },
  };
}

export function calculateCacheKey(request: AIRequest, model?: string): string {
  const parts = [
    request.content.toLowerCase().trim(),
    request.type,
  ];

  if (model) {
    parts.push(model);
  }

  if (request.context?.userId) {
    parts.push(`user:${request.context.userId}`);
  }

  return parts.join('|');
}

export function estimateResponseQuality(response: any): number {
  if (!response) return 0;

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

// Singleton instance
let cachingService: CachingService | null = null;

export function getCachingService(): CachingService {
  if (!cachingService) {
    cachingService = new CachingService();
  }
  return cachingService;
}

export function createCachingServiceSingleton(config?: Partial<CachingServiceConfig>): CachingService {
  cachingService = new CachingService(config);
  return cachingService;
}