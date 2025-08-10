"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.learningRoutes = learningRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function learningRoutes(services) {
    const router = (0, express_1.Router)();
    // Track user behavior
    router.post('/behavior', async (req, res) => {
        try {
            const { userId, action, context, metadata } = req.body;
            if (!userId || !action) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'userId and action are required'
                });
            }
            const behaviorData = {
                userId,
                action,
                context: context || {},
                metadata: metadata || {},
                timestamp: Date.now()
            };
            await services.learningService.behaviorTracker.trackBehavior(behaviorData);
            res.status(201).json({
                message: 'Behavior tracked successfully',
                behaviorId: `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                action,
                timestamp: behaviorData.timestamp
            });
        }
        catch (error) {
            logger_1.logger.error('Track behavior error:', error);
            res.status(500).json({
                error: 'Failed to track behavior',
                message: error.message
            });
        }
    });
    // Get user patterns
    router.get('/patterns/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { timeframe = '7d', limit = 20 } = req.query;
            const patterns = await services.learningService.patternAnalyzer.analyzeUserPatterns(userId, timeframe);
            res.json({
                userId,
                timeframe,
                patterns: patterns.slice(0, parseInt(limit)).map(pattern => ({
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
                totalPatterns: patterns.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get user patterns error:', error);
            res.status(500).json({
                error: 'Failed to get user patterns',
                message: error.message
            });
        }
    });
    // Get personalized recommendations
    router.get('/recommendations/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { context, limit = 10 } = req.query;
            const recommendations = await services.learningService.personalizationEngine.generateRecommendations(userId, context ? JSON.parse(context) : {});
            res.json({
                userId,
                context: context ? JSON.parse(context) : {},
                recommendations: recommendations.slice(0, parseInt(limit)).map(rec => ({
                    id: rec.id,
                    type: rec.type,
                    title: rec.title,
                    description: rec.description,
                    confidence: rec.confidence,
                    relevanceScore: rec.relevanceScore,
                    reasoning: rec.reasoning,
                    metadata: rec.metadata,
                    expiresAt: rec.expiresAt
                })),
                totalRecommendations: recommendations.length,
                generatedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Get recommendations error:', error);
            res.status(500).json({
                error: 'Failed to get recommendations',
                message: error.message
            });
        }
    });
    // Update user preferences
    router.patch('/preferences/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const preferences = req.body;
            await services.learningService.personalizationEngine.updateUserPreferences(userId, preferences);
            res.json({
                message: 'User preferences updated successfully',
                userId,
                updatedPreferences: preferences,
                updatedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Update preferences error:', error);
            res.status(500).json({
                error: 'Failed to update preferences',
                message: error.message
            });
        }
    });
    // Get user preferences
    router.get('/preferences/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const preferences = await services.learningService.personalizationEngine.getUserPreferences(userId);
            if (!preferences) {
                return res.status(404).json({
                    error: 'User preferences not found',
                    message: `No preferences found for user ${userId}`
                });
            }
            res.json({
                userId,
                preferences,
                lastUpdated: preferences.lastUpdated || Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Get preferences error:', error);
            res.status(500).json({
                error: 'Failed to get preferences',
                message: error.message
            });
        }
    });
    // Provide feedback on recommendation
    router.post('/feedback', async (req, res) => {
        try {
            const { userId, recommendationId, feedback, rating, context } = req.body;
            if (!userId || !recommendationId || !feedback) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'userId, recommendationId, and feedback are required'
                });
            }
            const feedbackData = {
                userId,
                recommendationId,
                feedback,
                rating: rating || null,
                context: context || {},
                timestamp: Date.now()
            };
            await services.learningService.personalizationEngine.processFeedback(feedbackData);
            res.status(201).json({
                message: 'Feedback processed successfully',
                feedbackId: `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                userId,
                recommendationId,
                feedback,
                timestamp: feedbackData.timestamp
            });
        }
        catch (error) {
            logger_1.logger.error('Process feedback error:', error);
            res.status(500).json({
                error: 'Failed to process feedback',
                message: error.message
            });
        }
    });
    // Get learning analytics
    router.get('/analytics/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { timeframe = '30d' } = req.query;
            // This would typically query analytics data from the learning service
            // For now, we'll return mock analytics data
            const analytics = {
                userId,
                timeframe,
                learningProgress: {
                    totalInteractions: 1250,
                    patternsIdentified: 45,
                    recommendationsGenerated: 180,
                    feedbackReceived: 67,
                    accuracyScore: 0.84
                },
                behaviorInsights: {
                    mostActiveHours: ['09:00-11:00', '14:00-16:00'],
                    preferredContentTypes: ['technical', 'tutorials', 'documentation'],
                    learningVelocity: 'increasing',
                    engagementScore: 0.78
                },
                personalizationMetrics: {
                    recommendationAccuracy: 0.82,
                    clickThroughRate: 0.34,
                    conversionRate: 0.18,
                    satisfactionScore: 4.2
                },
                adaptationRate: {
                    shortTerm: 0.65, // How quickly the system adapts to recent behavior
                    longTerm: 0.89 // How well the system maintains long-term preferences
                }
            };
            res.json(analytics);
        }
        catch (error) {
            logger_1.logger.error('Get learning analytics error:', error);
            res.status(500).json({
                error: 'Failed to get learning analytics',
                message: error.message
            });
        }
    });
    // Get similar users (for collaborative filtering)
    router.get('/similar-users/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { limit = 10, threshold = 0.7 } = req.query;
            const similarUsers = await services.learningService.personalizationEngine.findSimilarUsers(userId, parseFloat(threshold));
            res.json({
                userId,
                threshold: parseFloat(threshold),
                similarUsers: similarUsers.slice(0, parseInt(limit)).map(user => ({
                    userId: user.userId,
                    similarityScore: user.similarityScore,
                    commonPatterns: user.commonPatterns,
                    sharedPreferences: user.sharedPreferences,
                    lastInteraction: user.lastInteraction
                })),
                totalSimilarUsers: similarUsers.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get similar users error:', error);
            res.status(500).json({
                error: 'Failed to get similar users',
                message: error.message
            });
        }
    });
    // Export user data (for privacy compliance)
    router.get('/export/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { format = 'json' } = req.query;
            const userData = await services.learningService.behaviorTracker.exportUserData(userId);
            if (!userData) {
                return res.status(404).json({
                    error: 'User data not found',
                    message: `No data found for user ${userId}`
                });
            }
            if (format === 'csv') {
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename="user_data_${userId}.csv"`);
                // Convert to CSV format (simplified)
                const csv = Object.entries(userData).map(([key, value]) => `${key},${JSON.stringify(value)}`).join('\n');
                res.send(csv);
            }
            else {
                res.json({
                    userId,
                    exportedAt: Date.now(),
                    format,
                    data: userData
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Export user data error:', error);
            res.status(500).json({
                error: 'Failed to export user data',
                message: error.message
            });
        }
    });
    // Delete user data (for privacy compliance)
    router.delete('/data/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const { confirm } = req.body;
            if (!confirm) {
                return res.status(400).json({
                    error: 'Confirmation required',
                    message: 'Please set confirm: true to delete user data'
                });
            }
            await services.learningService.behaviorTracker.deleteUserData(userId);
            res.json({
                message: 'User data deleted successfully',
                userId,
                deletedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Delete user data error:', error);
            res.status(500).json({
                error: 'Failed to delete user data',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=learning.js.map