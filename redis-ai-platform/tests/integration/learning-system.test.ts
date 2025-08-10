import { Redis } from 'ioredis';
import { LearningService, BehaviorAction, FeedbackType, PrivacyLevel, ContentType } from '../../src/services/learning';

describe('Learning System Integration', () => {
  let redis: Redis;
  let learningService: LearningService;

  beforeAll(async () => {
    // Use test Redis instance
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 15, // Use separate database for tests
    });

    learningService = new LearningService(redis);

    // Clear test database
    await redis.flushdb();
  });

  afterAll(async () => {
    await redis.flushdb();
    await redis.quit();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await redis.flushdb();
  });

  describe('Complete Learning Workflow', () => {
    it('should handle complete learning and personalization scenario', async () => {
      const userId = 'test-user@example.com';
      const sessionId = 'test-session-123';

      // Step 1: Track user behaviors
      const behaviors = [
        {
          userId,
          sessionId,
          action: BehaviorAction.VIEW,
          context: { page: 'dashboard', section: 'overview' },
          metadata: { duration: 2000, scrollDepth: 0.8 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.CLICK,
          context: { page: 'dashboard', element: 'search-button' },
          metadata: { duration: 500 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.SEARCH,
          context: { page: 'search', query: 'machine learning' },
          metadata: { duration: 1500, resultsCount: 25 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.VIEW,
          context: { page: 'content', contentType: 'article', contentId: 'ml-101' },
          metadata: { duration: 30000, readingProgress: 0.9 }
        }
      ];

      for (const behavior of behaviors) {
        await learningService.behaviorTracker.trackBehavior(behavior);
      }

      // Verify behaviors were tracked
      const behaviorSummary = await learningService.behaviorTracker.getUserBehaviorSummary(userId);
      expect(behaviorSummary.totalEvents).toBe(4);
      expect(behaviorSummary.uniqueSessions).toBe(1);
      expect(behaviorSummary.totalDuration).toBe(34000);

      // Step 2: Record user feedback
      const feedback = {
        type: FeedbackType.RATING,
        rating: 5,
        comment: 'Excellent article!',
        context: { contentId: 'ml-101', contentType: 'article' }
      };

      await learningService.behaviorTracker.recordFeedback(userId, feedback);

      const recentFeedback = await learningService.behaviorTracker.getRecentFeedback(userId, 5);
      expect(recentFeedback).toHaveLength(1);
      expect(recentFeedback[0].rating).toBe(5);

      // Step 3: Analyze patterns
      const patterns = await learningService.patternAnalyzer.analyzeUserPatterns(userId, 7);
      expect(patterns).toBeDefined();
      expect(patterns.userId).toBe(userId);
      expect(patterns.confidence).toBeGreaterThanOrEqual(0);

      // Step 4: Get personalized recommendations
      const recommendationContext = {
        currentPage: 'dashboard',
        timeOfDay: '14:30',
        userActivity: 'browsing',
        sessionDuration: 600
      };

      const recommendations = await learningService.personalizationEngine.getPersonalizedRecommendations(
        userId,
        recommendationContext,
        5
      );

      expect(recommendations).toBeDefined();
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeLessThanOrEqual(5);

      // Step 5: Update personalization model with feedback
      const modelFeedback = {
        type: FeedbackType.THUMBS_UP,
        rating: 4,
        context: { recommendationId: recommendations[0]?.id }
      };

      await learningService.personalizationEngine.updatePersonalizationModel(userId, modelFeedback);

      // Step 6: Get personalization insights
      const insights = await learningService.personalizationEngine.getPersonalizationInsights(userId);
      expect(insights).toBeDefined();
      expect(insights.userId).toBe(userId);
      expect(insights.profileStrength).toBeGreaterThanOrEqual(0);
      expect(insights.profileStrength).toBeLessThanOrEqual(1);

      // Step 7: Test interface adaptation
      const currentInterface = {
        layout: 'grid',
        theme: 'light',
        density: 'comfortable'
      };

      const adaptation = await learningService.personalizationEngine.adaptInterface(userId, currentInterface);
      expect(adaptation).toBeDefined();
      expect(adaptation.userId).toBe(userId);
      expect(adaptation.confidence).toBeGreaterThanOrEqual(0);
    }, 30000); // 30 second timeout

    it('should handle user similarity and collaborative filtering', async () => {
      const users = ['user1@test.com', 'user2@test.com', 'user3@test.com'];

      // Create similar behavior patterns for users
      for (const userId of users) {
        const sessionId = `session-${userId}`;
        
        // Similar behaviors
        const behaviors = [
          {
            userId,
            sessionId,
            action: BehaviorAction.SEARCH,
            context: { page: 'search', query: 'artificial intelligence' },
            metadata: { duration: 2000 }
          },
          {
            userId,
            sessionId,
            action: BehaviorAction.VIEW,
            context: { page: 'content', contentType: 'article' },
            metadata: { duration: 25000 }
          }
        ];

        for (const behavior of behaviors) {
          await learningService.behaviorTracker.trackBehavior(behavior);
        }

        // Set similar preferences
        await learningService.behaviorTracker.updateUserPreferences(userId, {
          contentTypes: { text: 0.8, image: 0.6 },
          topics: { ai: 0.9, tech: 0.7 },
          learningRate: 0.1,
          privacyLevel: PrivacyLevel.MEDIUM
        });

        // Update similarity vectors
        await learningService.patternAnalyzer.updateUserSimilarity(userId);
      }

      // Find similar users for the first user
      const similarUsers = await learningService.patternAnalyzer.findSimilarUsers(users[0], 5);
      
      expect(similarUsers).toBeDefined();
      expect(Array.isArray(similarUsers)).toBe(true);
      expect(similarUsers.length).toBeGreaterThan(0);
      
      // Should not include the user themselves
      expect(similarUsers.every(user => user.userId !== users[0])).toBe(true);
      
      // Should be sorted by similarity score
      for (let i = 1; i < similarUsers.length; i++) {
        expect(similarUsers[i].score).toBeLessThanOrEqual(similarUsers[i - 1].score);
      }
    });

    it('should handle anomaly detection', async () => {
      const userId = 'anomaly-test@example.com';
      const sessionId = 'normal-session';

      // Create normal behavior pattern
      const normalBehaviors = [
        {
          userId,
          sessionId,
          action: BehaviorAction.VIEW,
          context: { page: 'dashboard' },
          metadata: { duration: 2000 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.CLICK,
          context: { page: 'dashboard', element: 'menu' },
          metadata: { duration: 500 }
        }
      ];

      for (const behavior of normalBehaviors) {
        await learningService.behaviorTracker.trackBehavior(behavior);
      }

      // Create patterns from normal behavior
      await learningService.patternAnalyzer.analyzeUserPatterns(userId);

      // Test with anomalous behavior
      const anomalousBehavior = {
        userId,
        sessionId: 'anomaly-session',
        action: BehaviorAction.VIEW,
        context: { page: 'admin-panel' }, // Unusual page
        timestamp: new Date(),
        metadata: { duration: 60000 } // Unusually long duration
      };

      const anomalies = await learningService.patternAnalyzer.detectAnomalies(userId, anomalousBehavior);
      
      expect(anomalies).toBeDefined();
      expect(Array.isArray(anomalies)).toBe(true);
      // Note: Actual anomaly detection depends on implementation
    });

    it('should handle behavior prediction', async () => {
      const userId = 'prediction-test@example.com';
      const sessionId = 'prediction-session';

      // Create predictable behavior pattern
      const behaviors = [
        {
          userId,
          sessionId,
          action: BehaviorAction.VIEW,
          context: { page: 'dashboard' },
          metadata: { duration: 2000 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.CLICK,
          context: { page: 'dashboard', element: 'search' },
          metadata: { duration: 500 }
        },
        {
          userId,
          sessionId,
          action: BehaviorAction.SEARCH,
          context: { page: 'search', query: 'test' },
          metadata: { duration: 1500 }
        }
      ];

      for (const behavior of behaviors) {
        await learningService.behaviorTracker.trackBehavior(behavior);
      }

      // Predict next behavior
      const predictionContext = {
        currentPage: 'dashboard',
        timeOfDay: '14:30',
        sessionDuration: 300,
        recentActions: ['view', 'click']
      };

      const predictions = await learningService.patternAnalyzer.predictUserBehavior(userId, predictionContext);
      
      expect(predictions).toBeDefined();
      expect(Array.isArray(predictions)).toBe(true);
      
      // Should be sorted by confidence
      for (let i = 1; i < predictions.length; i++) {
        expect(predictions[i].confidence).toBeLessThanOrEqual(predictions[i - 1].confidence);
      }
    });

    it('should handle personalized content generation', async () => {
      const userId = 'content-test@example.com';

      // Set user preferences
      await learningService.behaviorTracker.updateUserPreferences(userId, {
        contentTypes: { text: 0.9, image: 0.6, video: 0.3 },
        topics: { technology: 0.8, science: 0.7 },
        responseFormats: { detailed: 0.8, brief: 0.4 },
        learningRate: 0.1,
        privacyLevel: PrivacyLevel.MEDIUM
      });

      // Get personalized content
      const personalizedContent = await learningService.personalizationEngine.getPersonalizedContent(
        userId,
        ContentType.TEXT,
        { topic: 'technology', difficulty: 'intermediate' }
      );

      expect(personalizedContent).toBeDefined();
      expect(Array.isArray(personalizedContent)).toBe(true);
      
      // Each content item should have personalization metadata
      personalizedContent.forEach(content => {
        expect(content.metadata.personalizationScore).toBeGreaterThanOrEqual(0);
        expect(content.metadata.personalizedFor).toBe(userId);
        expect(content.metadata.personalizedAt).toBeDefined();
      });

      // Should be sorted by personalization score
      for (let i = 1; i < personalizedContent.length; i++) {
        expect(personalizedContent[i].metadata.personalizationScore)
          .toBeLessThanOrEqual(personalizedContent[i - 1].metadata.personalizationScore);
      }
    });
  });

  describe('Privacy and Data Management', () => {
    it('should respect user privacy settings', async () => {
      const userId = 'privacy-test@example.com';

      // Set high privacy level
      await learningService.behaviorTracker.updateUserPreferences(userId, {
        privacyLevel: PrivacyLevel.HIGH,
        learningRate: 0.05 // Lower learning rate for privacy
      });

      const preferences = await learningService.behaviorTracker.getUserPreferences(userId);
      expect(preferences.privacyLevel).toBe(PrivacyLevel.HIGH);
      expect(preferences.learningRate).toBe(0.05);

      // Get recommendations (should exclude collaborative filtering for high privacy)
      const recommendations = await learningService.personalizationEngine.getPersonalizedRecommendations(
        userId,
        { currentPage: 'dashboard' },
        5
      );

      // With high privacy, should not include collaborative recommendations
      const hasCollaborative = recommendations.some(rec => 
        rec.metadata?.algorithm === 'collaborative-filtering'
      );
      expect(hasCollaborative).toBe(false);
    });

    it('should handle data retention and cleanup', async () => {
      const userId = 'retention-test@example.com';
      const sessionId = 'retention-session';

      // Track some behaviors
      const behavior = {
        userId,
        sessionId,
        action: BehaviorAction.VIEW,
        context: { page: 'test' },
        metadata: { duration: 1000 }
      };

      await learningService.behaviorTracker.trackBehavior(behavior);

      // Verify data exists
      const summary = await learningService.behaviorTracker.getUserBehaviorSummary(userId);
      expect(summary.totalEvents).toBe(1);

      // Test data cleanup (this would normally be done by background processes)
      // For now, just verify the data structure exists
      expect(summary).toBeDefined();
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle concurrent user operations', async () => {
      const users = Array.from({ length: 10 }, (_, i) => `concurrent-user-${i}@test.com`);
      
      // Simulate concurrent behavior tracking
      const behaviorPromises = users.map(userId => 
        learningService.behaviorTracker.trackBehavior({
          userId,
          sessionId: `session-${userId}`,
          action: BehaviorAction.VIEW,
          context: { page: 'dashboard' },
          metadata: { duration: 2000 }
        })
      );

      await Promise.all(behaviorPromises);

      // Verify all behaviors were tracked
      const summaryPromises = users.map(userId => 
        learningService.behaviorTracker.getUserBehaviorSummary(userId)
      );

      const summaries = await Promise.all(summaryPromises);
      summaries.forEach(summary => {
        expect(summary.totalEvents).toBe(1);
      });
    });

    it('should handle large amounts of behavior data', async () => {
      const userId = 'large-data-test@example.com';
      const sessionId = 'large-data-session';

      // Track many behaviors
      const behaviorCount = 100;
      const behaviors = Array.from({ length: behaviorCount }, (_, i) => ({
        userId,
        sessionId,
        action: BehaviorAction.VIEW,
        context: { page: 'test', sequence: i },
        metadata: { duration: 1000 + i * 100 }
      }));

      // Track behaviors in batches to avoid overwhelming Redis
      const batchSize = 10;
      for (let i = 0; i < behaviors.length; i += batchSize) {
        const batch = behaviors.slice(i, i + batchSize);
        await Promise.all(batch.map(behavior => 
          learningService.behaviorTracker.trackBehavior(behavior)
        ));
      }

      // Verify all behaviors were tracked
      const summary = await learningService.behaviorTracker.getUserBehaviorSummary(userId);
      expect(summary.totalEvents).toBe(behaviorCount);
      expect(summary.totalDuration).toBeGreaterThan(0);
    });
  });
});