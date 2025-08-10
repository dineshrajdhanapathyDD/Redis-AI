import { Redis } from 'ioredis';
import { ContentConsistencyService } from '../services/content-consistency';
import { EmbeddingManager } from '../services/embedding-manager';
import { ContentType } from '../services/content-consistency/brand-analyzer';
import { logger } from '../utils/logger';

export class ContentConsistencyDemo {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private contentConsistencyService: ContentConsistencyService;

  constructor(redis: Redis) {
    this.redis = redis;
    this.embeddingManager = new EmbeddingManager(redis);
    this.contentConsistencyService = new ContentConsistencyService(redis, this.embeddingManager);
  }

  async runDemo(): Promise<void> {
    logger.info('🎨 Starting Content Consistency Management Demo');

    try {
      // Initialize the service
      await this.contentConsistencyService.initialize();
      logger.info('✅ Content Consistency Service initialized');

      // Demo 1: Brand Profile Creation and Management
      await this.demoBrandProfileManagement();

      // Demo 2: Content Consistency Analysis
      await this.demoContentConsistencyAnalysis();

      // Demo 3: Cross-Platform Content Adaptation
      await this.demoCrossPlatformAdaptation();

      // Demo 4: Performance Tracking and Analytics
      await this.demoPerformanceTracking();

      // Demo 5: Brand Impact Measurement
      await this.demoBrandImpactMeasurement();

      logger.info('🎉 Content Consistency Management Demo completed successfully!');

    } catch (error) {
      logger.error('❌ Demo failed:', error);
      throw error;
    } finally {
      await this.contentConsistencyService.shutdown();
    }
  }

