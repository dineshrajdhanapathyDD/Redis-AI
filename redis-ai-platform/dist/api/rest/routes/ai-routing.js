"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiRoutingRoutes = aiRoutingRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function aiRoutingRoutes(services) {
    const router = (0, express_1.Router)();
    // Route AI request
    router.post('/route', async (req, res) => {
        try {
            const { prompt, context, requirements = {}, userId, sessionId } = req.body;
            if (!prompt) {
                return res.status(400).json({
                    error: 'Prompt is required',
                    message: 'Please provide a prompt for AI processing'
                });
            }
            const aiRequest = {
                id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                prompt,
                context: context || {},
                requirements: {
                    maxLatency: 5000,
                    minAccuracy: 0.8,
                    preferredModels: [],
                    costConstraint: 'balanced',
                    ...requirements
                },
                userId: userId || 'anonymous',
                sessionId: sessionId || `session_${Date.now()}`,
                timestamp: Date.now()
            };
            const routingResult = await services.aiRoutingService.routingEngine.routeRequest(aiRequest);
            res.json({
                requestId: aiRequest.id,
                selectedModel: {
                    id: routingResult.selectedModel.id,
                    name: routingResult.selectedModel.name,
                    provider: routingResult.selectedModel.provider,
                    capabilities: routingResult.selectedModel.capabilities
                },
                routingReason: routingResult.reason,
                confidence: routingResult.confidence,
                estimatedLatency: routingResult.estimatedLatency,
                estimatedCost: routingResult.estimatedCost,
                alternatives: routingResult.alternatives?.map(alt => ({
                    modelId: alt.modelId,
                    score: alt.score,
                    reason: alt.reason
                })) || [],
                routingTime: routingResult.routingTime
            });
        }
        catch (error) {
            logger_1.logger.error('AI routing error:', error);
            res.status(500).json({
                error: 'Failed to route AI request',
                message: error.message
            });
        }
    });
    // Get available models
    router.get('/models', async (req, res) => {
        try {
            const { capability, provider, status = 'active' } = req.query;
            const models = await services.aiRoutingService.modelRegistry.getAvailableModels();
            let filteredModels = models;
            // Filter by capability
            if (capability) {
                filteredModels = filteredModels.filter(model => model.capabilities.includes(capability));
            }
            // Filter by provider
            if (provider) {
                filteredModels = filteredModels.filter(model => model.provider === provider);
            }
            // Filter by status
            if (status) {
                filteredModels = filteredModels.filter(model => model.status === status);
            }
            res.json({
                models: filteredModels.map(model => ({
                    id: model.id,
                    name: model.name,
                    provider: model.provider,
                    capabilities: model.capabilities,
                    status: model.status,
                    pricing: model.pricing,
                    performance: {
                        averageLatency: model.performance.averageLatency,
                        successRate: model.performance.successRate,
                        qualityScore: model.performance.qualityScore
                    },
                    limits: model.limits
                })),
                totalModels: filteredModels.length,
                filters: {
                    capability: capability || 'all',
                    provider: provider || 'all',
                    status
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get models error:', error);
            res.status(500).json({
                error: 'Failed to get models',
                message: error.message
            });
        }
    });
    // Get model performance metrics
    router.get('/models/:modelId/metrics', async (req, res) => {
        try {
            const { modelId } = req.params;
            const { timeframe = '24h' } = req.query;
            const metrics = await services.aiRoutingService.performanceMonitor.getModelMetrics(modelId, timeframe);
            if (!metrics) {
                return res.status(404).json({
                    error: 'Model not found',
                    message: `No metrics found for model ${modelId}`
                });
            }
            res.json({
                modelId,
                timeframe,
                metrics: {
                    requestCount: metrics.requestCount,
                    averageLatency: metrics.averageLatency,
                    successRate: metrics.successRate,
                    errorRate: metrics.errorRate,
                    qualityScore: metrics.qualityScore,
                    costPerRequest: metrics.costPerRequest,
                    throughput: metrics.throughput,
                    availability: metrics.availability
                },
                trends: metrics.trends || {},
                lastUpdated: metrics.lastUpdated
            });
        }
        catch (error) {
            logger_1.logger.error('Get model metrics error:', error);
            res.status(500).json({
                error: 'Failed to get model metrics',
                message: error.message
            });
        }
    });
    // Update model configuration
    router.patch('/models/:modelId', async (req, res) => {
        try {
            const { modelId } = req.params;
            const updates = req.body;
            const updatedModel = await services.aiRoutingService.modelRegistry.updateModel(modelId, updates);
            if (!updatedModel) {
                return res.status(404).json({
                    error: 'Model not found',
                    message: `Model ${modelId} does not exist`
                });
            }
            res.json({
                message: 'Model updated successfully',
                model: {
                    id: updatedModel.id,
                    name: updatedModel.name,
                    provider: updatedModel.provider,
                    status: updatedModel.status,
                    updatedAt: updatedModel.updatedAt
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Update model error:', error);
            res.status(500).json({
                error: 'Failed to update model',
                message: error.message
            });
        }
    });
    // Get routing analytics
    router.get('/analytics', async (req, res) => {
        try {
            const { timeframe = '24h', groupBy = 'model' } = req.query;
            // This would typically query analytics data from Redis
            // For now, we'll return mock analytics data
            const analytics = {
                timeframe,
                groupBy,
                totalRequests: 2450,
                successfulRoutes: 2389,
                failedRoutes: 61,
                averageRoutingTime: 23, // ms
                modelUsage: {
                    'gpt-4': { requests: 1200, successRate: 0.98, avgLatency: 1500 },
                    'claude-3': { requests: 800, successRate: 0.97, avgLatency: 1200 },
                    'local-llama': { requests: 450, successRate: 0.95, avgLatency: 800 }
                },
                costAnalysis: {
                    totalCost: 45.67,
                    costPerRequest: 0.0186,
                    costByModel: {
                        'gpt-4': 28.50,
                        'claude-3': 12.80,
                        'local-llama': 4.37
                    }
                },
                performanceTrends: {
                    latencyTrend: 'decreasing',
                    successRateTrend: 'stable',
                    costTrend: 'increasing'
                }
            };
            res.json(analytics);
        }
        catch (error) {
            logger_1.logger.error('Get routing analytics error:', error);
            res.status(500).json({
                error: 'Failed to get routing analytics',
                message: error.message
            });
        }
    });
    // Test model connectivity
    router.post('/models/:modelId/test', async (req, res) => {
        try {
            const { modelId } = req.params;
            const { testPrompt = 'Hello, this is a connectivity test.' } = req.body;
            const testResult = await services.aiRoutingService.modelRegistry.testModelConnectivity(modelId, testPrompt);
            res.json({
                modelId,
                testPrompt,
                result: {
                    success: testResult.success,
                    latency: testResult.latency,
                    response: testResult.response,
                    error: testResult.error,
                    timestamp: testResult.timestamp
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Test model connectivity error:', error);
            res.status(500).json({
                error: 'Failed to test model connectivity',
                message: error.message
            });
        }
    });
    // Get request history
    router.get('/requests', async (req, res) => {
        try {
            const { userId, sessionId, modelId, status, limit = 50, offset = 0 } = req.query;
            // This would typically query request history from Redis
            // For now, we'll return mock request history
            const requests = Array.from({ length: parseInt(limit) }, (_, i) => ({
                id: `req_${Date.now() - i * 1000}_${Math.random().toString(36).substr(2, 9)}`,
                prompt: `Sample request ${i + 1}`,
                userId: userId || `user_${i % 5}`,
                sessionId: sessionId || `session_${i % 10}`,
                selectedModel: modelId || ['gpt-4', 'claude-3', 'local-llama'][i % 3],
                status: status || ['completed', 'failed', 'pending'][i % 3],
                latency: 1000 + Math.random() * 2000,
                cost: 0.01 + Math.random() * 0.05,
                timestamp: Date.now() - i * 60000,
                routingReason: 'Best performance match'
            }));
            res.json({
                requests,
                pagination: {
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    total: 1000, // Mock total
                    hasMore: parseInt(offset) + parseInt(limit) < 1000
                },
                filters: {
                    userId,
                    sessionId,
                    modelId,
                    status
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get request history error:', error);
            res.status(500).json({
                error: 'Failed to get request history',
                message: error.message
            });
        }
    });
    // Get routing recommendations
    router.post('/recommendations', async (req, res) => {
        try {
            const { prompt, context = {}, requirements = {}, userId } = req.body;
            if (!prompt) {
                return res.status(400).json({
                    error: 'Prompt is required',
                    message: 'Please provide a prompt for recommendations'
                });
            }
            // Analyze the request to provide routing recommendations
            const analysis = await services.aiRoutingService.requestAnalyzer.analyzeRequest({
                prompt,
                context,
                requirements,
                userId: userId || 'anonymous'
            });
            const recommendations = await services.aiRoutingService.routingEngine.getRoutingRecommendations(analysis);
            res.json({
                prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
                analysis: {
                    complexity: analysis.complexity,
                    domain: analysis.domain,
                    requiredCapabilities: analysis.requiredCapabilities,
                    estimatedTokens: analysis.estimatedTokens
                },
                recommendations: recommendations.map(rec => ({
                    modelId: rec.modelId,
                    modelName: rec.modelName,
                    score: rec.score,
                    reasoning: rec.reasoning,
                    estimatedLatency: rec.estimatedLatency,
                    estimatedCost: rec.estimatedCost,
                    pros: rec.pros,
                    cons: rec.cons
                })),
                totalRecommendations: recommendations.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get routing recommendations error:', error);
            res.status(500).json({
                error: 'Failed to get routing recommendations',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=ai-routing.js.map