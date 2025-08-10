import { Redis } from 'ioredis';
import { PerformanceTracker, ContentPerformance, TimeFrame } from '../../../src/services/content-consistency/performance-tracker';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('PerformanceTracker', () => {
  let redis: jest.Mocked<Redis>;
  let performanceTracker: PerformanceTracker;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    performanceTracker = new PerformanceTracker(redis);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.hget = jest.fn().mockResolvedValue(null);
    redis.zadd = jest.fn().mockResolvedValue(1);
    redis.zremrangebyscore = jest.fn().mockResolvedValue(1);
    redis.zrangebyscore = jest.fn().mockResolvedValue([]);
    redis.keys = jest.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackPerformance', () => {
    it('should track performance data successfully', async () => {
      const performance: ContentPerformance = {
        contentId: 'content1',
        platformId: 'twitter',
        metrics: {
          views: 1000,
          impressions: 1500,
          clicks: 50,
          shares: 10,
          saves: 5,
          comments: 8,
          likes: 100,
          reactions: {
            like: 80,
            love: 15,
            laugh: 3,
            wow: 2,
            sad: 0,
            angry: 0,
            care: 0
          },
          timeSpent: 30,
          bounceRate: 0.3,
          completionRate: 0.7
        },
        engagement: {
          engagementRate: 0.12,
          engagementQuality: {
            score: 0.8,
            factors: [],
            breakdown: {
              meaningfulInteractions: 80,
              superficialInteractions: 20,
              negativeInteractions: 0,
              spamInteractions: 0
            }
          },
          audienceGrowth: 0.05,
          repeatEngagement: 0.3,
          shareQuality: {
            organicShares: 8,
            incentivizedShares: 2,
            shareContext: [],
            shareAudience: {
              internal: 6,
              external: 4,
              crossPlatform: []
            }
          },
          commentSentiment: {
            overall: {
              score: 0.7,
              confidence: 0.8,
              distribution: {
                positive: 0.7,
                neutral: 0.2,
                negative: 0.1
              }
            },
            breakdown: {} as any,
            trends: [],
            keyTopics: []
          },
          viralityScore: 0.2
        },
        reach: {
          totalReach: 1200,
          organicReach: 1000,
          paidReach: 200,
          viralReach: 100,
          audienceBreakdown: {
            newAudience: 800,
            returningAudience: 400,
            targetAudience: 900,
            spilloverAudience: 300,
            audienceQuality: {
              score: 0.8,
              relevanceScore: 0.85,
              engagementPotential: 0.75,
              conversionPotential: 0.6,
              brandAffinity: 0.7
            }
          },
          geographicReach: {
            countries: [],
            regions: [],
            cities: [],
            timeZones: []
          },
          demographicReach: {
            age: [],
            gender: [],
            interests: [],
            behaviors: []
          },
          deviceReach: {
            mobile: {
              reach: 800,
              percentage: 0.67,
              engagement: 0.12,
              performance: {
                loadTime: 2.5,
                interactionRate: 0.15,
                completionRate: 0.8,
                errorRate: 0.02
              }
            },
            desktop: {
              reach: 300,
              percentage: 0.25,
              engagement: 0.18,
              performance: {
                loadTime: 1.8,
                interactionRate: 0.22,
                completionRate: 0.9,
                errorRate: 0.01
              }
            },
            tablet: {
              reach: 100,
              percentage: 0.08,
              engagement: 0.14,
              performance: {
                loadTime: 2.2,
                interactionRate: 0.16,
                completionRate: 0.85,
                errorRate: 0.015
              }
            },
            other: {
              reach: 0,
              percentage: 0,
              engagement: 0,
              performance: {
                loadTime: 0,
                interactionRate: 0,
                completionRate: 0,
                errorRate: 0
              }
            }
          }
        },
        conversion: {
          totalConversions: 5,
          conversionRate: 0.005,
          conversionValue: 250,
          conversionFunnel: [],
          attributionModel: {} as any,
          conversionTypes: [],
          customerJourney: []
        },
        brandImpact: {
          brandAwareness: {
            aided: 0.3,
            unaided: 0.15,
            topOfMind: 0.05,
            brandRecall: 0.25,
            brandRecognition: 0.4,
            shareOfVoice: 0.08
          },
          brandSentiment: {
            overall: {
              score: 0.7,
              confidence: 0.8,
              distribution: {
                positive: 0.7,
                neutral: 0.2,
                negative: 0.1
              }
            },
            attributes: [],
            competitors: [],
            trends: []
          },
          brandAssociation: {
            primaryAssociations: [],
            secondaryAssociations: [],
            negativeAssociations: [],
            associationStrength: 0.6,
            associationUniqueness: 0.4
          },
          brandLoyalty: {
            customerRetention: 0.8,
            repeatPurchase: 0.6,
            advocacy: {
              netPromoterScore: 7.5,
              referralRate: 0.1,
              wordOfMouth: 0.3,
              userGeneratedContent: 0.05,
              testimonials: 0.02
            },
            switchingCost: 0.4,
            emotionalConnection: 0.6
          },
          brandEquity: {
            financialValue: 1000000,
            marketShare: 0.15,
            premiumPricing: 0.2,
            brandStrength: {
              differentiation: 0.7,
              relevance: 0.8,
              esteem: 0.6,
              knowledge: 0.7,
              overall: 0.7
            },
            brandRelevance: 0.8
          }
        },
        timestamp: new Date()
      };

      await performanceTracker.trackPerformance(performance);

      expect(redis.hset).toHaveBeenCalledWith(
        'performance:content1:twitter',
        'data',
        JSON.stringify(performance)
      );
      expect(redis.zadd).toHaveBeenCalledWith(
        'performance:content1:twitter:timeseries',
        performance.timestamp.getTime(),
        JSON.stringify(performance)
      );
      expect(redis.zremrangebyscore).toHaveBeenCalled(); // Cleanup old data
    });
  });

  describe('getPerformance', () => {
    it('should retrieve performance data', async () => {
      const mockPerformance = {
        contentId: 'content1',
        platformId: 'twitter',
        metrics: { views: 1000 }
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockPerformance));

      const result = await performanceTracker.getPerformance('content1', 'twitter');

      expect(result).toEqual(mockPerformance);
      expect(redis.hget).toHaveBeenCalledWith('performance:content1:twitter', 'data');
    });

    it('should return null when performance data not found', async () => {
      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await performanceTracker.getPerformance('nonexistent', 'twitter');

      expect(result).toBeNull();
    });
  });

  describe('getPerformanceHistory', () => {
    it('should retrieve performance history within timeframe', async () => {
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      const mockHistoryData = [
        JSON.stringify({ contentId: 'content1', timestamp: new Date('2023-01-15') }),
        JSON.stringify({ contentId: 'content1', timestamp: new Date('2023-01-20') })
      ];

      redis.zrangebyscore = jest.fn().mockResolvedValue(mockHistoryData);

      const result = await performanceTracker.getPerformanceHistory('content1', 'twitter', timeframe);

      expect(result).toHaveLength(2);
      expect(result[0].contentId).toBe('content1');
      expect(redis.zrangebyscore).toHaveBeenCalledWith(
        'performance:content1:twitter:timeseries',
        timeframe.start.getTime(),
        timeframe.end.getTime()
      );
    });

    it('should return empty array when no history found', async () => {
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      redis.zrangebyscore = jest.fn().mockResolvedValue([]);

      const result = await performanceTracker.getPerformanceHistory('content1', 'twitter', timeframe);

      expect(result).toHaveLength(0);
    });
  });

  describe('generateInsights', () => {
    it('should generate insights from performance data', async () => {
      const contentIds = ['content1', 'content2'];
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      // Mock Redis keys response
      redis.keys = jest.fn().mockResolvedValue([
        'performance:content1:twitter',
        'performance:content1:linkedin',
        'performance:content2:twitter'
      ]);

      // Mock performance history
      const mockHistoryData = [
        JSON.stringify({
          contentId: 'content1',
          engagement: { engagementRate: 0.1 },
          reach: { totalReach: 1000 },
          timestamp: new Date('2023-01-15')
        }),
        JSON.stringify({
          contentId: 'content1',
          engagement: { engagementRate: 0.15 },
          reach: { totalReach: 1200 },
          timestamp: new Date('2023-01-20')
        })
      ];

      redis.zrangebyscore = jest.fn().mockResolvedValue(mockHistoryData);

      const result = await performanceTracker.generateInsights(contentIds, timeframe);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(redis.keys).toHaveBeenCalled();
      expect(redis.hset).toHaveBeenCalled(); // Should store insights
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate a comprehensive performance report', async () => {
      const contentIds = ['content1', 'content2'];
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      // Mock Redis responses
      redis.keys = jest.fn().mockResolvedValue(['performance:content1:twitter']);
      redis.zrangebyscore = jest.fn().mockResolvedValue([
        JSON.stringify({
          contentId: 'content1',
          engagement: { engagementRate: 0.12 },
          reach: { totalReach: 1000 },
          timestamp: new Date('2023-01-15')
        })
      ]);

      const result = await performanceTracker.generatePerformanceReport(contentIds, timeframe);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.contentIds).toEqual(contentIds);
      expect(result.timeframe).toEqual(timeframe);
      expect(result.summary).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(result.recommendations).toBeDefined();
      expect(result.benchmarks).toBeDefined();
      expect(result.generatedAt).toBeDefined();
      expect(redis.hset).toHaveBeenCalled(); // Should store the report
    });
  });

  describe('trackBrandImpact', () => {
    it('should track brand impact metrics', async () => {
      const brandImpact = {
        brandAwareness: {
          aided: 0.3,
          unaided: 0.15,
          topOfMind: 0.05,
          brandRecall: 0.25,
          brandRecognition: 0.4,
          shareOfVoice: 0.08
        },
        brandSentiment: {
          overall: {
            score: 0.7,
            confidence: 0.8,
            distribution: {
              positive: 0.7,
              neutral: 0.2,
              negative: 0.1
            }
          },
          attributes: [],
          competitors: [],
          trends: []
        },
        brandAssociation: {
          primaryAssociations: [],
          secondaryAssociations: [],
          negativeAssociations: [],
          associationStrength: 0.6,
          associationUniqueness: 0.4
        },
        brandLoyalty: {
          customerRetention: 0.8,
          repeatPurchase: 0.6,
          advocacy: {
            netPromoterScore: 7.5,
            referralRate: 0.1,
            wordOfMouth: 0.3,
            userGeneratedContent: 0.05,
            testimonials: 0.02
          },
          switchingCost: 0.4,
          emotionalConnection: 0.6
        },
        brandEquity: {
          financialValue: 1000000,
          marketShare: 0.15,
          premiumPricing: 0.2,
          brandStrength: {
            differentiation: 0.7,
            relevance: 0.8,
            esteem: 0.6,
            knowledge: 0.7,
            overall: 0.7
          },
          brandRelevance: 0.8
        }
      };

      await performanceTracker.trackBrandImpact('content1', brandImpact);

      expect(redis.hset).toHaveBeenCalledWith(
        'brand_impact:content1',
        'data',
        expect.stringContaining('content1')
      );
    });
  });

  describe('getBrandImpactTrends', () => {
    it('should retrieve brand impact trends', async () => {
      const contentIds = ['content1', 'content2'];
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      const mockBrandImpactData = {
        contentId: 'content1',
        brandImpact: {
          brandAwareness: { aided: 0.3 }
        },
        timestamp: new Date('2023-01-15')
      };

      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockBrandImpactData));

      const result = await performanceTracker.getBrandImpactTrends(contentIds, timeframe);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(redis.hget).toHaveBeenCalledWith('brand_impact:content1', 'data');
    });

    it('should handle missing brand impact data', async () => {
      const contentIds = ['nonexistent'];
      const timeframe: TimeFrame = {
        start: new Date('2023-01-01'),
        end: new Date('2023-01-31'),
        period: 'month',
        timezone: 'UTC'
      };

      redis.hget = jest.fn().mockResolvedValue(null);

      const result = await performanceTracker.getBrandImpactTrends(contentIds, timeframe);

      expect(result).toHaveLength(0);
    });
  });
});