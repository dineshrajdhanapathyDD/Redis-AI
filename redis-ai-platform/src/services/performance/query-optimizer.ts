import { Redis } from 'ioredis';
import { QueryOptimizationConfig } from './types';
import { logger } from '../../utils/logger';

interface QueryPlan {
  originalQuery: any;
  optimizedQuery: any;
  estimatedCost: number;
  executionStrategy: 'parallel' | 'sequential' | 'hybrid';
  indexHints: string[];
  cacheStrategy: 'none' | 'partial' | 'full';
}

export class QueryOptimizer {
  private config: QueryOptimizationConfig;
  private queryCache = new Map<string, { result: any; timestamp: number; ttl: number }>();
  private metrics = {
    totalQueries: 0,
    optimizedQueries: 0,
    cacheHits: 0,
    averageOptimizationGain: 0
  };

  constructor(config: QueryOptimizationConfig) {
    this.config = config;
  }

  async optimizeVectorSearch(redis: Redis, query: any): Promise<QueryPlan> {
    const queryKey = this.generateQueryKey(query);
    
    // Check cache first if enabled
    if (this.config.enableResultCaching) {
      const cached = this.queryCache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.metrics.cacheHits++;
        return {
          originalQuery: query,
          optimizedQuery: query,
          estimatedCost: 0,
          executionStrategy: 'parallel',
          indexHints: [],
          cacheStrategy: 'full'
        };
      }
    }

    // Generate optimization plan
    const plan = await this.generateOptimizationPlan(redis, query);
    
    this.metrics.totalQueries++;
    if (plan.optimizedQuery !== plan.originalQuery) {
      this.metrics.optimizedQueries++;
    }

    return plan;
  }

  async executeOptimizedQuery(redis: Redis, plan: QueryPlan): Promise<any> {
    const startTime = Date.now();
    let result: any;

    try {
      // Check cache strategy
      if (plan.cacheStrategy === 'full') {
        const queryKey = this.generateQueryKey(plan.originalQuery);
        const cached = this.queryCache.get(queryKey);
        if (cached) {
          return cached.result;
        }
      }

      // Execute based on strategy
      result = await this.executeQuery(redis, plan);

      // Cache result if enabled
      if (this.config.enableResultCaching && plan.cacheStrategy !== 'none') {
        const queryKey = this.generateQueryKey(plan.originalQuery);
        this.queryCache.set(queryKey, {
          result,
          timestamp: Date.now(),
          ttl: this.calculateCacheTTL(plan)
        });
      }

      return result;
    } catch (error) {
      logger.error('Optimized query execution failed:', error);
      throw error;
    }
  }

  private async generateOptimizationPlan(redis: Redis, query: any): Promise<QueryPlan> {
    const plan: QueryPlan = {
      originalQuery: query,
      optimizedQuery: { ...query },
      estimatedCost: this.estimateQueryCost(query),
      executionStrategy: 'parallel',
      indexHints: [],
      cacheStrategy: 'partial'
    };

    // Apply query rewriting optimizations
    if (this.config.enableQueryRewriting) {
      plan.optimizedQuery = this.rewriteQuery(query);
    }

    // Add index hints
    if (this.config.enableIndexHints) {
      plan.indexHints = this.generateIndexHints(query);
    }

    return plan;
  }

  private rewriteQuery(query: any): any {
    const rewritten = { ...query };

    // Optimize vector search parameters
    if (query.vector && query.ef) {
      const optimalEf = Math.min(query.ef, Math.max(query.limit * 2, 100));
      if (optimalEf !== query.ef) {
        rewritten.ef = optimalEf;
      }
    }

    return rewritten;
  }

  private generateIndexHints(query: any): string[] {
    const hints: string[] = [];
    
    if (query.vector) {
      hints.push('USE_VECTOR_INDEX');
    }
    
    return hints;
  }

  private async executeQuery(redis: Redis, plan: QueryPlan): Promise<any> {
    const searchParams = this.buildSearchParams(plan.optimizedQuery);
    
    try {
      const result = await redis.call('FT.SEARCH', plan.optimizedQuery.index || 'default', ...searchParams);
      return this.parseSearchResult(result);
    } catch (error) {
      logger.error('Vector search execution failed:', error);
      throw error;
    }
  }

  private buildSearchParams(query: any): string[] {
    const params: string[] = ['*'];

    if (query.limit) {
      params.push('LIMIT', '0', query.limit.toString());
    }

    return params;
  }

  private parseSearchResult(result: any): any {
    if (!Array.isArray(result) || result.length < 1) {
      return { total: 0, results: [] };
    }

    const total = result[0];
    const results = [];

    for (let i = 1; i < result.length; i += 2) {
      const id = result[i];
      const fields = result[i + 1];
      
      const doc: any = { id };
      if (Array.isArray(fields)) {
        for (let j = 0; j < fields.length; j += 2) {
          doc[fields[j]] = fields[j + 1];
        }
      }
      
      results.push(doc);
    }

    return { total, results };
  }

  private estimateQueryCost(query: any): number {
    let cost = 1;

    if (query.vector) {
      cost += query.vector.length / 100;
    }

    if (query.limit) {
      cost += Math.log(query.limit) / 10;
    }

    return cost;
  }

  private calculateCacheTTL(plan: QueryPlan): number {
    let ttl = 300000; // 5 minutes default

    if (plan.estimatedCost > 10) {
      ttl = 1800000; // 30 minutes for expensive queries
    }

    return ttl;
  }

  private generateQueryKey(query: any): string {
    const normalized = {
      vector: query.vector ? 'vector_present' : 'no_vector',
      limit: query.limit || 10
    };

    return JSON.stringify(normalized);
  }

  getMetrics(): any {
    const optimizationRate = this.metrics.optimizedQueries / Math.max(1, this.metrics.totalQueries);
    const cacheHitRate = this.metrics.cacheHits / Math.max(1, this.metrics.totalQueries);

    return {
      ...this.metrics,
      optimizationRate,
      cacheHitRate
    };
  }

  clearCache(): void {
    this.queryCache.clear();
  }
}