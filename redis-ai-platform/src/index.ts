import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from '@/config/environment';
import { createRedisManager } from '@/config/redis';
import logger from '@/utils/logger';

async function startServer() {
  try {
    // Initialize Redis connection
    logger.info('Initializing Redis connection...');
    const redisManager = createRedisManager(config.redis);
    await redisManager.connect();

    // Create vector index for AI platform
    await redisManager.createVectorIndex(config.vectorIndex);

    // Test Redis connection
    const pingResult = await redisManager.ping();
    logger.info('Redis connection test successful', { ping: pingResult });

    // Initialize Express app
    const app = express();

    // Security middleware
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    }));

    // CORS configuration
    if (config.development.enableCors) {
      app.use(cors({
        origin: config.env === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(','),
        credentials: true,
      }));
    }

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    app.use((req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime: `${duration}ms`,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      });
      
      next();
    });

    // Health check endpoint
    app.get('/health', async (req, res) => {
      try {
        // Check Redis connection
        await redisManager.ping();
        
        res.status(200).json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: process.env.npm_package_version || '1.0.0',
          environment: config.env,
          services: {
            redis: 'connected',
            api: 'running',
          },
        });
      } catch (error) {
        logger.error('Health check failed', { error });
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Service unavailable',
        });
      }
    });

    // Initialize embedding system
    const { createEmbeddingManager } = await import('./services/embedding-manager');
    const embeddingManager = createEmbeddingManager();
    logger.info('Embedding system initialized');

    // Initialize search engine
    const { createSearchEngine } = await import('./services/search');
    const searchEngine = createSearchEngine({
      enableCrossModal: true,
      enableSemanticExpansion: true,
      maxResults: 20,
      rankingStrategy: 'general',
    });
    logger.info('Multi-modal search engine initialized');

    // Initialize AI routing service
    const { createAIRoutingService } = await import('./services/ai-routing');
    const aiRoutingService = createAIRoutingService({
      enablePerformanceMonitoring: true,
      enableCircuitBreakers: true,
      enableLoadBalancing: true,
      routingStrategy: 'balanced',
      maxRetries: 3,
    });
    logger.info('AI routing service initialized');

    // API routes
    app.get(`/api/${config.apiVersion}`, (req, res) => {
      res.json({
        message: 'Redis AI Platform API',
        version: config.apiVersion,
        timestamp: new Date().toISOString(),
        features: [
          'Multi-modal AI search',
          'Dynamic model routing',
          'Collaborative workspaces',
          'Adaptive learning',
          'Code intelligence',
          'Content consistency',
          'Predictive optimization',
          'Adaptive UI',
        ],
      });
    });

    // Embedding system endpoints
    app.get(`/api/${config.apiVersion}/embeddings/stats`, async (req, res) => {
      try {
        const stats = await embeddingManager.getEmbeddingStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get embedding stats', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve embedding statistics',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Multi-modal search endpoint
    app.post(`/api/${config.apiVersion}/search`, async (req, res) => {
      try {
        const { query, modalities, limit, threshold, filters } = req.body;
        
        if (!query) {
          return res.status(400).json({
            success: false,
            error: 'Query is required',
            timestamp: new Date().toISOString(),
          });
        }

        const { createSearchQuery } = await import('./services/search');
        const searchQuery = createSearchQuery(query, modalities, {
          limit,
          threshold,
          filters,
        });

        const searchResults = await searchEngine.search(searchQuery);

        res.json({
          success: true,
          data: {
            query: searchQuery.query,
            results: searchResults.results,
            analytics: searchResults.analytics,
            suggestions: searchResults.suggestions,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to perform multi-modal search', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to perform search',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Legacy embedding search endpoint (for backward compatibility)
    app.post(`/api/${config.apiVersion}/embeddings/search`, async (req, res) => {
      try {
        const { query, modalities, limit, threshold } = req.body;
        
        if (!query || !modalities) {
          return res.status(400).json({
            success: false,
            error: 'Query and modalities are required',
            timestamp: new Date().toISOString(),
          });
        }

        const searchResults = await embeddingManager.searchSimilarContent({
          query,
          modalities,
          limit: limit || 10,
          threshold: threshold || 0.7,
        });

        res.json({
          success: true,
          data: {
            query,
            results: searchResults,
            count: searchResults.length,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to search embeddings', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to search embeddings',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Search analytics endpoint
    app.get(`/api/${config.apiVersion}/search/stats`, async (req, res) => {
      try {
        const stats = await searchEngine.getSearchStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get search stats', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve search statistics',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // AI routing endpoints
    app.post(`/api/${config.apiVersion}/ai/route`, async (req, res) => {
      try {
        const { content, type, context, metadata } = req.body;
        
        if (!content || !type) {
          return res.status(400).json({
            success: false,
            error: 'Content and type are required',
            timestamp: new Date().toISOString(),
          });
        }

        const { createAIRequest } = await import('./services/ai-routing');
        const aiRequest = createAIRequest(content, type, {
          context,
          metadata,
        });

        const result = await aiRoutingService.routeRequest(aiRequest, context);

        res.json({
          success: true,
          data: {
            requestId: aiRequest.id,
            result: result.result,
            routing: result.routing,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to route AI request', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to route AI request',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // AI routing statistics endpoint
    app.get(`/api/${config.apiVersion}/ai/stats`, async (req, res) => {
      try {
        const stats = await aiRoutingService.getRoutingStats();
        res.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get AI routing stats', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve AI routing statistics',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Model health endpoint
    app.get(`/api/${config.apiVersion}/ai/health/:modelId?`, async (req, res) => {
      try {
        const { modelId } = req.params;
        const health = await aiRoutingService.getModelHealth(modelId);
        
        res.json({
          success: true,
          data: health,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error('Failed to get model health', { error });
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve model health',
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Error handling middleware
    app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      logger.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
      });

      res.status(error.status || 500).json({
        error: {
          message: config.env === 'development' ? error.message : 'Internal server error',
          status: error.status || 500,
          timestamp: new Date().toISOString(),
        },
      });
    });

    // 404 handler
    app.use('*', (req, res) => {
      res.status(404).json({
        error: {
          message: 'Route not found',
          status: 404,
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Start server
    const server = app.listen(config.port, () => {
      logger.info('Redis AI Platform started successfully', {
        port: config.port,
        environment: config.env,
        apiVersion: config.apiVersion,
        features: {
          cors: config.development.enableCors,
          swagger: config.development.enableSwagger,
          metrics: config.monitoring.enabled,
        },
      });
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}, starting graceful shutdown...`);
      
      server.close(async () => {
        try {
          await redisManager.disconnect();
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error });
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the application
startServer().catch((error) => {
  logger.error('Application startup failed', { error });
  process.exit(1);
});