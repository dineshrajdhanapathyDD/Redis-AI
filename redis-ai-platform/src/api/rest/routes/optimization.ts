import { Router, Request, Response } from 'express';
import { APIServices } from '../index';
import { logger } from '../../../utils/logger';

export function optimizationRoutes(services: APIServices): Router {
  const router = Router();

  // Get system metrics
  router.get('/metrics', async (req: Request, res: Response) => {
    try {
      const { timeframe = '1h' } = req.query;

      const metrics = await services.optimizationService.metricsCollector.getSystemMetrics(
        timeframe as string
      );

      res.json({
        timeframe,
        metrics,
        collectedAt: Date.now()
      });

    } catch (error) {
      logger.error('Get metrics error:', error);
      res.status(500).json({
        error: 'Failed to get metrics',
        message: error.message
      });
    }
  });

  // Get optimization recommendations
  router.get('/recommendations', async (req: Request, res: Response) => {
    try {
      const recommendations = await services.optimizationService.optimizationEngine.getOptimizationRecommendations();

      res.json({
        recommendations,
        generatedAt: Date.now()
      });

    } catch (error) {
      logger.error('Get optimization recommendations error:', error);
      res.status(500).json({
        error: 'Failed to get optimization recommendations',
        message: error.message
      });
    }
  });

  // Detect anomalies
  router.get('/anomalies', async (req: Request, res: Response) => {
    try {
      const { timeframe = '24h' } = req.query;

      const anomalies = await services.optimizationService.anomalyDetector.detectAnomalies(
        timeframe as string
      );

      res.json({
        timeframe,
        anomalies,
        detectedAt: Date.now()
      });

    } catch (error) {
      logger.error('Detect anomalies error:', error);
      res.status(500).json({
        error: 'Failed to detect anomalies',
        message: error.message
      });
    }
  });

  return router;
}