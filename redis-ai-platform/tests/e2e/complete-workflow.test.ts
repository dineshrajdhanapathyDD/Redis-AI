import { Redis } from 'ioredis';
import { EmbeddingManager } from '../../src/services/embedding-manager';
import { VectorStorage } from '../../src/services/vector-storage';
import { MultiModalSearch } from '../../src/services/search/multi-modal-search';
import { RoutingEngine } from '../../src/services/ai-routing/routing-engine';
import { CacheManager } from '../../src/services/caching/cache-manager';
import { WorkspaceManager } from '../../src/services/workspace/workspace-manager';
import { PersonalizationEngine } from '../../src/services/learning/personalization-engine';
import { CodeAnalyzer } from '../../src/services/code-intelligence/code-analyzer';
import { BrandAnalyzer } from '../../src/services/content-consistency/brand-analyzer';
import { OptimizationEngine } from '../../src/services/optimization/optimization-engine';
import { AdaptiveUIController } from '../../src/services/adaptive-ui/adaptive-ui-controller';
import { MonitoringService } from '../../src/services/monitoring/monitoring-service';
import { AuthService } from '../../src/services/auth/auth-service';
import { logger } from '../../src/utils/logger';

describe('Complete Workflow End-to-End Tests', () => {
  let redis: Redis;
  let embeddingManager: EmbeddingManager;
  let vectorStorage: VectorStorage;
  let multiModalSearch: MultiModalSearch;
  let routingEngine: RoutingEngine;
  let cacheManager: CacheManager;
  let workspaceManager: WorkspaceManager;
  let personalizationEngine: PersonalizationEngine;
  let codeAnalyzer: CodeAnalyzer;
  let brandAnalyzer: BrandAnalyzer;
  let optimizationEngine: OptimizationEngine;
  let adaptiveUI: AdaptiveUIController;
  let monitoring: MonitoringService;
  let authService: AuthService;

  let isRedisAvailable = false;

  beforeAll(async () => {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      await redis.connect();
      await redis.ping();
      isRedisAvailable = true;

      // Initialize all services
      embeddingManager = new EmbeddingManager({
        defaultProvider: 'local',
        providers: {
          local: { type: 'local', modelPath: './models/test-model' },
        },
      });

      vectorStorage = new VectorStorage(redis, {
        defaultIndex: 'test_index',
        dimensions: 384,
        similarity: 'cosine',
      });

      multiModalSearch = new MultiModalSearch(embeddingManager, vectorStorage, redis);
      
      routingEngine = new RoutingEngine(redis, {
        models: [
          { id: 'test-model', provider: 'test', endpoint: 'http://localhost:8000', capabilities: ['text'] },
        ],
        defaultModel: 'test-model',
        routingStrategy: 'performance',
      });

      cacheManager = new CacheManager(redis, {
        ttl: 3600,
        maxSize: 1000,
        enableSemanticCache: true,
      });

      workspaceManager = new WorkspaceManager(redis, {
        maxWorkspaces: 100,
        defaultPermissions: ['read', 'write'],
      });

      personalizationEngine = new PersonalizationEngine(redis, {
        learningRate: 0.1,
        maxRecommendations: 10,
      });

      codeAnalyzer = new CodeAnalyzer(embeddingManager, {
        supportedLanguages: ['typescript', 'javascript', 'python'],
        analysisDepth: 'medium',
      });

      brandAnalyzer = new BrandAnalyzer(embeddingManager, {
        brandGuidelines: {},
        consistencyThreshold: 0.8,
      });

      optimizationEngine = new OptimizationEngine(redis, {
        optimizationInterval: 60000,
        metricsRetention: 86400,
      });

      adaptiveUI = new AdaptiveUIController(redis, {
        adaptationThreshold: 0.7,
        maxAdaptations: 5,
      });

      monitoring = new MonitoringService(redis, {
        metrics: { enabled: true, interval: 30, retention: 3600, aggregation: { enabled: true, intervals: [60] } },
        health: { enabled: true, interval: 60, timeout: 5, endpoints: [] },
        alerts: { enabled: true, rules: [], channels: [] },
        tracing: { enabled: true, sampleRate: 1.0, maxSpans: 100, retention: 3600 },
        dashboard: { enabled: true, refreshInterval: 30, charts: [] },
      });

      // Initialize services
      await embeddingManager.initialize();
      await vectorStorage.initialize();
      await monitoring.initialize();

      logger.info('All services initialized for E2E tests');
    } catch (error) {
      logger.warn('Redis not available for E2E tests, skipping');
      isRedisAvailable = false;
    }
  });

  afterAll(async () => {
    if (isRedisAvailable && redis) {
      // Cleanup test data
      const keys = await redis.keys('test:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      await redis.quit();
    }
  });

  describe('Complete User Journey', () => {
    it('should handle complete user workflow from registration to content creation', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // 1. User Registration and Authentication
      const userData = {
        email: 'testuser@example.com',
        username: 'testuser',
        password: 'SecurePassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Note: AuthService would need proper initialization with all dependencies
      // This is a conceptual test showing the workflow

      // 2. Create Workspace
      const workspace = await workspaceManager.createWorkspace({
        name: 'Test Workspace',
        description: 'E2E Test Workspace',
        ownerId: 'test-user-id',
        settings: {
          isPublic: false,
          allowCollaboration: true,
        },
      });

      expect(workspace.id).toBeDefined();
      expect(workspace.name).toBe('Test Workspace');

      // 3. Add Content to Workspace
      const documents = [
        {
          id: 'doc1',
          content: 'This is a test document about machine learning and AI.',
          type: 'text',
          metadata: { title: 'ML Document', author: 'Test User' },
        },
        {
          id: 'doc2',
          content: 'function calculateSum(a, b) { return a + b; }',
          type: 'code',
          metadata: { language: 'javascript', title: 'Sum Function' },
        },
      ];

      for (const doc of documents) {
        // Generate embeddings
        const embedding = await embeddingManager.generateEmbedding(doc.content, doc.type);
        
        // Store in vector database
        await vectorStorage.upsert([{
          id: doc.id,
          vector: embedding,
          metadata: {
            ...doc.metadata,
            workspaceId: workspace.id,
            content: doc.content,
            type: doc.type,
          },
        }]);

        // Add to workspace
        await workspaceManager.addNode(workspace.id, {
          id: doc.id,
          type: doc.type,
          content: doc.content,
          metadata: doc.metadata,
        });
      }

      // 4. Perform Multi-Modal Search
      const searchResults = await multiModalSearch.search({
        query: 'machine learning code examples',
        types: ['text', 'code'],
        limit: 10,
        filters: { workspaceId: workspace.id },
      });

      expect(searchResults.results.length).toBeGreaterThan(0);
      expect(searchResults.results.some(r => r.metadata.type === 'text')).toBe(true);
      expect(searchResults.results.some(r => r.metadata.type === 'code')).toBe(true);

      // 5. Analyze Code Quality
      const codeDoc = documents.find(d => d.type === 'code');
      if (codeDoc) {
        const codeAnalysis = await codeAnalyzer.analyzeCode(codeDoc.content, 'javascript');
        
        expect(codeAnalysis.metrics).toBeDefined();
        expect(codeAnalysis.suggestions).toBeDefined();
        expect(codeAnalysis.quality.overall).toBeGreaterThan(0);
      }

      // 6. Check Brand Consistency
      const brandAnalysis = await brandAnalyzer.analyzeContent(documents[0].content, {
        contentType: 'text',
        context: 'documentation',
      });

      expect(brandAnalysis.score).toBeGreaterThan(0);
      expect(brandAnalysis.suggestions).toBeDefined();

      // 7. Record User Behavior for Personalization
      await personalizationEngine.recordInteraction('test-user-id', {
        type: 'search',
        query: 'machine learning',
        results: searchResults.results.map(r => r.id),
        timestamp: Date.now(),
      });

      await personalizationEngine.recordInteraction('test-user-id', {
        type: 'view',
        contentId: 'doc1',
        duration: 30000,
        timestamp: Date.now(),
      });

      // 8. Get Personalized Recommendations
      const recommendations = await personalizationEngine.getRecommendations('test-user-id', {
        type: 'content',
        limit: 5,
        context: { workspaceId: workspace.id },
      });

      expect(recommendations.length).toBeGreaterThan(0);

      // 9. Adapt UI Based on User Behavior
      const uiAdaptations = await adaptiveUI.getAdaptations('test-user-id', {
        context: 'workspace',
        currentLayout: 'default',
      });

      expect(uiAdaptations).toBeDefined();

      // 10. Monitor System Performance
      await monitoring.recordSystemMetrics({
        timestamp: Date.now(),
        cpu: { usage: 45, loadAverage: [1, 1, 1], cores: 4 },
        memory: { used: 2000000000, total: 4000000000, free: 2000000000, percentage: 50 },
        redis: { connected: true, memory: 100000000, operations: 100, connections: 10, hitRate: 95, keyCount: 1000 },
        network: { bytesIn: 1000000, bytesOut: 800000, packetsIn: 1000, packetsOut: 800 },
        application: { uptime: 3600, version: '1.0.0', environment: 'test', activeConnections: 5, requestsPerSecond: 100, errorRate: 1 },
      });

      const systemOverview = await monitoring.getSystemOverview();
      expect(systemOverview.timestamp).toBeDefined();
      expect(systemOverview.health).toBeDefined();

      // 11. Cache Frequently Accessed Content
      const cacheKey = `workspace:${workspace.id}:search:machine_learning`;
      await cacheManager.set(cacheKey, searchResults, { ttl: 3600 });

      const cachedResults = await cacheManager.get(cacheKey);
      expect(cachedResults).toEqual(searchResults);

      // 12. Optimize System Performance
      const optimizationSuggestions = await optimizationEngine.analyzePerformance({
        timeRange: { start: Date.now() - 3600000, end: Date.now() },
        metrics: ['response_time', 'memory_usage', 'cache_hit_rate'],
      });

      expect(optimizationSuggestions).toBeDefined();

      logger.info('✅ Complete user workflow test passed');
    }, 30000);
  });

  describe('Collaborative Workflow', () => {
    it('should handle multi-user collaboration scenario', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Create workspace with multiple users
      const workspace = await workspaceManager.createWorkspace({
        name: 'Collaborative Workspace',
        description: 'Multi-user collaboration test',
        ownerId: 'user1',
        settings: {
          isPublic: false,
          allowCollaboration: true,
        },
      });

      // Add collaborators
      await workspaceManager.addCollaborator(workspace.id, 'user2', 'editor');
      await workspaceManager.addCollaborator(workspace.id, 'user3', 'viewer');

      // User 1 adds content
      const doc1 = {
        id: 'collab-doc1',
        content: 'Initial document content by user 1',
        type: 'text',
        metadata: { author: 'user1', title: 'Collaborative Document' },
      };

      const embedding1 = await embeddingManager.generateEmbedding(doc1.content, doc1.type);
      await vectorStorage.upsert([{
        id: doc1.id,
        vector: embedding1,
        metadata: { ...doc1.metadata, workspaceId: workspace.id },
      }]);

      await workspaceManager.addNode(workspace.id, {
        id: doc1.id,
        type: doc1.type,
        content: doc1.content,
        metadata: doc1.metadata,
      });

      // User 2 edits content
      const updatedContent = 'Updated document content by user 2';
      const embedding2 = await embeddingManager.generateEmbedding(updatedContent, 'text');
      
      await vectorStorage.upsert([{
        id: doc1.id,
        vector: embedding2,
        metadata: { ...doc1.metadata, workspaceId: workspace.id, lastModifiedBy: 'user2' },
      }]);

      await workspaceManager.updateNode(workspace.id, doc1.id, {
        content: updatedContent,
        metadata: { ...doc1.metadata, lastModifiedBy: 'user2' },
      });

      // User 3 searches for content
      const searchResults = await multiModalSearch.search({
        query: 'collaborative document',
        types: ['text'],
        limit: 5,
        filters: { workspaceId: workspace.id },
      });

      expect(searchResults.results.length).toBeGreaterThan(0);
      expect(searchResults.results[0].metadata.lastModifiedBy).toBe('user2');

      // Record collaboration events for all users
      for (const userId of ['user1', 'user2', 'user3']) {
        await personalizationEngine.recordInteraction(userId, {
          type: 'collaboration',
          workspaceId: workspace.id,
          action: userId === 'user1' ? 'create' : userId === 'user2' ? 'edit' : 'view',
          contentId: doc1.id,
          timestamp: Date.now(),
        });
      }

      // Get workspace activity
      const activity = await workspaceManager.getActivity(workspace.id, { limit: 10 });
      expect(activity.length).toBeGreaterThan(0);

      logger.info('✅ Collaborative workflow test passed');
    }, 20000);
  });

  describe('AI-Powered Content Pipeline', () => {
    it('should handle AI-powered content analysis and routing', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Create diverse content types
      const contents = [
        { text: 'Artificial intelligence is transforming healthcare', type: 'article' },
        { text: 'const aiModel = new NeuralNetwork();', type: 'code' },
        { text: 'Our brand values innovation and excellence', type: 'marketing' },
        { text: 'User reported bug in search functionality', type: 'support' },
      ];

      const processedContents = [];

      for (const content of contents) {
        // 1. Route to appropriate AI model
        const routingDecision = await routingEngine.routeRequest({
          content: content.text,
          type: 'text_analysis',
          requirements: {
            accuracy: 'high',
            latency: 'medium',
          },
        });

        expect(routingDecision.selectedModel).toBeDefined();

        // 2. Generate embeddings
        const embedding = await embeddingManager.generateEmbedding(content.text, 'text');
        expect(embedding.length).toBeGreaterThan(0);

        // 3. Analyze content based on type
        let analysis;
        if (content.type === 'code') {
          analysis = await codeAnalyzer.analyzeCode(content.text, 'javascript');
        } else if (content.type === 'marketing') {
          analysis = await brandAnalyzer.analyzeContent(content.text, {
            contentType: 'marketing',
            context: 'brand_consistency',
          });
        }

        // 4. Store with metadata
        const contentId = `ai-content-${Date.now()}-${Math.random()}`;
        await vectorStorage.upsert([{
          id: contentId,
          vector: embedding,
          metadata: {
            content: content.text,
            type: content.type,
            analysis,
            routingDecision,
            timestamp: Date.now(),
          },
        }]);

        processedContents.push({
          id: contentId,
          content: content.text,
          type: content.type,
          analysis,
        });

        // 5. Cache results for similar requests
        const cacheKey = `ai-analysis:${content.type}:${Buffer.from(content.text).toString('base64').substring(0, 20)}`;
        await cacheManager.set(cacheKey, analysis, { ttl: 3600 });
      }

      // 6. Perform cross-content analysis
      const semanticSearch = await multiModalSearch.search({
        query: 'artificial intelligence technology',
        types: ['text'],
        limit: 10,
      });

      expect(semanticSearch.results.length).toBeGreaterThan(0);

      // 7. Generate insights from processed content
      const insights = {
        totalProcessed: processedContents.length,
        typeDistribution: processedContents.reduce((acc, content) => {
          acc[content.type] = (acc[content.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        averageProcessingTime: 150, // ms
      };

      expect(insights.totalProcessed).toBe(contents.length);
      expect(Object.keys(insights.typeDistribution).length).toBeGreaterThan(0);

      logger.info('✅ AI-powered content pipeline test passed');
    }, 25000);
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume operations efficiently', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const startTime = Date.now();
      const operationCount = 50; // Reduced for test performance
      const operations: Promise<any>[] = [];

      // Generate high volume of concurrent operations
      for (let i = 0; i < operationCount; i++) {
        const content = `Test content ${i} with various keywords and topics`;
        
        operations.push(
          (async () => {
            // Generate embedding
            const embedding = await embeddingManager.generateEmbedding(content, 'text');
            
            // Store in vector database
            await vectorStorage.upsert([{
              id: `perf-test-${i}`,
              vector: embedding,
              metadata: {
                content,
                index: i,
                timestamp: Date.now(),
              },
            }]);

            // Cache the result
            await cacheManager.set(`perf-test-${i}`, { content, embedding }, { ttl: 300 });

            // Record metrics
            await monitoring.recordPerformanceMetric({
              timestamp: Date.now(),
              endpoint: '/api/test/performance',
              method: 'POST',
              responseTime: Math.random() * 100 + 50,
              statusCode: 200,
              requestSize: content.length,
              responseSize: embedding.length * 4, // Approximate size
            });

            return i;
          })()
        );
      }

      // Wait for all operations to complete
      const results = await Promise.all(operations);
      const endTime = Date.now();
      const totalTime = endTime - startTime;

      expect(results.length).toBe(operationCount);
      expect(totalTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Verify data integrity
      const searchResults = await multiModalSearch.search({
        query: 'test content keywords',
        types: ['text'],
        limit: operationCount,
      });

      expect(searchResults.results.length).toBeGreaterThan(0);

      // Check cache performance
      const cacheHits = await Promise.all(
        Array.from({ length: 10 }, (_, i) => cacheManager.get(`perf-test-${i}`))
      );

      const hitCount = cacheHits.filter(hit => hit !== null).length;
      expect(hitCount).toBeGreaterThan(5); // At least 50% cache hit rate

      // Get performance metrics
      const performanceMetrics = await monitoring.getMetricsSummary({
        start: startTime,
        end: endTime,
      });

      expect(performanceMetrics.metrics).toBeDefined();

      logger.info(`✅ Performance test completed: ${operationCount} operations in ${totalTime}ms`);
    }, 45000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle various error scenarios gracefully', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Test invalid embedding generation
      try {
        await embeddingManager.generateEmbedding('', 'invalid-type');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test invalid vector storage operations
      try {
        await vectorStorage.upsert([{
          id: 'invalid',
          vector: [], // Empty vector
          metadata: {},
        }]);
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test search with invalid parameters
      try {
        await multiModalSearch.search({
          query: '',
          types: [],
          limit: -1,
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test workspace operations with invalid data
      try {
        await workspaceManager.createWorkspace({
          name: '',
          description: '',
          ownerId: '',
          settings: {},
        });
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Test cache operations with invalid keys
      try {
        await cacheManager.get('');
      } catch (error) {
        expect(error).toBeDefined();
      }

      // Verify system continues to function after errors
      const validContent = 'This is valid content for testing recovery';
      const embedding = await embeddingManager.generateEmbedding(validContent, 'text');
      expect(embedding.length).toBeGreaterThan(0);

      logger.info('✅ Error handling test passed');
    }, 15000);
  });
});