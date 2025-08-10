// Export all AI routing components
export { ModelRegistry, getModelRegistry, createModelRegistry } from './model-registry';
export { PerformanceMonitor, getPerformanceMonitor, createPerformanceMonitor } from './performance-monitor';
export { RequestAnalyzer, getRequestAnalyzer, createRequestAnalyzer } from './request-analyzer';
export { RoutingEngine, getRoutingEngine, createRoutingEngine } from './routing-engine';

import { getModelRegistry } from './model-registry';
import { getPerformanceMonitor } from './performance-monitor';
import { getRequestAnalyzer } from './request-analyzer';
import { createRoutingEngine, RoutingConfig } from './routing-engine';
import { AIRequest, AIRequestType, ModelEndpoint, ContentType } from '@/types';
import config from '@/config/environment';
import logger from '@/utils/logger';

export interface AIRoutingConfig {
  enablePerformanceMonitoring: boolean;
  enableCircuitBreakers: boolean;
  enableLoadBalancing: boolean;
  enableCostOptimization: boolean;
  routingStrategy: 'performance' | 'cost' | 'quality' | 'balanced';
  fallbackBehavior: 'retry' | 'alternative' | 'queue' | 'fail';
  maxRetries: number;
  healthCheckInterval: number;
}

export class AIRoutingService {
  private modelRegistry = getModelRegistry();
  private performanceMonitor = getPerformanceMonitor();
  private requestAnalyzer = getRequestAnalyzer();
  private routingEngine: ReturnType<typeof createRoutingEngine>;
  private config: AIRoutingConfig;
  private healthCheckTimer?: NodeJS.Timeout;

  constructor(routingConfig?: Partial<AIRoutingConfig>) {
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
    this.routingEngine = createRoutingEngine(engineConfig);

    // Initialize default models
    this.initializeDefaultModels();

    // Start health monitoring
    if (this.config.enablePerformanceMonitoring) {
      this.startHealthMonitoring();
    }

    logger.info('AI Routing Service initialized', {
      config: this.config,
    });
  }

