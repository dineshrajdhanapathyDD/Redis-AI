import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

// Import route handlers
import { searchRoutes } from './routes/search';
import { workspaceRoutes } from './routes/workspace';
import { aiRoutingRoutes } from './routes/ai-routing';
import { learningRoutes } from './routes/learning';
import { codeIntelligenceRoutes } from './routes/code-intelligence';
import { contentConsistencyRoutes } from './routes/content-consistency';
import { optimizationRoutes } from './routes/optimization';
import { adaptiveUIRoutes } from './routes/adaptive-ui';

// Import services
import { EmbeddingManager } from '../../services/embedding-manager';
import { VectorStorage } from '../../services/vector-storage';
import { MultiModalSearch } from '../../services/search';
import { WorkspaceService } from '../../services/workspace';
import { AIRoutingService } from '../../services/ai-routing';
import { LearningService } from '../../services/learning';
import { CodeIntelligenceService } from '../../services/code-intelligence';
import { ContentConsistencyService } from '../../services/content-consistency';
import { OptimizationService } from '../../services/optimization';
import { AdaptiveUIService } from '../../services/adaptive-ui';

export interface APIServices {
  embeddingManager: EmbeddingManager;
  vectorStorage: VectorStorage;
  multiModalSearch: MultiModalSearch;
  workspaceService: WorkspaceService;
  aiRoutingService: AIRoutingService;
  learningService: LearningService;
  codeIntelligenceService: CodeIntelligenceService;
  contentConsistencyService: ContentConsistencyService;
  optimizationService: OptimizationService;
  adaptiveUIService: AdaptiveUIService;
}

export interface APIConfig {
  port: number;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  enableHelmet: boolean;
  enableLogging: boolean;
}

export class RestAPI {
  private app: Express;
  private redis: Redis;
  private services: APIServices;
  private config: APIConfig;

  constructor(redis: Redis, services: APIServices, config: APIConfig) {
    this.app = express();
    this.redis = redis;
    this.services = services;
    this.config = config;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security middleware
    if (this.config.enableHelmet) {
      this.app.use(helmet());
    }

    // CORS configuration
    this.app.use(cors({
      origin: this.config.corsOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: this.config.rateLimitWindowMs,
      max: this.config.rateLimitMaxRequests,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(this.config.rateLimitWindowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false
    });
    this.app.use(limiter);

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request logging middleware
    if (this.config.enableLogging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        const start = Date.now();
        
        res.on('finish', () => {
          const duration = Date.now() - start;
          logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
        });
        
        next();
      });
    }

    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0'
      });
    });

    // API info endpoint
    this.app.get('/api/info', (req: Request, res: Response) => {
      res.json({
        name: 'Redis AI Platform API',
        version: '1.0.0',
        description: 'REST API for Redis-powered AI platform',
        endpoints: {
          search: '/api/search',
          workspace: '/api/workspace',
          aiRouting: '/api/ai-routing',
          learning: '/api/learning',
          codeIntelligence: '/api/code-intelligence',
          contentConsistency: '/api/content-consistency',
          optimization: '/api/optimization',
          adaptiveUI: '/api/adaptive-ui'
        },
        documentation: '/api/docs'
      });
    });
  }

  private setupRoutes(): void {
    // Mount route handlers
    this.app.use('/api/search', searchRoutes(this.services));
    this.app.use('/api/workspace', workspaceRoutes(this.services));
    this.app.use('/api/ai-routing', aiRoutingRoutes(this.services));
    this.app.use('/api/learning', learningRoutes(this.services));
    this.app.use('/api/code-intelligence', codeIntelligenceRoutes(this.services));
    this.app.use('/api/content-consistency', contentConsistencyRoutes(this.services));
    this.app.use('/api/optimization', optimizationRoutes(this.services));
    this.app.use('/api/adaptive-ui', adaptiveUIRoutes(this.services));

    // 404 handler for API routes
    this.app.use('/api/*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'API endpoint not found',
        path: req.path,
        method: req.method,
        availableEndpoints: [
          '/api/search',
          '/api/workspace',
          '/api/ai-routing',
          '/api/learning',
          '/api/code-intelligence',
          '/api/content-consistency',
          '/api/optimization',
          '/api/adaptive-ui'
        ]
      });
    });
  }

  private setupErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('API Error:', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method,
        body: req.body,
        query: req.query
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        error: 'Internal server error',
        message: isDevelopment ? error.message : 'Something went wrong',
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
      });
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });
  }

  public getApp(): Express {
    return this.app;
  }

  public async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const server = this.app.listen(this.config.port, () => {
          logger.info(`REST API server started on port ${this.config.port}`);
          resolve();
        });

        server.on('error', (error: Error) => {
          logger.error('Failed to start REST API server:', error);
          reject(error);
        });

        // Graceful shutdown
        process.on('SIGTERM', () => {
          logger.info('SIGTERM received, shutting down gracefully');
          server.close(() => {
            logger.info('REST API server closed');
            process.exit(0);
          });
        });

        process.on('SIGINT', () => {
          logger.info('SIGINT received, shutting down gracefully');
          server.close(() => {
            logger.info('REST API server closed');
            process.exit(0);
          });
        });

      } catch (error) {
        logger.error('Error starting REST API server:', error);
        reject(error);
      }
    });
  }
}

// Default configuration
export const defaultAPIConfig: APIConfig = {
  port: parseInt(process.env.API_PORT || '3000'),
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
  rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
  rateLimitMaxRequests: 100, // limit each IP to 100 requests per windowMs
  enableHelmet: process.env.NODE_ENV === 'production',
  enableLogging: true
};