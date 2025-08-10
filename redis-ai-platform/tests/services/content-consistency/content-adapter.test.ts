import { Redis } from 'ioredis';
import { ContentAdapter, Platform, PlatformType, AdaptationRequest } from '../../../src/services/content-consistency/content-adapter';
import { BrandProfile, ContentItem, ContentType } from '../../../src/services/content-consistency/brand-analyzer';
import { EmbeddingManager } from '../../../src/services/embedding-manager';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock EmbeddingManager
jest.mock('../../../src/services/embedding-manager');
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;

describe('ContentAdapter', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let contentAdapter: ContentAdapter;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    contentAdapter = new ContentAdapter(redis, embeddingManager);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.hget = jest.fn().mockResolvedValue(null);
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPlatform', () => {
    it('should register a platform successfully', async () => {
      const platform: Platform = {
        id: 'test-platform',
        name: 'Test Platform',
        type: PlatformType.SOCIAL_MEDIA,
        characteristics: {
          communicationStyle: 'casual' as any,
          contentPace: 'fast' as any,
          interactionLevel: 'high' as any,
          visualImportance: 'critical' as any,
          attentionSpan: 'short' as any,
          contentLifespan: 'ephemeral' as any
        },
        constraints: {
          textLimits: {
            maxCharacters: 280,
            allowedFormatting: ['bold'],
            prohibitedContent: ['spam']
          },
          imageLimits: {
            maxWidth: 1200,
            maxHeight: 675,
            maxFileSize: 5000000,
            allowedFormats: ['jpg', 'png'],
            aspectRatios: ['16:9'],
            minResolution: { width: 600, height: 400 }
          }
        },
        audience: {} as any,
        contentFormats: [],
        bestPractices: []
      };

      await contentAdapter.registerPlatform(platform);

      expect(redis.hset).toHaveBeenCalledWith(
        'platform:test-platform',
        'data',
        JSON.stringify(platform)
      );
    });
  });

  describe('getPlatform', () => {
    it('should retrieve a platform', async () => {
      const mockPlatform = {
        id: 'test-platform',
        name: 'Test Platform',
        type: 'social_media'
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockPlatform));

      const result = await contentAdapter.getPlatform('test-platform');

      expect(result).toEqual(mockPlatform);
      expect(redis.hget).toHaveBeenCalledWith('platform:test-platform', 'data');
    });

    it('should return null when platform not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await contentAdapter.getPlatform('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('adaptContent', () => {
    it('should adapt content for multiple platforms', async () => {
      const sourceContent: ContentItem = {
        id: 'content1',
        type: ContentType.SOCIAL_POST,
        title: 'Test Post',
        content: 'This is a long test post that needs to be adapted for different social media platforms with varying character limits and audience preferences.',
        metadata: {
          author: 'Test Author',
          audience: ['general'],
          tags: ['test'],
          language: 'en',
          format: 'text',
          channel: 'social'
        },
        platform: 'original',
        createdAt: new Date()
      };

      const brandProfile: BrandProfile = {
        id: 'brand1',
        name: 'Test Brand',
        description: 'Test brand',
        guidelines: {
          mission: 'Test mission',
          vision: 'Test vision',
          values: ['quality'],
          personality: ['professional'],
          positioning: 'Premium',
          targetAudience: [],
          brandPromise: 'Quality',
          differentiators: ['innovation']
        },
        styleElements: {} as any,
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: [],
        embeddings: {
          voiceEmbedding: [0.1, 0.2, 0.3],
          styleEmbedding: [0.2, 0.3, 0.4],
          visualEmbedding: [0.3, 0.4, 0.5],
          messagingEmbedding: [0.4, 0.5, 0.6],
          overallEmbedding: [0.25, 0.35, 0.45]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockTwitterPlatform = {
        id: 'twitter',
        name: 'Twitter',
        type: 'social_media',
        characteristics: {
          communicationStyle: 'conversational',
          contentPace: 'fast',
          interactionLevel: 'high',
          visualImportance: 'moderate',
          attentionSpan: 'very_short',
          contentLifespan: 'ephemeral'
        },
        constraints: {
          textLimits: {
            maxCharacters: 280,
            allowedFormatting: [],
            prohibitedContent: []
          },
          imageLimits: {
            maxWidth: 1200,
            maxHeight: 675,
            maxFileSize: 5000000,
            allowedFormats: ['jpg', 'png'],
            aspectRatios: ['16:9'],
            minResolution: { width: 600, height: 400 }
          }
        },
        audience: {} as any,
        contentFormats: [],
        bestPractices: []
      };

      const mockLinkedInPlatform = {
        id: 'linkedin',
        name: 'LinkedIn',
        type: 'social_media',
        characteristics: {
          communicationStyle: 'professional',
          contentPace: 'medium',
          interactionLevel: 'medium',
          visualImportance: 'important',
          attentionSpan: 'medium',
          contentLifespan: 'medium'
        },
        constraints: {
          textLimits: {
            maxCharacters: 3000,
            allowedFormatting: ['bold', 'italic'],
            prohibitedContent: []
          },
          imageLimits: {
            maxWidth: 1200,
            maxHeight: 627,
            maxFileSize: 10000000,
            allowedFormats: ['jpg', 'png'],
            aspectRatios: ['1.91:1'],
            minResolution: { width: 800, height: 418 }
          }
        },
        audience: {} as any,
        contentFormats: [],
        bestPractices: []
      };

      // Mock platform retrieval
      redis.hget = jest.fn()
        .mockResolvedValueOnce(JSON.stringify(mockTwitterPlatform))
        .mockResolvedValueOnce(JSON.stringify(mockLinkedInPlatform));

      const adaptationRequest: AdaptationRequest = {
        id: 'request1',
        sourceContent,
        targetPlatforms: ['twitter', 'linkedin'],
        brandProfile,
        preferences: {
          prioritizeEngagement: true,
          maintainBrandVoice: true,
          optimizeForPlatform: true,
          preserveKeyMessages: true,
          allowCreativeLiberty: 0.3
        },
        constraints: {
          approvalRequired: false,
          mustIncludeElements: [],
          mustAvoidElements: []
        }
      };

      const result = await contentAdapter.adaptContent(adaptationRequest);

      expect(result).toBeDefined();
      expect(result.requestId).toBe('request1');
      expect(result.adaptedContent).toHaveLength(2);
      expect(result.consistencyScore).toBeGreaterThanOrEqual(0);
      expect(result.consistencyScore).toBeLessThanOrEqual(1);
      expect(result.brandAlignmentScore).toBeGreaterThanOrEqual(0);
      expect(result.brandAlignmentScore).toBeLessThanOrEqual(1);
      expect(result.platformOptimizationScore).toBeGreaterThanOrEqual(0);
      expect(result.platformOptimizationScore).toBeLessThanOrEqual(1);
      expect(result.recommendations).toBeDefined();
      expect(redis.hset).toHaveBeenCalled(); // Should store the adaptation result
    });

    it('should handle missing platforms gracefully', async () => {
      const sourceContent: ContentItem = {
        id: 'content1',
        type: ContentType.SOCIAL_POST,
        title: 'Test Post',
        content: 'Test content',
        metadata: {
          author: 'Test Author',
          audience: ['general'],
          tags: ['test'],
          language: 'en',
          format: 'text',
          channel: 'social'
        },
        platform: 'original',
        createdAt: new Date()
      };

      const brandProfile: BrandProfile = {
        id: 'brand1',
        name: 'Test Brand',
        description: 'Test brand',
        guidelines: {} as any,
        styleElements: {} as any,
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: [],
        embeddings: {
          voiceEmbedding: [0.1, 0.2, 0.3],
          styleEmbedding: [0.2, 0.3, 0.4],
          visualEmbedding: [0.3, 0.4, 0.5],
          messagingEmbedding: [0.4, 0.5, 0.6],
          overallEmbedding: [0.25, 0.35, 0.45]
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const adaptationRequest: AdaptationRequest = {
        id: 'request1',
        sourceContent,
        targetPlatforms: ['nonexistent-platform'],
        brandProfile,
        preferences: {
          prioritizeEngagement: true,
          maintainBrandVoice: true,
          optimizeForPlatform: true,
          preserveKeyMessages: true,
          allowCreativeLiberty: 0.3
        },
        constraints: {
          approvalRequired: false,
          mustIncludeElements: [],
          mustAvoidElements: []
        }
      };

      // Mock platform not found
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await contentAdapter.adaptContent(adaptationRequest);

      expect(result).toBeDefined();
      expect(result.adaptedContent).toHaveLength(0); // No platforms found
    });
  });

  describe('createContentTemplate', () => {
    it('should create a content template', async () => {
      const template = {
        id: 'template1',
        name: 'Social Media Template',
        description: 'Template for social media posts',
        structure: {} as any,
        variables: [],
        rules: []
      };

      await contentAdapter.createContentTemplate(template);

      expect(redis.hset).toHaveBeenCalledWith(
        'template:template1',
        'data',
        JSON.stringify(template)
      );
    });
  });

  describe('getContentTemplate', () => {
    it('should retrieve a content template', async () => {
      const mockTemplate = {
        id: 'template1',
        name: 'Social Media Template',
        description: 'Template for social media posts'
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockTemplate));

      const result = await contentAdapter.getContentTemplate('template1');

      expect(result).toEqual(mockTemplate);
      expect(redis.hget).toHaveBeenCalledWith('template:template1', 'data');
    });

    it('should return null when template not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await contentAdapter.getContentTemplate('nonexistent');

      expect(result).toBeNull();
    });
  });
});