  async routeRequest(request: AIRequest, context?: any): Promise<{
    result: any;
    routing: {
      selectedModel: string;
      latency: number;
      cost: number;
      confidence: number;
      alternatives: string[];
    };
  }> {
    const startTime = Date.now();

    try {
      // Route the request
      const routingDecision = await this.routingEngine.route(request, context);
      
      // Execute the request
      const result = await this.routingEngine.executeRequest(request, routingDecision, context);
      
      const totalLatency = Date.now() - startTime;

      logger.info('Request routed and executed successfully', {
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

    } catch (error) {
      logger.error('Failed to route and execute request', {
        requestId: request.id,
        requestType: request.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async registerModel(modelConfig: {
    id: string;
    name: string;
    provider: string;
    endpoint: ModelEndpoint;
    capabilities: Array<{
      requestType: AIRequestType;
      maxTokens: number;
      supportedLanguages: string[];
      specializations: string[];
      qualityScore: number;
    }>;
    constraints: {
      maxConcurrentRequests: number;
      rateLimitPerMinute: number;
      maxRequestSize: number;
      requiredHeaders: string[];
      supportedFormats: string[];
    };
    priority?: number;
  }): Promise<void> {
    try {
      // Validate model configuration
      const validation = this.modelRegistry.validateModelConfig(modelConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid model configuration: ${validation.errors.join(', ')}`);
      }

      // Register the model
      this.modelRegistry.registerModel(modelConfig);

      logger.info('Model registered successfully', {
        modelId: modelConfig.id,
        name: modelConfig.name,
        provider: modelConfig.provider,
      });

    } catch (error) {
      logger.error('Failed to register model', {
        modelId: modelConfig.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async unregisterModel(modelId: string): Promise<boolean> {
    try {
      const success = this.modelRegistry.unregisterModel(modelId);
      
      if (success) {
        logger.info('Model unregistered successfully', { modelId });
      } else {
        logger.warn('Model not found for unregistration', { modelId });
      }

      return success;

    } catch (error) {
      logger.error('Failed to unregister model', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getModelHealth(modelId?: string): Promise<any> {
    try {
      if (modelId) {
        return await this.performanceMonitor.getModelHealthStatus(modelId);
      } else {
        return await this.performanceMonitor.getAllModelsHealth();
      }
    } catch (error) {
      logger.error('Failed to get model health', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getRoutingStats(): Promise<{
    totalRequests: number;
    successRate: number;
    averageLatency: number;
    modelUsage: Record<string, number>;
    healthStatus: any;
    registryStats: any;
  }> {
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

    } catch (error) {
      logger.error('Failed to get routing stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  updateConfiguration(newConfig: Partial<AIRoutingConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update routing engine configuration
    const engineConfig = this.createEngineConfig();
    this.routingEngine.updateConfig(engineConfig);

    logger.info('AI Routing Service configuration updated', {
      config: this.config,
    });
  }

  private createEngineConfig(): Partial<RoutingConfig> {
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

  private initializeDefaultModels(): void {
    try {
      // Register OpenAI models if API key is available
      if (config.ai.openaiApiKey) {
        this.registerDefaultOpenAIModels();
      }

      // Register Anthropic models if API key is available
      if (config.ai.anthropicApiKey) {
        this.registerDefaultAnthropicModels();
      }

      // Register local models as fallback
      this.registerDefaultLocalModels();

    } catch (error) {
      logger.error('Failed to initialize default models', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private registerDefaultOpenAIModels(): void {
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
            requestType: AIRequestType.TEXT_GENERATION,
            maxTokens: 8192,
            supportedLanguages: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh'],
            specializations: ['reasoning', 'analysis', 'creative-writing'],
            qualityScore: 0.95,
          },
          {
            requestType: AIRequestType.CODE_GENERATION,
            maxTokens: 8192,
            supportedLanguages: ['en'],
            specializations: ['programming', 'debugging', 'code-review'],
            qualityScore: 0.90,
          },
          {
            requestType: AIRequestType.QUESTION_ANSWERING,
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
            requestType: AIRequestType.TEXT_GENERATION,
            maxTokens: 4096,
            supportedLanguages: ['en', 'es', 'fr', 'de', 'it'],
            specializations: ['general-purpose', 'conversation'],
            qualityScore: 0.85,
          },
          {
            requestType: AIRequestType.CODE_GENERATION,
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
      } catch (error) {
        logger.warn('Failed to register OpenAI model', {
          modelId: model.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private registerDefaultAnthropicModels(): void {
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
            requestType: AIRequestType.TEXT_GENERATION,
            maxTokens: 100000,
            supportedLanguages: ['en', 'fr', 'es', 'de'],
            specializations: ['long-form', 'analysis', 'reasoning'],
            qualityScore: 0.93,
          },
          {
            requestType: AIRequestType.QUESTION_ANSWERING,
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
      } catch (error) {
        logger.warn('Failed to register Anthropic model', {
          modelId: model.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private registerDefaultLocalModels(): void {
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
            requestType: AIRequestType.TEXT_GENERATION,
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
      } catch (error) {
        logger.warn('Failed to register local model', {
          modelId: model.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(async () => {
      try {
        const healthStatus = await this.performanceMonitor.getAllModelsHealth();
        
        // Update model active status based on health
        for (const [modelId, health] of Object.entries(healthStatus)) {
          const isHealthy = (health as any).isHealthy;
          this.modelRegistry.setModelActive(modelId, isHealthy);
        }

      } catch (error) {
        logger.error('Health monitoring failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }, this.config.healthCheckInterval);
  }

  async cleanup(): Promise<void> {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    await this.performanceMonitor.cleanup();
    
    logger.info('AI Routing Service cleanup completed');
  }
}

// Factory function to create AI routing service
export function createAIRoutingService(config?: Partial<AIRoutingConfig>): AIRoutingService {
  return new AIRoutingService(config);
}

// Utility functions
export function createAIRequest(
  content: string,
  type: AIRequestType,
  options: {
    id?: string;
    context?: any;
    preferences?: any;
    metadata?: any;
  } = {}
): AIRequest {
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

export function validateAIRequest(request: AIRequest): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.id || typeof request.id !== 'string') {
    errors.push('Request ID is required and must be a string');
  }

  if (!request.content || typeof request.content !== 'string') {
    errors.push('Request content is required and must be a string');
  }

  if (!Object.values(AIRequestType).includes(request.type)) {
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