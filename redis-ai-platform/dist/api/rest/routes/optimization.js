"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizationRoutes = optimizationRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function optimizationRoutes(services) {
    const router = (0, express_1.Router)();
    // Get system metrics
    router.get('/metrics', async (req, res) => {
        try {
            const { timeframe = '1h' } = req.query;
            const metrics = await services.optimizationService.metricsCollector.getSystemMetrics(timeframe);
            res.json({
                timeframe,
                metrics,
                collectedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Get metrics error:', error);
            res.status(500).json({
                error: 'Failed to get metrics',
                message: error.message
            });
        }
    });
    // Get optimization recommendations
    router.get('/recommendations', async (req, res) => {
        try {
            const recommendations = await services.optimizationService.optimizationEngine.getOptimizationRecommendations();
            res.json({
                recommendations,
                generatedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Get optimization recommendations error:', error);
            res.status(500).json({
                error: 'Failed to get optimization recommendations',
                message: error.message
            });
        }
    });
    // Detect anomalies
    router.get('/anomalies', async (req, res) => {
        try {
            const { timeframe = '24h' } = req.query;
            const anomalies = await services.optimizationService.anomalyDetector.detectAnomalies(timeframe);
            res.json({
                timeframe,
                anomalies,
                detectedAt: Date.now()
            });
        }
        catch (error) {
            logger_1.logger.error('Detect anomalies error:', error);
            res.status(500).json({
                error: 'Failed to detect anomalies',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=optimization.js.map