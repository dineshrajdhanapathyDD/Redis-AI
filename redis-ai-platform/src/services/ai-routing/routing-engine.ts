import { getModelRegistry, RegisteredModel } from './model-registry';
import { getPerformanceMonitor, PerformanceMetric } from './performance-monitor';
import { getRequestAnalyzer, RequestAnalysis, RequestContext } from './request-analyzer';
import { AIRequest, ModelEndpoint, AIRequestType } from '@/types';
import logger from '@/utils/logger';

export interface RoutingDecision {
  selectedModel: RegisteredModel;
  alternativeModels: RegisteredModel[];
  confidence: number;
  reasoning: string[];
  estimatedLatency: number;
  estimatedCost: number;
  fallbackStrategy: 'retry' | 'alternative' | 'queue';
}

export interface RoutingConfig {
  enableLoadBalancing: boolean;
  enableFailover: boolean;
  maxRetries: number;
  retryDelay: number;
  costOptimization: boolean;
  latencyOptimization: boolean;
  qualityOptimization: boolean;
  weights: {
    performance: number;
    cost: number;
    quality: number;
    availability: number;
  };
}

export interface RoutingMetrics {
  totalRequests: number;
  successfulRoutes: number;
  failedRoutes: number;
  averageDecisionTime: number;
  modelUsageDistribution: Record<string, number>;
  fallbackUsage: Record<string, number>;
}

export class RoutingEngine {
  private modelRegistry = getModelRegistry();
  private performanceMonitor = getPerformanceMonitor();
  private requestAnalyzer = getRequestAnalyzer();
  private config: RoutingConfig;
  private metrics: RoutingMetrics;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(config?: Partial<RoutingConfig>) {
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

    logger.info('Routing engine initialized', { config: this.config });
  }

  async route(
    request: AIRequest,
    context?: RequestContext
  ): Promise<RoutingDecision> {
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
        logger.warn('Circuit breaker open for model, using alternative', {
          modelId: selectedModel.id,
          requestId: request.id,
        });
        
        // Use first available alternative
        const availableAlternative = alternativeModels.find(model => 
          !this.getCircuitBreaker(model.id).isOpen()
        );
        
        if (!availableAlternative) {
          throw new Error('No available models (all circuit breakers open)');
        }
        
        return this.createRoutingDecision(
          availableAlternative,
          alternativeModels,
          analysis,
          ['Circuit breaker fallback']
        );
      }

      // Create routing decision
      const decision = this.createRoutingDecision(
        selectedModel,
        alternativeModels,
        analysis,
        this.generateReasoning(selectedModel, analysis)
      );

      const decisionTime = Date.now() - startTime;
      this.updateMetrics(decision, decisionTime, true);

      logger.info('Request routed successfully', {
        requestId: request.id,
        selectedModel: selectedModel.id,
        confidence: decision.confidence,
        decisionTime,
      });

