"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createResolvers = createResolvers;
const logger_1 = require("../../utils/logger");
const multi_modal_search_1 = require("../../services/search/multi-modal-search");
const workspace_1 = require("../../services/workspace");
function createResolvers(services) {
    return {
        // Custom scalars
        Date: {
            serialize: (date) => date.toISOString(),
            parseValue: (value) => new Date(value),
            parseLiteral: (ast) => new Date(ast.value)
        },
        JSON: {
            serialize: (value) => value,
            parseValue: (value) => value,
            parseLiteral: (ast) => JSON.parse(ast.value)
        },
        // Queries
        Query: {
            // Search queries
            search: async (_, { input }) => {
                try {
                    const { query, contentTypes, limit, threshold } = input;
                    const validContentTypes = contentTypes?.filter((type) => Object.values(multi_modal_search_1.ContentType).includes(type)) || Object.values(multi_modal_search_1.ContentType);
                    const results = await services.multiModalSearch.search(query, validContentTypes, limit, threshold);
                    return {
                        query,
                        results: results.map(result => ({
                            id: result.id,
                            content: result.content,
                            contentType: result.contentType,
                            score: result.score,
                            metadata: result.metadata,
                            crossModalMatches: result.crossModalMatches || []
                        })),
                        totalResults: results.length,
                        searchTime: Date.now() // This would be calculated properly
                    };
                }
                catch (error) {
                    logger_1.logger.error('GraphQL search error:', error);
                    throw new Error(`Search failed: ${error.message}`);
                }
            },
            searchSuggestions: async (_, { query, limit }) => {
                try {
                    // Simple suggestion generation
                    return [
                        `${query} examples`,
                        `${query} tutorial`,
                        `${query} best practices`,
                        `${query} implementation`,
                        `${query} documentation`
                    ].slice(0, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL search suggestions error:', error);
                    throw new Error(`Failed to get suggestions: ${error.message}`);
                }
            },
            // Workspace queries
            workspace: async (_, { id }) => {
                try {
                    const workspace = await services.workspaceService.manager.getWorkspace(id);
                    if (!workspace) {
                        throw new Error(`Workspace ${id} not found`);
                    }
                    return workspace;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL get workspace error:', error);
                    throw new Error(`Failed to get workspace: ${error.message}`);
                }
            },
            workspaces: async (_, { userId }) => {
                try {
                    return await services.workspaceService.manager.getWorkspacesByUser(userId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL get workspaces error:', error);
                    throw new Error(`Failed to get workspaces: ${error.message}`);
                }
            },
            workspaceKnowledge: async (_, { workspaceId, query, limit }) => {
                try {
                    return await services.workspaceService.manager.queryKnowledge(workspaceId, query, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL workspace knowledge error:', error);
                    throw new Error(`Failed to query knowledge: ${error.message}`);
                }
            },
            workspaceInsights: async (_, { workspaceId }) => {
                try {
                    return await services.workspaceService.manager.discoverKnowledgeInsights(workspaceId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL workspace insights error:', error);
                    throw new Error(`Failed to get insights: ${error.message}`);
                }
            },
            workspaceClusters: async (_, { workspaceId, algorithm }) => {
                try {
                    return await services.workspaceService.manager.clusterWorkspaceKnowledge(workspaceId, algorithm);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL workspace clusters error:', error);
                    throw new Error(`Failed to get clusters: ${error.message}`);
                }
            },
            workspaceMetrics: async (_, { workspaceId }) => {
                try {
                    return await services.workspaceService.manager.getKnowledgeGraphMetrics(workspaceId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL workspace metrics error:', error);
                    throw new Error(`Failed to get metrics: ${error.message}`);
                }
            },
            // AI Routing queries
            availableModels: async (_, { capability, provider }) => {
                try {
                    let models = await services.aiRoutingService.modelRegistry.getAvailableModels();
                    if (capability) {
                        models = models.filter(model => model.capabilities.includes(capability));
                    }
                    if (provider) {
                        models = models.filter(model => model.provider === provider);
                    }
                    return models;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL available models error:', error);
                    throw new Error(`Failed to get models: ${error.message}`);
                }
            },
            modelMetrics: async (_, { modelId, timeframe }) => {
                try {
                    return await services.aiRoutingService.performanceMonitor.getModelMetrics(modelId, timeframe);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL model metrics error:', error);
                    throw new Error(`Failed to get model metrics: ${error.message}`);
                }
            },
            routingAnalytics: async (_, { timeframe }) => {
                try {
                    // Return mock analytics data
                    return {
                        timeframe,
                        totalRequests: 2450,
                        successfulRoutes: 2389,
                        failedRoutes: 61,
                        averageRoutingTime: 23,
                        modelUsage: {
                            'gpt-4': { requests: 1200, successRate: 0.98, avgLatency: 1500 },
                            'claude-3': { requests: 800, successRate: 0.97, avgLatency: 1200 },
                            'local-llama': { requests: 450, successRate: 0.95, avgLatency: 800 }
                        }
                    };
                }
                catch (error) {
                    logger_1.logger.error('GraphQL routing analytics error:', error);
                    throw new Error(`Failed to get analytics: ${error.message}`);
                }
            },
            // Learning queries
            userPatterns: async (_, { userId, timeframe, limit }) => {
                try {
                    return await services.learningService.patternAnalyzer.analyzeUserPatterns(userId, timeframe);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL user patterns error:', error);
                    throw new Error(`Failed to get user patterns: ${error.message}`);
                }
            },
            recommendations: async (_, { userId, context, limit }) => {
                try {
                    const recommendations = await services.learningService.personalizationEngine.generateRecommendations(userId, context || {});
                    return recommendations.slice(0, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL recommendations error:', error);
                    throw new Error(`Failed to get recommendations: ${error.message}`);
                }
            },
            userPreferences: async (_, { userId }) => {
                try {
                    return await services.learningService.personalizationEngine.getUserPreferences(userId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL user preferences error:', error);
                    throw new Error(`Failed to get user preferences: ${error.message}`);
                }
            },
            similarUsers: async (_, { userId, threshold, limit }) => {
                try {
                    const similarUsers = await services.learningService.personalizationEngine.findSimilarUsers(userId, threshold);
                    return similarUsers.slice(0, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL similar users error:', error);
                    throw new Error(`Failed to get similar users: ${error.message}`);
                }
            },
            // Code Intelligence queries
            analyzeCode: async (_, { code, language, filePath, context }) => {
                try {
                    return await services.codeIntelligenceService.codeAnalyzer.analyzeCode(code, language, filePath, context);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL analyze code error:', error);
                    throw new Error(`Failed to analyze code: ${error.message}`);
                }
            },
            searchCode: async (_, { query, language, limit }) => {
                try {
                    return await services.codeIntelligenceService.codeAnalyzer.searchSimilarCode(query, language, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL search code error:', error);
                    throw new Error(`Failed to search code: ${error.message}`);
                }
            },
            // Content Consistency queries
            analyzeBrandConsistency: async (_, { content, brandId, contentType, platform }) => {
                try {
                    return await services.contentConsistencyService.brandAnalyzer.analyzeBrandConsistency(content, brandId, contentType, platform);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL brand consistency error:', error);
                    throw new Error(`Failed to analyze brand consistency: ${error.message}`);
                }
            },
            // Optimization queries
            systemMetrics: async (_, { timeframe }) => {
                try {
                    return await services.optimizationService.metricsCollector.getSystemMetrics(timeframe);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL system metrics error:', error);
                    throw new Error(`Failed to get system metrics: ${error.message}`);
                }
            },
            optimizationRecommendations: async () => {
                try {
                    return await services.optimizationService.optimizationEngine.getOptimizationRecommendations();
                }
                catch (error) {
                    logger_1.logger.error('GraphQL optimization recommendations error:', error);
                    throw new Error(`Failed to get optimization recommendations: ${error.message}`);
                }
            },
            anomalies: async (_, { timeframe }) => {
                try {
                    return await services.optimizationService.anomalyDetector.detectAnomalies(timeframe);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL anomalies error:', error);
                    throw new Error(`Failed to detect anomalies: ${error.message}`);
                }
            },
            // Adaptive UI queries
            personalizationSuggestions: async (_, { userId }) => {
                try {
                    const patterns = await services.adaptiveUIService.interactionTracker.getUsagePatterns(userId);
                    return await services.adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(userId, patterns);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL personalization suggestions error:', error);
                    throw new Error(`Failed to get personalization suggestions: ${error.message}`);
                }
            },
            userInteractions: async (_, { userId, limit }) => {
                try {
                    const interactions = await services.adaptiveUIService.interactionTracker.getUserInteractions(userId);
                    return interactions.slice(0, limit);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL user interactions error:', error);
                    throw new Error(`Failed to get user interactions: ${error.message}`);
                }
            }
        },
        // Mutations
        Mutation: {
            // Workspace mutations
            createWorkspace: async (_, { input }) => {
                try {
                    const workspaceConfig = {
                        ...input,
                        settings: {
                            allowGuestAccess: false,
                            autoSaveInterval: 30,
                            knowledgeRetentionDays: 365,
                            syncMode: 'realtime',
                            ...input.settings
                        }
                    };
                    return await services.workspaceService.manager.createWorkspace(workspaceConfig);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL create workspace error:', error);
                    throw new Error(`Failed to create workspace: ${error.message}`);
                }
            },
            joinWorkspace: async (_, { workspaceId, userId, role }) => {
                try {
                    await services.workspaceService.manager.joinWorkspace(workspaceId, userId, role);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL join workspace error:', error);
                    throw new Error(`Failed to join workspace: ${error.message}`);
                }
            },
            leaveWorkspace: async (_, { workspaceId, userId }) => {
                try {
                    await services.workspaceService.manager.leaveWorkspace(workspaceId, userId);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL leave workspace error:', error);
                    throw new Error(`Failed to leave workspace: ${error.message}`);
                }
            },
            addKnowledge: async (_, { workspaceId, input }) => {
                try {
                    const knowledgeData = {
                        ...input,
                        metadata: {
                            tags: [],
                            confidence: 1.0,
                            source: 'graphql',
                            version: 1,
                            ...input.metadata
                        }
                    };
                    return await services.workspaceService.manager.addKnowledge(workspaceId, knowledgeData);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL add knowledge error:', error);
                    throw new Error(`Failed to add knowledge: ${error.message}`);
                }
            },
            addKnowledgeRelationship: async (_, { workspaceId, sourceId, targetId, relationship, strength }) => {
                try {
                    await services.workspaceService.manager.addKnowledgeRelationship(workspaceId, sourceId, targetId, relationship, strength);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL add knowledge relationship error:', error);
                    throw new Error(`Failed to add knowledge relationship: ${error.message}`);
                }
            },
            updateWorkspaceSettings: async (_, { workspaceId, settings }) => {
                try {
                    await services.workspaceService.manager.updateWorkspaceSettings(workspaceId, settings);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL update workspace settings error:', error);
                    throw new Error(`Failed to update workspace settings: ${error.message}`);
                }
            },
            // AI Routing mutations
            routeAIRequest: async (_, { input }) => {
                try {
                    const aiRequest = {
                        id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        ...input,
                        requirements: {
                            maxLatency: 5000,
                            minAccuracy: 0.8,
                            preferredModels: [],
                            costConstraint: 'balanced',
                            ...input.requirements
                        },
                        userId: input.userId || 'anonymous',
                        sessionId: input.sessionId || `session_${Date.now()}`,
                        timestamp: Date.now()
                    };
                    return await services.aiRoutingService.routingEngine.routeRequest(aiRequest);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL route AI request error:', error);
                    throw new Error(`Failed to route AI request: ${error.message}`);
                }
            },
            updateModel: async (_, { modelId, updates }) => {
                try {
                    return await services.aiRoutingService.modelRegistry.updateModel(modelId, updates);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL update model error:', error);
                    throw new Error(`Failed to update model: ${error.message}`);
                }
            },
            testModelConnectivity: async (_, { modelId, testPrompt }) => {
                try {
                    return await services.aiRoutingService.modelRegistry.testModelConnectivity(modelId, testPrompt || 'Hello, this is a connectivity test.');
                }
                catch (error) {
                    logger_1.logger.error('GraphQL test model connectivity error:', error);
                    throw new Error(`Failed to test model connectivity: ${error.message}`);
                }
            },
            // Learning mutations
            trackBehavior: async (_, { input }) => {
                try {
                    const behaviorData = {
                        ...input,
                        timestamp: Date.now()
                    };
                    await services.learningService.behaviorTracker.trackBehavior(behaviorData);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL track behavior error:', error);
                    throw new Error(`Failed to track behavior: ${error.message}`);
                }
            },
            updateUserPreferences: async (_, { userId, preferences }) => {
                try {
                    await services.learningService.personalizationEngine.updateUserPreferences(userId, preferences);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL update user preferences error:', error);
                    throw new Error(`Failed to update user preferences: ${error.message}`);
                }
            },
            provideFeedback: async (_, { userId, recommendationId, feedback, rating, context }) => {
                try {
                    const feedbackData = {
                        userId,
                        recommendationId,
                        feedback,
                        rating,
                        context: context || {},
                        timestamp: Date.now()
                    };
                    await services.learningService.personalizationEngine.processFeedback(feedbackData);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL provide feedback error:', error);
                    throw new Error(`Failed to provide feedback: ${error.message}`);
                }
            },
            // Code Intelligence mutations
            generateCode: async (_, { prompt, language, context, style }) => {
                try {
                    return await services.codeIntelligenceService.codeGenerator.generateCode(prompt, language, context, style);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL generate code error:', error);
                    throw new Error(`Failed to generate code: ${error.message}`);
                }
            },
            // Content Consistency mutations
            adaptContent: async (_, { content, sourcePlatform, targetPlatform, brandId }) => {
                try {
                    return await services.contentConsistencyService.contentAdapter.adaptContent(content, sourcePlatform, targetPlatform, brandId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL adapt content error:', error);
                    throw new Error(`Failed to adapt content: ${error.message}`);
                }
            },
            // Adaptive UI mutations
            trackInteraction: async (_, { input }) => {
                try {
                    const interaction = {
                        ...input,
                        id: input.id || `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                        timestamp: input.timestamp || Date.now()
                    };
                    await services.adaptiveUIService.interactionTracker.trackInteraction(interaction);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL track interaction error:', error);
                    throw new Error(`Failed to track interaction: ${error.message}`);
                }
            },
            processAdaptationRequest: async (_, { input }) => {
                try {
                    return await services.adaptiveUIService.adaptiveUIController.processAdaptationRequest(input);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL process adaptation request error:', error);
                    throw new Error(`Failed to process adaptation request: ${error.message}`);
                }
            },
            // Data Management mutations
            exportUserData: async (_, { userId, format }) => {
                try {
                    return await services.learningService.behaviorTracker.exportUserData(userId);
                }
                catch (error) {
                    logger_1.logger.error('GraphQL export user data error:', error);
                    throw new Error(`Failed to export user data: ${error.message}`);
                }
            },
            deleteUserData: async (_, { userId, confirm }) => {
                try {
                    if (!confirm) {
                        throw new Error('Confirmation required to delete user data');
                    }
                    await services.learningService.behaviorTracker.deleteUserData(userId);
                    return true;
                }
                catch (error) {
                    logger_1.logger.error('GraphQL delete user data error:', error);
                    throw new Error(`Failed to delete user data: ${error.message}`);
                }
            }
        },
        // Subscriptions (simplified implementations)
        Subscription: {
            workspaceUpdates: {
                subscribe: () => {
                    // This would typically use a pub/sub system like Redis or GraphQL subscriptions
                    // For now, return a mock subscription
                    return {
                        [Symbol.asyncIterator]: async function* () {
                            while (true) {
                                yield { workspaceUpdates: { type: 'update', timestamp: Date.now() } };
                                await new Promise(resolve => setTimeout(resolve, 5000));
                            }
                        }
                    };
                }
            },
            knowledgeAdded: {
                subscribe: () => {
                    return {
                        [Symbol.asyncIterator]: async function* () {
                            while (true) {
                                yield {
                                    knowledgeAdded: {
                                        id: `kn_${Date.now()}`,
                                        type: workspace_1.KnowledgeType.INSIGHT,
                                        content: 'New knowledge added',
                                        createdAt: new Date(),
                                        createdBy: 'system'
                                    }
                                };
                                await new Promise(resolve => setTimeout(resolve, 10000));
                            }
                        }
                    };
                }
            },
            systemAlert: {
                subscribe: () => {
                    return {
                        [Symbol.asyncIterator]: async function* () {
                            while (true) {
                                yield {
                                    systemAlert: {
                                        type: 'info',
                                        message: 'System is running normally',
                                        timestamp: Date.now()
                                    }
                                };
                                await new Promise(resolve => setTimeout(resolve, 30000));
                            }
                        }
                    };
                }
            }
        }
    };
}
//# sourceMappingURL=resolvers.js.map