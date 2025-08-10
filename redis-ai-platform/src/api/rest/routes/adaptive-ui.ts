import { Router, Request, Response } from 'express';
import { APIServices } from '../index';
import { logger } from '../../../utils/logger';

export function adaptiveUIRoutes(services: APIServices): Router {
  const router = Router();

  // Track user interaction
  router.post('/interactions', async (req: Request, res: Response) => {
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

    } catch (error) {
      logger.error('Track interaction error:', error);
      res.status(500).json({
        error: 'Failed to track interaction',
        message: error.message
      });
    }
  });

  // Get UI personalization suggestions
  router.get('/personalization/:userId', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;

      const patterns = await services.adaptiveUIService.interactionTracker.getUsagePatterns(userId);
      const suggestions = await services.adaptiveUIService.uiPersonalizer.generatePersonalizationSuggestions(
        userId,
        patterns
      );

      res.json({
        userId,
        suggestions,
        generatedAt: Date.now()
      });

    } catch (error) {
      logger.error('Get personalization suggestions error:', error);
      res.status(500).json({
        error: 'Failed to get personalization suggestions',
        message: error.message
      });
    }
  });

  // Process adaptation request
  router.post('/adapt', async (req: Request, res: Response) => {
    try {
      const adaptationRequest = req.body;

      if (!adaptationRequest.userId || !adaptationRequest.context) {
        return res.status(400).json({
          error: 'Missing required fields',
          message: 'userId and context are required'
        });
      }

      const result = await services.adaptiveUIService.adaptiveUIController.processAdaptationRequest(
        adaptationRequest
      );

      res.json({
        result,
        processedAt: Date.now()
      });

    } catch (error) {
      logger.error('Process adaptation request error:', error);
      res.status(500).json({
        error: 'Failed to process adaptation request',
        message: error.message
      });
    }
  });

  return router;
}