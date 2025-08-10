import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { io as Client, Socket } from 'socket.io-client';
import { Redis } from 'ioredis';
import { WebSocketGateway, defaultWebSocketConfig } from '../../../src/api/websocket';
import { APIServices } from '../../../src/api/rest';
import { EmbeddingManager } from '../../../src/services/embedding-manager';
import { VectorStorage } from '../../../src/services/vector-storage';
import { MultiModalSearch } from '../../../src/services/search';
import { WorkspaceService } from '../../../src/services/workspace';
import { AIRoutingService } from '../../../src/services/ai-routing';
import { LearningService } from '../../../src/services/learning';
import { CodeIntelligenceService } from '../../../src/services/code-intelligence';
import { ContentConsistencyService } from '../../../src/services/content-consistency';
import { OptimizationService } from '../../../src/services/optimization';
import { AdaptiveUIService } from '../../../src/services/adaptive-ui';

describe('WebSocket Gateway', () => {
  let httpServer: any;
  let gateway: WebSocketGateway;
  let redis: Redis;
  let services: APIServices;
  let clientSocket: Socket;
  let serverPort: number;

  beforeAll(async () => {
    // Setup Redis
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1 // Use test database
    });

    await redis.flushdb();

    // Initialize services
    const embeddingManager = new EmbeddingManager(redis);
    await embeddingManager.initialize();

    const vectorStorage = new VectorStorage(redis);
    await vectorStorage.initialize();

    services = {
      embeddingManager,
      vectorStorage,
      multiModalSearch: new MultiModalSearch(embeddingManager, vectorStorage),
      workspaceService: new WorkspaceService(redis, embeddingManager),
      aiRoutingService: new AIRoutingService(redis),
      learningService: new LearningService(redis),
      codeIntelligenceService: new CodeIntelligenceService(redis, embeddingManager),
      contentConsistencyService: new ContentConsistencyService(redis, embeddingManager),
      optimizationService: new OptimizationService(redis),
      adaptiveUIService: new AdaptiveUIService(redis)
    };

    // Initialize all services
    await services.multiModalSearch.initialize();
    await services.workspaceService.initialize();
    await services.aiRoutingService.initialize();
    await services.learningService.initialize();
    await services.codeIntelligenceService.initialize();
    await services.contentConsistencyService.initialize();
    await services.optimizationService.initialize();
    await services.adaptiveUIService.initialize();

    // Create HTTP server
    httpServer = createServer();
    
    // Create WebSocket gateway
    gateway = new WebSocketGateway(httpServer, redis, services, {
      ...defaultWebSocketConfig,
      enableAuth: false, // Disable auth for testing
      enableRateLimit: false, // Disable rate limiting for testing
      maxConnections: 100
    });

    // Start server
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        serverPort = httpServer.address().port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
    
    await gateway.shutdown();
    httpServer.close();
    await redis.quit();
  });

  beforeEach(async () => {
    // Create client socket
    clientSocket = Client(`http://localhost:${serverPort}`, {
      transports: ['websocket']
    });

    // Wait for connection
    await new Promise<void>((resolve) => {
      clientSocket.on('connect', resolve);
    });
  });

  afterEach(() => {
    if (clientSocket) {
      clientSocket.disconnect();
    }
  });

  describe('Connection Management', () => {
    it('should establish WebSocket connection', (done) => {
      clientSocket.on('connected', (data) => {
        expect(data).toHaveProperty('socketId');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('serverInfo');
        expect(data.serverInfo.features).toContain('workspace');
        expect(data.serverInfo.features).toContain('learning');
        done();
      });
    });

    it('should handle ping/pong', (done) => {
      clientSocket.emit('ping');
      
      clientSocket.on('pong', (data) => {
        expect(data).toHaveProperty('timestamp');
        expect(typeof data.timestamp).toBe('number');
        done();
      });
    });

    it('should provide connection info', (done) => {
      clientSocket.emit('get_info');
      
      clientSocket.on('connection_info', (data) => {
        expect(data).toHaveProperty('socketId');
        expect(data).toHaveProperty('connectedAt');
        expect(data).toHaveProperty('subscriptions');
        expect(Array.isArray(data.subscriptions)).toBe(true);
        done();
      });
    });
  });

  describe('Subscription Management', () => {
    it('should handle subscription to channels', (done) => {
      const channel = 'test_channel';
      
      clientSocket.emit('subscribe', { channel });
      
      clientSocket.on('subscribed', (data) => {
        expect(data.channel).toBe(channel);
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle unsubscription from channels', (done) => {
      const channel = 'test_channel';
      
      // First subscribe
      clientSocket.emit('subscribe', { channel });
      
      clientSocket.on('subscribed', () => {
        // Then unsubscribe
        clientSocket.emit('unsubscribe', { channel });
      });
      
      clientSocket.on('unsubscribed', (data) => {
        expect(data.channel).toBe(channel);
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });
  });

  describe('System Events', () => {
    it('should handle system alerts subscription', (done) => {
      clientSocket.emit('system:subscribe_alerts', { alertTypes: ['error', 'warning'] });
      
      clientSocket.on('system:alerts_subscribed', (data) => {
        expect(data.alertTypes).toEqual(['error', 'warning']);
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle system metrics subscription', (done) => {
      clientSocket.emit('system:subscribe_metrics', { 
        interval: 10000, 
        metrics: ['cpu', 'memory'] 
      });
      
      clientSocket.on('system:metrics_subscribed', (data) => {
        expect(data.interval).toBe(10000);
        expect(data.metrics).toEqual(['cpu', 'memory']);
        done();
      });
    });

    it('should provide system health information', (done) => {
      clientSocket.emit('system:get_health');
      
      clientSocket.on('system:health', (data) => {
        expect(data).toHaveProperty('overall');
        expect(data).toHaveProperty('timestamp');
        expect(data).toHaveProperty('components');
        expect(data).toHaveProperty('checks');
        done();
      });
    });

    it('should handle system issue reporting', (done) => {
      const issue = {
        type: 'performance',
        severity: 'medium',
        description: 'Test issue for WebSocket testing',
        metadata: { test: true }
      };

      clientSocket.emit('system:report_issue', issue);
      
      clientSocket.on('system:issue_reported', (data) => {
        expect(data).toHaveProperty('issueId');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });
  });

  describe('AI Routing Events', () => {
    it('should handle AI routing updates subscription', (done) => {
      clientSocket.emit('ai_routing:subscribe_updates', { 
        modelIds: ['gpt-4', 'claude-3'] 
      });
      
      clientSocket.on('ai_routing:subscribed', (data) => {
        expect(data.modelIds).toEqual(['gpt-4', 'claude-3']);
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle routing analytics requests', (done) => {
      clientSocket.emit('ai_routing:get_analytics', { 
        timeframe: '1h',
        groupBy: 'model'
      });
      
      clientSocket.on('ai_routing:analytics', (data) => {
        expect(data.analytics).toHaveProperty('timeframe', '1h');
        expect(data.analytics).toHaveProperty('groupBy', 'model');
        expect(data.analytics).toHaveProperty('totalRequests');
        expect(data.analytics).toHaveProperty('modelUsage');
        done();
      });
    });

    it('should handle model testing requests', (done) => {
      const modelId = 'test-model';
      const testPrompt = 'Test prompt for connectivity';

      clientSocket.emit('ai_routing:test_model', { modelId, testPrompt });
      
      clientSocket.on('ai_routing:test_started', (data) => {
        expect(data.modelId).toBe(modelId);
        expect(data.testPrompt).toBe(testPrompt);
      });

      clientSocket.on('ai_routing:test_result', (data) => {
        expect(data.modelId).toBe(modelId);
        expect(data.testPrompt).toBe(testPrompt);
        expect(data.result).toHaveProperty('success');
        expect(data.result).toHaveProperty('timestamp');
        done();
      });
    });
  });

  describe('Learning Events', () => {
    it('should handle behavior tracking', (done) => {
      const behaviorData = {
        action: 'click',
        context: { page: 'dashboard' },
        metadata: { test: true }
      };

      clientSocket.emit('learning:track_behavior', behaviorData);
      
      clientSocket.on('learning:behavior_tracked', (data) => {
        expect(data.action).toBe(behaviorData.action);
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle learning analytics requests', (done) => {
      clientSocket.emit('learning:get_analytics', { timeframe: '7d' });
      
      clientSocket.on('learning:analytics', (data) => {
        expect(data.analytics).toHaveProperty('timeframe', '7d');
        expect(data.analytics).toHaveProperty('learningProgress');
        expect(data.analytics).toHaveProperty('behaviorInsights');
        expect(data.analytics).toHaveProperty('personalizationMetrics');
        done();
      });
    });
  });

  describe('Adaptive UI Events', () => {
    it('should handle interaction tracking', (done) => {
      const interaction = {
        type: 'click',
        element: { id: 'test-button', type: 'button' },
        context: { page: 'dashboard' },
        metadata: { test: true }
      };

      clientSocket.emit('adaptive_ui:track_interaction', interaction);
      
      clientSocket.on('adaptive_ui:interaction_tracked', (data) => {
        expect(data).toHaveProperty('interactionId');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle assistance requests', (done) => {
      const assistanceData = {
        currentTask: 'data-analysis',
        strugglingAreas: ['charts'],
        context: { page: 'analytics' }
      };

      clientSocket.emit('adaptive_ui:get_assistance', assistanceData);
      
      clientSocket.on('adaptive_ui:assistance_provided', (data) => {
        expect(data.help).toHaveProperty('type');
        expect(data.help).toHaveProperty('content');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should handle feature readiness checks', (done) => {
      const featureData = {
        featureId: 'advanced-analytics',
        context: { page: 'dashboard', task: 'analysis' }
      };

      clientSocket.emit('adaptive_ui:check_feature_readiness', featureData);
      
      clientSocket.on('adaptive_ui:feature_readiness', (data) => {
        expect(data.featureId).toBe(featureData.featureId);
        expect(data).toHaveProperty('ready');
        expect(data).toHaveProperty('confidence');
        expect(data).toHaveProperty('factors');
        done();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid events gracefully', (done) => {
      clientSocket.emit('invalid:event', { data: 'test' });
      
      // Should not crash the server
      setTimeout(() => {
        expect(clientSocket.connected).toBe(true);
        done();
      }, 100);
    });

    it('should emit errors for malformed requests', (done) => {
      // Try to subscribe without required parameters
      clientSocket.emit('subscribe', {});
      
      clientSocket.on('error', (data) => {
        expect(data).toHaveProperty('message');
        done();
      });
    });
  });

  describe('Broadcasting', () => {
    it('should broadcast messages to all clients', (done) => {
      const testMessage = { test: 'broadcast message' };
      
      // Listen for broadcast
      clientSocket.on('test_broadcast', (data) => {
        expect(data).toEqual(testMessage);
        done();
      });

      // Trigger broadcast
      gateway.broadcast('test_broadcast', testMessage);
    });

    it('should broadcast to specific rooms', (done) => {
      const room = 'test_room';
      const testMessage = { test: 'room message' };
      
      // Join room first
      clientSocket.emit('subscribe', { channel: room });
      
      clientSocket.on('subscribed', () => {
        // Listen for room broadcast
        clientSocket.on('test_room_broadcast', (data) => {
          expect(data).toEqual(testMessage);
          done();
        });

        // Trigger room broadcast
        gateway.broadcastToRoom(room, 'test_room_broadcast', testMessage);
      });
    });
  });

  describe('Statistics', () => {
    it('should provide gateway statistics', () => {
      const stats = gateway.getStats();
      
      expect(stats).toHaveProperty('totalConnections');
      expect(stats).toHaveProperty('authenticatedUsers');
      expect(stats).toHaveProperty('anonymousConnections');
      expect(stats).toHaveProperty('totalSubscriptions');
      expect(stats).toHaveProperty('uptime');
      expect(stats).toHaveProperty('memoryUsage');
      
      expect(typeof stats.totalConnections).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });

    it('should track connection information', () => {
      const connectionInfo = gateway.getConnectionInfo(clientSocket.id);
      
      expect(connectionInfo).toBeDefined();
      expect(connectionInfo?.id).toBe(clientSocket.id);
      expect(connectionInfo?.connectedAt).toBeInstanceOf(Date);
      expect(connectionInfo?.subscriptions).toBeInstanceOf(Set);
    });
  });
});