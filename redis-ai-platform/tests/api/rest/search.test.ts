import request from 'supertest';
import { Express } from 'express';
import { Redis } from 'ioredis';
import { RestAPI, APIServices, defaultAPIConfig } from '../../../src/api/rest';
import { EmbeddingManager } from '../../../src/services/embedding-manager';
import { VectorStorage } from '../../../src/services/vector-storage';
import { MultiModalSearch, ContentType } from '../../../src/services/search';
import { WorkspaceService } from '../../../src/services/workspace';
import { AIRoutingService } from '../../../src/services/ai-routing';
import { LearningService } from '../../../src/services/learning';
import { CodeIntelligenceService } from '../../../src/services/code-intelligence';
import { ContentConsistencyService } from '../../../src/services/content-consistency';
import { OptimizationService } from '../../../src/services/optimization';
import { AdaptiveUIService } from '../../../src/services/adaptive-ui';

describe('Search API Routes', () => {
  let app: Express;
  let redis: Redis;
  let services: APIServices;

  beforeAll(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1 // Use test database
    });

    // Clear test data
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

    // Create REST API
    const restAPI = new RestAPI(redis, services, {
      ...defaultAPIConfig,
      port: 0, // Use random port for testing
      enableLogging: false
    });

    app = restAPI.getApp();
  });

  afterAll(async () => {
    await redis.quit();
  });

  describe('POST /api/search/multi-modal', () => {
    it('should perform multi-modal search', async () => {
      const response = await request(app)
        .post('/api/search/multi-modal')
        .send({
          query: 'machine learning algorithms',
          contentTypes: [ContentType.TEXT, ContentType.CODE],
          limit: 5,
          threshold: 0.7
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'machine learning algorithms');
      expect(response.body).toHaveProperty('contentTypes');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/search/multi-modal')
        .send({
          contentTypes: [ContentType.TEXT],
          limit: 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required');
    });

    it('should filter invalid content types', async () => {
      const response = await request(app)
        .post('/api/search/multi-modal')
        .send({
          query: 'test query',
          contentTypes: [ContentType.TEXT, 'invalid_type'],
          limit: 5
        })
        .expect(200);

      expect(response.body.contentTypes).not.toContain('invalid_type');
      expect(response.body.contentTypes).toContain(ContentType.TEXT);
    });
  });

  describe('POST /api/search/text', () => {
    it('should perform text search', async () => {
      const response = await request(app)
        .post('/api/search/text')
        .send({
          query: 'neural networks',
          limit: 10,
          threshold: 0.8
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'neural networks');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('totalResults');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/search/text')
        .send({
          limit: 10
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required');
    });
  });

  describe('POST /api/search/image', () => {
    it('should perform image search with text query', async () => {
      const response = await request(app)
        .post('/api/search/image')
        .send({
          query: 'cat photos',
          limit: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'cat photos');
      expect(response.body).toHaveProperty('searchType', 'text-to-image');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should perform image search with image URL', async () => {
      const response = await request(app)
        .post('/api/search/image')
        .send({
          imageUrl: 'https://example.com/image.jpg',
          limit: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'https://example.com/image.jpg');
      expect(response.body).toHaveProperty('searchType', 'image');
      expect(response.body).toHaveProperty('results');
    });

    it('should return 400 when both query and imageUrl are missing', async () => {
      const response = await request(app)
        .post('/api/search/image')
        .send({
          limit: 5
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query or image URL is required');
    });
  });

  describe('POST /api/search/code', () => {
    it('should perform code search', async () => {
      const response = await request(app)
        .post('/api/search/code')
        .send({
          query: 'function sort array',
          language: 'javascript',
          limit: 10
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'function sort array');
      expect(response.body).toHaveProperty('language', 'javascript');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should search all languages when language not specified', async () => {
      const response = await request(app)
        .post('/api/search/code')
        .send({
          query: 'binary search algorithm',
          limit: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('language', 'all');
      expect(response.body).toHaveProperty('results');
    });
  });

  describe('POST /api/search/cross-modal', () => {
    it('should perform cross-modal search', async () => {
      const response = await request(app)
        .post('/api/search/cross-modal')
        .send({
          query: 'machine learning tutorial',
          sourceType: ContentType.TEXT,
          targetTypes: [ContentType.IMAGE, ContentType.CODE],
          limit: 5
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'machine learning tutorial');
      expect(response.body).toHaveProperty('sourceType', ContentType.TEXT);
      expect(response.body).toHaveProperty('targetTypes');
      expect(response.body).toHaveProperty('results');
      expect(response.body).toHaveProperty('crossModalMatches');
    });

    it('should return 400 for missing required parameters', async () => {
      const response = await request(app)
        .post('/api/search/cross-modal')
        .send({
          query: 'test query'
          // Missing sourceType and targetTypes
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required parameters');
    });

    it('should return 400 for invalid source type', async () => {
      const response = await request(app)
        .post('/api/search/cross-modal')
        .send({
          query: 'test query',
          sourceType: 'invalid_type',
          targetTypes: [ContentType.TEXT]
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid source type');
    });
  });

  describe('GET /api/search/suggestions', () => {
    it('should return search suggestions', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .query({
          query: 'machine learning',
          limit: 3
        })
        .expect(200);

      expect(response.body).toHaveProperty('query', 'machine learning');
      expect(response.body).toHaveProperty('suggestions');
      expect(response.body).toHaveProperty('totalSuggestions');
      expect(Array.isArray(response.body.suggestions)).toBe(true);
      expect(response.body.suggestions.length).toBeLessThanOrEqual(3);
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .get('/api/search/suggestions')
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Query is required');
    });
  });

  describe('GET /api/search/analytics', () => {
    it('should return search analytics', async () => {
      const response = await request(app)
        .get('/api/search/analytics')
        .query({
          timeframe: '24h'
        })
        .expect(200);

      expect(response.body).toHaveProperty('timeframe', '24h');
      expect(response.body).toHaveProperty('totalSearches');
      expect(response.body).toHaveProperty('uniqueUsers');
      expect(response.body).toHaveProperty('averageResponseTime');
      expect(response.body).toHaveProperty('topQueries');
      expect(response.body).toHaveProperty('contentTypeDistribution');
      expect(response.body).toHaveProperty('successRate');
      expect(Array.isArray(response.body.topQueries)).toBe(true);
    });

    it('should use default timeframe when not specified', async () => {
      const response = await request(app)
        .get('/api/search/analytics')
        .expect(200);

      expect(response.body).toHaveProperty('timeframe', '24h');
    });
  });
});