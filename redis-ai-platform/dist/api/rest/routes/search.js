"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRoutes = searchRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
const multi_modal_search_1 = require("../../../services/search/multi-modal-search");
function searchRoutes(services) {
    const router = (0, express_1.Router)();
    // Multi-modal search endpoint
    router.post('/multi-modal', async (req, res) => {
        try {
            const { query, contentTypes, limit = 10, threshold = 0.7 } = req.body;
            if (!query) {
                return res.status(400).json({
                    error: 'Query is required',
                    message: 'Please provide a search query'
                });
            }
            const validContentTypes = contentTypes?.filter((type) => Object.values(multi_modal_search_1.ContentType).includes(type)) || Object.values(multi_modal_search_1.ContentType);
            const results = await services.multiModalSearch.search(query, validContentTypes, limit, threshold);
            res.json({
                query,
                contentTypes: validContentTypes,
                results: results.map(result => ({
                    id: result.id,
                    content: result.content,
                    contentType: result.contentType,
                    score: result.score,
                    metadata: result.metadata,
                    crossModalMatches: result.crossModalMatches
                })),
                totalResults: results.length,
                searchTime: Date.now() // This would be calculated properly in a real implementation
            });
        }
        catch (error) {
            logger_1.logger.error('Multi-modal search error:', error);
            res.status(500).json({
                error: 'Search failed',
                message: error.message
            });
        }
    });
    // Text search endpoint
    router.post('/text', async (req, res) => {
        try {
            const { query, limit = 10, threshold = 0.7 } = req.body;
            if (!query) {
                return res.status(400).json({
                    error: 'Query is required',
                    message: 'Please provide a search query'
                });
            }
            const results = await services.multiModalSearch.search(query, [multi_modal_search_1.ContentType.TEXT], limit, threshold);
            res.json({
                query,
                results: results.map(result => ({
                    id: result.id,
                    content: result.content,
                    score: result.score,
                    metadata: result.metadata
                })),
                totalResults: results.length
            });
        }
        catch (error) {
            logger_1.logger.error('Text search error:', error);
            res.status(500).json({
                error: 'Text search failed',
                message: error.message
            });
        }
    });
    // Image search endpoint
    router.post('/image', async (req, res) => {
        try {
            const { query, imageUrl, limit = 10, threshold = 0.7 } = req.body;
            if (!query && !imageUrl) {
                return res.status(400).json({
                    error: 'Query or image URL is required',
                    message: 'Please provide either a text query or image URL for search'
                });
            }
            const searchQuery = imageUrl || query;
            const results = await services.multiModalSearch.search(searchQuery, [multi_modal_search_1.ContentType.IMAGE], limit, threshold);
            res.json({
                query: searchQuery,
                searchType: imageUrl ? 'image' : 'text-to-image',
                results: results.map(result => ({
                    id: result.id,
                    content: result.content,
                    score: result.score,
                    metadata: result.metadata,
                    imageUrl: result.metadata?.url
                })),
                totalResults: results.length
            });
        }
        catch (error) {
            logger_1.logger.error('Image search error:', error);
            res.status(500).json({
                error: 'Image search failed',
                message: error.message
            });
        }
    });
    // Audio search endpoint
    router.post('/audio', async (req, res) => {
        try {
            const { query, audioUrl, limit = 10, threshold = 0.7 } = req.body;
            if (!query && !audioUrl) {
                return res.status(400).json({
                    error: 'Query or audio URL is required',
                    message: 'Please provide either a text query or audio URL for search'
                });
            }
            const searchQuery = audioUrl || query;
            const results = await services.multiModalSearch.search(searchQuery, [multi_modal_search_1.ContentType.AUDIO], limit, threshold);
            res.json({
                query: searchQuery,
                searchType: audioUrl ? 'audio' : 'text-to-audio',
                results: results.map(result => ({
                    id: result.id,
                    content: result.content,
                    score: result.score,
                    metadata: result.metadata,
                    audioUrl: result.metadata?.url,
                    transcript: result.metadata?.transcript
                })),
                totalResults: results.length
            });
        }
        catch (error) {
            logger_1.logger.error('Audio search error:', error);
            res.status(500).json({
                error: 'Audio search failed',
                message: error.message
            });
        }
    });
    // Code search endpoint
    router.post('/code', async (req, res) => {
        try {
            const { query, language, limit = 10, threshold = 0.7 } = req.body;
            if (!query) {
                return res.status(400).json({
                    error: 'Query is required',
                    message: 'Please provide a code search query'
                });
            }
            const results = await services.multiModalSearch.search(query, [multi_modal_search_1.ContentType.CODE], limit, threshold);
            // Filter by language if specified
            const filteredResults = language
                ? results.filter(result => result.metadata?.language === language)
                : results;
            res.json({
                query,
                language: language || 'all',
                results: filteredResults.map(result => ({
                    id: result.id,
                    content: result.content,
                    score: result.score,
                    metadata: result.metadata,
                    language: result.metadata?.language,
                    repository: result.metadata?.repository,
                    filePath: result.metadata?.filePath
                })),
                totalResults: filteredResults.length
            });
        }
        catch (error) {
            logger_1.logger.error('Code search error:', error);
            res.status(500).json({
                error: 'Code search failed',
                message: error.message
            });
        }
    });
    // Cross-modal search endpoint
    router.post('/cross-modal', async (req, res) => {
        try {
            const { query, sourceType, targetTypes, limit = 10, threshold = 0.7 } = req.body;
            if (!query || !sourceType || !targetTypes) {
                return res.status(400).json({
                    error: 'Missing required parameters',
                    message: 'Please provide query, sourceType, and targetTypes'
                });
            }
            if (!Object.values(multi_modal_search_1.ContentType).includes(sourceType)) {
                return res.status(400).json({
                    error: 'Invalid source type',
                    message: `Source type must be one of: ${Object.values(multi_modal_search_1.ContentType).join(', ')}`
                });
            }
            const validTargetTypes = targetTypes.filter((type) => Object.values(multi_modal_search_1.ContentType).includes(type));
            if (validTargetTypes.length === 0) {
                return res.status(400).json({
                    error: 'Invalid target types',
                    message: `Target types must include at least one of: ${Object.values(multi_modal_search_1.ContentType).join(', ')}`
                });
            }
            // First search in source type
            const sourceResults = await services.multiModalSearch.search(query, [sourceType], Math.min(limit * 2, 20), // Get more source results for cross-modal matching
            threshold);
            // Then find cross-modal matches
            const crossModalResults = [];
            for (const sourceResult of sourceResults.slice(0, 5)) { // Limit to top 5 for performance
                const matches = await services.multiModalSearch.search(sourceResult.content, validTargetTypes, limit, threshold * 0.8 // Slightly lower threshold for cross-modal
                );
                crossModalResults.push(...matches.map(match => ({
                    ...match,
                    sourceResult: {
                        id: sourceResult.id,
                        content: sourceResult.content,
                        contentType: sourceResult.contentType,
                        score: sourceResult.score
                    }
                })));
            }
            // Sort by combined score and remove duplicates
            const uniqueResults = crossModalResults
                .filter((result, index, self) => index === self.findIndex(r => r.id === result.id))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            res.json({
                query,
                sourceType,
                targetTypes: validTargetTypes,
                results: uniqueResults,
                totalResults: uniqueResults.length,
                crossModalMatches: uniqueResults.length
            });
        }
        catch (error) {
            logger_1.logger.error('Cross-modal search error:', error);
            res.status(500).json({
                error: 'Cross-modal search failed',
                message: error.message
            });
        }
    });
    // Search suggestions endpoint
    router.get('/suggestions', async (req, res) => {
        try {
            const { query, limit = 5 } = req.query;
            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    error: 'Query is required',
                    message: 'Please provide a query parameter'
                });
            }
            // This would typically use a suggestion service or cached popular queries
            // For now, we'll generate simple suggestions based on the query
            const suggestions = [
                `${query} examples`,
                `${query} tutorial`,
                `${query} best practices`,
                `${query} implementation`,
                `${query} documentation`
            ].slice(0, parseInt(limit));
            res.json({
                query,
                suggestions,
                totalSuggestions: suggestions.length
            });
        }
        catch (error) {
            logger_1.logger.error('Search suggestions error:', error);
            res.status(500).json({
                error: 'Failed to get search suggestions',
                message: error.message
            });
        }
    });
    // Search analytics endpoint
    router.get('/analytics', async (req, res) => {
        try {
            const { timeframe = '24h' } = req.query;
            // This would typically query analytics data from Redis
            // For now, we'll return mock analytics data
            const analytics = {
                timeframe,
                totalSearches: 1250,
                uniqueUsers: 89,
                averageResponseTime: 145, // ms
                topQueries: [
                    { query: 'machine learning', count: 45 },
                    { query: 'neural networks', count: 38 },
                    { query: 'data processing', count: 32 },
                    { query: 'vector search', count: 28 },
                    { query: 'embeddings', count: 25 }
                ],
                contentTypeDistribution: {
                    [multi_modal_search_1.ContentType.TEXT]: 45,
                    [multi_modal_search_1.ContentType.CODE]: 30,
                    [multi_modal_search_1.ContentType.IMAGE]: 15,
                    [multi_modal_search_1.ContentType.AUDIO]: 10
                },
                successRate: 0.94,
                averageResultsPerQuery: 8.3
            };
            res.json(analytics);
        }
        catch (error) {
            logger_1.logger.error('Search analytics error:', error);
            res.status(500).json({
                error: 'Failed to get search analytics',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=search.js.map