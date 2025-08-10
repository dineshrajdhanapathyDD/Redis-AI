"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryOptimizer = void 0;
const logger_1 = require("../../utils/logger");
class QueryOptimizer {
    config;
    queryCache = new Map();
    metrics = {
        totalQueries: 0,
        optimizedQueries: 0,
        cacheHits: 0,
        averageOptimizationGain: 0
    };
    constructor(config) {
        this.config = config;
    }
    async optimizeVectorSearch(redis, query) {
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
    async executeOptimizedQuery(redis, plan) {
        const startTime = Date.now();
        let result;
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
        }
        catch (error) {
            logger_1.logger.error('Optimized query execution failed:', error);
            throw error;
        }
    }
    async generateOptimizationPlan(redis, query) {
        const plan = {
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
    rewriteQuery(query) {
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
    generateIndexHints(query) {
        const hints = [];
        if (query.vector) {
            hints.push('USE_VECTOR_INDEX');
        }
        return hints;
    }
    async executeQuery(redis, plan) {
        const searchParams = this.buildSearchParams(plan.optimizedQuery);
        try {
            const result = await redis.call('FT.SEARCH', plan.optimizedQuery.index || 'default', ...searchParams);
            return this.parseSearchResult(result);
        }
        catch (error) {
            logger_1.logger.error('Vector search execution failed:', error);
            throw error;
        }
    }
    buildSearchParams(query) {
        const params = ['*'];
        if (query.limit) {
            params.push('LIMIT', '0', query.limit.toString());
        }
        return params;
    }
    parseSearchResult(result) {
        if (!Array.isArray(result) || result.length < 1) {
            return { total: 0, results: [] };
        }
        const total = result[0];
        const results = [];
        for (let i = 1; i < result.length; i += 2) {
            const id = result[i];
            const fields = result[i + 1];
            const doc = { id };
            if (Array.isArray(fields)) {
                for (let j = 0; j < fields.length; j += 2) {
                    doc[fields[j]] = fields[j + 1];
                }
            }
            results.push(doc);
        }
        return { total, results };
    }
    estimateQueryCost(query) {
        let cost = 1;
        if (query.vector) {
            cost += query.vector.length / 100;
        }
        if (query.limit) {
            cost += Math.log(query.limit) / 10;
        }
        return cost;
    }
    calculateCacheTTL(plan) {
        let ttl = 300000; // 5 minutes default
        if (plan.estimatedCost > 10) {
            ttl = 1800000; // 30 minutes for expensive queries
        }
        return ttl;
    }
    generateQueryKey(query) {
        const normalized = {
            vector: query.vector ? 'vector_present' : 'no_vector',
            limit: query.limit || 10
        };
        return JSON.stringify(normalized);
    }
    getMetrics() {
        const optimizationRate = this.metrics.optimizedQueries / Math.max(1, this.metrics.totalQueries);
        const cacheHitRate = this.metrics.cacheHits / Math.max(1, this.metrics.totalQueries);
        return {
            ...this.metrics,
            optimizationRate,
            cacheHitRate
        };
    }
    clearCache() {
        this.queryCache.clear();
    }
}
exports.QueryOptimizer = QueryOptimizer;
//# sourceMappingURL=query-optimizer.js.map