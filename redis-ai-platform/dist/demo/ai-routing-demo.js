"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAIRoutingDemo = runAIRoutingDemo;
const ai_routing_1 = require("../services/ai-routing");
const redis_1 = require("../config/redis");
const types_1 = require("../types");
const environment_1 = __importDefault(require("../config/environment"));
const logger_1 = __importDefault(require("../utils/logger"));
async function runAIRoutingDemo() {
    try {
        logger_1.default.info('Starting Redis AI Platform AI Routing Demo');
        // Initialize Redis connection
        const redisManager = (0, redis_1.createRedisManager)(environment_1.default.redis);
        await redisManager.connect();
        // Initialize AI routing service
        const aiRoutingService = (0, ai_routing_1.createAIRoutingService)({
            enablePerformanceMonitoring: true,
            enableCircuitBreakers: true,
            enableLoadBalancing: true,
            routingStrategy: 'balanced',
            maxRetries: 3,
        });
        logger_1.default.info('AI Routing Service initialized successfully');
        // Demo 1: Basic request routing
        logger_1.default.info('Demo 1: Basic AI request routing');
        const basicRequest = (0, ai_routing_1.createAIRequest)('Explain the concept of vector databases and their applications in AI systems', types_1.AIRequestType.TEXT_GENERATION, {
            metadata: {
                priority: 'medium',
                maxLatency: 5000,
            },
        });
        const basicResult = await aiRoutingService.routeRequest(basicRequest);
        logger_1.default.info('Basic request routed successfully:', {
            requestId: basicRequest.id,
            selectedModel: basicResult.routing.selectedModel,
            latency: `${basicResult.routing.latency}ms`,
            confidence: basicResult.routing.confidence.toFixed(3),
            alternatives: basicResult.routing.alternatives,
        });
        // Demo 2: Code generation request
        logger_1.default.info('Demo 2: Code generation request routing');
        const codeRequest = (0, ai_routing_1.createAIRequest)(`Write a TypeScript function that implements a Redis-based vector similarity search:
      
      Requirements:
      - Function should accept a query vector and return similar vectors
      - Use Redis Vector Similarity Search (VSS)
      - Include error handling and logging
      - Return results with similarity scores`, types_1.AIRequestType.CODE_GENERATION, {
            metadata: {
                priority: 'high',
                requiredCapabilities: ['programming', 'typescript'],
                maxLatency: 3000,
            },
        });
        const codeResult = await aiRoutingService.routeRequest(codeRequest);
        logger_1.default.info('Code generation request routed:', {
            requestId: codeRequest.id,
            selectedModel: codeResult.routing.selectedModel,
            latency: `${codeResult.routing.latency}ms`,
            estimatedCost: `$${codeResult.routing.cost.toFixed(4)}`,
        });
        // Demo 3: Question answering with context
        logger_1.default.info('Demo 3: Question answering with user context');
        const qaRequest = (0, ai_routing_1.createAIRequest)('What are the key differences between HNSW and FLAT vector indexing algorithms in Redis?', types_1.AIRequestType.QUESTION_ANSWERING, {
            context: {
                userId: 'demo-user',
                sessionId: 'demo-session',
                conversationHistory: [
                    {
                        role: 'user',
                        content: 'I\'m learning about vector databases',
                    },
                    {
                        role: 'assistant',
                        content: 'Vector databases are specialized for storing and querying high-dimensional vectors',
                    },
                ],
                userPreferences: {
                    preferredModels: ['gpt-4'],
                    responseStyle: 'technical',
                },
            },
            metadata: {
                priority: 'medium',
                requiredCapabilities: ['reasoning', 'technical-knowledge'],
            },
        });
        const qaResult = await aiRoutingService.routeRequest(qaRequest, qaRequest.context);
        logger_1.default.info('Q&A request routed with context:', {
            requestId: qaRequest.id,
            selectedModel: qaResult.routing.selectedModel,
            confidence: qaResult.routing.confidence.toFixed(3),
            hasContext: !!qaRequest.context,
        });
        // Demo 4: Batch request processing
        logger_1.default.info('Demo 4: Batch request processing with different priorities');
        const batchRequests = [
            (0, ai_routing_1.createAIRequest)('Summarize the benefits of using Redis for AI applications', types_1.AIRequestType.SUMMARIZATION, { metadata: { priority: 'low' } }),
            (0, ai_routing_1.createAIRequest)('URGENT: Translate this error message to Spanish: "Vector index not found"', types_1.AIRequestType.TRANSLATION, { metadata: { priority: 'high', maxLatency: 1000 } }),
            (0, ai_routing_1.createAIRequest)('Generate a creative story about an AI that learns to paint', types_1.AIRequestType.TEXT_GENERATION, { metadata: { priority: 'medium', requiredCapabilities: ['creativity'] } }),
        ];
        const batchResults = await Promise.all(batchRequests.map(request => aiRoutingService.routeRequest(request)));
        logger_1.default.info('Batch requests processed:', {
            totalRequests: batchRequests.length,
            results: batchResults.map((result, index) => ({
                requestType: batchRequests[index].type,
                selectedModel: result.routing.selectedModel,
                latency: `${result.routing.latency}ms`,
                priority: batchRequests[index].metadata.priority,
            })),
        });
        // Demo 5: Model performance and health monitoring
        logger_1.default.info('Demo 5: Model performance and health monitoring');
        const routingStats = await aiRoutingService.getRoutingStats();
        logger_1.default.info('Current routing statistics:', {
            totalRequests: routingStats.totalRequests,
            successRate: `${(routingStats.successRate * 100).toFixed(1)}%`,
            averageLatency: `${routingStats.averageLatency.toFixed(0)}ms`,
            modelUsage: routingStats.modelUsage,
            activeModels: routingStats.registryStats.activeModels,
        });
        // Get health status for all models
        const healthStatus = await aiRoutingService.getModelHealth();
        logger_1.default.info('Model health status:', {
            modelsChecked: Object.keys(healthStatus).length,
            healthyModels: Object.values(healthStatus).filter((h) => h.isHealthy).length,
            modelDetails: Object.entries(healthStatus).map(([modelId, health]) => ({
                modelId,
                isHealthy: health.isHealthy,
                issues: health.issues,
                responseTime: `${health.performance.averageLatency.toFixed(0)}ms`,
                availability: `${(health.performance.availability * 100).toFixed(1)}%`,
            })),
        });
        // Demo 6: Dynamic configuration updates
        logger_1.default.info('Demo 6: Dynamic configuration updates');
        // Switch to cost-optimized routing
        aiRoutingService.updateConfiguration({
            routingStrategy: 'cost',
            enableCostOptimization: true,
        });
        const costOptimizedRequest = (0, ai_routing_1.createAIRequest)('Generate a brief explanation of machine learning', types_1.AIRequestType.TEXT_GENERATION);
        const costOptimizedResult = await aiRoutingService.routeRequest(costOptimizedRequest);
        logger_1.default.info('Cost-optimized routing result:', {
            selectedModel: costOptimizedResult.routing.selectedModel,
            estimatedCost: `$${costOptimizedResult.routing.cost.toFixed(4)}`,
            strategy: 'cost-optimized',
        });
        // Switch to performance-optimized routing
        aiRoutingService.updateConfiguration({
            routingStrategy: 'performance',
            enableCostOptimization: false,
        });
        const performanceOptimizedRequest = (0, ai_routing_1.createAIRequest)('Generate a brief explanation of machine learning', types_1.AIRequestType.TEXT_GENERATION, { metadata: { maxLatency: 2000 } });
        const performanceOptimizedResult = await aiRoutingService.routeRequest(performanceOptimizedRequest);
        logger_1.default.info('Performance-optimized routing result:', {
            selectedModel: performanceOptimizedResult.routing.selectedModel,
            latency: `${performanceOptimizedResult.routing.latency}ms`,
            strategy: 'performance-optimized',
        });
        // Demo 7: Error handling and fallback scenarios
        logger_1.default.info('Demo 7: Error handling and fallback scenarios');
        try {
            // Try to route an unsupported request type
            const unsupportedRequest = (0, ai_routing_1.createAIRequest)('Analyze this image: [image data]', types_1.AIRequestType.IMAGE_ANALYSIS // No models registered for this type
            );
            await aiRoutingService.routeRequest(unsupportedRequest);
        }
        catch (error) {
            logger_1.default.info('Expected error for unsupported request type:', {
                error: error instanceof Error ? error.message : 'Unknown error',
                handled: true,
            });
        }
        // Demo 8: Model registration and management
        logger_1.default.info('Demo 8: Model registration and management');
        // Register a custom model
        try {
            await aiRoutingService.registerModel({
                id: 'demo-custom-model',
                name: 'Demo Custom Model',
                provider: 'custom',
                endpoint: {
                    id: 'demo-custom-model',
                    name: 'Demo Custom Model',
                    provider: 'custom',
                    url: 'http://localhost:8080/generate',
                    capabilities: ['text-generation'],
                    pricing: {
                        inputTokenCost: 0.001,
                        outputTokenCost: 0.001,
                        currency: 'USD',
                    },
                    performance: {
                        averageLatency: 1500,
                        throughput: 15,
                        accuracy: 0.80,
                        availability: 0.95,
                        errorRate: 0.05,
                    },
                },
                capabilities: [
                    {
                        requestType: types_1.AIRequestType.TEXT_GENERATION,
                        maxTokens: 2048,
                        supportedLanguages: ['en'],
                        specializations: ['demo', 'testing'],
                        qualityScore: 0.80,
                    },
                ],
                constraints: {
                    maxConcurrentRequests: 50,
                    rateLimitPerMinute: 1000,
                    maxRequestSize: 8192,
                    requiredHeaders: ['Content-Type'],
                    supportedFormats: ['json'],
                },
                priority: 60,
            });
            logger_1.default.info('Custom model registered successfully');
            // Test routing with the new model
            const customModelRequest = (0, ai_routing_1.createAIRequest)('Test request for custom model', types_1.AIRequestType.TEXT_GENERATION, {
                metadata: {
                    requiredCapabilities: ['demo'],
                },
            });
            const customModelResult = await aiRoutingService.routeRequest(customModelRequest);
            logger_1.default.info('Custom model routing result:', {
                selectedModel: customModelResult.routing.selectedModel,
                wasCustomModelSelected: customModelResult.routing.selectedModel === 'demo-custom-model',
            });
        }
        catch (error) {
            logger_1.default.warn('Custom model registration failed:', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        // Demo 9: Final statistics and cleanup
        logger_1.default.info('Demo 9: Final statistics and performance summary');
        const finalStats = await aiRoutingService.getRoutingStats();
        logger_1.default.info('Final routing statistics:', {
            totalRequests: finalStats.totalRequests,
            successRate: `${(finalStats.successRate * 100).toFixed(1)}%`,
            averageLatency: `${finalStats.averageLatency.toFixed(0)}ms`,
            mostUsedModel: Object.entries(finalStats.modelUsage)
                .sort(([, a], [, b]) => b - a)[0]?.[0] || 'none',
            registeredModels: finalStats.registryStats.totalModels,
            activeModels: finalStats.registryStats.activeModels,
        });
        logger_1.default.info('Redis AI Platform AI Routing Demo completed successfully!');
        // Cleanup
        await aiRoutingService.cleanup();
        await redisManager.disconnect();
    }
    catch (error) {
        logger_1.default.error('AI Routing demo failed:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    runAIRoutingDemo().catch((error) => {
        console.error('Failed to run AI routing demo:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=ai-routing-demo.js.map