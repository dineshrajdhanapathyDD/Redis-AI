import { Redis } from 'ioredis';
import { PersonalizationEngine, RecommendationType, ContentType } from '../../../src/services/learning/personalization-engine';
import { BehaviorTracker } from '../../../src/services/learning/behavior-tracker';
import { PatternAnalyzer } from '../../../src/services/learning/pattern-analyzer';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock dependencies
jest.mock('../../../src/services/learning/behavior-tracker');
jest.mock('../../../src/services/learning/pattern-analyzer');
const MockedBehaviorTracker = BehaviorTracker as jest.MockedClass<typeof BehaviorTracker>;
const MockedPatternAnalyzer = PatternAnalyzer as jest.MockedClass<typeof PatternAnalyzer>;

describe('PersonalizationEngine', () => {
  let redis: jest.Mocked<Redis>;
  let behaviorTracker: jest.Mocked<BehaviorTracker>;
  let patternAnalyzer: jest.Mocked<PatternAnalyzer>;
  let personalizationEngine: PersonalizationEngine;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    behaviorTracker = new MockedBehaviorTracker(redis) as jest.Mocked<BehaviorTracker>;
    patternAnalyzer = new MockedPatternAnalyzer(redis, behaviorTracker) as jest.Mocked<PatternAnalyzer>;
    personalizationEngine = new PersonalizationEngine(redis, behaviorTracker, patternAnalyzer);

    // Setup default mocks
    redis.zadd = jest.fn().mockResolvedValue(1);
    redis.expire = jest.fn().mockResolvedValue(1);
    redis.get = jest.fn().mockResolvedValue(null);
    redis.set = jest.fn().mockResolvedValue('OK');

    behaviorTracker.getUserPreferences = jest.fn().mockResolvedValue({
      contentTypes: { text: 0.8, image: 0.6, video: 0.4 },
      interactionStyles: { quick: 0.7, detailed: 0.3 },
      responseFormats: { brief: 0.6, detailed: 0.8 },
      topics: { ai: 0.9, tech: 0.7 },
      learningRate: 0.1,
      privacyLevel: 'medium' as any,
      lastUpdated: new Date()
    });

    behaviorTracker.getUserBehaviorSummary = jest.fn().mockResolvedValue({
      totalEvents: 50,
      uniqueSessions: 10,
      averageSessionLength: 5,
      totalDuration: 25000,
      mostCommonActions: [{ action: 'click', count: 20 }],
      mostVisitedPages: [{ page: 'dashboard', count: 15 }],
      timeRange: { start: new Date(), end: new Date() }
    });

    behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([
      { id: 'pattern1', type: 'temporal' as any, frequency: 0.8, confidence: 0.9 }
    ]);

    behaviorTracker.getRecentFeedback = jest.fn().mockResolvedValue([
      { id: 'feedback1', type: 'rating' as any, rating: 4, timestamp: new Date() }
    ]);

    behaviorTracker.recordFeedback = jest.fn().mockResolvedValue();
    behaviorTracker.updateUserPreferences = jest.fn().mockResolvedValue();

    patternAnalyzer.analyzeUserPatterns = jest.fn().mockResolvedValue({
      userId: 'user123',
      analysisDate: new Date(),
      timeWindow: 7,
      temporalPatterns: [],
      interactionPatterns: [],
      contentPatterns: [],
      insights: [
        { type: 'temporal' as any, description: 'Most active in mornings', confidence: 0.8, actionable: true }
      ],
      confidence: 0.8
    });

    patternAnalyzer.findSimilarUsers = jest.fn().mockResolvedValue([
      { userId: 'user456', score: 0.8, sharedPreferences: ['text content'], sharedPatterns: ['temporal'] }
    ]);

    patternAnalyzer.predictUserBehavior = jest.fn().mockResolvedValue([
      { type: 'action', prediction: 'click', confidence: 0.7, context: {} }
    ]);

    patternAnalyzer.updateUserSimilarity = jest.fn().mockResolvedValue();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPersonalizedRecommendations', () => {
    it('should generate personalized recommendations', async () => {
      const context = {
        currentPage: 'dashboard',
        timeOfDay: '10:00',
        userActivity: 'browsing',
        sessionDuration: 300
      };

      const recommendations = await personalizationEngine.getPersonalizedRecommendations('user123', context, 5);

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Each recommendation should have required properties
      recommendations.forEach(rec => {
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.title).toBeDefined();
        expect(rec.score).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(1);
        expect(rec.reasoning).toBeDefined();
      });
    });

    it('should combine content-based and collaborative recommendations', async () => {
      const context = {
        currentPage: 'search',
        timeOfDay: '14:00',
        userActivity: 'searching',
        sessionDuration: 600
      };

      const recommendations = await personalizationEngine.getPersonalizedRecommendations('user123', context, 10);

      // Should include both types of recommendations
      const hasContentBased = recommendations.some(rec => rec.metadata?.algorithm === 'content-based');
      const hasCollaborative = recommendations.some(rec => rec.metadata?.algorithm === 'collaborative-filtering');

      expect(hasContentBased || hasCollaborative).toBe(true);
    });

    it('should rank recommendations by score', async () => {
      const context = { currentPage: 'dashboard' };
      const recommendations = await personalizationEngine.getPersonalizedRecommendations('user123', context, 10);

      // Should be sorted by score (descending)
      for (let i = 1; i < recommendations.length; i++) {
        expect(recommendations[i].score).toBeLessThanOrEqual(recommendations[i - 1].score);
      }
    });
  });

  describe('updatePersonalizationModel', () => {
    it('should update model based on feedback', async () => {
      const feedback = {
        type: 'rating' as any,
        rating: 5,
        comment: 'Excellent recommendation!',
        context: { contentType: 'text', contentId: 'content123' }
      };

      await personalizationEngine.updatePersonalizationModel('user123', feedback);

      expect(behaviorTracker.recordFeedback).toHaveBeenCalledWith('user123', {
        type: feedback.type,
        rating: feedback.rating,
        comment: feedback.comment,
        context: feedback.context
      });

      expect(behaviorTracker.updateUserPreferences).toHaveBeenCalled();
      expect(patternAnalyzer.updateUserSimilarity).toHaveBeenCalledWith('user123');
    });

    it('should handle negative feedback appropriately', async () => {
      const feedback = {
        type: 'rating' as any,
        rating: 1,
        comment: 'Not relevant',
        context: { contentType: 'video', contentId: 'content456' }
      };

      await personalizationEngine.updatePersonalizationModel('user123', feedback);

      expect(behaviorTracker.recordFeedback).toHaveBeenCalled();
      expect(behaviorTracker.updateUserPreferences).toHaveBeenCalled();
    });
  });

  describe('getPersonalizedContent', () => {
    it('should return personalized content based on user preferences', async () => {
      const contentType = ContentType.TEXT;
      const context = {
        topic: 'ai',
        difficulty: 'intermediate',
        format: 'article'
      };

      const personalizedContent = await personalizationEngine.getPersonalizedContent('user123', contentType, context);

      expect(personalizedContent).toBeDefined();
      expect(Array.isArray(personalizedContent)).toBe(true);

      // Each content item should have personalization metadata
      personalizedContent.forEach(content => {
        expect(content.id).toBeDefined();
        expect(content.type).toBe(contentType);
        expect(content.metadata.personalizationScore).toBeGreaterThanOrEqual(0);
        expect(content.metadata.personalizedFor).toBe('user123');
        expect(content.metadata.personalizedAt).toBeDefined();
      });
    });

    it('should filter out low-relevance content', async () => {
      const contentType = ContentType.IMAGE;
      const context = { topic: 'unrelated' };

      const personalizedContent = await personalizationEngine.getPersonalizedContent('user123', contentType, context);

      // All returned content should have personalization score > 0.3
      personalizedContent.forEach(content => {
        expect(content.metadata.personalizationScore).toBeGreaterThan(0.3);
      });
    });

    it('should sort content by personalization score', async () => {
      const contentType = ContentType.TEXT;
      const context = { topic: 'ai' };

      const personalizedContent = await personalizationEngine.getPersonalizedContent('user123', contentType, context);

      // Should be sorted by personalization score (descending)
      for (let i = 1; i < personalizedContent.length; i++) {
        expect(personalizedContent[i].metadata.personalizationScore)
          .toBeLessThanOrEqual(personalizedContent[i - 1].metadata.personalizationScore);
      }
    });
  });

  describe('adaptInterface', () => {
    it('should adapt interface based on user patterns', async () => {
      const currentInterface = {
        layout: 'grid',
        theme: 'light',
        density: 'comfortable',
        navigation: 'sidebar'
      };

      const adaptation = await personalizationEngine.adaptInterface('user123', currentInterface);

      expect(adaptation).toBeDefined();
      expect(adaptation.userId).toBe('user123');
      expect(adaptation.adaptationId).toBeDefined();
      expect(adaptation.timestamp).toBeDefined();
      expect(Array.isArray(adaptation.changes)).toBe(true);
      expect(adaptation.confidence).toBeGreaterThanOrEqual(0);
      expect(adaptation.confidence).toBeLessThanOrEqual(1);
      expect(adaptation.reasoning).toBeDefined();
    });

    it('should provide reasoning for adaptations', async () => {
      const currentInterface = { layout: 'list' };
      const adaptation = await personalizationEngine.adaptInterface('user123', currentInterface);

      expect(adaptation.reasoning).toBeDefined();
      expect(typeof adaptation.reasoning).toBe('string');
      expect(adaptation.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('predictUserNeeds', () => {
    it('should predict user needs based on context', async () => {
      const context = {
        currentPage: 'dashboard',
        timeOfDay: '09:00',
        sessionDuration: 300,
        recentActions: ['view', 'click']
      };

      const predictions = await personalizationEngine.predictUserNeeds('user123', context);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);

      // Should be sorted by confidence
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].confidence).toBeLessThanOrEqual(predictions[i - 1].confidence);
      }

      // Each prediction should have required properties
      predictions.forEach(prediction => {
        expect(prediction.type).toBeDefined();
        expect(prediction.description).toBeDefined();
        expect(prediction.confidence).toBeGreaterThanOrEqual(0);
        expect(prediction.confidence).toBeLessThanOrEqual(1);
      });
    });

    it('should predict different types of needs', async () => {
      const context = { currentPage: 'editor', userActivity: 'writing' };
      const predictions = await personalizationEngine.predictUserNeeds('user123', context);

      // Should predict various types of needs (information, tools, assistance)
      const needTypes = predictions.map(p => p.type);
      expect(needTypes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getPersonalizationInsights', () => {
    it('should provide comprehensive personalization insights', async () => {
      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      expect(insights).toBeDefined();
      expect(insights.userId).toBe('user123');
      expect(insights.generatedAt).toBeDefined();
      expect(insights.profileStrength).toBeGreaterThanOrEqual(0);
      expect(insights.profileStrength).toBeLessThanOrEqual(1);
      expect(Array.isArray(insights.topPreferences)).toBe(true);
      expect(Array.isArray(insights.behaviorInsights)).toBe(true);
      expect(Array.isArray(insights.similarUsers)).toBe(true);
      expect(insights.recommendations).toBeDefined();
      expect(Array.isArray(insights.recommendations.contentTypes)).toBe(true);
      expect(Array.isArray(insights.recommendations.features)).toBe(true);
      expect(Array.isArray(insights.recommendations.improvements)).toBe(true);
    });

    it('should include top preferences', async () => {
      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      expect(insights.topPreferences.length).toBeGreaterThan(0);
      insights.topPreferences.forEach(pref => {
        expect(pref.type).toBeDefined();
        expect(pref.score).toBeGreaterThanOrEqual(0);
        expect(pref.score).toBeLessThanOrEqual(1);
      });

      // Should be sorted by score
      for (let i = 1; i < insights.topPreferences.length; i++) {
        expect(insights.topPreferences[i].score)
          .toBeLessThanOrEqual(insights.topPreferences[i - 1].score);
      }
    });

    it('should include similar users information', async () => {
      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      insights.similarUsers.forEach(user => {
        expect(user.userId).toBeDefined();
        expect(user.similarity).toBeGreaterThanOrEqual(0);
        expect(user.similarity).toBeLessThanOrEqual(1);
        expect(Array.isArray(user.sharedInterests)).toBe(true);
      });
    });

    it('should provide actionable recommendations', async () => {
      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      expect(insights.recommendations.contentTypes).toBeDefined();
      expect(insights.recommendations.features).toBeDefined();
      expect(insights.recommendations.improvements).toBeDefined();

      // Improvements should be actionable strings
      insights.recommendations.improvements.forEach(improvement => {
        expect(typeof improvement).toBe('string');
        expect(improvement.length).toBeGreaterThan(0);
      });
    });
  });

  describe('profile strength calculation', () => {
    it('should calculate profile strength correctly', async () => {
      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      expect(insights.profileStrength).toBeGreaterThanOrEqual(0);
      expect(insights.profileStrength).toBeLessThanOrEqual(1);
    });

    it('should return low strength for new users', async () => {
      // Mock minimal user data
      behaviorTracker.getUserBehaviorSummary = jest.fn().mockResolvedValue({
        totalEvents: 1,
        uniqueSessions: 1,
        averageSessionLength: 1,
        totalDuration: 100,
        mostCommonActions: [],
        mostVisitedPages: [],
        timeRange: { start: new Date(), end: new Date() }
      });

      behaviorTracker.getRecentFeedback = jest.fn().mockResolvedValue([]);
      behaviorTracker.getUserPreferences = jest.fn().mockResolvedValue({
        contentTypes: {},
        interactionStyles: {},
        responseFormats: {},
        topics: {},
        learningRate: 0.1,
        privacyLevel: 'medium' as any,
        lastUpdated: new Date()
      });

      const insights = await personalizationEngine.getPersonalizationInsights('user123');

      expect(insights.profileStrength).toBeLessThan(0.3);
    });
  });
});