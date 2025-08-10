"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIRoutingService = exports.createRoutingEngine = exports.getRoutingEngine = exports.RoutingEngine = exports.createRequestAnalyzer = exports.getRequestAnalyzer = exports.RequestAnalyzer = exports.createPerformanceMonitor = exports.getPerformanceMonitor = exports.PerformanceMonitor = exports.createModelRegistry = exports.getModelRegistry = exports.ModelRegistry = void 0;
exports.createAIRoutingService = createAIRoutingService;
exports.createAIRequest = createAIRequest;
exports.validateAIRequest = validateAIRequest;
// Export all AI routing components
var model_registry_1 = require("./model-registry");
Object.defineProperty(exports, "ModelRegistry", { enumerable: true, get: function () { return model_registry_1.ModelRegistry; } });
Object.defineProperty(exports, "getModelRegistry", { enumerable: true, get: function () { return model_registry_1.getModelRegistry; } });
Object.defineProperty(exports, "createModelRegistry", { enumerable: true, get: function () { return model_registry_1.createModelRegistry; } });
var performance_monitor_1 = require("./performance-monitor");
Object.defineProperty(exports, "PerformanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.PerformanceMonitor; } });
Object.defineProperty(exports, "getPerformanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.getPerformanceMonitor; } });
Object.defineProperty(exports, "createPerformanceMonitor", { enumerable: true, get: function () { return performance_monitor_1.createPerformanceMonitor; } });
var request_analyzer_1 = require("./request-analyzer");
Object.defineProperty(exports, "RequestAnalyzer", { enumerable: true, get: function () { return request_analyzer_1.RequestAnalyzer; } });
Object.defineProperty(exports, "getRequestAnalyzer", { enumerable: true, get: function () { return request_analyzer_1.getRequestAnalyzer; } });
Object.defineProperty(exports, "createRequestAnalyzer", { enumerable: true, get: function () { return request_analyzer_1.createRequestAnalyzer; } });
var routing_engine_1 = require("./routing-engine");
Object.defineProperty(exports, "RoutingEngine", { enumerable: true, get: function () { return routing_engine_1.RoutingEngine; } });
Object.defineProperty(exports, "getRoutingEngine", { enumerable: true, get: function () { return routing_engine_1.getRoutingEngine; } });
Object.defineProperty(exports, "createRoutingEngine", { enumerable: true, get: function () { return routing_engine_1.createRoutingEngine; } });
const model_registry_2 = require("./model-registry");
const performance_monitor_2 = require("./performance-monitor");
const request_analyzer_2 = require("./request-analyzer");
const routing_engine_2 = require("./routing-engine");
const types_1 = require("@/types");
const environment_1 = __importDefault(require("@/config/environment"));
const logger_1 = __importDefault(require("@/utils/logger"));
class AIRoutingService {
    modelRegistry = (0, model_registry_2.getModelRegistry)();
    performanceMonitor = (0, performance_monitor_2.getPerformanceMonitor)();
    requestAnalyzer = (0, request_analyzer_2.getRequestAnalyzer)();
    routingEngine;
    config;
    healthCheckTimer;
    constructor(routingConfig) {
        this.config = {
            enablePerformanceMonitoring: true,
            enableCircuitBreakers: true,
            enableLoadBalancing: true,
            enableCostOptimization: false,
            routingStrategy: 'balanced',
            fallbackBehavior: 'alternative',
            maxRetries: 3,
            healthCheckInterval: 30000, // 30 seconds
            ...routingConfig,
        };
        // Create routing engine with appropriate configuration
        const engineConfig = this.createEngineConfig();
        this.routingEngine = (0, routing_engine_2.createRoutingEngine)(engineConfig);
        // Initialize default models
        this.initializeDefaultModels();
        // Start health monitoring
        if (this.config.enablePerformanceMonitoring) {
            this.startHealthMonitoring();
        }
        logger_1.default.info('AI Routing Service initialized', {
            config: this.config,
        });
    }
    async routeRequest(request, context) {
        const startTime = Date.now();
        try {
            // Route the request
            const routingDecision = await this.routingEngine.route(request, context);
            // Execute the request
            const result = await this.routingEngine.executeRequest(request, routingDecision, context);
            const totalLatency = Date.now() - startTime;
            logger_1.default.info('Request routed and executed successfully', {
                requestId: request.id,
                requestType: request.type,
                selectedModel: routingDecision.selectedModel.id,
                totalLatency,
                confidence: routingDecision.confidence,
            });
            return {
                result,
                routing: {
                    selectedModel: routingDecision.selectedModel.id,
                    latency: totalLatency,
                    cost: routingDecision.estimatedCost,
                    confidence: routingDecision.confidence,
                    alternatives: routingDecision.alternativeModels.map(m => m.id),
                },
            };
        }
        catch (error) {
            logger_1.default.error('Failed to route and execute request', {
                requestId: request.id,
                requestType: request.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async registerModel(modelConfig) {
        try {
            // Validate model configuration
            const validation = this.modelRegistry.validateModelConfig(modelConfig);
            if (!validation.isValid) {
                throw new Error(`Invalid model configuration: ${validation.errors.join(', ')}`);
            }
            // Register the model
            this.modelRegistry.registerModel(modelConfig);
            logger_1.default.info('Model registered successfully', {
                modelId: modelConfig.id,
                name: modelConfig.name,
                provider: modelConfig.provider,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to register model', {
                modelId: modelConfig.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async unregisterModel(modelId) {
        try {
            const success = this.modelRegistry.unregisterModel(modelId);
            if (success) {
                logger_1.default.info('Model unregistered successfully', { modelId });
            }
            else {
                logger_1.default.warn('Model not found for unregistration', { modelId });
            }
            return success;
        }
        catch (error) {
            logger_1.default.error('Failed to unregister model', {
                modelId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getModelHealth(modelId) {
        try {
            if (modelId) {
                return await this.performanceMonitor.getModelHealthStatus(modelId);
            }
            else {
                return await this.performanceMonitor.getAllModelsHealth();
            }
        }
        catch (error) {
            logger_1.default.error('Failed to get model health', {
                modelId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getRoutingStats() {
        try {
            const [routingMetrics, healthStatus, registryStats] = await Promise.all([
                this.routingEngine.getMetrics(),
                this.routingEngine.getHealthStatus(),
                this.modelRegistry.getRegistryStats(),
            ]);
            return {
                totalRequests: routingMetrics.totalRequests,
                successRate: routingMetrics.totalRequests > 0
                    ? routingMetrics.successfulRoutes / routingMetrics.totalRequests
                    : 0,
                averageLatency: routingMetrics.averageDecisionTime,
                modelUsage: routingMetrics.modelUsageDistribution,
                healthStatus,
                registryStats,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get routing stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        // Update routing engine configuration
        const engineConfig = this.createEngineConfig();
        this.routingEngine.updateConfig(engineConfig);
        logger_1.default.info('AI Routing Service configuration updated', {
            config: this.config,
        });
    }
    createEngineConfig() {
        const strategyWeights = {
            performance: { performance: 0.6, cost: 0.1, quality: 0.2, availability: 0.1 },
            cost: { performance: 0.2, cost: 0.5, quality: 0.2, availability: 0.1 },
            quality: { performance: 0.2, cost: 0.1, quality: 0.6, availability: 0.1 },
            balanced: { performance: 0.3, cost: 0.2, quality: 0.3, availability: 0.2 },
        };
        return {
            enableLoadBalancing: this.config.enableLoadBalancing,
            enableFailover: true,
            maxRetries: this.config.maxRetries,
            costOptimization: this.config.enableCostOptimization,
            latencyOptimization: this.config.routingStrategy === 'performance',
            qualityOptimization: this.config.routingStrategy === 'quality',
            weights: strategyWeights[this.config.routingStrategy],
        };
    }
    initializeDefaultModels() {
        try {
            // Register OpenAI models if API key is available
            if (environment_1.default.ai.openaiApiKey) {
                this.registerDefaultOpenAIModels();
            }
            // Register Anthropic models if API key is available
            if (environment_1.default.ai.anthropicApiKey) {
                this.registerDefaultAnthropicModels();
            }
            // Register local models as fallback
            this.registerDefaultLocalModels();
        }
        catch (error) {
            logger_1.default.error('Failed to initialize default models', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    registerDefaultOpenAIModels() {
        const openAIModels = [
            {
                id: 'gpt-4',
                name: 'GPT-4',
                provider: 'openai',
                endpoint: {
                    id: 'gpt-4',
                    name: 'GPT-4',
                    provider: 'openai',
                    url: 'https://api.openai.com/v1/chat/completions',
                    capabilities: ['text-generation', 'code-generation', 'reasoning'],
                    pricing: {
                        inputTokenCost: 0.03,
                        outputTokenCost: 0.06,
                        currency: 'USD',
                    },
                    performance: {
                        averageLatency: 2000,
                        throughput: 10,
                        accuracy: 0.95,
                        availability: 0.99,
                        errorRate: 0.01,
                    },
                },
                capabilities: [
                    {
                        requestType: types_1.AIRequestType.TEXT_GENERATION,
                        maxTokens: 8192,
                        supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
                        specializations: ['reasoning', 'analysis', 'creative-writing'],
                        qualityScore: 0.95,
                    },
                    {
                        requestType: types_1.AIRequestType.CODE_GENERATION,
                        maxTokens: 8192,
                        supportedLanguages: ['en'],
                        specializations: ['programming', 'debugging', 'code-review'],
                        qualityScore: 0.90,
                    },
                    {
                        requestType: types_1.AIRequestType.QUESTION_ANSWERING,
                        maxTokens: 8192,
                        supportedLanguages: ['en', 'es', 'fr', 'de'],
                        specializations: ['reasoning', 'factual-qa', 'analysis'],
                        qualityScore: 0.92,
                    },
                ],
                constraints: {
                    maxConcurrentRequests: 100,
                    rateLimitPerMinute: 3500,
                    maxRequestSize: 32768,
                    requiredHeaders: ['Authorization', 'Content-Type'],
                    supportedFormats: ['json'],
                },
                priority: 90,
            },
            {
                id: 'gpt-3.5-turbo',
                name: 'GPT-3.5 Turbo',
                provider: 'openai',
                endpoint: {
                    id: 'gpt-3.5-turbo',
                    name: 'GPT-3.5 Turbo',
                    provider: 'openai',
                    url: 'https://api.openai.com/v1/chat/completions',
                    capabilities: ['text-generation', 'code-generation'],
                    pricing: {
                        inputTokenCost: 0.001,
                        outputTokenCost: 0.002,
                        currency: 'USD',
                    },
                    performance: {
                        averageLatency: 1000,
                        throughput: 20,
                        accuracy: 0.85,
                        availability: 0.99,
                        errorRate: 0.01,
                    },
                },
                capabilities: [
                    {
                        requestType: types_1.AIRequestType.TEXT_GENERATION,
                        maxTokens: 4096,
                        supportedLanguages: ['en', 'es', 'fr', 'de', 'it'],
                        specializations: ['general-purpose', 'conversation'],
                        qualityScore: 0.85,
                    },
                    {
                        requestType: types_1.AIRequestType.CODE_GENERATION,
                        maxTokens: 4096,
                        supportedLanguages: ['en'],
                        specializations: ['programming', 'scripting'],
                        qualityScore: 0.80,
                    },
                ],
                constraints: {
                    maxConcurrentRequests: 200,
                    rateLimitPerMinute: 10000,
                    maxRequestSize: 16384,
                    requiredHeaders: ['Authorization', 'Content-Type'],
                    supportedFormats: ['json'],
                },
                priority: 70,
            },
        ];
        for (const model of openAIModels) {
            try {
                this.modelRegistry.registerModel(model);
            }
            catch (error) {
                logger_1.default.warn('Failed to register OpenAI model', {
                    modelId: model.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    registerDefaultAnthropicModels() {
        const anthropicModels = [
            {
                id: 'claude-2',
                name: 'Claude 2',
                provider: 'anthropic',
                endpoint: {
                    id: 'claude-2',
                    name: 'Claude 2',
                    provider: 'anthropic',
                    url: 'https://api.anthropic.com/v1/messages',
                    capabilities: ['text-generation', 'analysis', 'reasoning'],
                    pricing: {
                        inputTokenCost: 0.008,
                        outputTokenCost: 0.024,
                        currency: 'USD',
                    },
                    performance: {
                        averageLatency: 2500,
                        throughput: 8,
                        accuracy: 0.93,
                        availability: 0.98,
                        errorRate: 0.02,
                    },
                },
                capabilities: [
                    {
                        requestType: types_1.AIRequestType.TEXT_GENERATION,
                        maxTokens: 100000,
                        supportedLanguages: ['en', 'fr', 'es', 'de'],
                        specializations: ['long-form', 'analysis', 'reasoning'],
                        qualityScore: 0.93,
                    },
                    {
                        requestType: types_1.AIRequestType.QUESTION_ANSWERING,
                        maxTokens: 100000,
                        supportedLanguages: ['en'],
                        specializations: ['reasoning', 'analysis', 'research'],
                        qualityScore: 0.94,
                    },
                ],
                constraints: {
                    maxConcurrentRequests: 50,
                    rateLimitPerMinute: 1000,
                    maxRequestSize: 200000,
                    requiredHeaders: ['x-api-key', 'Content-Type'],
                    supportedFormats: ['json'],
                },
                priority: 85,
            },
        ];
        for (const model of anthropicModels) {
            try {
                this.modelRegistry.registerModel(model);
            }
            catch (error) {
                logger_1.default.warn('Failed to register Anthropic model', {
                    modelId: model.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    registerDefaultLocalModels() {
        const localModels = [
            {
                id: 'local-text-generator',
                name: 'Local Text Generator',
                provider: 'local',
                endpoint: {
                    id: 'local-text-generator',
                    name: 'Local Text Generator',
                    provider: 'local',
                    url: 'http://localhost:8080/generate',
                    capabilities: ['text-generation'],
                    pricing: {
                        inputTokenCost: 0,
                        outputTokenCost: 0,
                        currency: 'USD',
                    },
                    performance: {
                        averageLatency: 3000,
                        throughput: 5,
                        accuracy: 0.70,
                        availability: 0.95,
                        errorRate: 0.05,
                    },
                },
                capabilities: [
                    {
                        requestType: types_1.AIRequestType.TEXT_GENERATION,
                        maxTokens: 2048,
                        supportedLanguages: ['en'],
                        specializations: ['general-purpose'],
                        qualityScore: 0.70,
                    },
                ],
                constraints: {
                    maxConcurrentRequests: 10,
                    rateLimitPerMinute: 100,
                    maxRequestSize: 8192,
                    requiredHeaders: ['Content-Type'],
                    supportedFormats: ['json'],
                },
                priority: 30,
            },
        ];
        for (const model of localModels) {
            try {
                this.modelRegistry.registerModel(model);
            }
            catch (error) {
                logger_1.default.warn('Failed to register local model', {
                    modelId: model.id,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }
    }
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(async () => {
            try {
                const healthStatus = await this.performanceMonitor.getAllModelsHealth();
                // Update model active status based on health
                for (const [modelId, health] of Object.entries(healthStatus)) {
                    const isHealthy = health.isHealthy;
                    this.modelRegistry.setModelActive(modelId, isHealthy);
                }
            }
            catch (error) {
                logger_1.default.error('Health monitoring failed', {
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }, this.config.healthCheckInterval);
    }
    async cleanup() {
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
        }
        await this.performanceMonitor.cleanup();
        logger_1.default.info('AI Routing Service cleanup completed');
    }
}
exports.AIRoutingService = AIRoutingService;
// Factory function to create AI routing service
function createAIRoutingService(config) {
    return new AIRoutingService(config);
}
// Utility functions
function createAIRequest(content, type, options = {}) {
    return {
        id: options.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        content,
        type,
        context: options.context,
        preferences: options.preferences,
        metadata: {
            priority: 'medium',
            maxLatency: 10000,
            maxCost: 1.0,
            requiredCapabilities: [],
            timestamp: new Date(),
            ...options.metadata,
        },
    };
}
function validateAIRequest(request) {
    const errors = [];
    if (!request.id || typeof request.id !== 'string') {
        errors.push('Request ID is required and must be a string');
    }
    if (!request.content || typeof request.content !== 'string') {
        errors.push('Request content is required and must be a string');
    }
    if (!Object.values(types_1.AIRequestType).includes(request.type)) {
        errors.push(`Invalid request type: ${request.type}`);
    }
    if (!request.metadata || typeof request.metadata !== 'object') {
        errors.push('Request metadata is required');
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
//# sourceMappingURL=index.js.map