  private async demoBrandProfileManagement(): Promise<void> {
    logger.info('\n📋 Demo 1: Brand Profile Creation and Management');

    // Create a comprehensive brand profile
    const brandProfileData = {
      name: 'TechFlow Solutions',
      description: 'A cutting-edge technology company specializing in AI-powered business solutions',
      guidelines: {
        mission: 'To empower businesses with intelligent technology solutions that drive growth and innovation',
        vision: 'A world where every business can harness the power of AI to achieve their goals',
        values: ['innovation', 'reliability', 'transparency', 'customer-centricity', 'excellence'],
        personality: ['innovative', 'trustworthy', 'approachable', 'expert', 'forward-thinking'],
        positioning: 'The trusted partner for AI-powered business transformation',
        targetAudience: [
          {
            id: 'business-leaders',
            name: 'Business Leaders & Decision Makers',
            demographics: {
              ageRange: '35-55',
              gender: ['male', 'female', 'non-binary'],
              location: ['North America', 'Europe', 'Asia-Pacific'],
              income: '$100,000+',
              education: 'Bachelor\'s degree or higher',
              occupation: ['CEO', 'CTO', 'VP', 'Director', 'Manager']
            },
            psychographics: {
              interests: ['business growth', 'technology trends', 'efficiency', 'ROI'],
              values: ['results', 'innovation', 'reliability', 'growth'],
              lifestyle: ['busy', 'goal-oriented', 'tech-aware'],
              attitudes: ['optimistic about technology', 'values expertise', 'risk-aware'],
              motivations: ['business growth', 'competitive advantage', 'efficiency'],
              painPoints: ['complex technology', 'ROI uncertainty', 'implementation challenges']
            },
            preferences: {
              contentTypes: ['case studies', 'whitepapers', 'webinars', 'executive summaries'],
              channels: ['LinkedIn', 'email', 'industry publications'],
              formats: ['professional articles', 'data-driven content', 'video presentations'],
              tone: ['professional', 'authoritative', 'results-focused'],
              topics: ['AI/ML', 'business transformation', 'ROI', 'case studies']
            },
            communicationStyle: {
              formality: 'formal' as any,
              complexity: 'advanced' as any,
              emotionalTone: 'confident' as any,
              perspective: 'second_person' as any,
              callToActionStyle: 'direct' as any
            }
          }
        ],
        brandPromise: 'Delivering measurable business results through intelligent technology solutions',
        differentiators: [
          'Proven AI expertise with 10+ years experience',
          'Industry-specific solutions tailored to your needs',
          'Comprehensive support from strategy to implementation',
          'Measurable ROI with transparent reporting'
        ]
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
            },
            {
              level: 2,
              fontSize: '2rem',
              fontWeight: 600,
              lineHeight: 1.3,
              letterSpacing: -0.01,
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
            name: 'TechFlow Blue',
            hex: '#0066cc',
            rgb: { r: 0, g: 102, b: 204 },
            hsl: { h: 210, s: 100, l: 40 },
            usage: ['primary buttons', 'links', 'headers', 'brand elements'],
            accessibility: {
              contrastRatio: 4.5,
              wcagLevel: 'AA' as any,
              suitableFor: ['text', 'backgrounds']
            }
          },
          secondary: [
            {
              name: 'TechFlow Gray',
              hex: '#6c757d',
              rgb: { r: 108, g: 117, b: 125 },
              hsl: { h: 210, s: 7, l: 46 },
              usage: ['secondary text', 'borders', 'subtle elements'],
              accessibility: {
                contrastRatio: 3.2,
                wcagLevel: 'AA' as any,
                suitableFor: ['text']
              }
            }
          ],
          neutral: [
            {
              name: 'White',
              hex: '#ffffff',
              rgb: { r: 255, g: 255, b: 255 },
              hsl: { h: 0, s: 0, l: 100 },
              usage: ['backgrounds', 'cards', 'content areas'],
              accessibility: {
                contrastRatio: 21,
                wcagLevel: 'AAA' as any,
                suitableFor: ['backgrounds']
              }
            },
            {
              name: 'Light Gray',
              hex: '#f8f9fa',
              rgb: { r: 248, g: 249, b: 250 },
              hsl: { h: 210, s: 17, l: 98 },
              usage: ['section backgrounds', 'subtle dividers'],
              accessibility: {
                contrastRatio: 19.8,
                wcagLevel: 'AAA' as any,
                suitableFor: ['backgrounds']
              }
            }
          ],
          accent: [
            {
              name: 'TechFlow Orange',
              hex: '#ff6b35',
              rgb: { r: 255, g: 107, b: 53 },
              hsl: { h: 16, s: 100, l: 60 },
              usage: ['call-to-action', 'highlights', 'important elements'],
              accessibility: {
                contrastRatio: 3.8,
                wcagLevel: 'AA' as any,
                suitableFor: ['text']
              }
            }
          ],
          semantic: {
            success: {
              name: 'Success Green',
              hex: '#28a745',
              rgb: { r: 40, g: 167, b: 69 },
              hsl: { h: 134, s: 61, l: 41 },
              usage: ['success messages', 'positive indicators', 'completed states'],
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
              usage: ['error messages', 'critical alerts', 'destructive actions'],
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
              usage: ['info messages', 'neutral indicators', 'help text'],
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
      contentRules: [
        {
          id: 'professional-tone',
          name: 'Professional Tone',
          description: 'All content must maintain a professional, authoritative tone',
          category: 'voice_tone' as any,
          severity: 'error' as any,
          conditions: [],
          actions: [],
          exceptions: [],
          isActive: true
        },
        {
          id: 'no-jargon',
          name: 'Avoid Technical Jargon',
          description: 'Minimize technical jargon unless explaining complex concepts',
          category: 'voice_tone' as any,
          severity: 'warning' as any,
          conditions: [],
          actions: [],
          exceptions: [],
          isActive: true
        }
      ]
    };

    const brandProfile = await this.contentConsistencyService.brandAnalyzer.createBrandProfile(brandProfileData);
    logger.info(`✅ Created brand profile: ${brandProfile.name} (ID: ${brandProfile.id})`);
    logger.info(`   Mission: ${brandProfile.guidelines.mission}`);
    logger.info(`   Values: ${brandProfile.guidelines.values.join(', ')}`);
    logger.info(`   Target Audiences: ${brandProfile.guidelines.targetAudience.length}`);

    // Update brand profile
    const updatedProfile = await this.contentConsistencyService.brandAnalyzer.updateBrandProfile(
      brandProfile.id,
      {
        description: 'An innovative AI technology company transforming businesses worldwide'
      }
    );
    logger.info(`✅ Updated brand profile description`);

    // Retrieve brand profile
    const retrievedProfile = await this.contentConsistencyService.brandAnalyzer.getBrandProfile(brandProfile.id);
    logger.info(`✅ Retrieved brand profile: ${retrievedProfile?.name}`);
  }

  private async demoContentConsistencyAnalysis(): Promise<void> {
    logger.info('\n🔍 Demo 2: Content Consistency Analysis');

    // Get the brand profile created in the previous demo
    const brandProfiles = await this.redis.keys('brand_profile:*');
    if (brandProfiles.length === 0) {
      logger.warn('No brand profiles found, skipping consistency analysis');
      return;
    }

    const brandProfileData = await this.redis.hget(brandProfiles[0], 'data');
    if (!brandProfileData) {
      logger.warn('Brand profile data not found');
      return;
    }

    const brandProfile = JSON.parse(brandProfileData);

    // Create content items with varying consistency levels
    const contentItems = [
      {
        id: 'content-consistent',
        type: ContentType.ARTICLE,
        title: 'How AI-Powered Solutions Drive Business Growth',
        content: 'In today\'s competitive landscape, businesses are increasingly turning to artificial intelligence to drive growth and innovation. TechFlow Solutions has helped over 500 companies implement AI-powered solutions that deliver measurable results. Our comprehensive approach combines strategic planning, technical expertise, and ongoing support to ensure successful AI adoption. Through our proven methodology, clients typically see a 25-40% improvement in operational efficiency within the first six months.',
        metadata: {
          author: 'TechFlow Content Team',
          audience: ['business-leaders'],
          tags: ['AI', 'business-growth', 'solutions', 'ROI'],
          language: 'en',
          format: 'markdown',
          channel: 'blog'
        },
        platform: 'website',
        createdAt: new Date()
      },
      {
        id: 'content-inconsistent',
        type: ContentType.SOCIAL_POST,
        title: 'Casual AI Update',
        content: 'Hey everyone! 😎 Just wanted to drop by and say our AI stuff is pretty awesome lol. We\'ve got some cool tech that might help your business or whatever. Hit us up if you wanna chat! 🚀 #AI #Tech #Cool',
        metadata: {
          author: 'Social Media Intern',
          audience: ['general'],
          tags: ['AI', 'casual', 'social'],
          language: 'en',
          format: 'text',
          channel: 'social'
        },
        platform: 'twitter',
        createdAt: new Date()
      },
      {
        id: 'content-moderate',
        type: ContentType.EMAIL,
        title: 'Introducing Our New AI Platform',
        content: 'Dear Valued Client, We are excited to announce the launch of our new AI platform designed to streamline your business operations. This innovative solution combines machine learning algorithms with intuitive user interfaces to deliver powerful insights and automation capabilities. Our team of experts is ready to help you implement this technology and achieve your business objectives.',
        metadata: {
          author: 'TechFlow Marketing',
          audience: ['business-leaders'],
          tags: ['AI', 'platform', 'announcement'],
          language: 'en',
          format: 'html',
          channel: 'email'
        },
        platform: 'email',
        createdAt: new Date()
      }
    ];

    // Analyze brand consistency
    const consistencyReport = await this.contentConsistencyService.brandAnalyzer.analyzeBrandConsistency(
      brandProfile.id,
      contentItems
    );

    logger.info(`✅ Brand consistency analysis completed`);
    logger.info(`   Brand: ${brandProfile.name}`);
    logger.info(`   Content Items Analyzed: ${consistencyReport.contentItems}`);
    logger.info(`   Overall Consistency Score: ${(consistencyReport.overallScore * 100).toFixed(1)}%`);
    logger.info(`   Violations Found: ${consistencyReport.violations.length}`);
    logger.info(`   Recommendations Generated: ${consistencyReport.recommendations.length}`);

    // Display individual content scores
    consistencyReport.scores.forEach((score, index) => {
      const content = contentItems[index];
      logger.info(`   Content "${content.title}": ${(score.overallScore * 100).toFixed(1)}% consistency`);
      logger.info(`     Voice: ${(score.voiceScore * 100).toFixed(1)}%, Style: ${(score.styleScore * 100).toFixed(1)}%, Visual: ${(score.visualScore * 100).toFixed(1)}%, Messaging: ${(score.messagingScore * 100).toFixed(1)}%`);
    });

    // Display violations
    if (consistencyReport.violations.length > 0) {
      logger.info(`   Brand Violations:`);
      consistencyReport.violations.forEach(violation => {
        logger.info(`     - ${violation.description} (${violation.severity})`);
        logger.info(`       Suggestion: ${violation.suggestion}`);
      });
    }

    // Display recommendations
    if (consistencyReport.recommendations.length > 0) {
      logger.info(`   Recommendations:`);
      consistencyReport.recommendations.forEach(rec => {
        logger.info(`     - ${rec.title} (${rec.priority} priority)`);
        logger.info(`       ${rec.description}`);
        logger.info(`       Expected Impact: ${rec.impact}`);
      });
    }
  }

  private async demoCrossPlatformAdaptation(): Promise<void> {
    logger.info('\n🔄 Demo 3: Cross-Platform Content Adaptation');

    // Get brand profile
    const brandProfiles = await this.redis.keys('brand_profile:*');
    if (brandProfiles.length === 0) {
      logger.warn('No brand profiles found, skipping adaptation demo');
      return;
    }

    const brandProfileData = await this.redis.hget(brandProfiles[0], 'data');
    const brandProfile = JSON.parse(brandProfileData!);

    // Create source content (long-form article)
    const sourceContent = {
      id: 'source-article',
      type: ContentType.ARTICLE,
      title: 'The Complete Guide to AI Implementation in Enterprise Environments',
      content: 'Implementing artificial intelligence in enterprise environments requires careful planning, strategic thinking, and technical expertise. This comprehensive guide covers everything you need to know about successful AI adoption, from initial assessment and strategy development to implementation and ongoing optimization. We\'ll explore the key challenges organizations face, best practices for overcoming common obstacles, and proven methodologies for achieving measurable results. Our experience working with Fortune 500 companies has taught us that successful AI implementation requires more than just technology – it requires a holistic approach that considers people, processes, and technology together. Throughout this guide, we\'ll share real-world case studies, practical frameworks, and actionable insights that you can apply to your own AI initiatives.',
      metadata: {
        author: 'TechFlow AI Team',
        audience: ['business-leaders', 'technical-leaders'],
        tags: ['AI', 'implementation', 'enterprise', 'guide'],
        language: 'en',
        format: 'markdown',
        channel: 'blog'
      },
      platform: 'website',
      createdAt: new Date()
    };

    // Define target platforms with different constraints
    const targetPlatforms = ['twitter', 'linkedin', 'email'];

    // Create adaptation request
    const adaptationRequest = {
      id: 'multi-platform-adaptation',
      sourceContent,
      targetPlatforms,
      brandProfile,
      preferences: {
        prioritizeEngagement: true,
        maintainBrandVoice: true,
        optimizeForPlatform: true,
        preserveKeyMessages: true,
        allowCreativeLiberty: 0.4
      },
      constraints: {
        approvalRequired: false,
        mustIncludeElements: ['TechFlow', 'AI implementation'],
        mustAvoidElements: ['competitor names', 'pricing information']
      }
    };

    // Perform content adaptation
    const adaptationResult = await this.contentConsistencyService.contentAdapter.adaptContent(adaptationRequest);

    logger.info(`✅ Content adaptation completed`);
    logger.info(`   Source Content: "${sourceContent.title}"`);
    logger.info(`   Original Length: ${sourceContent.content.length} characters`);
    logger.info(`   Target Platforms: ${targetPlatforms.join(', ')}`);
    logger.info(`   Adaptations Created: ${adaptationResult.adaptedContent.length}`);
    logger.info(`   Overall Consistency Score: ${(adaptationResult.consistencyScore * 100).toFixed(1)}%`);
    logger.info(`   Brand Alignment Score: ${(adaptationResult.brandAlignmentScore * 100).toFixed(1)}%`);
    logger.info(`   Platform Optimization Score: ${(adaptationResult.platformOptimizationScore * 100).toFixed(1)}%`);

    // Display adapted content for each platform
    adaptationResult.adaptedContent.forEach(adapted => {
      logger.info(`\n   📱 ${adapted.platformId.toUpperCase()} Adaptation:`);
      logger.info(`     Content: "${adapted.content.content.substring(0, 100)}${adapted.content.content.length > 100 ? '...' : ''}"`);
      logger.info(`     Length: ${adapted.content.content.length} characters`);
      logger.info(`     Adaptations Applied: ${adapted.adaptations.length}`);
      
      adapted.adaptations.forEach(adaptation => {
        logger.info(`       - ${adaptation.type}: ${adaptation.description}`);
        logger.info(`         Reason: ${adaptation.reason}`);
        logger.info(`         Confidence: ${(adaptation.confidence * 100).toFixed(1)}%`);
      });

      logger.info(`     Predicted Performance:`);
      logger.info(`       Engagement: ${(adapted.performance.engagementScore * 100).toFixed(1)}%`);
      logger.info(`       Reach: ${(adapted.performance.reachScore * 100).toFixed(1)}%`);
      logger.info(`       Conversion: ${(adapted.performance.conversionScore * 100).toFixed(1)}%`);
      logger.info(`       Brand Score: ${(adapted.performance.brandScore * 100).toFixed(1)}%`);

      if (adapted.alternatives.length > 0) {
        logger.info(`     Alternatives Available: ${adapted.alternatives.length}`);
      }
    });

    // Display recommendations
    if (adaptationResult.recommendations.length > 0) {
      logger.info(`\n   💡 Adaptation Recommendations:`);
      adaptationResult.recommendations.forEach(rec => {
        logger.info(`     - ${rec.title} (${rec.priority} priority)`);
        logger.info(`       ${rec.description}`);
        logger.info(`       Expected Impact: ${rec.expectedImpact}`);
      });
    }
  }

  private async demoPerformanceTracking(): Promise<void> {
    logger.info('\n📊 Demo 4: Performance Tracking and Analytics');

    // Simulate performance data for different content pieces
    const performanceDataPoints = [
      {
        contentId: 'content-consistent',
        platformId: 'website',
        metrics: {
          views: 5000,
          impressions: 7500,
          clicks: 350,
          shares: 75,
          saves: 45,
          comments: 28,
          likes: 220,
          reactions: {
            like: 180,
            love: 25,
            laugh: 8,
            wow: 7,
            sad: 0,
            angry: 0,
            care: 0
          },
          timeSpent: 180,
          bounceRate: 0.22,
          completionRate: 0.88
        },
        engagement: {
          engagementRate: 0.18,
          engagementQuality: {
            score: 0.85,
            factors: [
              { factor: 'meaningful_comments', weight: 0.3, score: 0.9, description: 'High quality comments' },
              { factor: 'share_quality', weight: 0.25, score: 0.8, description: 'Organic shares to relevant audiences' }
            ],
            breakdown: {
              meaningfulInteractions: 85,
              superficialInteractions: 12,
              negativeInteractions: 2,
              spamInteractions: 1
            }
          },
          audienceGrowth: 0.12,
          repeatEngagement: 0.45,
          shareQuality: {
            organicShares: 65,
            incentivizedShares: 10,
            shareContext: [
              { platform: 'linkedin', context: 'professional_discussion', frequency: 35, sentiment: 'positive' },
              { platform: 'twitter', context: 'industry_news', frequency: 20, sentiment: 'positive' }
            ],
            shareAudience: {
              internal: 45,
              external: 30,
              crossPlatform: [
                { fromPlatform: 'website', toPlatform: 'linkedin', count: 25, context: 'professional_sharing' },
                { fromPlatform: 'website', toPlatform: 'twitter', count: 15, context: 'news_sharing' }
              ]
            }
          },
          commentSentiment: {
            overall: {
              score: 0.82,
              confidence: 0.88,
              distribution: {
                positive: 0.82,
                neutral: 0.15,
                negative: 0.03
              }
            },
            breakdown: {
              comments: { score: 0.85, confidence: 0.9, distribution: { positive: 0.85, neutral: 0.12, negative: 0.03 } },
              reactions: { score: 0.92, confidence: 0.95, distribution: { positive: 0.92, neutral: 0.08, negative: 0.0 } },
              shares: { score: 0.88, confidence: 0.85, distribution: { positive: 0.88, neutral: 0.12, negative: 0.0 } },
              mentions: { score: 0.75, confidence: 0.8, distribution: { positive: 0.75, neutral: 0.2, negative: 0.05 } }
            },
            trends: [
              {
                timeframe: 'last_7_days',
                sentiment: { score: 0.85, confidence: 0.9, distribution: { positive: 0.85, neutral: 0.12, negative: 0.03 } },
                volume: 28,
                triggers: ['ai_implementation', 'business_results']
              }
            ],
            keyTopics: [
              {
                topic: 'ai_implementation',
                sentiment: { score: 0.88, confidence: 0.92, distribution: { positive: 0.88, neutral: 0.1, negative: 0.02 } },
                volume: 15,
                keywords: ['implementation', 'results', 'success', 'ROI']
              }
            ]
          },
          viralityScore: 0.35
        },
        reach: {
          totalReach: 6500,
          organicReach: 5200,
          paidReach: 1000,
          viralReach: 300,
          audienceBreakdown: {
            newAudience: 3900,
            returningAudience: 2600,
            targetAudience: 5200,
            spilloverAudience: 1300,
            audienceQuality: {
              score: 0.82,
              relevanceScore: 0.88,
              engagementPotential: 0.78,
              conversionPotential: 0.65,
              brandAffinity: 0.75
            }
          },
          geographicReach: {
            countries: [
              { country: 'United States', reach: 2600, percentage: 40, engagement: 0.19 },
              { country: 'Canada', reach: 650, percentage: 10, engagement: 0.22 },
              { country: 'United Kingdom', reach: 780, percentage: 12, engagement: 0.17 }
            ],
            regions: [
              { region: 'North America', reach: 3250, percentage: 50, characteristics: ['tech-savvy', 'business-focused'] },
              { region: 'Europe', reach: 1950, percentage: 30, characteristics: ['quality-focused', 'privacy-conscious'] }
            ],
            cities: [
              { city: 'San Francisco', country: 'United States', reach: 520, percentage: 8, urbanType: 'tech_hub' },
              { city: 'New York', country: 'United States', reach: 390, percentage: 6, urbanType: 'business_center' }
            ],
            timeZones: [
              { timezone: 'PST', reach: 1300, peakHours: ['09:00', '17:00'], engagement: 0.21 },
              { timezone: 'EST', reach: 1560, peakHours: ['08:00', '18:00'], engagement: 0.18 }
            ]
          },
          demographicReach: {
            age: [
              { ageGroup: '25-34', reach: 1950, percentage: 30, engagement: 0.22 },
              { ageGroup: '35-44', reach: 2275, percentage: 35, engagement: 0.19 },
              { ageGroup: '45-54', reach: 1625, percentage: 25, engagement: 0.16 }
            ],
            gender: [
              { gender: 'male', reach: 3575, percentage: 55, engagement: 0.17 },
              { gender: 'female', reach: 2925, percentage: 45, engagement: 0.19 }
            ],
            interests: [
              { interest: 'artificial_intelligence', reach: 3250, relevance: 0.95, engagement: 0.24 },
              { interest: 'business_technology', reach: 2600, relevance: 0.88, engagement: 0.21 }
            ],
            behaviors: [
              { behavior: 'tech_early_adopter', reach: 1950, frequency: 0.8, value: 0.85 },
              { behavior: 'business_decision_maker', reach: 1300, frequency: 0.6, value: 0.92 }
            ]
          },
          deviceReach: {
            mobile: {
              reach: 3900,
              percentage: 60,
              engagement: 0.16,
              performance: {
                loadTime: 2.8,
                interactionRate: 0.18,
                completionRate: 0.82,
                errorRate: 0.02
              }
            },
            desktop: {
              reach: 2275,
              percentage: 35,
              engagement: 0.22,
              performance: {
                loadTime: 1.9,
                interactionRate: 0.26,
                completionRate: 0.91,
                errorRate: 0.01
              }
            },
            tablet: {
              reach: 325,
              percentage: 5,
              engagement: 0.19,
              performance: {
                loadTime: 2.4,
                interactionRate: 0.21,
                completionRate: 0.87,
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
          totalConversions: 18,
          conversionRate: 0.0036,
          conversionValue: 4500,
          conversionFunnel: [
            { stage: 'awareness', users: 5000, conversionRate: 1.0, dropoffRate: 0.0, averageTime: 0, barriers: [] },
            { stage: 'interest', users: 1500, conversionRate: 0.3, dropoffRate: 0.7, averageTime: 45, barriers: ['information_overload'] },
            { stage: 'consideration', users: 450, conversionRate: 0.3, dropoffRate: 0.7, averageTime: 180, barriers: ['pricing_concerns', 'implementation_complexity'] },
            { stage: 'conversion', users: 18, conversionRate: 0.04, dropoffRate: 0.96, averageTime: 720, barriers: ['decision_process', 'budget_approval'] }
          ],
          attributionModel: {
            firstTouch: { conversions: 8, value: 2000, percentage: 44.4 },
            lastTouch: { conversions: 18, value: 4500, percentage: 100 },
            linear: { conversions: 12, value: 3000, percentage: 66.7 },
            timeDecay: { conversions: 15, value: 3750, percentage: 83.3 },
            positionBased: { conversions: 14, value: 3500, percentage: 77.8 }
          },
          conversionTypes: [
            { type: 'consultation_request', count: 12, value: 3000, averageValue: 250, timeToConversion: 14 },
            { type: 'demo_request', count: 6, value: 1500, averageValue: 250, timeToConversion: 7 }
          ],
          customerJourney: [
            {
              stage: 'awareness',
              touchpoints: [
                { platform: 'website', content: 'blog_article', timestamp: new Date(), engagement: 0.8, influence: 0.3 }
              ],
              duration: 0,
              conversionRate: 0.3,
              influence: 0.3
            }
          ]
        },
        brandImpact: {
          brandAwareness: {
            aided: 0.35,
            unaided: 0.18,
            topOfMind: 0.08,
            brandRecall: 0.28,
            brandRecognition: 0.42,
            shareOfVoice: 0.12
          },
          brandSentiment: {
            overall: {
              score: 0.78,
              confidence: 0.85,
              distribution: {
                positive: 0.78,
                neutral: 0.18,
                negative: 0.04
              }
            },
            attributes: [
              {
                attribute: 'innovation',
                sentiment: { score: 0.85, confidence: 0.9, distribution: { positive: 0.85, neutral: 0.12, negative: 0.03 } },
                importance: 0.9,
                performance: 0.85
              },
              {
                attribute: 'reliability',
                sentiment: { score: 0.82, confidence: 0.88, distribution: { positive: 0.82, neutral: 0.15, negative: 0.03 } },
                importance: 0.85,
                performance: 0.82
              }
            ],
            competitors: [
              {
                competitor: 'TechRival Corp',
                sentiment: { score: 0.65, confidence: 0.8, distribution: { positive: 0.65, neutral: 0.25, negative: 0.1 } },
                comparison: 0.13,
                gapAnalysis: ['innovation_advantage', 'customer_service_edge']
              }
            ],
            trends: [
              {
                timeframe: 'last_30_days',
                sentiment: { score: 0.8, confidence: 0.87, distribution: { positive: 0.8, neutral: 0.17, negative: 0.03 } },
                volume: 156,
                triggers: ['product_launch', 'positive_reviews']
              }
            ]
          },
          brandAssociation: {
            primaryAssociations: [
              { concept: 'AI_innovation', strength: 0.88, valence: 0.92, uniqueness: 0.75, relevance: 0.95 },
              { concept: 'business_results', strength: 0.82, valence: 0.89, uniqueness: 0.68, relevance: 0.91 }
            ],
            secondaryAssociations: [
              { concept: 'enterprise_solutions', strength: 0.75, valence: 0.85, uniqueness: 0.55, relevance: 0.88 }
            ],
            negativeAssociations: [
              { concept: 'complexity', strength: 0.25, valence: 0.15, uniqueness: 0.3, relevance: 0.4 }
            ],
            associationStrength: 0.82,
            associationUniqueness: 0.66
          },
          brandLoyalty: {
            customerRetention: 0.88,
            repeatPurchase: 0.72,
            advocacy: {
              netPromoterScore: 8.2,
              referralRate: 0.15,
              wordOfMouth: 0.35,
              userGeneratedContent: 0.08,
              testimonials: 0.05
            },
            switchingCost: 0.65,
            emotionalConnection: 0.72
          },
          brandEquity: {
            financialValue: 2500000,
            marketShare: 0.18,
            premiumPricing: 0.25,
            brandStrength: {
              differentiation: 0.78,
              relevance: 0.85,
              esteem: 0.72,
              knowledge: 0.82,
              overall: 0.79
            },
            brandRelevance: 0.85
          }
        },
        timestamp: new Date()
      }
    ];

    // Track performance data
    for (const performanceData of performanceDataPoints) {
      await this.contentConsistencyService.performanceTracker.trackPerformance(performanceData);
      logger.info(`✅ Tracked performance for content: ${performanceData.contentId} on ${performanceData.platformId}`);
    }

    // Generate performance insights
    const timeframe = {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date(),
      period: 'month',
      timezone: 'UTC'
    };

    const insights = await this.contentConsistencyService.performanceTracker.generateInsights(
      ['content-consistent'],
      timeframe
    );

    logger.info(`✅ Generated ${insights.length} performance insights`);
    insights.forEach(insight => {
      logger.info(`   💡 ${insight.title} (${insight.impact} impact, ${(insight.confidence * 100).toFixed(1)}% confidence)`);
      logger.info(`      ${insight.description}`);
      if (insight.recommendations.length > 0) {
        logger.info(`      Recommendations: ${insight.recommendations.join(', ')}`);
      }
    });

    // Generate comprehensive performance report
    const performanceReport = await this.contentConsistencyService.performanceTracker.generatePerformanceReport(
      ['content-consistent'],
      timeframe
    );

    logger.info(`\n📈 Performance Report Generated:`);
    logger.info(`   Report ID: ${performanceReport.id}`);
    logger.info(`   Content Items: ${performanceReport.summary.totalContent}`);
    logger.info(`   Total Engagement: ${performanceReport.summary.totalEngagement}`);
    logger.info(`   Total Reach: ${performanceReport.summary.totalReach}`);
    logger.info(`   Total Conversions: ${performanceReport.summary.totalConversions}`);
    logger.info(`   Average Performance: ${(performanceReport.summary.averagePerformance * 100).toFixed(1)}%`);
    logger.info(`   Insights Generated: ${performanceReport.insights.length}`);
    logger.info(`   Recommendations: ${performanceReport.recommendations.length}`);
    logger.info(`   Benchmark Comparisons: ${performanceReport.benchmarks.length}`);

    if (performanceReport.summary.topPerformers.length > 0) {
      logger.info(`   🏆 Top Performers:`);
      performanceReport.summary.topPerformers.forEach(performer => {
        logger.info(`     - Content ${performer.contentId}: ${performer.metric} = ${performer.value} (${(performer.improvement * 100).toFixed(1)}% improvement)`);
        logger.info(`       Success Factors: ${performer.factors.join(', ')}`);
      });
    }

    if (performanceReport.summary.underperformers.length > 0) {
      logger.info(`   ⚠️ Underperformers:`);
      performanceReport.summary.underperformers.forEach(underperformer => {
        logger.info(`     - Content ${underperformer.contentId}: ${underperformer.metric} = ${underperformer.value} (${(underperformer.decline * 100).toFixed(1)}% decline)`);
        logger.info(`       Issues: ${underperformer.issues.join(', ')}`);
      });
    }
  }

  private async demoBrandImpactMeasurement(): Promise<void> {
    logger.info('\n🎯 Demo 5: Brand Impact Measurement');

    // Track brand impact for content
    const brandImpactData = {
      brandAwareness: {
        aided: 0.42,
        unaided: 0.22,
        topOfMind: 0.12,
        brandRecall: 0.35,
        brandRecognition: 0.48,
        shareOfVoice: 0.15
      },
      brandSentiment: {
        overall: {
          score: 0.82,
          confidence: 0.88,
          distribution: {
            positive: 0.82,
            neutral: 0.15,
            negative: 0.03
          }
        },
        attributes: [
          {
            attribute: 'innovation',
            sentiment: { score: 0.88, confidence: 0.92, distribution: { positive: 0.88, neutral: 0.1, negative: 0.02 } },
            importance: 0.95,
            performance: 0.88
          },
          {
            attribute: 'trustworthiness',
            sentiment: { score: 0.85, confidence: 0.9, distribution: { positive: 0.85, neutral: 0.12, negative: 0.03 } },
            importance: 0.9,
            performance: 0.85
          },
          {
            attribute: 'expertise',
            sentiment: { score: 0.87, confidence: 0.89, distribution: { positive: 0.87, neutral: 0.11, negative: 0.02 } },
            importance: 0.88,
            performance: 0.87
          }
        ],
        competitors: [
          {
            competitor: 'AI Solutions Inc',
            sentiment: { score: 0.68, confidence: 0.82, distribution: { positive: 0.68, neutral: 0.22, negative: 0.1 } },
            comparison: 0.14,
            gapAnalysis: ['innovation_leadership', 'customer_satisfaction', 'market_presence']
          },
          {
            competitor: 'TechAdvance Corp',
            sentiment: { score: 0.71, confidence: 0.85, distribution: { positive: 0.71, neutral: 0.21, negative: 0.08 } },
            comparison: 0.11,
            gapAnalysis: ['technical_expertise', 'brand_recognition']
          }
        ],
        trends: [
          {
            timeframe: 'last_quarter',
            sentiment: { score: 0.84, confidence: 0.9, distribution: { positive: 0.84, neutral: 0.14, negative: 0.02 } },
            volume: 487,
            triggers: ['successful_implementations', 'positive_case_studies', 'industry_recognition']
          }
        ]
      },
      brandAssociation: {
        primaryAssociations: [
          { concept: 'AI_leadership', strength: 0.92, valence: 0.95, uniqueness: 0.82, relevance: 0.98 },
          { concept: 'business_transformation', strength: 0.88, valence: 0.91, uniqueness: 0.75, relevance: 0.94 },
          { concept: 'enterprise_solutions', strength: 0.85, valence: 0.89, uniqueness: 0.68, relevance: 0.92 }
        ],
        secondaryAssociations: [
          { concept: 'innovation', strength: 0.82, valence: 0.88, uniqueness: 0.65, relevance: 0.89 },
          { concept: 'reliability', strength: 0.79, valence: 0.86, uniqueness: 0.62, relevance: 0.87 }
        ],
        negativeAssociations: [
          { concept: 'complexity', strength: 0.18, valence: 0.12, uniqueness: 0.25, relevance: 0.35 },
          { concept: 'high_cost', strength: 0.15, valence: 0.08, uniqueness: 0.22, relevance: 0.28 }
        ],
        associationStrength: 0.87,
        associationUniqueness: 0.72
      },
      brandLoyalty: {
        customerRetention: 0.91,
        repeatPurchase: 0.78,
        advocacy: {
          netPromoterScore: 8.7,
          referralRate: 0.22,
          wordOfMouth: 0.42,
          userGeneratedContent: 0.12,
          testimonials: 0.08
        },
        switchingCost: 0.72,
        emotionalConnection: 0.78
      },
      brandEquity: {
        financialValue: 3200000,
        marketShare: 0.22,
        premiumPricing: 0.32,
        brandStrength: {
          differentiation: 0.85,
          relevance: 0.89,
          esteem: 0.78,
          knowledge: 0.86,
          overall: 0.845
        },
        brandRelevance: 0.89
      }
    };

    await this.contentConsistencyService.performanceTracker.trackBrandImpact('content-consistent', brandImpactData);
    logger.info(`✅ Brand impact data tracked for content-consistent`);

    // Analyze brand impact trends
    const timeframe = {
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      end: new Date(),
      period: 'quarter',
      timezone: 'UTC'
    };

    const brandImpactTrends = await this.contentConsistencyService.performanceTracker.getBrandImpactTrends(
      ['content-consistent'],
      timeframe
    );

    logger.info(`\n📊 Brand Impact Analysis:`);
    logger.info(`   Brand Awareness:`);
    logger.info(`     Aided Awareness: ${(brandImpactData.brandAwareness.aided * 100).toFixed(1)}%`);
    logger.info(`     Unaided Awareness: ${(brandImpactData.brandAwareness.unaided * 100).toFixed(1)}%`);
    logger.info(`     Top of Mind: ${(brandImpactData.brandAwareness.topOfMind * 100).toFixed(1)}%`);
    logger.info(`     Brand Recall: ${(brandImpactData.brandAwareness.brandRecall * 100).toFixed(1)}%`);
    logger.info(`     Brand Recognition: ${(brandImpactData.brandAwareness.brandRecognition * 100).toFixed(1)}%`);
    logger.info(`     Share of Voice: ${(brandImpactData.brandAwareness.shareOfVoice * 100).toFixed(1)}%`);

    logger.info(`\n   Brand Sentiment:`);
    logger.info(`     Overall Score: ${(brandImpactData.brandSentiment.overall.score * 100).toFixed(1)}% (${(brandImpactData.brandSentiment.overall.confidence * 100).toFixed(1)}% confidence)`);
    logger.info(`     Positive: ${(brandImpactData.brandSentiment.overall.distribution.positive * 100).toFixed(1)}%`);
    logger.info(`     Neutral: ${(brandImpactData.brandSentiment.overall.distribution.neutral * 100).toFixed(1)}%`);
    logger.info(`     Negative: ${(brandImpactData.brandSentiment.overall.distribution.negative * 100).toFixed(1)}%`);

    logger.info(`\n   Key Brand Attributes:`);
    brandImpactData.brandSentiment.attributes.forEach(attr => {
      logger.info(`     ${attr.attribute}: ${(attr.sentiment.score * 100).toFixed(1)}% sentiment, ${(attr.importance * 100).toFixed(1)}% importance, ${(attr.performance * 100).toFixed(1)}% performance`);
    });

    logger.info(`\n   Competitive Position:`);
    brandImpactData.brandSentiment.competitors.forEach(comp => {
      logger.info(`     vs ${comp.competitor}: ${(comp.comparison * 100).toFixed(1)}% advantage`);
      logger.info(`       Sentiment Gap: ${((brandImpactData.brandSentiment.overall.score - comp.sentiment.score) * 100).toFixed(1)}%`);
      logger.info(`       Key Advantages: ${comp.gapAnalysis.join(', ')}`);
    });

    logger.info(`\n   Brand Associations:`);
    logger.info(`     Primary Associations:`);
    brandImpactData.brandAssociation.primaryAssociations.forEach(assoc => {
      logger.info(`       ${assoc.concept}: ${(assoc.strength * 100).toFixed(1)}% strength, ${(assoc.uniqueness * 100).toFixed(1)}% uniqueness`);
    });

    logger.info(`\n   Brand Loyalty Metrics:`);
    logger.info(`     Customer Retention: ${(brandImpactData.brandLoyalty.customerRetention * 100).toFixed(1)}%`);
    logger.info(`     Repeat Purchase: ${(brandImpactData.brandLoyalty.repeatPurchase * 100).toFixed(1)}%`);
    logger.info(`     Net Promoter Score: ${brandImpactData.brandLoyalty.advocacy.netPromoterScore.toFixed(1)}`);
    logger.info(`     Referral Rate: ${(brandImpactData.brandLoyalty.advocacy.referralRate * 100).toFixed(1)}%`);
    logger.info(`     Word of Mouth: ${(brandImpactData.brandLoyalty.advocacy.wordOfMouth * 100).toFixed(1)}%`);
    logger.info(`     Emotional Connection: ${(brandImpactData.brandLoyalty.emotionalConnection * 100).toFixed(1)}%`);

    logger.info(`\n   Brand Equity:`);
    logger.info(`     Financial Value: $${brandImpactData.brandEquity.financialValue.toLocaleString()}`);
    logger.info(`     Market Share: ${(brandImpactData.brandEquity.marketShare * 100).toFixed(1)}%`);
    logger.info(`     Premium Pricing Power: ${(brandImpactData.brandEquity.premiumPricing * 100).toFixed(1)}%`);
    logger.info(`     Overall Brand Strength: ${(brandImpactData.brandEquity.brandStrength.overall * 100).toFixed(1)}%`);
    logger.info(`       Differentiation: ${(brandImpactData.brandEquity.brandStrength.differentiation * 100).toFixed(1)}%`);
    logger.info(`       Relevance: ${(brandImpactData.brandEquity.brandStrength.relevance * 100).toFixed(1)}%`);
    logger.info(`       Esteem: ${(brandImpactData.brandEquity.brandStrength.esteem * 100).toFixed(1)}%`);
    logger.info(`       Knowledge: ${(brandImpactData.brandEquity.brandStrength.knowledge * 100).toFixed(1)}%`);

    if (brandImpactTrends.length > 0) {
      logger.info(`\n   📈 Brand Impact Trends:`);
      brandImpactTrends.forEach(trend => {
        logger.info(`     ${trend.contentId} - ${trend.metric}: ${trend.trend.direction} trend`);
        logger.info(`       Magnitude: ${(trend.trend.magnitude * 100).toFixed(1)}%`);
        logger.info(`       Significance: ${(trend.significance * 100).toFixed(1)}%`);
        logger.info(`       Key Factors: ${trend.factors.join(', ')}`);
      });
    }
  }
}

// Export demo function for easy execution
export async function runContentConsistencyDemo(redis: Redis): Promise<void> {
  const demo = new ContentConsistencyDemo(redis);
  await demo.runDemo();
}