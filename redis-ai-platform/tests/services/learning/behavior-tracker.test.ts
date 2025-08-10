import { Redis } from 'ioredis';
import { BehaviorTracker, BehaviorAction, FeedbackType, PrivacyLevel } from '../../../src/services/learning/behavior-tracker';

// Mock Redis
jest.mock('ioredis');
const MockedRedis = Redis as jest.MockedClass<typeof Redis>;

describe('BehaviorTracker', () => {
  let redis: jest.Mocked<Redis>;
  let behaviorTracker: BehaviorTracker;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    behaviorTracker = new BehaviorTracker(redis);

    // Setup default mocks
    redis.xadd = jest.fn().mockResolvedValue('1234567890-0');
    redis.xrange = jest.fn().mockResolvedValue([]);
    redis.xrevrange = jest.fn().mockResolvedValue([]);
    redis.hgetall = jest.fn().mockResolvedValue({});
    redis.hset = jest.fn().mockResolvedValue(1);
    redis.publish = jest.fn().mockResolvedValue(1);
    redis.zrevrange = jest.fn().mockResolvedValue([]);
    redis.hget = jest.fn().mockResolvedValue(null);
    redis.keys = jest.fn().mockResolvedValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('trackBehavior', () => {
    it('should track user behavior successfully', async () => {
      const behavior = {
        userId: 'user123',
        sessionId: 'session456',
        action: BehaviorAction.CLICK,
        context: { page: 'dashboard', element: 'search-button' },
        metadata: { duration: 1500 }
      };

      await behaviorTracker.trackBehavior(behavior);

      expect(redis.xadd).toHaveBeenCalledWith(
        'behavior:user123',
        '*',
        'sessionId', 'session456',
        'action', 'click',
        'context', JSON.stringify(behavior.context),
        'metadata', JSON.stringify(behavior.metadata),
        'timestamp', expect.any(String)
      );
    });

    it('should handle behavior tracking errors gracefully', async () => {
      redis.xadd = jest.fn().mockRejectedValue(new Error('Redis error'));

      const behavior = {
        userId: 'user123',
        sessionId: 'session456',
        action: BehaviorAction.CLICK,
        context: {},
        metadata: {}
      };

      await expect(behaviorTracker.trackBehavior(behavior)).rejects.toThrow('Redis error');
    });
  });

  describe('getUserBehaviorSummary', () => {
    it('should return behavior summary for user', async () => {
      const mockBehaviorData = [
        ['1234567890-0', ['sessionId', 'session1', 'action', 'click', 'context', '{"page":"dashboard"}', 'metadata', '{"duration":1000}']],
        ['1234567891-0', ['sessionId', 'session1', 'action', 'view', 'context', '{"page":"profile"}', 'metadata', '{"duration":2000}']]
      ];

      redis.xrange = jest.fn().mockResolvedValue(mockBehaviorData);

      const summary = await behaviorTracker.getUserBehaviorSummary('user123');

      expect(summary.totalEvents).toBe(2);
      expect(summary.uniqueSessions).toBe(1);
      expect(summary.totalDuration).toBe(3000);
      expect(summary.mostCommonActions).toHaveLength(2);
    });

    it('should handle empty behavior data', async () => {
      redis.xrange = jest.fn().mockResolvedValue([]);

      const summary = await behaviorTracker.getUserBehaviorSummary('user123');

      expect(summary.totalEvents).toBe(0);
      expect(summary.uniqueSessions).toBe(0);
      expect(summary.totalDuration).toBe(0);
    });
  });

  describe('getUserPreferences', () => {
    it('should return user preferences when they exist', async () => {
      const mockPreferences = {
        contentTypes: '{"text":0.8,"image":0.6}',
        interactionStyles: '{"quick":0.7}',
        responseFormats: '{"detailed":0.9}',
        topics: '{"ai":0.8}',
        learningRate: '0.1',
        privacyLevel: 'medium',
        lastUpdated: '2023-01-01T00:00:00.000Z'
      };

      redis.hgetall = jest.fn().mockResolvedValue(mockPreferences);

      const preferences = await behaviorTracker.getUserPreferences('user123');

      expect(preferences.contentTypes.text).toBe(0.8);
      expect(preferences.learningRate).toBe(0.1);
      expect(preferences.privacyLevel).toBe(PrivacyLevel.MEDIUM);
    });

    it('should return default preferences when none exist', async () => {
      redis.hgetall = jest.fn().mockResolvedValue({});

      const preferences = await behaviorTracker.getUserPreferences('user123');

      expect(preferences.contentTypes).toEqual({});
      expect(preferences.learningRate).toBe(0.1);
      expect(preferences.privacyLevel).toBe(PrivacyLevel.MEDIUM);
    });
  });

  describe('updateUserPreferences', () => {
    it('should update user preferences successfully', async () => {
      const currentPreferences = {
        contentTypes: { text: 0.5 },
        interactionStyles: {},
        responseFormats: {},
        topics: {},
        learningRate: 0.1,
        privacyLevel: PrivacyLevel.MEDIUM,
        lastUpdated: new Date()
      };

      redis.hgetall = jest.fn().mockResolvedValue({
        contentTypes: JSON.stringify(currentPreferences.contentTypes),
        interactionStyles: JSON.stringify(currentPreferences.interactionStyles),
        responseFormats: JSON.stringify(currentPreferences.responseFormats),
        topics: JSON.stringify(currentPreferences.topics),
        learningRate: currentPreferences.learningRate.toString(),
        privacyLevel: currentPreferences.privacyLevel,
        lastUpdated: currentPreferences.lastUpdated.toISOString()
      });

      const updates = {
        contentTypes: { text: 0.8, image: 0.6 },
        learningRate: 0.2
      };

      await behaviorTracker.updateUserPreferences('user123', updates);

      expect(redis.hset).toHaveBeenCalledWith(
        'preferences:user123',
        'contentTypes', JSON.stringify({ text: 0.8, image: 0.6 }),
        'interactionStyles', JSON.stringify({}),
        'responseFormats', JSON.stringify({}),
        'topics', JSON.stringify({}),
        'learningRate', '0.2',
        'privacyLevel', 'medium',
        'lastUpdated', expect.any(String)
      );

      expect(redis.publish).toHaveBeenCalledWith(
        'preferences:user123',
        expect.stringContaining('"type":"preferences_updated"')
      );
    });
  });

  describe('recordFeedback', () => {
    it('should record user feedback successfully', async () => {
      const feedback = {
        type: FeedbackType.RATING,
        rating: 4,
        comment: 'Great feature!',
        context: { feature: 'search', contentId: 'content123' }
      };

      await behaviorTracker.recordFeedback('user123', feedback);

      expect(redis.xadd).toHaveBeenCalledWith(
        'feedback:user123',
        '*',
        'id', expect.any(String),
        'type', 'rating',
        'rating', '4',
        'comment', 'Great feature!',
        'context', JSON.stringify(feedback.context),
        'timestamp', expect.any(String)
      );
    });

    it('should update preferences based on feedback', async () => {
      const feedback = {
        type: FeedbackType.RATING,
        rating: 5,
        context: { contentType: 'text' }
      };

      // Mock current preferences
      redis.hgetall = jest.fn().mockResolvedValue({
        contentTypes: '{"text":0.5}',
        interactionStyles: '{}',
        responseFormats: '{}',
        topics: '{}',
        learningRate: '0.1',
        privacyLevel: 'medium',
        lastUpdated: new Date().toISOString()
      });

      await behaviorTracker.recordFeedback('user123', feedback);

      // Should update preferences based on positive feedback
      expect(redis.hset).toHaveBeenCalledWith(
        'preferences:user123',
        expect.any(String),
        expect.stringContaining('"text":0.7'), // 0.5 + (5-3)*0.1 = 0.7
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe('getRecentFeedback', () => {
    it('should return recent feedback for user', async () => {
      const mockFeedbackData = [
        ['1234567890-0', ['id', 'feedback1', 'type', 'rating', 'rating', '4', 'comment', 'Good', 'context', '{}', 'timestamp', '2023-01-01T00:00:00.000Z']],
        ['1234567891-0', ['id', 'feedback2', 'type', 'thumbs', 'rating', '5', 'comment', 'Excellent', 'context', '{}', 'timestamp', '2023-01-02T00:00:00.000Z']]
      ];

      redis.xrevrange = jest.fn().mockResolvedValue(mockFeedbackData);

      const feedback = await behaviorTracker.getRecentFeedback('user123', 10);

      expect(feedback).toHaveLength(2);
      expect(feedback[0].id).toBe('feedback1');
      expect(feedback[0].rating).toBe(4);
      expect(feedback[1].id).toBe('feedback2');
      expect(feedback[1].rating).toBe(5);
    });

    it('should handle empty feedback data', async () => {
      redis.xrevrange = jest.fn().mockResolvedValue([]);

      const feedback = await behaviorTracker.getRecentFeedback('user123');

      expect(feedback).toHaveLength(0);
    });
  });

  describe('getBehaviorPatterns', () => {
    it('should return behavior patterns for user', async () => {
      const mockPatternIds = ['pattern1', 'pattern2'];
      const mockPatternData = {
        id: 'pattern1',
        type: 'temporal',
        frequency: 0.8,
        confidence: 0.9
      };

      redis.zrevrange = jest.fn().mockResolvedValue(mockPatternIds);
      redis.hget = jest.fn().mockResolvedValue(JSON.stringify(mockPatternData));

      const patterns = await behaviorTracker.getBehaviorPatterns('user123', 5);

      expect(patterns).toHaveLength(2);
      expect(patterns[0].id).toBe('pattern1');
      expect(patterns[0].type).toBe('temporal');
    });

    it('should handle missing pattern data', async () => {
      redis.zrevrange = jest.fn().mockResolvedValue(['pattern1']);
      redis.hget = jest.fn().mockResolvedValue(null);

      const patterns = await behaviorTracker.getBehaviorPatterns('user123');

      expect(patterns).toHaveLength(0);
    });
  });
});