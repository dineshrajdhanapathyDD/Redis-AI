"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchEngineOrchestrator = exports.createCrossModalMatcher = exports.CrossModalRelationshipType = exports.CrossModalMatcher = exports.ResultBlender = exports.SearchResultRanker = exports.MultiModalSearchEngine = void 0;
exports.createSearchEngine = createSearchEngine;
exports.createSearchQuery = createSearchQuery;
exports.isValidSearchQuery = isValidSearchQuery;
// Export all search components
var multi_modal_search_1 = require("./multi-modal-search");
Object.defineProperty(exports, "MultiModalSearchEngine", { enumerable: true, get: function () { return multi_modal_search_1.MultiModalSearchEngine; } });
var result_ranker_1 = require("./result-ranker");
Object.defineProperty(exports, "SearchResultRanker", { enumerable: true, get: function () { return result_ranker_1.SearchResultRanker; } });
Object.defineProperty(exports, "ResultBlender", { enumerable: true, get: function () { return result_ranker_1.ResultBlender; } });
var cross_modal_matcher_1 = require("./cross-modal-matcher");
Object.defineProperty(exports, "CrossModalMatcher", { enumerable: true, get: function () { return cross_modal_matcher_1.CrossModalMatcher; } });
Object.defineProperty(exports, "CrossModalRelationshipType", { enumerable: true, get: function () { return cross_modal_matcher_1.CrossModalRelationshipType; } });
Object.defineProperty(exports, "createCrossModalMatcher", { enumerable: true, get: function () { return cross_modal_matcher_1.createCrossModalMatcher; } });
const multi_modal_search_2 = require("./multi-modal-search");
const result_ranker_2 = require("./result-ranker");
const cross_modal_matcher_2 = require("./cross-modal-matcher");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class SearchEngineOrchestrator {
    multiModalEngine;
    resultRanker;
    crossModalMatcher;
    config;
    constructor(config) {
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
        this.multiModalEngine = new multi_modal_search_2.MultiModalSearchEngine();
        this.resultRanker = new result_ranker_2.SearchResultRanker();
        this.crossModalMatcher = (0, cross_modal_matcher_2.createCrossModalMatcher)(this.config.crossModalConfig);
        logger_1.default.info('Search engine orchestrator initialized', {
            config: this.config,
        });
    }
    async search(query) {
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
            const rankedResults = this.resultRanker.rankResults(searchResult.results, normalizedQuery, rankingConfig);
            // Generate search suggestions
            const suggestions = await this.generateSearchSuggestions(normalizedQuery, rankedResults);
            const totalTime = Date.now() - startTime;
            logger_1.default.info('Search completed', {
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
        }
        catch (error) {
            logger_1.default.error('Search failed', {
                query: query.query,
                modalities: query.modalities,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async searchWithMultipleStrategies(query, strategies) {
        const resultSets = [];
        const strategyBreakdown = [];
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
            }
            catch (error) {
                logger_1.default.warn('Strategy failed', {
                    strategy: strategy.name,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
        // Blend results from all strategies
        const blender = new (await Promise.resolve().then(() => __importStar(require('./result-ranker')))).ResultBlender();
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
    normalizeQuery(query) {
        return {
            ...query,
            query: query.query.trim(),
            modalities: query.modalities.length > 0 ? query.modalities : [types_1.ContentType.TEXT],
            limit: query.limit || this.config.maxResults,
            threshold: query.threshold || this.config.defaultThreshold,
            filters: query.filters || {},
        };
    }
    async generateSearchSuggestions(query, results) {
        const suggestions = [];
        try {
            // Extract common terms from top results
            const topResults = results.slice(0, 5);
            const termFrequency = new Map();
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
                const otherModalities = Object.values(types_1.ContentType).filter(type => type !== currentModality);
                if (otherModalities.length > 0) {
                    suggestions.push(`Find ${otherModalities[0]} related to: ${query.query}`);
                }
            }
        }
        catch (error) {
            logger_1.default.debug('Failed to generate suggestions', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        return suggestions.slice(0, 5);
    }
    // Management and analytics methods
    async getSearchStats() {
        const [searchStats, crossModalStats] = await Promise.all([
            this.multiModalEngine.getSearchStats(),
            this.crossModalMatcher.getRelationshipStats(),
        ]);
        return {
            totalSearches: 0, // Would be tracked in a real implementation
            averageQueryTime: searchStats.averageQueryTime,
            popularQueries: searchStats.popularQueries,
            modalityUsage: {}, // Would be tracked
            cacheHitRate: searchStats.cacheHitRate,
            crossModalStats,
        };
    }
    async warmupSearchCache(commonQueries) {
        logger_1.default.info('Warming up search caches', { queryCount: commonQueries.length });
        await Promise.all([
            this.multiModalEngine.warmupCache(commonQueries),
            this.crossModalMatcher.buildCrossModalIndex(),
        ]);
        logger_1.default.info('Search cache warmup completed');
    }
    clearAllCaches() {
        this.multiModalEngine.clearCache();
        this.crossModalMatcher.clearCache();
        logger_1.default.info('All search caches cleared');
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (newConfig.crossModalConfig) {
            this.crossModalMatcher.updateConfig(newConfig.crossModalConfig);
        }
        logger_1.default.info('Search engine configuration updated', { config: this.config });
    }
    // Method to explain search results for debugging
    async explainSearch(query, resultId) {
        try {
            const searchResult = await this.search(query);
            const targetResult = searchResult.results.find(r => r.id === resultId);
            if (!targetResult) {
                return `Result ${resultId} not found in search results`;
            }
            const explanation = this.resultRanker.explainRanking(targetResult, query, this.resultRanker.getOptimalConfig(this.config.rankingStrategy));
            return explanation;
        }
        catch (error) {
            return `Failed to explain search: ${error instanceof Error ? error.message : 'Unknown error'}`;
        }
    }
}
exports.SearchEngineOrchestrator = SearchEngineOrchestrator;
// Factory function to create search engine with default configuration
function createSearchEngine(config) {
    return new SearchEngineOrchestrator(config);
}
// Utility functions for search
function createSearchQuery(query, modalities = [types_1.ContentType.TEXT], options = {}) {
    return {
        query,
        modalities,
        limit: options.limit || 10,
        threshold: options.threshold || 0.3,
        filters: options.filters,
    };
}
function isValidSearchQuery(query) {
    return (typeof query.query === 'string' &&
        query.query.trim().length > 0 &&
        Array.isArray(query.modalities) &&
        query.modalities.length > 0 &&
        query.modalities.every(m => Object.values(types_1.ContentType).includes(m)));
}
//# sourceMappingURL=index.js.map