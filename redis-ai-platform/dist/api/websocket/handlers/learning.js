"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningHandler = void 0;
const logger_1 = require("../../../utils/logger");
class LearningHandler {
    io;
    redis;
    services;
    constructor(io, redis, services) {
        this.io = io;
        this.redis = redis;
        this.services = services;
    }
    setupHandlers(socket, connectionInfo) {
        // Track user behavior in real-time
        socket.on('learning:track_behavior', async (data) => {
            try {
                const { action, context = {}, metadata = {} } = data;
                if (!connectionInfo.userId) {
                    return; // Allow anonymous behavior tracking
                }
                const behaviorData = {
                    userId: connectionInfo.userId || socket.id,
                    action,
                    context: {
                        socketId: socket.id,
                        ipAddress: connectionInfo.ipAddress,
                        userAgent: connectionInfo.userAgent,
                        ...context
                    },
                    metadata: {
                        realtime: true,
                        source: 'websocket',
                        ...metadata
                    },
                    timestamp: Date.now()
                };
                await this.services.learningService.behaviorTracker.trackBehavior(behaviorData);
                // Acknowledge behavior tracking
                socket.emit('learning:behavior_tracked', {
                    action,
                    timestamp: behaviorData.timestamp
                });
            }
            catch (error) {
                logger_1.logger.error('Track behavior error:', error);
                socket.emit('error', { message: 'Failed to track behavior', error: error.message });
            }
        });
        // Subscribe to personalized recommendations
        socket.on('learning:subscribe_recommendations', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for recommendations' });
                    return;
                }
                const { context = {} } = data;
                // Join user-specific recommendation room
                await socket.join(`user:${connectionInfo.userId}:recommendations`);
                connectionInfo.subscriptions.add(`user:${connectionInfo.userId}:recommendations`);
                // Get initial recommendations
                const recommendations = await this.services.learningService.personalizationEngine.generateRecommendations(connectionInfo.userId, context);
                socket.emit('learning:recommendations_update', {
                    recommendations: recommendations.map(rec => ({
                        id: rec.id,
                        type: rec.type,
                        title: rec.title,
                        description: rec.description,
                        confidence: rec.confidence,
                        relevanceScore: rec.relevanceScore,
                        reasoning: rec.reasoning
                    })),
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Subscribe recommendations error:', error);
                socket.emit('error', { message: 'Failed to subscribe to recommendations', error: error.message });
            }
        });
        // Get user patterns
        socket.on('learning:get_patterns', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for patterns' });
                    return;
                }
                const { timeframe = '7d', limit = 20 } = data;
                const patterns = await this.services.learningService.patternAnalyzer.analyzeUserPatterns(connectionInfo.userId, timeframe);
                socket.emit('learning:patterns', {
                    patterns: patterns.slice(0, limit).map(pattern => ({
                        id: pattern.id,
                        type: pattern.type,
                        description: pattern.description,
                        frequency: pattern.frequency,
                        confidence: pattern.confidence,
                        strength: pattern.strength,
                        context: pattern.context,
                        firstObserved: pattern.firstObserved,
                        lastObserved: pattern.lastObserved,
                        occurrences: pattern.occurrences
                    })),
                    totalPatterns: patterns.length,
                    timeframe,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get patterns error:', error);
                socket.emit('error', { message: 'Failed to get patterns', error: error.message });
            }
        });
        // Update user preferences
        socket.on('learning:update_preferences', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for preferences update' });
                    return;
                }
                const { preferences } = data;
                await this.services.learningService.personalizationEngine.updateUserPreferences(connectionInfo.userId, preferences);
                socket.emit('learning:preferences_updated', {
                    preferences,
                    timestamp: Date.now()
                });
                // Emit to user's recommendations room to trigger update
                this.io.to(`user:${connectionInfo.userId}:recommendations`).emit('learning:preferences_changed', {
                    preferences,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Update preferences error:', error);
                socket.emit('error', { message: 'Failed to update preferences', error: error.message });
            }
        });
        // Provide feedback on recommendation
        socket.on('learning:provide_feedback', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for feedback' });
                    return;
                }
                const { recommendationId, feedback, rating, context = {} } = data;
                const feedbackData = {
                    userId: connectionInfo.userId,
                    recommendationId,
                    feedback,
                    rating,
                    context: {
                        socketId: socket.id,
                        ipAddress: connectionInfo.ipAddress,
                        ...context
                    },
                    timestamp: Date.now()
                };
                await this.services.learningService.personalizationEngine.processFeedback(feedbackData);
                socket.emit('learning:feedback_processed', {
                    recommendationId,
                    feedback,
                    timestamp: feedbackData.timestamp
                });
            }
            catch (error) {
                logger_1.logger.error('Provide feedback error:', error);
                socket.emit('error', { message: 'Failed to process feedback', error: error.message });
            }
        });
        // Get similar users
        socket.on('learning:get_similar_users', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for similar users' });
                    return;
                }
                const { threshold = 0.7, limit = 10 } = data;
                const similarUsers = await this.services.learningService.personalizationEngine.findSimilarUsers(connectionInfo.userId, threshold);
                socket.emit('learning:similar_users', {
                    similarUsers: similarUsers.slice(0, limit).map(user => ({
                        userId: user.userId,
                        similarityScore: user.similarityScore,
                        commonPatterns: user.commonPatterns,
                        sharedPreferences: user.sharedPreferences,
                        lastInteraction: user.lastInteraction
                    })),
                    totalSimilarUsers: similarUsers.length,
                    threshold,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get similar users error:', error);
                socket.emit('error', { message: 'Failed to get similar users', error: error.message });
            }
        });
        // Get learning analytics
        socket.on('learning:get_analytics', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for analytics' });
                    return;
                }
                const { timeframe = '30d' } = data;
                // Mock analytics data (in real implementation, this would come from the service)
                const analytics = {
                    userId: connectionInfo.userId,
                    timeframe,
                    learningProgress: {
                        totalInteractions: Math.floor(Math.random() * 2000) + 500,
                        patternsIdentified: Math.floor(Math.random() * 100) + 20,
                        recommendationsGenerated: Math.floor(Math.random() * 300) + 50,
                        feedbackReceived: Math.floor(Math.random() * 150) + 20,
                        accuracyScore: 0.7 + Math.random() * 0.3
                    },
                    behaviorInsights: {
                        mostActiveHours: ['09:00-11:00', '14:00-16:00', '19:00-21:00'],
                        preferredContentTypes: ['technical', 'tutorials', 'documentation'],
                        learningVelocity: ['increasing', 'stable', 'decreasing'][Math.floor(Math.random() * 3)],
                        engagementScore: 0.5 + Math.random() * 0.5
                    },
                    personalizationMetrics: {
                        recommendationAccuracy: 0.6 + Math.random() * 0.4,
                        clickThroughRate: 0.2 + Math.random() * 0.3,
                        conversionRate: 0.1 + Math.random() * 0.2,
                        satisfactionScore: 3.5 + Math.random() * 1.5
                    },
                    adaptationRate: {
                        shortTerm: 0.4 + Math.random() * 0.4,
                        longTerm: 0.7 + Math.random() * 0.3
                    }
                };
                socket.emit('learning:analytics', {
                    analytics,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get learning analytics error:', error);
                socket.emit('error', { message: 'Failed to get learning analytics', error: error.message });
            }
        });
    }
    // Method to broadcast new recommendations to users
    async broadcastNewRecommendation(userId, recommendation) {
        try {
            this.io.to(`user:${userId}:recommendations`).emit('learning:new_recommendation', {
                recommendation: {
                    id: recommendation.id,
                    type: recommendation.type,
                    title: recommendation.title,
                    description: recommendation.description,
                    confidence: recommendation.confidence,
                    relevanceScore: recommendation.relevanceScore,
                    reasoning: recommendation.reasoning
                },
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Broadcast new recommendation error:', error);
        }
    }
    // Method to broadcast pattern discovery
    async broadcastPatternDiscovered(userId, pattern) {
        try {
            this.io.to(`user:${userId}:recommendations`).emit('learning:pattern_discovered', {
                pattern: {
                    id: pattern.id,
                    type: pattern.type,
                    description: pattern.description,
                    frequency: pattern.frequency,
                    confidence: pattern.confidence,
                    strength: pattern.strength
                },
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Broadcast pattern discovered error:', error);
        }
    }
}
exports.LearningHandler = LearningHandler;
//# sourceMappingURL=learning.js.map