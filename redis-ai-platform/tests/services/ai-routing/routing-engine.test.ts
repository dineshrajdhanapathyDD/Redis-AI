import { createRoutingEngine } from '../../../src/services/ai-routing/routing-engine';
import { createModelRegistry } from '../../../src/services/ai-routing/model-registry';
import { createPerformanceMonitor } from '../../../src/services/ai-routing/performance-monitor';
import { createRequestAnalyzer } from '../../../src/services/ai-routing/request-analyzer';
import { createAIRequest } from '../../../src/services/ai-routing';
import { AIRequestType } from '../../../src/types';

describe('RoutingEngine', () => {
  let routingEngine: ReturnType<typeof createRoutingEngine>;
  let modelRegistry: ReturnType<typeof createModelRegistry>;

  beforeEach(() => {
    // Create fresh instances for each test
    modelRegistry = createModelRegistry();
    createPerformanceMonitor();
    createRequestAnalyzer();
    
    routingEngine = createRoutingEngine({
      enableLoadBalancing: true,
      enableFailover: true,
      maxRetries: 2,
      weights: {
        performance: 0.4,
        cost: 0.2,
        quality: 0.3,
        availability: 0.1,
      },
    });

    // Register test models
    setupTestModels();
  });

  function setupTestModels() {
    const testModels = [
      {
        id: 'test-gpt-4',
        name: 'Test GPT-4',
        provider: 'openai',
        endpoint: {
          id: 'test-gpt-4',
          name: 'Test GPT-4',
          provider: 'openai',
          url: 'https://api.openai.com/v1/chat/completions',
          capabilities: ['text-generation'],
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
            supportedLanguages: ['en'],
            specializations: ['reasoning', 'analysis'],
            qualityScore: 0.95,
          },
        ],
        constraints: {
          maxConcurrentRequests: 100,
          rateLimitPerMinute: 3500,
          maxRequestSize: 32768,
          requiredHeaders: ['Authorization'],
          supportedFormats: ['json'],
        },
        priority: 90,
      },
      {
        id: 'test-gpt-3.5',
        name: 'Test GPT-3.5',
        provider: 'openai',
        endpoint: {
          id: 'test-gpt-3.5',
          name: 'Test GPT-3.5',
          provider: 'openai',
          url: 'https://api.openai.com/v1/chat/completions',
          capabilities: ['text-generation'],
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
            supportedLanguages: ['en'],
            specializations: ['general-purpose'],
            qualityScore: 0.85,
          },
        ],
        constraints: {
          maxConcurrentRequests: 200,
          rateLimitPerMinute: 10000,
          maxRequestSize: 16384,
          requiredHeaders: ['Authorization'],
          supportedFormats: ['json'],
        },
        priority: 70,
      },
    ];

    for (const model of testModels) {
      modelRegistry.registerModel(model);
    }
  }

  describe('request routing', () => {
    it('should route text generation request successfully', async () => {
      const request = createAIRequest(
        'Generate a creative story about AI',
        AIRequestType.TEXT_GENERATION
      );

      const decision = await routingEngine.route(request);

      expect(decision).toBeDefined();
      expect(decision.selectedModel).toBeDefined();
      expect(decision.selectedModel.id).toMatch(/test-gpt/);
      expect(decision.confidence).toBeGreaterThan(0);
      expect(decision.confidence).toBeLessThanOrEqual(1);
      expect(decision.alternativeModels).toBeDefined();
      expect(Array.isArray(decision.reasoning)).toBe(true);
    });

    it('should prefer higher priority models', async () => {
      const request = createAIRequest(
        'Simple text generation task',
        AIRequestType.TEXT_GENERATION
      );

      const decision = await routingEngine.route(request);

      // Should prefer GPT-4 (priority 90) over GPT-3.5 (priority 70)
      expect(decision.selectedModel.id).toBe('test-gpt-4');
    });

    it('should handle requests with specific requirements', async () => {
      const request = createAIRequest(
        'Complex reasoning task requiring high accuracy',
        AIRequestType.TEXT_GENERATION,
        {
          metadata: {
            priority: 'high',
            maxLatency: 5000,
            requiredCapabilities: ['reasoning'],
          },
        }
      );

      const decision = await routingEngine.route(request);

      expect(decision.selectedModel).toBeDefined();
      expect(decision.estimatedLatency).toBeLessThanOrEqual(5000);
      expect(decision.reasoning).toContain('High urgency request - prioritizing fast models');
    });

    it('should throw error when no models available', async () => {
      const request = createAIRequest(
        'Test request',
        AIRequestType.IMAGE_ANALYSIS // No models registered for this type
      );

      await expect(routingEngine.route(request)).rejects.toThrow(
        'No available models for request type: image_analysis'
      );
    });
  });

  describe('request execution', () => {
    it('should execute request successfully', async () => {
      const request = createAIRequest(
        'Test execution',
        AIRequestType.TEXT_GENERATION
      );

      const decision = await routingEngine.route(request);
      const result = await routingEngine.executeRequest(request, decision);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.model).toBe(decision.selectedModel.id);
      expect(result.usage).toBeDefined();
    });

    it('should retry on failure with alternative models', async () => {
      const request = createAIRequest(
        'Test retry logic',
        AIRequestType.TEXT_GENERATION
      );

      const decision = await routingEngine.route(request);
      
      // Mock the first model to fail
      const originalCallModelAPI = (routingEngine as any).callModelAPI;
      let callCount = 0;
      
      (routingEngine as any).callModelAPI = async (model: any, req: any, ctx: any) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Simulated API failure');
        }
        return originalCallModelAPI.call(routingEngine, model, req, ctx);
      };

      const result = await routingEngine.executeRequest(request, decision);

      expect(result).toBeDefined();
      expect(callCount).toBeGreaterThan(1); // Should have retried
    });

    it('should fail after max retries', async () => {
      const request = createAIRequest(
        'Test max retries',
        AIRequestType.TEXT_GENERATION
      );

      const decision = await routingEngine.route(request);
      
      // Mock all calls to fail
      (routingEngine as any).callModelAPI = async () => {
        throw new Error('Persistent API failure');
      };

      await expect(routingEngine.executeRequest(request, decision))
        .rejects.toThrow('Request failed after 2 attempts');
    });
  });

  describe('load balancing', () => {
    it('should distribute requests across models', async () => {
      const requests = Array.from({ length: 10 }, (_, i) =>
        createAIRequest(`Request ${i}`, AIRequestType.TEXT_GENERATION)
      );

      const selectedModels: string[] = [];

      for (const request of requests) {
        const decision = await routingEngine.route(request);
        selectedModels.push(decision.selectedModel.id);
      }

      // Should use both models (though not necessarily evenly)
      const uniqueModels = new Set(selectedModels);
      expect(uniqueModels.size).toBeGreaterThan(1);
    });
  });

  describe('circuit breaker', () => {
    it('should open circuit breaker after failures', async () => {
      const request = createAIRequest(
        'Test circuit breaker',
        AIRequestType.TEXT_GENERATION
      );

      // Mock API to always fail for one model
      (routingEngine as any).callModelAPI = async (model: any) => {
        if (model.id === 'test-gpt-4') {
          throw new Error('Model failure');
        }
        return {
          id: 'response_123',
          content: 'Success response',
          model: model.id,
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        };
      };

      // Execute multiple requests to trigger circuit breaker
      for (let i = 0; i < 6; i++) {
        try {
          const decision = await routingEngine.route(request);
          await routingEngine.executeRequest(request, decision);
        } catch (error) {
          // Expected failures
        }
      }

      // Next routing should avoid the failed model
      const decision = await routingEngine.route(request);
      expect(decision.selectedModel.id).toBe('test-gpt-3.5');
    });
  });

  describe('metrics and health', () => {
    it('should track routing metrics', async () => {
      const request = createAIRequest(
        'Test metrics',
        AIRequestType.TEXT_GENERATION
      );

      const initialMetrics = routingEngine.getMetrics();
      
      const decision = await routingEngine.route(request);
      await routingEngine.executeRequest(request, decision);

      const updatedMetrics = routingEngine.getMetrics();

      expect(updatedMetrics.totalRequests).toBe(initialMetrics.totalRequests + 1);
      expect(updatedMetrics.successfulRoutes).toBe(initialMetrics.successfulRoutes + 1);
      expect(updatedMetrics.modelUsageDistribution[decision.selectedModel.id]).toBeGreaterThan(0);
    });

    it('should provide health status', async () => {
      const healthStatus = await routingEngine.getHealthStatus();

      expect(healthStatus).toMatchObject({
        isHealthy: expect.any(Boolean),
        activeModels: expect.any(Number),
        circuitBreakersOpen: expect.any(Number),
        averageResponseTime: expect.any(Number),
        successRate: expect.any(Number),
      });

      expect(healthStatus.activeModels).toBeGreaterThan(0);
    });
  });

  describe('configuration updates', () => {
    it('should update configuration', () => {
      const newConfig = {
        enableLoadBalancing: false,
        maxRetries: 5,
        weights: {
          performance: 0.5,
          cost: 0.3,
          quality: 0.1,
          availability: 0.1,
        },
      };

      expect(() => routingEngine.updateConfig(newConfig)).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle empty request content', async () => {
      const request = createAIRequest('', AIRequestType.TEXT_GENERATION);

      const decision = await routingEngine.route(request);
      expect(decision).toBeDefined();
    });

    it('should handle very long request content', async () => {
      const longContent = 'A'.repeat(50000);
      const request = createAIRequest(longContent, AIRequestType.TEXT_GENERATION);

      const decision = await routingEngine.route(request);
      expect(decision).toBeDefined();
    });

    it('should handle requests with context', async () => {
      const request = createAIRequest(
        'Test with context',
        AIRequestType.TEXT_GENERATION
      );

      const context = {
        userId: 'test-user',
        sessionId: 'test-session',
        conversationHistory: [
          { role: 'user', content: 'Previous message' },
          { role: 'assistant', content: 'Previous response' },
        ],
        userPreferences: {
          preferredModels: ['test-gpt-4'],
        },
      };

      const decision = await routingEngine.route(request, context);
      expect(decision.selectedModel.id).toBe('test-gpt-4');
    });
  });
});