      return decision;

    } catch (error) {
      const decisionTime = Date.now() - startTime;
      this.updateMetrics(null, decisionTime, false);
      
      logger.error('Failed to route request', {
        requestId: request.id,
        requestType: request.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      throw error;
    }
  }

  async executeRequest(
    request: AIRequest,
    decision: RoutingDecision,
    context?: RequestContext
  ): Promise<any> {
    const startTime = Date.now();
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < this.config.maxRetries) {
      try {
        const model = attempt === 0 ? decision.selectedModel : 
          decision.alternativeModels[Math.min(attempt - 1, decision.alternativeModels.length - 1)];

        if (!model) {
          throw new Error('No more alternative models available');
        }

        logger.debug('Executing request', {
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

        logger.info('Request executed successfully', {
          requestId: request.id,
          modelId: model.id,
          latency,
          attempt: attempt + 1,
        });

        return result;

      } catch (error) {
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

        logger.warn('Request execution failed', {
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

  private async getCandidateModels(
    request: AIRequest,
    analysis: RequestAnalysis
  ): Promise<RegisteredModel[]> {
    // Get models that support the request type
    const typeModels = this.modelRegistry.getModelsForRequestType(request.type);
    
    // Filter by capabilities
    const capableModels = typeModels.filter(model => {
      const capability = model.capabilities.find(cap => cap.requestType === request.type);
      if (!capability) return false;

      // Check if model has required capabilities
      return analysis.requiredCapabilities.every(reqCap =>
        capability.specializations.includes(reqCap) ||
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

  private async scoreModels(
    models: RegisteredModel[],
    analysis: RequestAnalysis,
    context?: RequestContext
  ): Promise<RegisteredModel[]> {
    const scoredModels = await Promise.all(
      models.map(async (model) => {
        const score = await this.calculateModelScore(model, analysis, context);
        return { model, score };
      })
    );

    // Sort by score (descending)
    scoredModels.sort((a, b) => b.score - a.score);

    return scoredModels.map(item => item.model);
  }

  private async calculateModelScore(
    model: RegisteredModel,
    analysis: RequestAnalysis,
    context?: RequestContext
  ): Promise<number> {
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
    const finalScore = (
      performanceScore * this.config.weights.performance +
      costScore * this.config.weights.cost +
      qualityScore * this.config.weights.quality +
      availabilityScore * this.config.weights.availability +
      preferenceBoost
    );

    return Math.max(0, Math.min(1, finalScore));
  }

  private calculatePerformanceScore(
    performance: any,
    analysis: RequestAnalysis
  ): number {
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

  private calculateCostScore(model: RegisteredModel, analysis: RequestAnalysis): number {
    if (!this.config.costOptimization) return 0.5;

    const estimatedCost = this.estimateRequestCost(model, analysis);
    
    // Normalize cost (assuming $0.10 as high cost)
    const normalizedCost = Math.min(estimatedCost / 0.10, 1);
    
    // Return inverse (lower cost = higher score)
    return Math.max(0, 1 - normalizedCost);
  }

  private calculateQualityScore(model: RegisteredModel, analysis: RequestAnalysis): number {
    const capability = model.capabilities.find(cap => cap.requestType === analysis.requiredCapabilities[0] as any);
    if (!capability) return 0.5;

    let qualityScore = capability.qualityScore;

    // Adjust based on quality requirements
    const accuracyMatch = Math.abs(capability.qualityScore - analysis.qualityRequirements.accuracy);
    qualityScore -= accuracyMatch * 0.2;

    // Model priority factor
    const priorityScore = model.priority / 100;
    qualityScore += priorityScore * 0.1;

    return Math.max(0, Math.min(1, qualityScore));
  }

  private applyLoadBalancing(models: RegisteredModel[]): RegisteredModel[] {
    // Simple round-robin load balancing based on recent usage
    const usage = this.metrics.modelUsageDistribution;
    
    return models.sort((a, b) => {
      const usageA = usage[a.id] || 0;
      const usageB = usage[b.id] || 0;
      return usageA - usageB; // Prefer less used models
    });
  }

  private createRoutingDecision(
    selectedModel: RegisteredModel,
    alternativeModels: RegisteredModel[],
    analysis: RequestAnalysis,
    reasoning: string[]
  ): RoutingDecision {
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

  private calculateConfidence(model: RegisteredModel, analysis: RequestAnalysis): number {
    let confidence = 0.5;

    // Model capability match
    const capability = model.capabilities.find(cap => 
      analysis.requiredCapabilities.includes(cap.requestType as string)
    );
    
    if (capability) {
      confidence += capability.qualityScore * 0.3;
    }

    // Performance confidence
    if (model.performance.availability > 0.95) confidence += 0.2;
    if (model.performance.errorRate < 0.05) confidence += 0.2;

    // Priority boost
    confidence += (model.priority / 100) * 0.1;

    return Math.max(0, Math.min(1, confidence));
  }

  private generateReasoning(model: RegisteredModel, analysis: RequestAnalysis): string[] {
    const reasoning: string[] = [];

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

  private determineFallbackStrategy(analysis: RequestAnalysis): 'retry' | 'alternative' | 'queue' {
    if (analysis.urgency === 'high') return 'alternative';
    if (analysis.complexity === 'low') return 'retry';
    return 'alternative';
  }

  private estimateRequestCost(model: RegisteredModel, analysis: RequestAnalysis): number {
    const inputCost = (analysis.estimatedTokens / 1000) * model.endpoint.pricing.inputTokenCost;
    const outputCost = (analysis.estimatedTokens * 0.3 / 1000) * model.endpoint.pricing.outputTokenCost; // Assume 30% output ratio
    return inputCost + outputCost;
  }

  private getCircuitBreaker(modelId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(modelId)) {
      this.circuitBreakers.set(modelId, new CircuitBreaker(modelId));
    }
    return this.circuitBreakers.get(modelId)!;
  }

  private async callModelAPI(
    model: RegisteredModel,
    request: AIRequest,
    context?: RequestContext
  ): Promise<any> {
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

  private async recordMetric(modelId: string, metric: PerformanceMetric): Promise<void> {
    await this.performanceMonitor.recordMetric(metric);
  }

  private calculateCost(model: RegisteredModel, request: AIRequest, result: any): number {
    if (result.usage) {
      const inputCost = (result.usage.promptTokens / 1000) * model.endpoint.pricing.inputTokenCost;
      const outputCost = (result.usage.completionTokens / 1000) * model.endpoint.pricing.outputTokenCost;
      return inputCost + outputCost;
    }
    return 0;
  }

  private estimateAccuracy(result: any, request: AIRequest): number {
    // This would implement actual accuracy estimation
    // For now, return a mock value
    return Math.random() * 0.3 + 0.7; // 0.7 to 1.0
  }

  private updateMetrics(decision: RoutingDecision | null, decisionTime: number, success: boolean): void {
    if (success && decision) {
      this.metrics.successfulRoutes++;
      this.metrics.modelUsageDistribution[decision.selectedModel.id] = 
        (this.metrics.modelUsageDistribution[decision.selectedModel.id] || 0) + 1;
    } else {
      this.metrics.failedRoutes++;
    }

    // Update average decision time
    const totalDecisionTime = this.metrics.averageDecisionTime * (this.metrics.totalRequests - 1) + decisionTime;
    this.metrics.averageDecisionTime = totalDecisionTime / this.metrics.totalRequests;
  }

  // Public methods for management
  getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }

  updateConfig(newConfig: Partial<RoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    logger.info('Routing engine configuration updated', { config: this.config });
  }

  async getHealthStatus(): Promise<{
    isHealthy: boolean;
    activeModels: number;
    circuitBreakersOpen: number;
    averageResponseTime: number;
    successRate: number;
  }> {
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

// Simple Circuit Breaker implementation
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private readonly failureThreshold = 5;
  private readonly timeout = 60000; // 1 minute

  constructor(private modelId: string) {}

  isOpen(): boolean {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
      logger.warn('Circuit breaker opened', {
        modelId: this.modelId,
        failures: this.failures,
      });
    }
  }
}

// Singleton instance
let routingEngine: RoutingEngine | null = null;

export function getRoutingEngine(): RoutingEngine {
  if (!routingEngine) {
    routingEngine = new RoutingEngine();
  }
  return routingEngine;
}

export function createRoutingEngine(config?: Partial<RoutingConfig>): RoutingEngine {
  routingEngine = new RoutingEngine(config);
  return routingEngine;
}