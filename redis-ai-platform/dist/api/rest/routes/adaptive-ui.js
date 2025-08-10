"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adaptiveUIRoutes = adaptiveUIRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function adaptiveUIRoutes(services) {
    const router = (0, express_1.Router)();
    // Track user interaction
    router.post('/interactions', async (req, res) => {
        try {
            const interaction = req.body;
            if (!interaction.userId || !interaction.type) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'userId and type are required'
                });
            }
            await services.adaptiveUIService.interactionTracker.trackInteraction(interaction);
            res.status(201).json({
                message: 'Interaction tracked successfully',
                interactionId: interaction.id,
                timestamp: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Track interaction error:', error);
            res.status(500).json({
                error: 'Failed to track interaction',
                message: error.message
            });
        }
    });
    // Get UI personalization suggestions
    router.get('/personalization/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const patterns = await services.adaptiveUIService.interactionTracker.getUsagePatterns(userId);
            const suggestions = await services.adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(userId, patterns);
            res.json({
                userId,
                suggestions,
                generatedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Get personalization suggestions error:', error);
            res.status(500).json({
                error: 'Failed to get personalization suggestions',
                message: error.message
            });
        }
    });
    // Process adaptation request
    router.post('/adapt', async (req, res) => {
        try {
            const adaptationRequest = req.body;
            if (!adaptationRequest.userId || !adaptationRequest.context) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'userId and context are required'
                });
            }
            const result = await services.adaptiveUIService.adaptiveUIController.processAdaptationRequest(adaptationRequest);
            res.json({
                result,
                processedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Process adaptation request error:', error);
            res.status(500).json({
                error: 'Failed to process adaptation request',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=adaptive-ui.js.map