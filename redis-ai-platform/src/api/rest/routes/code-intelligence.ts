import { Router, Request, Response } from 'express';
import { APIServices } from '../index';
import { logger } from '../../../utils/logger';

export function codeIntelligenceRoutes(services: APIServices): Router {
  const router = Router();

  // Analyze code
  router.post('/analyze', async (req: Request, res: Response) => {
    try {
      const { code, language, filePath, context } = req.body;

      if (!code) {
        return res.status(400).json({
          error: 'Code is required',
          message: 'Please provide code to analyze'
        });
      }

      const analysis = await services.codeIntelligenceService.codeAnalyzer.analyzeCode(
        code,
        language,
        filePath,
        context
      );

      res.json({
        analysis: {
          complexity: analysis.complexity,
          quality: analysis.quality,
          patterns: analysis.patterns,
          suggestions: analysis.suggestions,
          metrics: analysis.metrics
        },
        language,
        filePath,
        analyzedAt: Date.now()
      });

    } catch (error) {
      logger.error('Code analysis error:', error);
      res.status(500).json({
        error: 'Failed to analyze code',
        message: error.message
      });
    }
  });

  // Generate code
  router.post('/generate', async (req: Request, res: Response) => {
    try {
      const { prompt, language, context, style } = req.body;

      if (!prompt) {
        return res.status(400).json({
          error: 'Prompt is required',
          message: 'Please provide a prompt for code generation'
        });
      }

      const generatedCode = await services.codeIntelligenceService.codeGenerator.generateCode(
        prompt,
        language,
        context,
        style
      );

      res.json({
        prompt,
        language,
        generatedCode: {
          code: generatedCode.code,
          explanation: generatedCode.explanation,
          confidence: generatedCode.confidence,
          alternatives: generatedCode.alternatives
        },
        generatedAt: Date.now()
      });

    } catch (error) {
      logger.error('Code generation error:', error);
      res.status(500).json({
        error: 'Failed to generate code',
        message: error.message
      });
    }
  });

  // Search similar code
  router.post('/search', async (req: Request, res: Response) => {
    try {
      const { query, language, limit = 10 } = req.body;

      if (!query) {
        return res.status(400).json({
          error: 'Query is required',
          message: 'Please provide a search query'
        });
      }

      const results = await services.codeIntelligenceService.codeAnalyzer.searchSimilarCode(
        query,
        language,
        limit
      );

      res.json({
        query,
        language,
        results,
        totalResults: results.length
      });

    } catch (error) {
      logger.error('Code search error:', error);
      res.status(500).json({
        error: 'Failed to search code',
        message: error.message
      });
    }
  });

  return router;
}