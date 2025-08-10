"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultGraphQLConfig = exports.GraphQLAPI = void 0;
const apollo_server_express_1 = require("apollo-server-express");
const graphql_1 = require("graphql");
const subscriptions_transport_ws_1 = require("subscriptions-transport-ws");
const schema_1 = require("@graphql-tools/schema");
const logger_1 = require("../../utils/logger");
const schema_2 = require("./schema");
const resolvers_1 = require("./resolvers");
class GraphQLAPI {
    server;
    subscriptionServer = null;
    redis;
    services;
    config;
    schema;
    constructor(redis, services, config) {
        this.redis = redis;
        this.services = services;
        this.config = config;
        // Create executable schema
        this.schema = (0, schema_1.makeExecutableSchema)({
            typeDefs: schema_2.typeDefs,
            resolvers: (0, resolvers_1.createResolvers)(services)
        });
        // Create Apollo Server
        this.server = new apollo_server_express_1.ApolloServer({
            schema: this.schema,
            context: this.createContext.bind(this),
            playground: this.config.playground,
            introspection: this.config.introspection,
            formatError: this.formatError.bind(this),
            formatResponse: this.formatResponse.bind(this),
            plugins: [
                {
                    requestDidStart() {
                        return {
                            didResolveOperation(requestContext) {
                                logger_1.logger.info(`GraphQL Operation: ${requestContext.request.operationName}`);
                            },
                            didEncounterErrors(requestContext) {
                                logger_1.logger.error('GraphQL Errors:', requestContext.errors);
                            }
                        };
                    }
                }
            ]
        });
    }
    async createContext({ req, connection }) {
        // Handle WebSocket connections (subscriptions)
        if (connection) {
            return {
                ...connection.context,
                services: this.services,
                redis: this.redis
            };
        }
        // Handle HTTP requests
        const context = {
            services: this.services,
            redis: this.redis,
            req,
            user: null,
            rateLimitInfo: null
        };
        // Authentication (if enabled)
        if (this.config.context.enableAuth) {
            context.user = await this.authenticateUser(req);
        }
        // Rate limiting (if enabled)
        if (this.config.context.enableRateLimit) {
            context.rateLimitInfo = await this.checkRateLimit(req);
            if (context.rateLimitInfo.exceeded) {
                throw new Error('Rate limit exceeded');
            }
        }
        return context;
    }
    async authenticateUser(req) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader) {
                return null;
            }
            const token = authHeader.replace('Bearer ', '');
            if (!token) {
                return null;
            }
            // This would typically validate JWT token or API key
            // For now, we'll return a mock user
            return {
                id: 'user_123',
                email: 'user@example.com',
                role: 'user'
            };
        }
        catch (error) {
            logger_1.logger.error('Authentication error:', error);
            return null;
        }
    }
    async checkRateLimit(req) {
        try {
            const clientId = req.ip || 'unknown';
            const key = `graphql_rate_limit:${clientId}`;
            const window = this.config.context.rateLimitWindow;
            const maxRequests = this.config.context.rateLimitMax;
            // Get current count
            const current = await this.redis.get(key);
            const count = current ? parseInt(current) : 0;
            if (count >= maxRequests) {
                return {
                    exceeded: true,
                    count,
                    limit: maxRequests,
                    resetTime: Date.now() + window
                };
            }
            // Increment counter
            if (count === 0) {
                await this.redis.setex(key, Math.ceil(window / 1000), 1);
            }
            else {
                await this.redis.incr(key);
            }
            return {
                exceeded: false,
                count: count + 1,
                limit: maxRequests,
                resetTime: Date.now() + window
            };
        }
        catch (error) {
            logger_1.logger.error('Rate limit check error:', error);
            return { exceeded: false, count: 0, limit: this.config.context.rateLimitMax };
        }
    }
    formatError(error) {
        logger_1.logger.error('GraphQL Error:', {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: error.extensions
        });
        // Don't expose internal errors in production
        const isDevelopment = process.env.NODE_ENV === 'development';
        return {
            message: error.message,
            locations: error.locations,
            path: error.path,
            extensions: {
                code: error.extensions?.code || 'INTERNAL_ERROR',
                timestamp: new Date().toISOString(),
                ...(isDevelopment && { stack: error.stack })
            }
        };
    }
    formatResponse(response, { request, context }) {
        // Add response metadata
        if (response.data) {
            response.extensions = {
                ...response.extensions,
                timestamp: new Date().toISOString(),
                operationName: request.operationName,
                ...(context.rateLimitInfo && {
                    rateLimit: {
                        remaining: context.rateLimitInfo.limit - context.rateLimitInfo.count,
                        resetTime: context.rateLimitInfo.resetTime
                    }
                })
            };
        }
        return response;
    }
    async applyMiddleware(app) {
        try {
            // Apply Apollo GraphQL middleware
            this.server.applyMiddleware({
                app,
                path: this.config.path,
                cors: this.config.cors
            });
            logger_1.logger.info(`GraphQL endpoint available at ${this.config.path}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to apply GraphQL middleware:', error);
            throw error;
        }
    }
    async createSubscriptionServer(httpServer) {
        try {
            this.subscriptionServer = subscriptions_transport_ws_1.SubscriptionServer.create({
                schema: this.schema,
                execute: graphql_1.execute,
                subscribe: graphql_1.subscribe,
                onConnect: async (connectionParams, webSocket, context) => {
                    logger_1.logger.info('GraphQL WebSocket connection established');
                    // Authentication for WebSocket connections
                    if (this.config.context.enableAuth && connectionParams.authorization) {
                        const user = await this.authenticateUser({
                            headers: { authorization: connectionParams.authorization }
                        });
                        return { user, services: this.services, redis: this.redis };
                    }
                    return { services: this.services, redis: this.redis };
                },
                onDisconnect: (webSocket, context) => {
                    logger_1.logger.info('GraphQL WebSocket connection closed');
                },
                onOperation: (message, params, webSocket) => {
                    logger_1.logger.info(`GraphQL Subscription Operation: ${params.operationName}`);
                    return params;
                },
                onOperationComplete: (webSocket, opId) => {
                    logger_1.logger.info(`GraphQL Subscription Operation Complete: ${opId}`);
                }
            }, {
                server: httpServer,
                path: this.config.subscriptionsPath
            });
            logger_1.logger.info(`GraphQL subscriptions available at ${this.config.subscriptionsPath}`);
        }
        catch (error) {
            logger_1.logger.error('Failed to create subscription server:', error);
            throw error;
        }
    }
    async start() {
        try {
            await this.server.start();
            logger_1.logger.info('GraphQL server started successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to start GraphQL server:', error);
            throw error;
        }
    }
    async stop() {
        try {
            if (this.subscriptionServer) {
                this.subscriptionServer.close();
                this.subscriptionServer = null;
            }
            await this.server.stop();
            logger_1.logger.info('GraphQL server stopped successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to stop GraphQL server:', error);
            throw error;
        }
    }
    getServer() {
        return this.server;
    }
}
exports.GraphQLAPI = GraphQLAPI;
// Default configuration
exports.defaultGraphQLConfig = {
    path: '/graphql',
    subscriptionsPath: '/graphql-subscriptions',
    playground: process.env.NODE_ENV === 'development',
    introspection: process.env.NODE_ENV === 'development',
    cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true
    },
    context: {
        enableAuth: process.env.ENABLE_AUTH === 'true',
        enableRateLimit: process.env.ENABLE_RATE_LIMIT === 'true',
        rateLimitMax: parseInt(process.env.GRAPHQL_RATE_LIMIT_MAX || '100'),
        rateLimitWindow: parseInt(process.env.GRAPHQL_RATE_LIMIT_WINDOW || '900000') // 15 minutes
    }
};
//# sourceMappingURL=index.js.map