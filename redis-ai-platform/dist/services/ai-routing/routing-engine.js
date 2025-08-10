"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoutingEngine = void 0;
exports.getRoutingEngine = getRoutingEngine;
exports.createRoutingEngine = createRoutingEngine;
const model_registry_1 = require("./model-registry");
const performance_monitor_1 = require("./performance-monitor");
const request_analyzer_1 = require("./request-analyzer");
const logger_1 = __importDefault(require("@/utils/logger"));
class RoutingEngine {
    modelRegistry = (0, model_registry_1.getModelRegistry)();
    performanceMonitor = (0, performance_monitor_1.getPerformanceMonitor)();
    requestAnalyzer = (0, request_analyzer_1.getRequestAnalyzer)();
    config;
    metrics;
    circuitBreakers = new Map();
    constructor(config) {
        this.config = {
            enableLoadBalancing: true,
            enableFailover: true,
            maxRetries: 3,
            retryDelay: 1000,
            costOptimization: false,
            latencyOptimization: true,
            qualityOptimization: true,
            weights: {
                performance: 0.4,
                cost: 0.2,
                quality: 0.3,
                availability: 0.1,
            },
            ...config,
        };
        this.metrics = {
            totalRequests: 0,
            successfulRoutes: 0,
            failedRoutes: 0,
            averageDecisionTime: 0,
            modelUsageDistribution: {},
            fallbackUsage: {},
        };
        logger_1.default.info('Routing engine initialized', { config: this.config });
    }
    async route(request, context) {
        const startTime = Date.now();
        this.metrics.totalRequests++;
        try {
            // Analyze the request
            const analysis = this.requestAnalyzer.analyzeRequest(request, context);
            // Get candidate models
            const candidateModels = await this.getCandidateModels(request, analysis);
            if (candidateModels.length === 0) {
                throw new Error(`No available models for request type: ${request.type}`);
            }
            // Score and rank models
            const scoredModels = await this.scoreModels(candidateModels, analysis, context);
            // Select the best model
            const selectedModel = scoredModels[0];
            const alternativeModels = scoredModels.slice(1, 4); // Top 3 alternatives
            // Check circuit breaker
            const circuitBreaker = this.getCircuitBreaker(selectedModel.id);
            if (circuitBreaker.isOpen()) {
                logger_1.default.warn('Circuit breaker open for model, using alternative', {
                    modelId: selectedModel.id,
                    requestId: request.id,
                });
                // Use first available alternative
                const availableAlternative = alternativeModels.find(model => !this.getCircuitBreaker(model.id).isOpen());
                if (!availableAlternative) {
                    throw new Error('No available models (all circuit breakers open)');
                }
                return this.createRoutingDecision(availableAlternative, alternativeModels, analysis, ['Circuit breaker fallback']);
            }
            // Create routing decision
            const decision = this.createRoutingDecision(selectedModel, alternativeModels, analysis, this.generateReasoning(selectedModel, analysis));
            const decisionTime = Date.now() - startTime;
            this.updateMetrics(decision, decisionTime, true);
            logger_1.default.info('Request routed successfully', {
                requestId: request.id,
                selectedModel: selectedModel.id,
                confidence: decision.confidence,
                decisionTime,
            });
            return decision;
        }
        catch (error) {
            const decisionTime = Date.now() - startTime;
            this.updateMetrics(null, decisionTime, false);
            logger_1.default.error('Failed to route request', {
                requestId: request.id,
                requestType: request.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async executeRequest(request, decision, context) {
        const startTime = Date.now();
        let attempt = 0;
        let lastError = null;
        while (attempt < this.config.maxRetries) {
            try {
                const model = attempt === 0 ? decision.selectedModel :
                    decision.alternativeModels[Math.min(attempt - 1, decision.alternativeModels.length - 1)];
                if (!model) {
                    throw new Error('No more alternative models available');
                }
                logger_1.default.debug('Executing request', {
                    requestId: request.id,
                    modelId: model.id,
                    attempt: attempt + 1,
                });
                // Execute the actual request (this would call the model API)
                const result = await this.callModelAPI(model, request, context);
                // Record successful metric
                const latency = Date.now() - startTime;
                await this.recordMetric(model.id, {
                    modelId: model.id,
                    timestamp: Date.now(),
                    latency,
                    success: true,
                    requestSize: request.content.length,
                    responseSize: JSON.stringify(result).length,
                    cost: this.calculateCost(model, request, result),
                    accuracy: this.estimateAccuracy(result, request),
                });
                // Update circuit breaker
                this.getCircuitBreaker(model.id).recordSuccess();
                logger_1.default.info('Request executed successfully', {
                    requestId: request.id,
                    modelId: model.id,
                    latency,
                    attempt: attempt + 1,
                });
                return result;
            }
            catch (error) {
                attempt++;
                lastError = error instanceof Error ? error : new Error('Unknown error');
                const currentModel = attempt === 1 ? decision.selectedModel :
                    decision.alternativeModels[Math.min(attempt - 2, decision.alternativeModels.length - 1)];
                if (currentModel) {
                    // Record failed metric
                    const latency = Date.now() - startTime;
                    await this.recordMetric(currentModel.id, {
                        modelId: currentModel.id,
                        timestamp: Date.now(),
                        latency,
                        success: false,
                        errorType: lastError.message,
                        requestSize: request.content.length,
                        responseSize: 0,
                        cost: 0,
                    });
                    // Update circuit breaker
                    this.getCircuitBreaker(currentModel.id).recordFailure();
                }
                logger_1.default.warn('Request execution failed', {
                    requestId: request.id,
                    modelId: currentModel?.id,
                    attempt,
                    error: lastError.message,
                });
                if (attempt < this.config.maxRetries) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
                }
            }
        }
        throw new Error(`Request failed after ${this.config.maxRetries} attempts: ${lastError?.message}`);
    }
    async getCandidateModels(request, analysis) {
        // Get models that support the request type
        const typeModels = this.modelRegistry.getModelsForRequestType(request.type);
        // Filter by capabilities
        const capableModels = typeModels.filter(model => {
            const capability = model.capabilities.find(cap => cap.requestType === request.type);
            if (!capability)
                return false;
            // Check if model has required capabilities
            return analysis.requiredCapabilities.every(reqCap => capability.specializations.includes(reqCap) ||
                capability.requestType === request.type // Basic capability match
            );
        });
        // Filter by constraints
        const constraintModels = capableModels.filter(model => {
            // Check token limit
            const capability = model.capabilities.find(cap => cap.requestType === request.type);
            if (capability && analysis.estimatedTokens > capability.maxTokens) {
                return false;
            }
            // Check if model is healthy
            const circuitBreaker = this.getCircuitBreaker(model.id);
            if (circuitBreaker.isOpen()) {
                return false;
            }
            return true;
        });
        // Apply load balancing if enabled
        if (this.config.enableLoadBalancing) {
            return this.applyLoadBalancing(constraintModels);
        }
        return constraintModels;
    }
    async scoreModels(models, analysis, context) {
        const scoredModels = await Promise.all(models.map(async (model) => {
            const score = await this.calculateModelScore(model, analysis, context);
            return { model, score };
        }));
        // Sort by score (descending)
        scoredModels.sort((a, b) => b.score - a.score);
        return scoredModels.map(item => item.model);
    }
    async calculateModelScore(model, analysis, context) {
        // Get recent performance metrics
        const performance = await this.performanceMonitor.getModelPerformance(model.id, '15m');
        // Calculate component scores
        const performanceScore = this.calculatePerformanceScore(performance, analysis);
        const costScore = this.calculateCostScore(model, analysis);
        const qualityScore = this.calculateQualityScore(model, analysis);
        const availabilityScore = performance.availability;
        // Apply user preferences if available
        let preferenceBoost = 0;
        if (context?.userPreferences?.preferredModels) {
            if (context.userPreferences.preferredModels.includes(model.id)) {
                preferenceBoost = 0.1;
            }
        }
        // Weighted final score
        const finalScore = (performanceScore * this.config.weights.performance +
            costScore * this.config.weights.cost +
            qualityScore * this.config.weights.quality +
            availabilityScore * this.config.weights.availability +
            preferenceBoost);
        return Math.max(0, Math.min(1, finalScore));
    }
    calculatePerformanceScore(performance, analysis) {
        let score = 0.5; // Base score
        // Latency score (lower is better)
        const latencyRatio = Math.min(performance.averageLatency / analysis.expectedLatency, 2);
        const latencyScore = Math.max(0, 1 - latencyRatio);
        score += latencyScore * 0.4;
        // Throughput score
        const throughputScore = Math.min(performance.throughput / 10, 1); // Normalize to 10 RPS
        score += throughputScore * 0.3;
        // Error rate score (lower is better)
        const errorScore = Math.max(0, 1 - performance.errorRate);
        score += errorScore * 0.3;
        return Math.max(0, Math.min(1, score));
    }
    calculateCostScore(model, analysis) {
        if (!this.config.costOptimization)
            return 0.5;
        const estimatedCost = this.estimateRequestCost(model, analysis);
        // Normalize cost (assuming $0.10 as high cost)
        const normalizedCost = Math.min(estimatedCost / 0.10, 1);
        // Return inverse (lower cost = higher score)
        return Math.max(0, 1 - normalizedCost);
    }
    calculateQualityScore(model, analysis) {
        const capability = model.capabilities.find(cap => cap.requestType === analysis.requiredCapabilities[0]);
        if (!capability)
            return 0.5;
        let qualityScore = capability.qualityScore;
        // Adjust based on quality requirements
        const accuracyMatch = Math.abs(capability.qualityScore - analysis.qualityRequirements.accuracy);
        qualityScore -= accuracyMatch * 0.2;
        // Model priority factor
        const priorityScore = model.priority / 100;
        qualityScore += priorityScore * 0.1;
        return Math.max(0, Math.min(1, qualityScore));
    }
    applyLoadBalancing(models) {
        // Simple round-robin load balancing based on recent usage
        const usage = this.metrics.modelUsageDistribution;
        return models.sort((a, b) => {
            const usageA = usage[a.id] || 0;
            const usageB = usage[b.id] || 0;
            return usageA - usageB; // Prefer less used models
        });
    }
    createRoutingDecision(selectedModel, alternativeModels, analysis, reasoning) {
        return {
            selectedModel,
            alternativeModels,
            confidence: this.calculateConfidence(selectedModel, analysis),
            reasoning,
            estimatedLatency: analysis.expectedLatency,
            estimatedCost: this.estimateRequestCost(selectedModel, analysis),
            fallbackStrategy: this.determineFallbackStrategy(analysis),
        };
    }
    calculateConfidence(model, analysis) {
        let confidence = 0.5;
        // Model capability match
        const capability = model.capabilities.find(cap => analysis.requiredCapabilities.includes(cap.requestType));
        if (capability) {
            confidence += capability.qualityScore * 0.3;
        }
        // Performance confidence
        if (model.performance.availability > 0.95)
            confidence += 0.2;
        if (model.performance.errorRate < 0.05)
            confidence += 0.2;
        // Priority boost
        confidence += (model.priority / 100) * 0.1;
        return Math.max(0, Math.min(1, confidence));
    }
    generateReasoning(model, analysis) {
        const reasoning = [];
        reasoning.push(`Selected ${model.name} (${model.provider})`);
        reasoning.push(`Request complexity: ${analysis.complexity}`);
        reasoning.push(`Estimated tokens: ${analysis.estimatedTokens}`);
        reasoning.push(`Model priority: ${model.priority}`);
        reasoning.push(`Expected latency: ${analysis.expectedLatency}ms`);
        if (analysis.urgency === 'high') {
            reasoning.push('High urgency request - prioritizing fast models');
        }
        if (this.config.costOptimization) {
            reasoning.push('Cost optimization enabled');
        }
        if (this.config.latencyOptimization) {
            reasoning.push('Latency optimization enabled');
        }
        return reasoning;
    }
    determineFallbackStrategy(analysis) {
        if (analysis.urgency === 'high')
            return 'alternative';
        if (analysis.complexity === 'low')
            return 'retry';
        return 'alternative';
    }
    estimateRequestCost(model, analysis) {
        const inputCost = (analysis.estimatedTokens / 1000) * model.endpoint.pricing.inputTokenCost;
        const outputCost = (analysis.estimatedTokens * 0.3 / 1000) * model.endpoint.pricing.outputTokenCost; // Assume 30% output ratio
        return inputCost + outputCost;
    }
    getCircuitBreaker(modelId) {
        if (!this.circuitBreakers.has(modelId)) {
            this.circuitBreakers.set(modelId, new CircuitBreaker(modelId));
        }
        return this.circuitBreakers.get(modelId);
    }
    async callModelAPI(model, request, context) {
        // This would implement the actual API call to the model
        // For now, return a mock response
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        return {
            id: `response_${Date.now()}`,
            content: `Mock response from ${model.name} for request: ${request.content.substring(0, 50)}...`,
            model: model.id,
            usage: {
                promptTokens: Math.floor(request.content.length / 4),
                completionTokens: 100,
                totalTokens: Math.floor(request.content.length / 4) + 100,
            },
        };
    }
    async recordMetric(modelId, metric) {
        await this.performanceMonitor.recordMetric(metric);
    }
    calculateCost(model, request, result) {
        if (result.usage) {
            const inputCost = (result.usage.promptTokens / 1000) * model.endpoint.pricing.inputTokenCost;
            const outputCost = (result.usage.completionTokens / 1000) * model.endpoint.pricing.outputTokenCost;
            return inputCost + outputCost;
        }
        return 0;
    }
    estimateAccuracy(result, request) {
        // This would implement actual accuracy estimation
        // For now, return a mock value
        return Math.random() * 0.3 + 0.7; // 0.7 to 1.0
    }
    updateMetrics(decision, decisionTime, success) {
        if (success && decision) {
            this.metrics.successfulRoutes++;
            this.metrics.modelUsageDistribution[decision.selectedModel.id] =
                (this.metrics.modelUsageDistribution[decision.selectedModel.id] || 0) + 1;
        }
        else {
            this.metrics.failedRoutes++;
        }
        // Update average decision time
        const totalDecisionTime = this.metrics.averageDecisionTime * (this.metrics.totalRequests - 1) + decisionTime;
        this.metrics.averageDecisionTime = totalDecisionTime / this.metrics.totalRequests;
    }
    // Public methods for management
    getMetrics() {
        return { ...this.metrics };
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger_1.default.info('Routing engine configuration updated', { config: this.config });
    }
    async getHealthStatus() {
        const activeModels = this.modelRegistry.getActiveModels().length;
        const openCircuitBreakers = Array.from(this.circuitBreakers.values())
            .filter(cb => cb.isOpen()).length;
        const successRate = this.metrics.totalRequests > 0
            ? this.metrics.successfulRoutes / this.metrics.totalRequests
            : 1;
        return {
            isHealthy: activeModels > 0 && successRate > 0.8,
            activeModels,
            circuitBreakersOpen: openCircuitBreakers,
            averageResponseTime: this.metrics.averageDecisionTime,
            successRate,
        };
    }
}
exports.RoutingEngine = RoutingEngine;
// Simple Circuit Breaker implementation
class CircuitBreaker {
    modelId;
    failures = 0;
    lastFailureTime = 0;
    state = 'closed';
    failureThreshold = 5;
    timeout = 60000; // 1 minute
    constructor(modelId) {
        this.modelId = modelId;
    }
    isOpen() {
        if (this.state === 'open') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'half-open';
                return false;
            }
            return true;
        }
        return false;
    }
    recordSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    recordFailure() {
        this.failures++;
        this.lastFailureTime = Date.now();
        if (this.failures >= this.failureThreshold) {
            this.state = 'open';
            logger_1.default.warn('Circuit breaker opened', {
                modelId: this.modelId,
                failures: this.failures,
            });
        }
    }
}
// Singleton instance
let routingEngine = null;
function getRoutingEngine() {
    if (!routingEngine) {
        routingEngine = new RoutingEngine();
    }
    return routingEngine;
}
function createRoutingEngine(config) {
    routingEngine = new RoutingEngine(config);
    return routingEngine;
}
//# sourceMappingURL=routing-engine.js.map