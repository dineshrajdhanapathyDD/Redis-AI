"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentConsistencyService = exports.PerformanceTracker = exports.ContentAdapter = exports.BrandAnalyzer = void 0;
// Export main classes
var brand_analyzer_1 = require("./brand-analyzer");
Object.defineProperty(exports, "BrandAnalyzer", { enumerable: true, get: function () { return brand_analyzer_1.BrandAnalyzer; } });
var content_adapter_1 = require("./content-adapter");
Object.defineProperty(exports, "ContentAdapter", { enumerable: true, get: function () { return content_adapter_1.ContentAdapter; } });
var performance_tracker_1 = require("./performance-tracker");
Object.defineProperty(exports, "PerformanceTracker", { enumerable: true, get: function () { return performance_tracker_1.PerformanceTracker; } });
const brand_analyzer_2 = require("./brand-analyzer");
const content_adapter_2 = require("./content-adapter");
const performance_tracker_2 = require("./performance-tracker");
const logger_1 = require("../../utils/logger");
class ContentConsistencyService {
    brandAnalyzer;
    contentAdapter;
    performanceTracker;
    constructor(redis, embeddingManager) {
        this.brandAnalyzer = new brand_analyzer_2.BrandAnalyzer(redis, embeddingManager);
        this.contentAdapter = new content_adapter_2.ContentAdapter(redis, embeddingManager);
        this.performanceTracker = new performance_tracker_2.PerformanceTracker(redis);
    }
    async initialize() {
        // Initialize content consistency service components
        logger_1.logger.info('Initializing Content Consistency Service');
        // Set up default platforms
        await this.setupDefaultPlatforms();
        // Set up performance tracking indices
        await this.setupPerformanceTracking();
        logger_1.logger.info('Content Consistency Service initialized successfully');
    }
    async shutdown() {
        // Cleanup logic when shutting down the service
        logger_1.logger.info('Shutting down Content Consistency Service');
        // Save any pending performance data
        await this.savePendingData();
        logger_1.logger.info('Content Consistency Service shutdown complete');
    }
    async setupDefaultPlatforms() {
        // Set up common social media platforms
        const platforms = [
            {
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
                        allowedFormatting: ['bold', 'italic'],
                        prohibitedContent: ['excessive_hashtags']
                    },
                    imageLimits: {
                        maxWidth: 1200,
                        maxHeight: 675,
                        maxFileSize: 5000000,
                        allowedFormats: ['jpg', 'png', 'gif'],
                        aspectRatios: ['16:9', '1:1'],
                        minResolution: { width: 600, height: 335 }
                    },
                    hashtagLimits: {
                        maxHashtags: 2,
                        maxLength: 100,
                        allowedCharacters: 'alphanumeric',
                        caseSensitive: false
                    }
                },
                audience: {
                    demographics: {
                        primaryAgeRange: '25-44',
                        secondaryAgeRanges: ['18-24', '45-54'],
                        genderDistribution: { male: 48, female: 52, other: 0 },
                        geographicDistribution: {
                            regions: [
                                { region: 'North America', percentage: 40, characteristics: ['tech-savvy'] },
                                { region: 'Europe', percentage: 25, characteristics: ['privacy-conscious'] }
                            ],
                            urbanRural: { urban: 70, suburban: 25, rural: 5 },
                            timeZones: ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1']
                        },
                        deviceUsage: { mobile: 80, desktop: 18, tablet: 2, other: 0 }
                    },
                    behavior: {
                        activeHours: [
                            { start: '09:00', end: '11:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
                            { start: '19:00', end: '21:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] }
                        ],
                        contentConsumption: [
                            { contentType: 'text', duration: 15, frequency: 'high', context: ['news', 'updates'] }
                        ],
                        interactionStyle: {
                            commentFrequency: 'medium',
                            shareFrequency: 'high',
                            likeFrequency: 'high',
                            clickThroughRate: 0.02,
                            engagementDepth: 'shallow'
                        },
                        shareability: [
                            { trigger: 'humor', likelihood: 0.8, context: ['memes', 'jokes'] },
                            { trigger: 'controversy', likelihood: 0.6, context: ['debates', 'opinions'] }
                        ]
                    },
                    preferences: {
                        contentTypes: [
                            { type: 'text', preference: 0.9, context: ['news', 'opinions'] },
                            { type: 'image', preference: 0.7, context: ['memes', 'infographics'] }
                        ],
                        formats: [
                            { format: 'short_text', preference: 0.9, deviceSpecific: false }
                        ],
                        topics: [
                            { topic: 'technology', interest: 0.8, seasonality: [] },
                            { topic: 'news', interest: 0.9, seasonality: [] }
                        ],
                        tone: [
                            { tone: 'conversational', preference: 0.8, context: ['general'] },
                            { tone: 'humorous', preference: 0.7, context: ['entertainment'] }
                        ]
                    },
                    engagement: {
                        peakTimes: [
                            { start: '09:00', end: '11:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }
                        ],
                        contentLifecycle: [
                            { stage: 'initial', duration: '1 hour', characteristics: ['high_visibility'] },
                            { stage: 'decay', duration: '23 hours', characteristics: ['declining_reach'] }
                        ],
                        viralityFactors: [
                            { factor: 'trending_hashtag', impact: 0.8, conditions: ['relevant_topic'] }
                        ],
                        decayRate: {
                            halfLife: 18,
                            factors: [
                                { factor: 'algorithm_change', impact: 0.3 }
                            ]
                        }
                    }
                },
                contentFormats: [],
                bestPractices: [
                    {
                        id: 'twitter_brevity',
                        category: 'content',
                        title: 'Keep it concise',
                        description: 'Twitter users prefer short, punchy content',
                        implementation: 'Aim for 100-150 characters when possible',
                        examples: [
                            {
                                title: 'Concise vs Verbose',
                                description: 'Compare short and long versions',
                                before: 'We are excited to announce that our new product feature is now available for all users to try',
                                after: 'New feature is live! Try it now 🚀',
                                impact: '40% higher engagement'
                            }
                        ],
                        metrics: ['engagement_rate', 'retweet_rate']
                    }
                ]
            },
            {
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
                        allowedFormatting: ['bold', 'italic', 'bullet_points'],
                        prohibitedContent: ['overly_casual']
                    },
                    imageLimits: {
                        maxWidth: 1200,
                        maxHeight: 627,
                        maxFileSize: 10000000,
                        allowedFormats: ['jpg', 'png'],
                        aspectRatios: ['1.91:1', '1:1'],
                        minResolution: { width: 800, height: 418 }
                    }
                },
                audience: {
                    demographics: {
                        primaryAgeRange: '30-49',
                        secondaryAgeRanges: ['25-29', '50-64'],
                        genderDistribution: { male: 52, female: 48, other: 0 },
                        geographicDistribution: {
                            regions: [
                                { region: 'North America', percentage: 35, characteristics: ['business-focused'] },
                                { region: 'Europe', percentage: 30, characteristics: ['professional'] }
                            ],
                            urbanRural: { urban: 80, suburban: 18, rural: 2 },
                            timeZones: ['UTC-8', 'UTC-5', 'UTC+0', 'UTC+1']
                        },
                        deviceUsage: { mobile: 60, desktop: 38, tablet: 2, other: 0 }
                    },
                    behavior: {
                        activeHours: [
                            { start: '08:00', end: '10:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
                            { start: '17:00', end: '19:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu', 'fri'] }
                        ],
                        contentConsumption: [
                            { contentType: 'article', duration: 180, frequency: 'medium', context: ['industry_news', 'insights'] }
                        ],
                        interactionStyle: {
                            commentFrequency: 'high',
                            shareFrequency: 'medium',
                            likeFrequency: 'high',
                            clickThroughRate: 0.045,
                            engagementDepth: 'deep'
                        },
                        shareability: [
                            { trigger: 'professional_insight', likelihood: 0.7, context: ['industry_knowledge'] },
                            { trigger: 'career_advice', likelihood: 0.6, context: ['professional_development'] }
                        ]
                    },
                    preferences: {
                        contentTypes: [
                            { type: 'article', preference: 0.9, context: ['thought_leadership'] },
                            { type: 'infographic', preference: 0.8, context: ['data_visualization'] }
                        ],
                        formats: [
                            { format: 'long_form', preference: 0.8, deviceSpecific: false }
                        ],
                        topics: [
                            { topic: 'business', interest: 0.9, seasonality: [] },
                            { topic: 'career', interest: 0.8, seasonality: [] }
                        ],
                        tone: [
                            { tone: 'professional', preference: 0.9, context: ['general'] },
                            { tone: 'authoritative', preference: 0.7, context: ['thought_leadership'] }
                        ]
                    },
                    engagement: {
                        peakTimes: [
                            { start: '08:00', end: '10:00', timezone: 'UTC-5', days: ['mon', 'tue', 'wed', 'thu'] }
                        ],
                        contentLifecycle: [
                            { stage: 'initial', duration: '4 hours', characteristics: ['professional_audience'] },
                            { stage: 'extended', duration: '3 days', characteristics: ['continued_engagement'] }
                        ],
                        viralityFactors: [
                            { factor: 'industry_relevance', impact: 0.7, conditions: ['timely_topic'] }
                        ],
                        decayRate: {
                            halfLife: 72,
                            factors: [
                                { factor: 'weekend_effect', impact: 0.5 }
                            ]
                        }
                    }
                },
                contentFormats: [],
                bestPractices: [
                    {
                        id: 'linkedin_thought_leadership',
                        category: 'content',
                        title: 'Share professional insights',
                        description: 'LinkedIn users value thought leadership and industry expertise',
                        implementation: 'Share unique perspectives and actionable insights',
                        examples: [
                            {
                                title: 'Thought Leadership Post',
                                description: 'Professional insight with actionable advice',
                                after: 'After 10 years in tech, here are 3 lessons that transformed my leadership approach...',
                                impact: '60% higher engagement than generic posts'
                            }
                        ],
                        metrics: ['engagement_rate', 'share_rate', 'comment_quality']
                    }
                ]
            }
        ];
        for (const platform of platforms) {
            await this.contentAdapter.registerPlatform(platform);
        }
        logger_1.logger.info(`Set up ${platforms.length} default platforms`);
    }
    async setupPerformanceTracking() {
        // Set up Redis structures for performance tracking
        // This could include time series indices, aggregation keys, etc.
        logger_1.logger.info('Performance tracking setup completed');
    }
    async savePendingData() {
        // Save any pending performance data or analysis results
        // This would be implemented based on specific requirements
    }
}
exports.ContentConsistencyService = ContentConsistencyService;
//# sourceMappingURL=index.js.map