"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveUIHandler = void 0;
const logger_1 = require("../../../utils/logger");
class AdaptiveUIHandler {
    io;
    redis;
    services;
    constructor(io, redis, services) {
        this.io = io;
        this.redis = redis;
        this.services = services;
    }
    setupHandlers(socket, connectionInfo) {
        // Track user interactions in real-time
        socket.on('adaptive_ui:track_interaction', async (data) => {
            try {
                const { type, element, context, metadata = {} } = data;
                if (!connectionInfo.userId) {
                    return;
                }
                const interaction = {
                    id: `int_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: connectionInfo.userId,
                    type,
                    timestamp: Date.now(),
                    element,
                    context: {
                        socketId: socket.id,
                        ipAddress: connectionInfo.ipAddress,
                        ...context
                    },
                    metadata: {
                        realtime: true,
                        source: 'websocket',
                        ...metadata
                    }
                };
                await this.services.adaptiveUIService.interactionTracker.trackInteraction(interaction);
                // Acknowledge interaction tracking
                socket.emit('adaptive_ui:interaction_tracked', {
                    interactionId: interaction.id,
                    timestamp: interaction.timestamp
                });
                // Check if we should trigger UI adaptations
                await this.checkForAdaptations(socket, connectionInfo, interaction);
            }
            catch (error) {
                logger_1.logger.error('Track interaction error:', error);
                socket.emit('error', { message: 'Failed to track interaction', error: error.message });
            }
        });
        // Subscribe to UI personalization updates
        socket.on('adaptive_ui:subscribe_personalization', async () => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for personalization' });
                    return;
                }
                // Join user-specific personalization room
                await socket.join(`user:${connectionInfo.userId}:personalization`);
                connectionInfo.subscriptions.add(`user:${connectionInfo.userId}:personalization`);
                // Get current personalization suggestions
                const patterns = await this.services.adaptiveUIService.interactionTracker.getUsagePatterns(connectionInfo.userId);
                const suggestions = await this.services.adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(connectionInfo.userId, patterns);
                socket.emit('adaptive_ui:personalization_update', {
                    suggestions: suggestions.map(suggestion => ({
                        id: suggestion.id,
                        type: suggestion.type,
                        component: suggestion.component,
                        suggestion: suggestion.suggestion,
                        confidence: suggestion.confidence,
                        impact: suggestion.impact
                    })),
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Subscribe personalization error:', error);
                socket.emit('error', { message: 'Failed to subscribe to personalization', error: error.message });
            }
        });
        // Process adaptation request
        socket.on('adaptive_ui:request_adaptation', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for adaptation' });
                    return;
                }
                const { context, priority = 'medium', constraints = [] } = data;
                const adaptationRequest = {
                    userId: connectionInfo.userId,
                    context: {
                        socketId: socket.id,
                        ipAddress: connectionInfo.ipAddress,
                        ...context
                    },
                    priority,
                    constraints
                };
                const result = await this.services.adaptiveUIService.adaptiveUIController.processAdaptationRequest(adaptationRequest);
                socket.emit('adaptive_ui:adaptation_result', {
                    success: result.success,
                    adaptations: result.adaptations,
                    errors: result.errors,
                    metrics: result.metrics,
                    timestamp: Date.now()
                });
                // If adaptations were successful, notify about UI changes
                if (result.success && result.adaptations.length > 0) {
                    socket.emit('adaptive_ui:ui_adapted', {
                        adaptations: result.adaptations.map(adaptation => ({
                            type: adaptation.type,
                            component: adaptation.component,
                            changes: adaptation.changes,
                            impact: adaptation.impact
                        })),
                        timestamp: Date.now()
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Request adaptation error:', error);
                socket.emit('error', { message: 'Failed to process adaptation request', error: error.message });
            }
        });
        // Get contextual assistance
        socket.on('adaptive_ui:get_assistance', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for assistance' });
                    return;
                }
                const { currentTask = '', strugglingAreas = [], context = {} } = data;
                const assistanceContext = {
                    userId: connectionInfo.userId,
                    currentTask,
                    strugglingAreas,
                    helpHistory: [],
                    preferences: {
                        proactiveHelp: true,
                        tutorialStyle: 'interactive',
                        helpFrequency: 'moderate'
                    },
                    lastUpdated: Date.now()
                };
                const help = await this.services.adaptiveUIService.contextualAssistant.provideContextualHelp(assistanceContext);
                socket.emit('adaptive_ui:assistance_provided', {
                    help: {
                        type: help.type,
                        priority: help.priority,
                        content: help.content,
                        trigger: help.trigger,
                        metadata: help.metadata
                    },
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get assistance error:', error);
                socket.emit('error', { message: 'Failed to get assistance', error: error.message });
            }
        });
        // Get feature introduction
        socket.on('adaptive_ui:check_feature_readiness', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for feature introduction' });
                    return;
                }
                const { featureId, context = {} } = data;
                const patterns = await this.services.adaptiveUIService.interactionTracker.getUsagePatterns(connectionInfo.userId);
                const readiness = await this.services.adaptiveUIService.featureIntroducer.assessFeatureReadiness(connectionInfo.userId, featureId, patterns);
                socket.emit('adaptive_ui:feature_readiness', {
                    featureId,
                    ready: readiness.ready,
                    confidence: readiness.confidence,
                    recommendedTiming: readiness.recommendedTiming,
                    factors: readiness.factors,
                    timestamp: Date.now()
                });
                // If feature is ready, optionally introduce it
                if (readiness.ready && readiness.confidence > 0.8) {
                    const introductionContext = {
                        userId: connectionInfo.userId,
                        currentPage: context.page || 'unknown',
                        currentTask: context.task || 'unknown',
                        userState: 'focused',
                        sessionDuration: Date.now() - connectionInfo.connectedAt.getTime(),
                        recentActions: context.recentActions || []
                    };
                    const introduction = await this.services.adaptiveUIService.featureIntroducer.introduceFeature(featureId, introductionContext);
                    socket.emit('adaptive_ui:feature_introduction', {
                        featureId: introduction.featureId,
                        method: introduction.method,
                        timing: introduction.timing,
                        content: introduction.content,
                        timestamp: Date.now()
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Check feature readiness error:', error);
                socket.emit('error', { message: 'Failed to check feature readiness', error: error.message });
            }
        });
        // Update accessibility preferences
        socket.on('adaptive_ui:update_accessibility', async (data) => {
            try {
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required for accessibility updates' });
                    return;
                }
                const { preferences } = data;
                // Create or update accessibility profile
                const profile = await this.services.adaptiveUIService.accessibilityAdapter.createAccessibilityProfile(connectionInfo.userId, { accessibility: preferences });
                // Generate accessibility adaptations
                const adaptations = await this.services.adaptiveUIService.accessibilityAdapter.generateAdaptations(connectionInfo.userId, profile);
                socket.emit('adaptive_ui:accessibility_updated', {
                    profile: {
                        userId: profile.userId,
                        needs: profile.needs,
                        preferences: profile.preferences
                    },
                    adaptations: adaptations.map(adaptation => ({
                        id: adaptation.id,
                        adaptationType: adaptation.adaptationType,
                        target: adaptation.target,
                        modifications: adaptation.modifications,
                        impact: adaptation.impact
                    })),
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Update accessibility error:', error);
                socket.emit('error', { message: 'Failed to update accessibility', error: error.message });
            }
        });
    }
    async checkForAdaptations(socket, connectionInfo, interaction) {
        try {
            // Check if user is struggling (multiple failed interactions)
            const recentInteractions = await this.services.adaptiveUIService.interactionTracker.getUserInteractions(connectionInfo.userId);
            const recentFailures = recentInteractions
                .filter(i => Date.now() - i.timestamp < 60000) // Last minute
                .filter(i => i.metadata?.successful === false)
                .length;
            if (recentFailures >= 3) {
                // User is struggling, offer help
                const struggles = await this.services.adaptiveUIService.contextualAssistant.detectUserStruggles(connectionInfo.userId);
                if (struggles.length > 0) {
                    socket.emit('adaptive_ui:struggle_detected', {
                        struggles: struggles.map(struggle => ({
                            area: struggle.area,
                            severity: struggle.severity,
                            component: struggle.component,
                            pattern: struggle.pattern
                        })),
                        timestamp: Date.now()
                    });
                }
            }
            // Check for personalization opportunities
            const patterns = await this.services.adaptiveUIService.interactionTracker.getUsagePatterns(connectionInfo.userId);
            if (patterns.length > 0) {
                const suggestions = await this.services.adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(connectionInfo.userId, patterns);
                const highConfidenceSuggestions = suggestions.filter(s => s.confidence > 0.8);
                if (highConfidenceSuggestions.length > 0) {
                    // Emit to user's personalization room
                    this.io.to(`user:${connectionInfo.userId}:personalization`).emit('adaptive_ui:new_suggestions', {
                        suggestions: highConfidenceSuggestions.map(suggestion => ({
                            id: suggestion.id,
                            type: suggestion.type,
                            component: suggestion.component,
                            suggestion: suggestion.suggestion,
                            confidence: suggestion.confidence,
                            impact: suggestion.impact
                        })),
                        timestamp: Date.now()
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Check for adaptations error:', error);
        }
    }
}
exports.AdaptiveUIHandler = AdaptiveUIHandler;
//# sourceMappingURL=adaptive-ui.js.map