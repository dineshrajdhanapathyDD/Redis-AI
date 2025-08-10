"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const environment_1 = __importDefault(require("@/config/environment"));
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
async function startServer() {
    try {
        // Initialize Redis connection
        logger_1.default.info('Initializing Redis connection...');
        const redisManager = (0, redis_1.createRedisManager)(environment_1.default.redis);
        await redisManager.connect();
        // Create vector index for AI platform
        await redisManager.createVectorIndex(environment_1.default.vectorIndex);
        // Test Redis connection
        const pingResult = await redisManager.ping();
        logger_1.default.info('Redis connection test successful', { ping: pingResult });
        // Initialize Express app
        const app = (0, express_1.default)();
        // Security middleware
        app.use((0, helmet_1.default)({
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
        if (environment_1.default.development.enableCors) {
            app.use((0, cors_1.default)({
                origin: environment_1.default.env === 'development' ? true : process.env.ALLOWED_ORIGINS?.split(','),
                credentials: true,
            }));
        }
        // Body parsing middleware
        app.use(express_1.default.json({ limit: '10mb' }));
        app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        app.use((req, res, next) => {
            const start = Date.now();
            res.on('finish', () => {
                const duration = Date.now() - start;
                logger_1.default.info('HTTP Request', {
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
                    environment: environment_1.default.env,
                    services: {
                        redis: 'connected',
                        api: 'running',
                    },
                });
            }
            catch (error) {
                logger_1.default.error('Health check failed', { error });
                res.status(503).json({
                    status: 'unhealthy',
                    timestamp: new Date().toISOString(),
                    error: 'Service unavailable',
                });
            }
        });
        // Initialize embedding system
        const { createEmbeddingManager } = await Promise.resolve().then(() => __importStar(require('./services/embedding-manager')));
        const embeddingManager = createEmbeddingManager();
        logger_1.default.info('Embedding system initialized');
        // Initialize search engine
        const { createSearchEngine } = await Promise.resolve().then(() => __importStar(require('./services/search')));
        const searchEngine = createSearchEngine({
            enableCrossModal: true,
            enableSemanticExpansion: true,
            maxResults: 20,
            rankingStrategy: 'general',
        });
        logger_1.default.info('Multi-modal search engine initialized');
        // Initialize AI routing service
        const { createAIRoutingService } = await Promise.resolve().then(() => __importStar(require('./services/ai-routing')));
        const aiRoutingService = createAIRoutingService({
            enablePerformanceMonitoring: true,
            enableCircuitBreakers: true,
            enableLoadBalancing: true,
            routingStrategy: 'balanced',
            maxRetries: 3,
        });
        logger_1.default.info('AI routing service initialized');
        // API routes
        app.get(`/api/${environment_1.default.apiVersion}`, (req, res) => {
            res.json({
                message: 'Redis AI Platform API',
                version: environment_1.default.apiVersion,
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
        app.get(`/api/${environment_1.default.apiVersion}/embeddings/stats`, async (req, res) => {
            try {
                const stats = await embeddingManager.getEmbeddingStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error('Failed to get embedding stats', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve embedding statistics',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Multi-modal search endpoint
        app.post(`/api/${environment_1.default.apiVersion}/search`, async (req, res) => {
            try {
                const { query, modalities, limit, threshold, filters } = req.body;
                if (!query) {
                    return res.status(400).json({
                        success: false,
                        error: 'Query is required',
                        timestamp: new Date().toISOString(),
                    });
                }
                const { createSearchQuery } = await Promise.resolve().then(() => __importStar(require('./services/search')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to perform multi-modal search', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to perform search',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Legacy embedding search endpoint (for backward compatibility)
        app.post(`/api/${environment_1.default.apiVersion}/embeddings/search`, async (req, res) => {
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
            }
            catch (error) {
                logger_1.default.error('Failed to search embeddings', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to search embeddings',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Search analytics endpoint
        app.get(`/api/${environment_1.default.apiVersion}/search/stats`, async (req, res) => {
            try {
                const stats = await searchEngine.getSearchStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error('Failed to get search stats', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve search statistics',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // AI routing endpoints
        app.post(`/api/${environment_1.default.apiVersion}/ai/route`, async (req, res) => {
            try {
                const { content, type, context, metadata } = req.body;
                if (!content || !type) {
                    return res.status(400).json({
                        success: false,
                        error: 'Content and type are required',
                        timestamp: new Date().toISOString(),
                    });
                }
                const { createAIRequest } = await Promise.resolve().then(() => __importStar(require('./services/ai-routing')));
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
            }
            catch (error) {
                logger_1.default.error('Failed to route AI request', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to route AI request',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // AI routing statistics endpoint
        app.get(`/api/${environment_1.default.apiVersion}/ai/stats`, async (req, res) => {
            try {
                const stats = await aiRoutingService.getRoutingStats();
                res.json({
                    success: true,
                    data: stats,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error('Failed to get AI routing stats', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve AI routing statistics',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Model health endpoint
        app.get(`/api/${environment_1.default.apiVersion}/ai/health/:modelId?`, async (req, res) => {
            try {
                const { modelId } = req.params;
                const health = await aiRoutingService.getModelHealth(modelId);
                res.json({
                    success: true,
                    data: health,
                    timestamp: new Date().toISOString(),
                });
            }
            catch (error) {
                logger_1.default.error('Failed to get model health', { error });
                res.status(500).json({
                    success: false,
                    error: 'Failed to retrieve model health',
                    timestamp: new Date().toISOString(),
                });
            }
        });
        // Error handling middleware
        app.use((error, req, res, next) => {
            logger_1.default.error('Unhandled error', {
                error: error.message,
                stack: error.stack,
                url: req.url,
                method: req.method,
            });
            res.status(error.status || 500).json({
                error: {
                    message: environment_1.default.env === 'development' ? error.message : 'Internal server error',
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
        const server = app.listen(environment_1.default.port, () => {
            logger_1.default.info('Redis AI Platform started successfully', {
                port: environment_1.default.port,
                environment: environment_1.default.env,
                apiVersion: environment_1.default.apiVersion,
                features: {
                    cors: environment_1.default.development.enableCors,
                    swagger: environment_1.default.development.enableSwagger,
                    metrics: environment_1.default.monitoring.enabled,
                },
            });
        });
        // Graceful shutdown
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`Received ${signal}, starting graceful shutdown...`);
            server.close(async () => {
                try {
                    await redisManager.disconnect();
                    logger_1.default.info('Graceful shutdown completed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.default.error('Error during shutdown', { error });
                    process.exit(1);
                }
            });
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    }
    catch (error) {
        logger_1.default.error('Failed to start server', { error });
        process.exit(1);
    }
}
// Start the application
startServer().catch((error) => {
    logger_1.default.error('Application startup failed', { error });
    process.exit(1);
});
//# sourceMappingURL=index.js.map