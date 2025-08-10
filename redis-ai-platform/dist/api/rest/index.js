"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultAPIConfig = exports.RestAPI = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const logger_1 = require("../../utils/logger");
// Import route handlers
const search_1 = require("./routes/search");
const workspace_1 = require("./routes/workspace");
const ai_routing_1 = require("./routes/ai-routing");
const learning_1 = require("./routes/learning");
const code_intelligence_1 = require("./routes/code-intelligence");
const content_consistency_1 = require("./routes/content-consistency");
const optimization_1 = require("./routes/optimization");
const adaptive_ui_1 = require("./routes/adaptive-ui");
class RestAPI {
    app;
    redis;
    services;
    config;
    constructor(redis, services, config) {
        this.app = (0, express_1.default)();
        this.redis = redis;
        this.services = services;
        this.config = config;
        this.setupMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
    }
    setupMiddleware() {
        // Security middleware
        if (this.config.enableHelmet) {
            this.app.use((0, helmet_1.default)());
        }
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: this.config.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        // Rate limiting
        const limiter = (0, express_rate_limit_1.default)({
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
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        if (this.config.enableLogging) {
            this.app.use((req, res, next) => {
                const start = Date.now();
                res.on('finish', () => {
                    const duration = Date.now() - start;
                    logger_1.logger.info(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
                });
                next();
            });
        }
        // Health check endpoint
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                version: process.env.npm_package_version || '1.0.0'
            });
        });
        // API info endpoint
        this.app.get('/api/info', (req, res) => {
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
    setupRoutes() {
        // Mount route handlers
        this.app.use('/api/search', (0, search_1.searchRoutes)(this.services));
        this.app.use('/api/workspace', (0, workspace_1.workspaceRoutes)(this.services));
        this.app.use('/api/ai-routing', (0, ai_routing_1.aiRoutingRoutes)(this.services));
        this.app.use('/api/learning', (0, learning_1.learningRoutes)(this.services));
        this.app.use('/api/code-intelligence', (0, code_intelligence_1.codeIntelligenceRoutes)(this.services));
        this.app.use('/api/content-consistency', (0, content_consistency_1.contentConsistencyRoutes)(this.services));
        this.app.use('/api/optimization', (0, optimization_1.optimizationRoutes)(this.services));
        this.app.use('/api/adaptive-ui', (0, adaptive_ui_1.adaptiveUIRoutes)(this.services));
        // 404 handler for API routes
        this.app.use('/api/*', (req, res) => {
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
    setupErrorHandling() {
        // Global error handler
        this.app.use((error, req, res, next) => {
            logger_1.logger.error('API Error:', {
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
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.logger.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }
    getApp() {
        return this.app;
    }
    async start() {
        return new Promise((resolve, reject) => {
            try {
                const server = this.app.listen(this.config.port, () => {
                    logger_1.logger.info(`REST API server started on port ${this.config.port}`);
                    resolve();
                });
                server.on('error', (error) => {
                    logger_1.logger.error('Failed to start REST API server:', error);
                    reject(error);
                });
                // Graceful shutdown
                process.on('SIGTERM', () => {
                    logger_1.logger.info('SIGTERM received, shutting down gracefully');
                    server.close(() => {
                        logger_1.logger.info('REST API server closed');
                        process.exit(0);
                    });
                });
                process.on('SIGINT', () => {
                    logger_1.logger.info('SIGINT received, shutting down gracefully');
                    server.close(() => {
                        logger_1.logger.info('REST API server closed');
                        process.exit(0);
                    });
                });
            }
            catch (error) {
                logger_1.logger.error('Error starting REST API server:', error);
                reject(error);
            }
        });
    }
}
exports.RestAPI = RestAPI;
// Default configuration
exports.defaultAPIConfig = {
    port: parseInt(process.env.API_PORT || '3000'),
    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    rateLimitWindowMs: 15 * 60 * 1000, // 15 minutes
    rateLimitMaxRequests: 100, // limit each IP to 100 requests per windowMs
    enableHelmet: process.env.NODE_ENV === 'production',
    enableLogging: true
};
//# sourceMappingURL=index.js.map