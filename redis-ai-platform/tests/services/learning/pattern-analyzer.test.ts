import { Redis } from 'ioredis';
import { PatternAnalyzer, PatternType, InsightType } from '../../../src/services/learning/pattern-analyzer';
import { BehaviorTracker } from '../../../src/services/learning/behavior-tracker';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

// Mock BehaviorTracker
jest.mock('../../../src/services/learning/behavior-tracker');
const MockedBehaviorTracker = BehaviorTracker as jest.MockedClass<typeof BehaviorTracker>;

describe('PatternAnalyzer', () => {
  let redis: jest.Mocked<Redis>;
  let behaviorTracker: jest.Mocked<BehaviorTracker>;
  let patternAnalyzer: PatternAnalyzer;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    behaviorTracker = new MockedBehaviorTracker(redis) as jest.Mocked<BehaviorTracker>;
    patternAnalyzer = new PatternAnalyzer(redis, behaviorTracker);

    // Setup default mocks
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.keys = jest.fn().mockResolvedValue([]);
    redis.hget = jest.fn().mockResolvedValue(null);
    behaviorTracker.getUserBehaviorSummary = jest.fn().mockResolvedValue({
      totalEvents: 10,
      uniqueSessions: 3,
      averageSessionLength: 3.33,
      totalDuration: 15000,
      mostCommonActions: [{ action: 'click', count: 5 }],
      mostVisitedPages: [{ page: 'dashboard', count: 3 }],
      timeRange: { start: new Date(), end: new Date() }
    });
    behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([]);
    behaviorTracker.getUserPreferences = jest.fn().mockResolvedValue({
      contentTypes: { text: 0.8, image: 0.6 },
      interactionStyles: { quick: 0.7 },
      responseFormats: { detailed: 0.9 },
      topics: { ai: 0.8 },
      learningRate: 0.1,
      privacyLevel: 'medium' as any,
      lastUpdated: new Date()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeUserPatterns', () => {
    it('should analyze user patterns successfully', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123', 7);

      expect(analysis).toBeDefined();
      expect(analysis.userId).toBe('user123');
      expect(analysis.timeWindow).toBe(7);
      expect(analysis.temporalPatterns).toBeDefined();
      expect(analysis.interactionPatterns).toBeDefined();
      expect(analysis.contentPatterns).toBeDefined();
      expect(analysis.insights).toBeDefined();
      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should handle different time windows', async () => {
      const analysis30Days = await patternAnalyzer.analyzeUserPatterns('user123', 30);
      const analysis7Days = await patternAnalyzer.analyzeUserPatterns('user123', 7);

      expect(analysis30Days.timeWindow).toBe(30);
      expect(analysis7Days.timeWindow).toBe(7);
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in user behavior', async () => {
      const currentBehavior = {
        userId: 'user123',
        sessionId: 'session456',
        action: 'click' as any,
        context: { page: 'unusual-page' },
        timestamp: new Date(),
        metadata: { duration: 10000 } // Unusually long duration
      };

      const mockPatterns = [
        {
          id: 'pattern1',
          type: PatternType.TEMPORAL,
          frequency: 0.8,
          confidence: 0.9,
          data: { averageDuration: 2000 }
        }
      ];

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue(mockPatterns);

      const anomalies = await patternAnalyzer.detectAnomalies('user123', currentBehavior);

      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
    });

    it('should return empty array when no anomalies detected', async () => {
      const normalBehavior = {
        userId: 'user123',
        sessionId: 'session456',
        action: 'click' as any,
        context: { page: 'dashboard' },
        timestamp: new Date(),
        metadata: { duration: 2000 }
      };

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([]);

      const anomalies = await patternAnalyzer.detectAnomalies('user123', normalBehavior);

      expect(anomalies).toHaveLength(0);
    });
  });

  describe('predictUserBehavior', () => {
    it('should predict user behavior based on context', async () => {
      const context = {
        currentPage: 'dashboard',
        timeOfDay: '14:30',
        sessionDuration: 300,
        recentActions: ['view', 'click']
      };

      const mockPatterns = [
        {
          id: 'pattern1',
          type: PatternType.INTERACTION,
          frequency: 0.8,
          confidence: 0.9,
          data: { commonSequences: [['view', 'click', 'search']] }
        }
      ];

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue(mockPatterns);

      const predictions = await patternAnalyzer.predictUserBehavior('user123', context);

      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      // Predictions should be sorted by confidence
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].confidence).toBeLessThanOrEqual(predictions[i - 1].confidence);
      }
    });

    it('should handle empty patterns gracefully', async () => {
      const context = {
        currentPage: 'dashboard',
        timeOfDay: '14:30',
        sessionDuration: 300,
        recentActions: []
      };

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([]);

      const predictions = await patternAnalyzer.predictUserBehavior('user123', context);

      expect(predictions).toHaveLength(0);
    });
  });

  describe('findSimilarUsers', () => {
    it('should find similar users based on preferences and patterns', async () => {
      const mockUserKeys = ['user_similarity:user456', 'user_similarity:user789'];
      redis.keys = jest.fn().mockResolvedValue(mockUserKeys);

      // Mock similar user data
      behaviorTracker.getUserPreferences = jest.fn()
        .mockResolvedValueOnce({
          contentTypes: { text: 0.8, image: 0.6 },
          interactionStyles: { quick: 0.7 },
          responseFormats: { detailed: 0.9 },
          topics: { ai: 0.8 },
          learningRate: 0.1,
          privacyLevel: 'medium' as any,
          lastUpdated: new Date()
        })
        .mockResolvedValueOnce({
          contentTypes: { text: 0.7, image: 0.8 },
          interactionStyles: { quick: 0.6 },
          responseFormats: { detailed: 0.8 },
          topics: { ai: 0.9 },
          learningRate: 0.1,
          privacyLevel: 'medium' as any,
          lastUpdated: new Date()
        })
        .mockResolvedValueOnce({
          contentTypes: { text: 0.9, image: 0.5 },
          interactionStyles: { detailed: 0.8 },
          responseFormats: { brief: 0.7 },
          topics: { ai: 0.7 },
          learningRate: 0.1,
          privacyLevel: 'high' as any,
          lastUpdated: new Date()
        });

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([
        { id: 'pattern1', type: PatternType.TEMPORAL, frequency: 0.8, confidence: 0.9 }
      ]);

      const similarUsers = await patternAnalyzer.findSimilarUsers('user123', 5);

      expect(similarUsers).toBeDefined();
      expect(Array.isArray(similarUsers)).toBe(true);
      expect(similarUsers.length).toBeLessThanOrEqual(5);
      
      // Should be sorted by similarity score
      for (let i = 1; i < similarUsers.length; i++) {
        expect(similarUsers[i].score).toBeLessThanOrEqual(similarUsers[i - 1].score);
      }
    });

    it('should exclude the user themselves from similar users', async () => {
      const mockUserKeys = ['user_similarity:user123', 'user_similarity:user456'];
      redis.keys = jest.fn().mockResolvedValue(mockUserKeys);

      const similarUsers = await patternAnalyzer.findSimilarUsers('user123', 5);

      // Should not include user123 in the results
      expect(similarUsers.every(user => user.userId !== 'user123')).toBe(true);
    });

    it('should filter out users with low similarity scores', async () => {
      const mockUserKeys = ['user_similarity:user456'];
      redis.keys = jest.fn().mockResolvedValue(mockUserKeys);

      // Mock very different preferences (low similarity)
      behaviorTracker.getUserPreferences = jest.fn()
        .mockResolvedValueOnce({
          contentTypes: { text: 0.8, image: 0.6 },
          interactionStyles: { quick: 0.7 },
          responseFormats: { detailed: 0.9 },
          topics: { ai: 0.8 },
          learningRate: 0.1,
          privacyLevel: 'medium' as any,
          lastUpdated: new Date()
        })
        .mockResolvedValueOnce({
          contentTypes: { video: 0.9, audio: 0.8 },
          interactionStyles: { slow: 0.9 },
          responseFormats: { brief: 0.9 },
          topics: { sports: 0.9 },
          learningRate: 0.1,
          privacyLevel: 'low' as any,
          lastUpdated: new Date()
        });

      behaviorTracker.getBehaviorPatterns = jest.fn().mockResolvedValue([]);

      const similarUsers = await patternAnalyzer.findSimilarUsers('user123', 5);

      // Should filter out users with similarity < 0.3
      expect(similarUsers.every(user => user.score >= 0.3)).toBe(true);
    });
  });

  describe('updateUserSimilarity', () => {
    it('should update user similarity vector', async () => {
      await patternAnalyzer.updateUserSimilarity('user123');

      expect(redis.hset).toHaveBeenCalledWith(
        'user_similarity:user123',
        'vector', expect.any(String),
        'lastUpdated', expect.any(String)
      );
    });

    it('should handle update errors gracefully', async () => {
      redis.hset = jest.fn().mockRejectedValue(new Error('Redis error'));

      await expect(patternAnalyzer.updateUserSimilarity('user123')).rejects.toThrow('Redis error');
    });
  });

  describe('pattern analysis methods', () => {
    it('should analyze temporal patterns', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.temporalPatterns).toBeDefined();
      expect(Array.isArray(analysis.temporalPatterns)).toBe(true);
    });

    it('should analyze interaction patterns', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.interactionPatterns).toBeDefined();
      expect(Array.isArray(analysis.interactionPatterns)).toBe(true);
    });

    it('should analyze content patterns', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.contentPatterns).toBeDefined();
      expect(Array.isArray(analysis.contentPatterns)).toBe(true);
    });

    it('should generate insights from patterns', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.insights).toBeDefined();
      expect(Array.isArray(analysis.insights)).toBe(true);
      
      // Each insight should have required properties
      analysis.insights.forEach(insight => {
        expect(insight.type).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(insight.confidence).toBeGreaterThanOrEqual(0);
        expect(insight.confidence).toBeLessThanOrEqual(1);
        expect(typeof insight.actionable).toBe('boolean');
      });
    });
  });

  describe('confidence calculation', () => {
    it('should calculate overall confidence correctly', async () => {
      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.confidence).toBeGreaterThanOrEqual(0);
      expect(analysis.confidence).toBeLessThanOrEqual(1);
    });

    it('should return 0 confidence when no patterns exist', async () => {
      // Mock empty patterns
      behaviorTracker.getUserBehaviorSummary = jest.fn().mockResolvedValue({
        totalEvents: 0,
        uniqueSessions: 0,
        averageSessionLength: 0,
        totalDuration: 0,
        mostCommonActions: [],
        mostVisitedPages: [],
        timeRange: { start: new Date(), end: new Date() }
      });

      const analysis = await patternAnalyzer.analyzeUserPatterns('user123');

      expect(analysis.confidence).toBe(0);
    });
  });
});