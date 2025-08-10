import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { logger } from '../../../utils/logger';
import { APIServices } from '../../rest/index';
import { ConnectionInfo } from '../index';

export class AIRoutingHandler {
  private io: SocketIOServer;
  private redis: Redis;
  private services: APIServices;

  constructor(io: SocketIOServer, redis: Redis, services: APIServices) {
    this.io = io;
    this.redis = redis;
    this.services = services;
  }

  public setupHandlers(socket: any, connectionInfo: ConnectionInfo): void {
    // Subscribe to AI routing updates
    socket.on('ai_routing:subscribe_updates', async (data: { modelIds?: string[] }) => {
      try {
        const { modelIds = [] } = data;

        // Join AI routing updates room
        await socket.join('ai_routing:updates');
        connectionInfo.subscriptions.add('ai_routing:updates');

        // Store subscription preferences
        await this.redis.hset(
          `ai_routing_prefs:${socket.id}`,
          'modelIds',
          JSON.stringify(modelIds),
          'subscribedAt',
          Date.now().toString()
        );

        socket.emit('ai_routing:subscribed', {
          modelIds,
          timestamp: Date.now()
        });

        // Send current model status
        const models = await this.services.aiRoutingService.modelRegistry.getAvailableModels();
        const filteredModels = modelIds.length > 0 
          ? models.filter(model => modelIds.includes(model.id))
          : models;

        socket.emit('ai_routing:models_status', {
          models: filteredModels.map(model => ({
            id: model.id,
            name: model.name,
            provider: model.provider,
            status: model.status,
            performance: model.performance,
            lastUpdated: model.updatedAt
          })),
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Subscribe AI routing updates error:', error);
        socket.emit('error', { message: 'Failed to subscribe to AI routing updates', error: (error as Error).message });
      }
    });

    // Route AI request in real-time
    socket.on('ai_routing:route_request', async (data: {
      prompt: string;
      context?: any;
      requirements?: any;
      sessionId?: string;
    }) => {
      try {
        const { prompt, context = {}, requirements = {}, sessionId } = data;

        if (!connectionInfo.userId) {
          socket.emit('error', { message: 'Authentication required for AI routing' });
          return;
        }

        const aiRequest = {
          id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          prompt,
          context: {
            socketId: socket.id,
            ipAddress: connectionInfo.ipAddress,
            ...context
          },
          requirements: {
            maxLatency: 5000,
            minAccuracy: 0.8,
            preferredModels: [],
            costConstraint: 'balanced',
            ...requirements
          },
          userId: connectionInfo.userId,
          sessionId: sessionId || `session_${Date.now()}`,
          timestamp: Date.now()
        };

        // Emit request started
        socket.emit('ai_routing:request_started', {
          requestId: aiRequest.id,
          timestamp: Date.now()
        });

        // Route the request
        const routingResult = await this.services.aiRoutingService.routingEngine.routeRequest(aiRequest);

        // Emit routing result
        socket.emit('ai_routing:request_routed', {
          requestId: aiRequest.id,
          selectedModel: {
            id: routingResult.selectedModel.id,
            name: routingResult.selectedModel.name,
            provider: routingResult.selectedModel.provider
          },
          routingReason: routingResult.reason,
          confidence: routingResult.confidence,
          estimatedLatency: routingResult.estimatedLatency,
          estimatedCost: routingResult.estimatedCost,
          routingTime: routingResult.routingTime,
          timestamp: Date.now()
        });

        // Broadcast routing statistics to subscribers
        this.io.to('ai_routing:updates').emit('ai_routing:request_processed', {
          modelId: routingResult.selectedModel.id,
          routingTime: routingResult.routingTime,
          estimatedLatency: routingResult.estimatedLatency,
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Route AI request error:', error);
        socket.emit('error', { message: 'Failed to route AI request', error: (error as Error).message });
      }
    });

    // Get model performance metrics
    socket.on('ai_routing:get_model_metrics', async (data: {
      modelId: string;
      timeframe?: string;
    }) => {
      try {
        const { modelId, timeframe = '1h' } = data;

        const metrics = await this.services.aiRoutingService.performanceMonitor.getModelMetrics(
          modelId,
          timeframe
        );

        if (!metrics) {
          socket.emit('error', { message: `No metrics found for model ${modelId}` });
          return;
        }

        socket.emit('ai_routing:model_metrics', {
          modelId,
          timeframe,
          metrics: {
            requestCount: metrics.requestCount,
            averageLatency: metrics.averageLatency,
            successRate: metrics.successRate,
            errorRate: metrics.errorRate,
            qualityScore: metrics.qualityScore,
            costPerRequest: metrics.costPerRequest,
            throughput: metrics.throughput,
            availability: metrics.availability
          },
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Get model metrics error:', error);
        socket.emit('error', { message: 'Failed to get model metrics', error: (error as Error).message });
      }
    });

    // Test model connectivity
    socket.on('ai_routing:test_model', async (data: {
      modelId: string;
      testPrompt?: string;
    }) => {
      try {
        const { modelId, testPrompt = 'Hello, this is a connectivity test.' } = data;

        // Emit test started
        socket.emit('ai_routing:test_started', {
          modelId,
          testPrompt,
          timestamp: Date.now()
        });

        const testResult = await this.services.aiRoutingService.modelRegistry.testModelConnectivity(
          modelId,
          testPrompt
        );

        socket.emit('ai_routing:test_result', {
          modelId,
          testPrompt,
          result: {
            success: testResult.success,
            latency: testResult.latency,
            response: testResult.response,
            error: testResult.error,
            timestamp: testResult.timestamp
          }
        });

        // Broadcast test result to subscribers if it's a failure
        if (!testResult.success) {
          this.io.to('ai_routing:updates').emit('ai_routing:model_test_failed', {
            modelId,
            error: testResult.error,
            timestamp: Date.now()
          });
        }

      } catch (error) {
        logger.error('Test model connectivity error:', error);
        socket.emit('error', { message: 'Failed to test model connectivity', error: (error as Error).message });
      }
    });

    // Get routing analytics
    socket.on('ai_routing:get_analytics', async (data: {
      timeframe?: string;
      groupBy?: string;
    }) => {
      try {
        const { timeframe = '24h', groupBy = 'model' } = data;

        // Mock analytics data (in real implementation, this would come from the service)
        const analytics = {
          timeframe,
          groupBy,
          totalRequests: Math.floor(Math.random() * 5000) + 1000,
          successfulRoutes: Math.floor(Math.random() * 4500) + 900,
          failedRoutes: Math.floor(Math.random() * 500) + 50,
          averageRoutingTime: Math.floor(Math.random() * 50) + 10,
          modelUsage: {
            'gpt-4': { 
              requests: Math.floor(Math.random() * 2000) + 500, 
              successRate: 0.95 + Math.random() * 0.05, 
              avgLatency: Math.floor(Math.random() * 1000) + 1000 
            },
            'claude-3': { 
              requests: Math.floor(Math.random() * 1500) + 400, 
              successRate: 0.93 + Math.random() * 0.07, 
              avgLatency: Math.floor(Math.random() * 800) + 800 
            },
            'local-llama': { 
              requests: Math.floor(Math.random() * 1000) + 200, 
              successRate: 0.90 + Math.random() * 0.10, 
              avgLatency: Math.floor(Math.random() * 600) + 400 
            }
          },
          costAnalysis: {
            totalCost: Math.random() * 100 + 20,
            costPerRequest: Math.random() * 0.05 + 0.01,
            costByModel: {
              'gpt-4': Math.random() * 50 + 10,
              'claude-3': Math.random() * 30 + 5,
              'local-llama': Math.random() * 10 + 1
            }
          },
          performanceTrends: {
            latencyTrend: ['decreasing', 'stable', 'increasing'][Math.floor(Math.random() * 3)],
            successRateTrend: ['stable', 'improving', 'degrading'][Math.floor(Math.random() * 3)],
            costTrend: ['stable', 'increasing', 'decreasing'][Math.floor(Math.random() * 3)]
          }
        };

        socket.emit('ai_routing:analytics', {
          analytics,
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Get routing analytics error:', error);
        socket.emit('error', { message: 'Failed to get routing analytics', error: (error as Error).message });
      }
    });

    // Get routing recommendations
    socket.on('ai_routing:get_recommendations', async (data: {
      prompt: string;
      context?: any;
      requirements?: any;
    }) => {
      try {
        const { prompt, context = {}, requirements = {} } = data;

        // Analyze the request
        const analysis = await this.services.aiRoutingService.requestAnalyzer.analyzeRequest({
          prompt,
          context,
          requirements,
          userId: connectionInfo.userId || 'anonymous'
        });

        const recommendations = await this.services.aiRoutingService.routingEngine.getRoutingRecommendations(
          analysis
        );

        socket.emit('ai_routing:recommendations', {
          prompt: prompt.substring(0, 100) + (prompt.length > 100 ? '...' : ''),
          analysis: {
            complexity: analysis.complexity,
            domain: analysis.domain,
            requiredCapabilities: analysis.requiredCapabilities,
            estimatedTokens: analysis.estimatedTokens
          },
          recommendations: recommendations.map(rec => ({
            modelId: rec.modelId,
            modelName: rec.modelName,
            score: rec.score,
            reasoning: rec.reasoning,
            estimatedLatency: rec.estimatedLatency,
            estimatedCost: rec.estimatedCost,
            pros: rec.pros,
            cons: rec.cons
          })),
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Get routing recommendations error:', error);
        socket.emit('error', { message: 'Failed to get routing recommendations', error: (error as Error).message });
      }
    });

    // Subscribe to model status changes
    socket.on('ai_routing:subscribe_model_status', async (data: { modelIds?: string[] }) => {
      try {
        const { modelIds = [] } = data;

        // Join model status room
        await socket.join('ai_routing:model_status');
        connectionInfo.subscriptions.add('ai_routing:model_status');

        // Store model subscription preferences
        await this.redis.hset(
          `ai_routing_model_prefs:${socket.id}`,
          'modelIds',
          JSON.stringify(modelIds),
          'subscribedAt',
          Date.now().toString()
        );

        socket.emit('ai_routing:model_status_subscribed', {
          modelIds,
          timestamp: Date.now()
        });

      } catch (error) {
        logger.error('Subscribe model status error:', error);
        socket.emit('error', { message: 'Failed to subscribe to model status', error: (error as Error).message });
      }
    });
  }

  // Method to broadcast model status changes
  public async broadcastModelStatusChange(modelId: string, status: string, metadata?: any): Promise<void> {
    try {
      this.io.to('ai_routing:model_status').emit('ai_routing:model_status_changed', {
        modelId,
        status,
        metadata,
        timestamp: Date.now()
      });

      this.io.to('ai_routing:updates').emit('ai_routing:model_updated', {
        modelId,
        status,
        metadata,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Broadcast model status change error:', error);
    }
  }

  // Method to broadcast routing metrics updates
  public async broadcastMetricsUpdate(metrics: any): Promise<void> {
    try {
      this.io.to('ai_routing:updates').emit('ai_routing:metrics_updated', {
        metrics,
        timestamp: Date.now()
      });

    } catch (error) {
      logger.error('Broadcast metrics update error:', error);
    }
  }
}