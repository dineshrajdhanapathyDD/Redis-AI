import { Redis } from 'ioredis';
import { BrandAnalyzer, BrandProfile, ContentItem, ContentType } from '../../../src/services/content-consistency/brand-analyzer';
import { EmbeddingManager } from '../../../src/services/embedding-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock EmbeddingManager
jest.mock('../../../src/services/embedding-manager');
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;

describe('BrandAnalyzer', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let brandAnalyzer: BrandAnalyzer;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    brandAnalyzer = new BrandAnalyzer(redis, embeddingManager);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.hget = jest.fn().mockResolvedValue(null);
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBrandProfile', () => {
    it('should create a brand profile successfully', async () => {
      const profileData = {
        name: 'Test Brand',
        description: 'A test brand for unit testing',
        guidelines: {
          mission: 'To test effectively',
          vision: 'A world of perfect tests',
          values: ['quality', 'reliability', 'innovation'],
          personality: ['professional', 'trustworthy'],
          positioning: 'Premium testing solutions',
          targetAudience: [],
          brandPromise: 'Reliable testing every time',
          differentiators: ['comprehensive coverage', 'easy integration']
        },
        styleElements: {} as any,
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: []
      };

      const result = await brandAnalyzer.createBrandProfile(profileData);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('Test Brand');
      expect(result.embeddings).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(embeddingManager.generateEmbedding).toHaveBeenCalled();
      expect(redis.hset).toHaveBeenCalled();
    });
  });

  describe('getBrandProfile', () => {
    it('should retrieve a brand profile', async () => {
      const mockProfile = {
        id: 'brand123',
        name: 'Test Brand',
        description: 'Test description'
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockProfile));

      const result = await brandAnalyzer.getBrandProfile('brand123');

      expect(result).toEqual(mockProfile);
      expect(redis.hget).toHaveBeenCalledWith('brand_profile:brand123', 'data');
    });

    it('should return null when brand profile not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await brandAnalyzer.getBrandProfile('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('analyzeBrandConsistency', () => {
    it('should analyze brand consistency for content items', async () => {
      const mockBrandProfile = {
        id: 'brand123',
        name: 'Test Brand',
        embeddings: {
          voiceEmbedding: [0.1, 0.2, 0.3],
          styleEmbedding: [0.2, 0.3, 0.4],
          visualEmbedding: [0.3, 0.4, 0.5],
          messagingEmbedding: [0.4, 0.5, 0.6],
          overallEmbedding: [0.25, 0.35, 0.45]
        }
      };

      const contentItems: ContentItem[] = [
        {
          id: 'content1',
          type: ContentType.ARTICLE,
          title: 'Test Article',
          content: 'This is a test article content',
          metadata: {
            author: 'Test Author',
            audience: ['general'],
            tags: ['test'],
            language: 'en',
            format: 'markdown',
            channel: 'blog'
          },
          platform: 'website',
          createdAt: new Date()
        }
      ];

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockBrandProfile));

      const result = await brandAnalyzer.analyzeBrandConsistency('brand123', contentItems);

      expect(result).toBeDefined();
      expect(result.brandId).toBe('brand123');
      expect(result.contentItems).toBe(1);
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.violations).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(redis.hset).toHaveBeenCalled(); // Should store the report
    });

    it('should throw error when brand profile not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      await expect(brandAnalyzer.analyzeBrandConsistency('nonexistent', [])).rejects.toThrow('Brand profile not found: nonexistent');
    });
  });

  describe('updateBrandProfile', () => {
    it('should update an existing brand profile', async () => {
      const existingProfile = {
        id: 'brand123',
        name: 'Old Name',
        description: 'Old description',
        embeddings: {
          voiceEmbedding: [0.1, 0.2, 0.3],
          styleEmbedding: [0.2, 0.3, 0.4],
          visualEmbedding: [0.3, 0.4, 0.5],
          messagingEmbedding: [0.4, 0.5, 0.6],
          overallEmbedding: [0.25, 0.35, 0.45]
        },
        createdAt: new Date('2023-01-01'),
        updatedAt: new Date('2023-01-01')
      };

      const updates = {
        name: 'New Name',
        description: 'New description'
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(existingProfile));

      const result = await brandAnalyzer.updateBrandProfile('brand123', updates);

      expect(result.name).toBe('New Name');
      expect(result.description).toBe('New description');
      expect(result.updatedAt).not.toEqual(existingProfile.updatedAt);
      expect(embeddingManager.generateEmbedding).toHaveBeenCalled();
      expect(redis.hset).toHaveBeenCalled();
    });

    it('should throw error when brand profile not found for update', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      await expect(brandAnalyzer.updateBrandProfile('nonexistent', { name: 'New Name' })).rejects.toThrow('Brand profile not found: nonexistent');
    });
  });
});