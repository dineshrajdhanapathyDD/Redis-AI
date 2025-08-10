import { Router, Request, Response } from 'express';
import { APIServices } from '../index';
import { logger } from '../../../utils/logger';

export function contentConsistencyRoutes(services: APIServices): Router {
  const router = Router();

  // Analyze brand consistency
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { content, contentType, brandId, platform } = req.body;

      if (!content || !brandId) {
        return res.status(400).json({
          error: 'Content and brand ID are required',
          message: 'Please provide content and brandId'
        });
      }

      const analysis = await services.contentConsistencyService.brandAnalyzer.analyzeBrandConsistency(
        content,
        brandId,
        contentType,
        platform
      );

      res.json({
        brandId,
        contentType,
        platform,
        analysis: {
          consistencyScore: analysis.consistencyScore,
          brandAlignment: analysis.brandAlignment,
          suggestions: analysis.suggestions,
          violations: analysis.violations
        },
        analyzedAt: Date.now()
      });

    } catch (error) {
      logger.error('Brand consistency analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze brand consistency',
        message: error.message
      });
    }
  });

  // Adapt content for platform
  router.post('/adapt', async (req: Request, res: Response) => {
    try {
      const { content, sourcePlatform, targetPlatform, brandId } = req.body;

      if (!content || !targetPlatform) {
        return res.status(400).json({
          error: 'Content and target platform are required',
          message: 'Please provide content and targetPlatform'
        });
      }

      const adaptedContent = await services.contentConsistencyService.contentAdapter.adaptContent(
        content,
        sourcePlatform,
        targetPlatform,
        brandId
      );

      res.json({
        sourcePlatform,
        targetPlatform,
        brandId,
        adaptedContent: {
          content: adaptedContent.content,
          changes: adaptedContent.changes,
          confidence: adaptedContent.confidence,
          metadata: adaptedContent.metadata
        },
        adaptedAt: Date.now()
      });

    } catch (error) {
      logger.error('Content adaptation error:', error);
      res.status(500).json({
        error: 'Failed to adapt content',
        message: error.message
      });
    }
  });

  return router;
}