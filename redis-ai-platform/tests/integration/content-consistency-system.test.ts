import { Redis } from 'ioredis';
import { ContentConsistencyService } from '../../src/services/content-consistency';
import { EmbeddingManager } from '../../src/services/embedding-manager';
import { ContentType } from '../../src/services/content-consistency/brand-analyzer';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock EmbeddingManager
jest.mock('../../src/services/embedding-manager');
const MockedEmbeddingManager = EmbeddingManager as jest.MockedClass<typeof EmbeddingManager>;

describe('Content Consistency System Integration', () => {
  let redis: jest.Mocked<Redis>;
  let embeddingManager: jest.Mocked<EmbeddingManager>;
  let contentConsistencyService: ContentConsistencyService;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    embeddingManager = new MockedEmbeddingManager(redis) as jest.Mocked<EmbeddingManager>;
    contentConsistencyService = new ContentConsistencyService(redis, embeddingManager);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.hget = jest.fn().mockResolvedValue(null);
    redis.zadd = jest.fn().mockResolvedValue(1);
    redis.zremrangebyscore = jest.fn().mockResolvedValue(1);
    redis.keys = jest.fn().mockResolvedValue([]);
    embeddingManager.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('End-to-End Content Consistency Workflow', () => {
    it('should handle complete brand consistency workflow', async () => {
      // Step 1: Initialize the service
      await contentConsistencyService.initialize();

      // Step 2: Create a brand profile
      const brandProfileData = {
        name: 'TechCorp',
        description: 'A leading technology company focused on innovation',
        guidelines: {
          mission: 'To democratize technology for everyone',
          vision: 'A world where technology empowers every individual',
          values: ['innovation', 'accessibility', 'quality', 'transparency'],
          personality: ['innovative', 'approachable', 'reliable', 'forward-thinking'],
          positioning: 'Premium technology solutions for modern businesses',
          targetAudience: [
            {
              id: 'tech-professionals',
              name: 'Technology Professionals',
              demographics: {
                ageRange: '25-45',
                gender: ['male', 'female', 'non-binary'],
                location: ['North America', 'Europe', 'Asia'],
                income: '$75,000+',
                education: 'Bachelor\'s degree or higher',
                occupation: ['software engineer', 'product manager', 'CTO', 'tech lead']
              },
              psychographics: {
                interests: ['technology', 'innovation', 'productivity', 'career growth'],
                values: ['efficiency', 'quality', 'continuous learning'],
                lifestyle: ['tech-savvy', 'early adopter', 'career-focused'],
                attitudes: ['optimistic about technology', 'values expertise'],
                motivations: ['career advancement', 'solving complex problems'],
                painPoints: ['information overload', 'keeping up with trends']
              },
              preferences: {
                contentTypes: ['technical articles', 'case studies', 'tutorials'],
                channels: ['LinkedIn', 'Twitter', 'tech blogs'],
                formats: ['long-form content', 'infographics', 'videos'],
                tone: ['professional', 'informative', 'authoritative'],
                topics: ['AI/ML', 'cloud computing', 'software development']
              },
              communicationStyle: {
                formality: 'semi_formal' as any,
                complexity: 'advanced' as any,
                emotionalTone: 'confident' as any,
                perspective: 'second_person' as any,
                callToActionStyle: 'direct' as any
              }
            }
          ],
          brandPromise: 'Reliable technology solutions that scale with your business',
          differentiators: ['cutting-edge innovation', 'enterprise-grade security', 'exceptional support']
        },
        styleElements: {
          typography: {
            primaryFont: {
              family: 'Inter',
              weights: [400, 500, 600, 700],
              styles: ['normal', 'italic'],
              fallbacks: ['system-ui', 'sans-serif']
            },
            headingStyles: [
              {
                level: 1,
                fontSize: '2.5rem',
                fontWeight: 700,
                lineHeight: 1.2,
                letterSpacing: -0.02,
                color: '#1a1a1a'
              }
            ],
            bodyTextStyle: {
              fontSize: '1rem',
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: 0,
              color: '#333333'
            },
            captionStyle: {
              fontSize: '0.875rem',
              fontWeight: 400,
              lineHeight: 1.4,
              letterSpacing: 0,
              color: '#666666'
            },
            linkStyle: {
              fontSize: '1rem',
              fontWeight: 500,
              lineHeight: 1.6,
              letterSpacing: 0,
              color: '#0066cc'
            }
          },
          colorPalette: {
            primary: {
              name: 'TechCorp Blue',
              hex: '#0066cc',
              rgb: { r: 0, g: 102, b: 204 },
              hsl: { h: 210, s: 100, l: 40 },
              usage: ['primary buttons', 'links', 'headers'],
              accessibility: {
                contrastRatio: 4.5,
                wcagLevel: 'AA' as any,
                suitableFor: ['text', 'backgrounds']
              }
            },
            secondary: [],
            neutral: [],
            accent: [],
            semantic: {
              success: {
                name: 'Success Green',
                hex: '#28a745',
                rgb: { r: 40, g: 167, b: 69 },
                hsl: { h: 134, s: 61, l: 41 },
                usage: ['success messages', 'positive indicators'],
                accessibility: {
                  contrastRatio: 3.1,
                  wcagLevel: 'AA' as any,
                  suitableFor: ['text']
                }
              },
              warning: {
                name: 'Warning Orange',
                hex: '#ffc107',
                rgb: { r: 255, g: 193, b: 7 },
                hsl: { h: 45, s: 100, l: 51 },
                usage: ['warning messages', 'caution indicators'],
                accessibility: {
                  contrastRatio: 2.8,
                  wcagLevel: 'AA' as any,
                  suitableFor: ['backgrounds']
                }
              },
              error: {
                name: 'Error Red',
                hex: '#dc3545',
                rgb: { r: 220, g: 53, b: 69 },
                hsl: { h: 354, s: 70, l: 54 },
                usage: ['error messages', 'critical alerts'],
                accessibility: {
                  contrastRatio: 5.2,
                  wcagLevel: 'AA' as any,
                  suitableFor: ['text', 'backgrounds']
                }
              },
              info: {
                name: 'Info Blue',
                hex: '#17a2b8',
                rgb: { r: 23, g: 162, b: 184 },
                hsl: { h: 188, s: 78, l: 41 },
                usage: ['info messages', 'neutral indicators'],
                accessibility: {
                  contrastRatio: 4.1,
                  wcagLevel: 'AA' as any,
                  suitableFor: ['text']
                }
              }
            }
          },
          imagery: {} as any,
          layout: {} as any,
          spacing: {} as any,
          iconography: {} as any
        },
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: []
      };

      const brandProfile = await contentConsistencyService.brandAnalyzer.createBrandProfile(brandProfileData);
      expect(brandProfile).toBeDefined();
      expect(brandProfile.name).toBe('TechCorp');

      // Step 3: Create content items to analyze
      const contentItems = [
        {
          id: 'content1',
          type: ContentType.ARTICLE,
          title: 'The Future of AI in Enterprise Software',
          content: 'Artificial intelligence is revolutionizing how enterprises approach software development. Our cutting-edge AI solutions help businesses scale efficiently while maintaining security and reliability. With TechCorp\'s innovative platform, companies can harness the power of machine learning to drive growth and innovation.',
          metadata: {
            author: 'TechCorp Team',
            audience: ['tech-professionals'],
            tags: ['AI', 'enterprise', 'software', 'innovation'],
            language: 'en',
            format: 'markdown',
            channel: 'blog'
          },
          platform: 'website',
          createdAt: new Date()
        },
        {
          id: 'content2',
          type: ContentType.SOCIAL_POST,
          title: 'Quick AI Update',
          content: 'Just shipped our new AI features! 🚀 Game-changing stuff for developers. Check it out and let us know what you think! #AI #TechCorp #Innovation',
          metadata: {
            author: 'TechCorp Social',
            audience: ['tech-professionals'],
            tags: ['AI', 'product-update', 'social'],
            language: 'en',
            format: 'text',
            channel: 'social'
          },
          platform: 'twitter',
          createdAt: new Date()
        }
      ];

      // Step 4: Analyze brand consistency
      const consistencyReport = await contentConsistencyService.brandAnalyzer.analyzeBrandConsistency(
        brandProfile.id,
        contentItems
      );

      expect(consistencyReport).toBeDefined();
      expect(consistencyReport.brandId).toBe(brandProfile.id);
      expect(consistencyReport.contentItems).toBe(2);
      expect(consistencyReport.overallScore).toBeGreaterThanOrEqual(0);
      expect(consistencyReport.overallScore).toBeLessThanOrEqual(1);

      // Step 5: Adapt content for different platforms
      const adaptationRequest = {
        id: 'adaptation1',
        sourceContent: contentItems[0],
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
          mustIncludeElements: ['TechCorp'],
          mustAvoidElements: ['competitor names']
        }
      };

      // Mock platform data for adaptation
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

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockTwitterPlatform));

      const adaptationResult = await contentConsistencyService.contentAdapter.adaptContent(adaptationRequest);
      expect(adaptationResult).toBeDefined();
      expect(adaptationResult.requestId).toBe('adaptation1');

      // Step 6: Track performance
      const performanceData = {
        contentId: 'content1',
        platformId: 'website',
        metrics: {
          views: 5000,
          impressions: 7500,
          clicks: 250,
          shares: 45,
          saves: 20,
          comments: 35,
          likes: 180,
          reactions: {
            like: 150,
            love: 20,
            laugh: 5,
            wow: 5,
            sad: 0,
            angry: 0,
            care: 0
          },
          timeSpent: 120,
          bounceRate: 0.25,
          completionRate: 0.85
        },
        engagement: {
          engagementRate: 0.15,
          engagementQuality: {
            score: 0.85,
            factors: [],
            breakdown: {
              meaningfulInteractions: 85,
              superficialInteractions: 15,
              negativeInteractions: 0,
              spamInteractions: 0
            }
          },
          audienceGrowth: 0.08,
          repeatEngagement: 0.4,
          shareQuality: {
            organicShares: 40,
            incentivizedShares: 5,
            shareContext: [],
            shareAudience: {
              internal: 30,
              external: 15,
              crossPlatform: []
            }
          },
          commentSentiment: {
            overall: {
              score: 0.8,
              confidence: 0.85,
              distribution: {
                positive: 0.8,
                neutral: 0.15,
                negative: 0.05
              }
            },
            breakdown: {} as any,
            trends: [],
            keyTopics: []
          },
          viralityScore: 0.3
        },
        reach: {} as any,
        conversion: {} as any,
        brandImpact: {} as any,
        timestamp: new Date()
      };

      await contentConsistencyService.performanceTracker.trackPerformance(performanceData);

      // Step 7: Generate performance report
      const timeframe = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      redis.keys = jest.fn().mockResolvedValue(['performance:content1:website']);
      redis.zrangebyscore = jest.fn().mockResolvedValue([JSON.stringify(performanceData)]);

      const performanceReport = await contentConsistencyService.performanceTracker.generatePerformanceReport(
        ['content1'],
        timeframe
      );

      expect(performanceReport).toBeDefined();
      expect(performanceReport.contentIds).toContain('content1');
      expect(performanceReport.summary).toBeDefined();
      expect(performanceReport.insights).toBeDefined();

      // Step 8: Shutdown the service
      await contentConsistencyService.shutdown();

      // Verify all components were called appropriately
      expect(redis.hset).toHaveBeenCalledTimes(6); // Brand profile, consistency report, adaptation result, performance data, insights, performance report
      expect(embeddingManager.generateEmbedding).toHaveBeenCalled();
    });

    it('should handle brand consistency violations and recommendations', async () => {
      await contentConsistencyService.initialize();

      // Create a brand profile with strict guidelines
      const strictBrandProfile = await contentConsistencyService.brandAnalyzer.createBrandProfile({
        name: 'StrictBrand',
        description: 'A brand with very specific guidelines',
        guidelines: {
          mission: 'Professional excellence',
          vision: 'Industry leadership',
          values: ['professionalism', 'quality'],
          personality: ['formal', 'authoritative'],
          positioning: 'Premium professional services',
          targetAudience: [],
          brandPromise: 'Uncompromising quality',
          differentiators: ['expertise', 'reliability']
        },
        styleElements: {} as any,
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: []
      });

      // Create content that violates brand guidelines
      const violatingContent = [
        {
          id: 'violating1',
          type: ContentType.SOCIAL_POST,
          title: 'Casual Post',
          content: 'Hey guys! 😎 Just wanted to say our stuff is pretty cool lol. Hit us up if you want to chat! 🔥',
          metadata: {
            author: 'Social Team',
            audience: ['general'],
            tags: ['casual', 'social'],
            language: 'en',
            format: 'text',
            channel: 'social'
          },
          platform: 'twitter',
          createdAt: new Date()
        }
      ];

      const consistencyReport = await contentConsistencyService.brandAnalyzer.analyzeBrandConsistency(
        strictBrandProfile.id,
        violatingContent
      );

      expect(consistencyReport).toBeDefined();
      expect(consistencyReport.brandId).toBe(strictBrandProfile.id);
      expect(consistencyReport.contentItems).toBe(1);
      // The score should reflect the mismatch between casual content and formal brand
      expect(consistencyReport.overallScore).toBeDefined();
    });

    it('should optimize content adaptation for platform-specific constraints', async () => {
      await contentConsistencyService.initialize();

      const brandProfile = await contentConsistencyService.brandAnalyzer.createBrandProfile({
        name: 'AdaptiveBrand',
        description: 'A brand that adapts well to different platforms',
        guidelines: {
          mission: 'Flexible communication',
          vision: 'Multi-platform excellence',
          values: ['adaptability', 'consistency'],
          personality: ['flexible', 'consistent'],
          positioning: 'Adaptive brand solutions',
          targetAudience: [],
          brandPromise: 'Consistent message, optimized delivery',
          differentiators: ['platform optimization', 'message consistency']
        },
        styleElements: {} as any,
        voiceAndTone: {} as any,
        visualIdentity: {} as any,
        contentRules: []
      });

      // Long-form content that needs adaptation
      const longFormContent = {
        id: 'longform1',
        type: ContentType.ARTICLE,
        title: 'Comprehensive Guide to Platform Optimization',
        content: 'This is a comprehensive guide that covers all aspects of platform optimization. It includes detailed explanations, step-by-step instructions, case studies, and best practices. The content is designed to be thorough and informative, providing readers with everything they need to know about optimizing their content for different platforms. This guide covers social media platforms, email marketing, website content, and more. Each section provides specific recommendations and actionable insights that readers can implement immediately.',
        metadata: {
          author: 'Content Team',
          audience: ['marketers', 'content creators'],
          tags: ['optimization', 'platforms', 'guide'],
          language: 'en',
          format: 'markdown',
          channel: 'blog'
        },
        platform: 'website',
        createdAt: new Date()
      };

      // Mock Twitter platform with character limit
      const twitterPlatform = {
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

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(twitterPlatform));

      const adaptationRequest = {
        id: 'longform-adaptation',
        sourceContent: longFormContent,
        targetPlatforms: ['twitter'],
        brandProfile,
        preferences: {
          prioritizeEngagement: true,
          maintainBrandVoice: true,
          optimizeForPlatform: true,
          preserveKeyMessages: true,
          allowCreativeLiberty: 0.5
        },
        constraints: {
          approvalRequired: false,
          mustIncludeElements: ['optimization'],
          mustAvoidElements: []
        }
      };

      const adaptationResult = await contentConsistencyService.contentAdapter.adaptContent(adaptationRequest);

      expect(adaptationResult).toBeDefined();
      expect(adaptationResult.adaptedContent).toHaveLength(1);
      
      const twitterAdaptation = adaptationResult.adaptedContent[0];
      expect(twitterAdaptation.platformId).toBe('twitter');
      expect(twitterAdaptation.adaptations).toBeDefined();
      
      // Should have adaptations for text length
      const textLengthAdaptation = twitterAdaptation.adaptations.find(
        a => a.type === 'text_length'
      );
      expect(textLengthAdaptation).toBeDefined();
    });
  });

  describe('Performance Tracking and Analytics', () => {
    it('should track and analyze content performance trends', async () => {
      await contentConsistencyService.initialize();

      const contentId = 'trending-content';
      const platformId = 'linkedin';

      // Simulate performance data over time showing improving trend
      const performanceDataPoints = [
        {
          contentId,
          platformId,
          metrics: { views: 1000, clicks: 50, shares: 5 },
          engagement: { engagementRate: 0.05 },
          reach: { totalReach: 1000 },
          conversion: {} as any,
          brandImpact: {} as any,
          timestamp: new Date('2023-01-01')
        },
        {
          contentId,
          platformId,
          metrics: { views: 1500, clicks: 90, shares: 12 },
          engagement: { engagementRate: 0.08 },
          reach: { totalReach: 1500 },
          conversion: {} as any,
          brandImpact: {} as any,
          timestamp: new Date('2023-01-15')
        },
        {
          contentId,
          platformId,
          metrics: { views: 2200, clicks: 150, shares: 25 },
          engagement: { engagementRate: 0.12 },
          reach: { totalReach: 2200 },
          conversion: {} as any,
          brandImpact: {} as any,
          timestamp: new Date('2023-01-30')
        }
      ];

      // Track each performance data point
      for (const data of performanceDataPoints) {
        await contentConsistencyService.performanceTracker.trackPerformance(data);
      }

      // Mock Redis responses for trend analysis
      redis.keys = jest.fn().mockResolvedValue([`performance:${contentId}:${platformId}`]);
      redis.zrangebyscore = jest.fn().mockResolvedValue(
        performanceDataPoints.map(data => JSON.stringify(data))
      );

      const timeframe = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      const insights = await contentConsistencyService.performanceTracker.generateInsights(
        [contentId],
        timeframe
      );

      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);

      const performanceReport = await contentConsistencyService.performanceTracker.generatePerformanceReport(
        [contentId],
        timeframe
      );

      expect(performanceReport).toBeDefined();
      expect(performanceReport.summary.totalContent).toBe(1);
      expect(performanceReport.insights).toBeDefined();
      expect(performanceReport.recommendations).toBeDefined();
    });
  });
});