"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningDemo = void 0;
exports.runLearningDemo = runLearningDemo;
const ioredis_1 = require("ioredis");
const learning_1 = require("../services/learning");
const logger_1 = require("../utils/logger");
class LearningDemo {
    redis;
    learningService;
    constructor(redis) {
        this.redis = redis;
        this.learningService = new learning_1.LearningService(redis);
    }
    async runDemo() {
        logger_1.logger.info('🧠 Starting Adaptive Learning and Personalization Demo');
        try {
            // Demo 1: Behavior tracking and pattern analysis
            await this.demoBehaviorTracking();
            // Demo 2: Pattern analysis and insights
            await this.demoPatternAnalysis();
            // Demo 3: Personalized recommendations
            await this.demoPersonalizedRecommendations();
            // Demo 4: Interface adaptation
            await this.demoInterfaceAdaptation();
            // Demo 5: User similarity and collaborative filtering
            await this.demoCollaborativeFiltering();
            logger_1.logger.info('✅ Adaptive Learning and Personalization Demo completed successfully');
        }
        catch (error) {
            logger_1.logger.error(`❌ Demo failed: ${error.message}`);
            throw error;
        }
    }
    async demoBehaviorTracking() {
        logger_1.logger.info('\n📊 Demo 1: Behavior Tracking and Learning');
        const userId = 'alice@example.com';
        const sessionId = 'session_' + Date.now();
        // Simulate user behaviors over time
        const behaviors = [
            {
                userId,
                sessionId,
                action: learning_1.BehaviorAction.VIEW,
                context: { page: 'dashboard', section: 'overview' },
                metadata: { duration: 2000, scrollDepth: 0.8 }
            },
            {
                userId,
                sessionId,
                action: learning_1.BehaviorAction.CLICK,
                context: { page: 'dashboard', element: 'search-button' },
                metadata: { duration: 500 }
            },
            {
                userId,
                sessionId,
                action: learning_1.BehaviorAction.SEARCH,
                context: { page: 'search', query: 'machine learning tutorials' },
                metadata: { duration: 1500, resultsCount: 25 }
            },
            {
                userId,
                sessionId,
                action: learning_1.BehaviorAction.VIEW,
                context: { page: 'content', contentType: 'article', contentId: 'ml-basics-101' },
                metadata: { duration: 45000, readingProgress: 0.9 }
            },
            {
                userId,
                sessionId,
                action: learning_1.BehaviorAction.LIKE,
                context: { page: 'content', contentId: 'ml-basics-101' },
                metadata: { duration: 200 }
            }
        ];
        // Track behaviors
        for (const behavior of behaviors) {
            await this.learningService.behaviorTracker.trackBehavior(behavior);
            logger_1.logger.info(`Tracked behavior: ${behavior.action} on ${behavior.context.page}`);
            // Add small delay to simulate real-time behavior
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        // Get behavior summary
        const summary = await this.learningService.behaviorTracker.getUserBehaviorSummary(userId);
        logger_1.logger.info(`Behavior Summary for ${userId}:`);
        logger_1.logger.info(`  - Total events: ${summary.totalEvents}`);
        logger_1.logger.info(`  - Unique sessions: ${summary.uniqueSessions}`);
        logger_1.logger.info(`  - Total duration: ${summary.totalDuration}ms`);
        logger_1.logger.info(`  - Most common actions: ${summary.mostCommonActions.map(a => `${a.action}(${a.count})`).join(', ')}`);
        // Record user feedback
        const feedbacks = [
            {
                type: learning_1.FeedbackType.RATING,
                rating: 5,
                comment: 'Excellent article on ML basics!',
                context: { contentId: 'ml-basics-101', contentType: 'article' }
            },
            {
                type: learning_1.FeedbackType.THUMBS_UP,
                rating: 4,
                context: { feature: 'search', query: 'machine learning tutorials' }
            }
        ];
        for (const feedback of feedbacks) {
            await this.learningService.behaviorTracker.recordFeedback(userId, feedback);
            logger_1.logger.info(`Recorded feedback: ${feedback.type} with rating ${feedback.rating}`);
        }
        // Get user preferences (should be updated based on behavior and feedback)
        const preferences = await this.learningService.behaviorTracker.getUserPreferences(userId);
        logger_1.logger.info(`User Preferences:`);
        logger_1.logger.info(`  - Content types: ${JSON.stringify(preferences.contentTypes)}`);
        logger_1.logger.info(`  - Learning rate: ${preferences.learningRate}`);
        logger_1.logger.info(`  - Privacy level: ${preferences.privacyLevel}`);
    }
    async demoPatternAnalysis() {
        logger_1.logger.info('\n🔍 Demo 2: Pattern Analysis and Insights');
        const userId = 'alice@example.com';
        // Simulate additional behaviors for pattern analysis
        await this.simulateExtendedBehavior(userId);
        // Analyze user patterns
        const patterns = await this.learningService.patternAnalyzer.analyzeUserPatterns(userId, 7);
        logger_1.logger.info(`Pattern Analysis for ${userId}:`);
        logger_1.logger.info(`  - Analysis confidence: ${patterns.confidence.toFixed(3)}`);
        logger_1.logger.info(`  - Temporal patterns: ${patterns.temporalPatterns.length}`);
        logger_1.logger.info(`  - Interaction patterns: ${patterns.interactionPatterns.length}`);
        logger_1.logger.info(`  - Content patterns: ${patterns.contentPatterns.length}`);
        // Display insights
        logger_1.logger.info(`Generated Insights:`);
        patterns.insights.forEach((insight, index) => {
            logger_1.logger.info(`  ${index + 1}. [${insight.type}] ${insight.description} (confidence: ${insight.confidence.toFixed(3)})`);
            if (insight.actionable && insight.recommendation) {
                logger_1.logger.info(`     → Recommendation: ${insight.recommendation}`);
            }
        });
        // Test anomaly detection
        const unusualBehavior = {
            userId,
            sessionId: 'anomaly_session',
            action: learning_1.BehaviorAction.VIEW,
            context: { page: 'admin-panel' }, // Unusual page for this user
            timestamp: new Date(),
            metadata: { duration: 30000 } // Unusually long duration
        };
        const anomalies = await this.learningService.patternAnalyzer.detectAnomalies(userId, unusualBehavior);
        if (anomalies.length > 0) {
            logger_1.logger.info(`Detected ${anomalies.length} anomalies:`);
            anomalies.forEach((anomaly, index) => {
                logger_1.logger.info(`  ${index + 1}. ${anomaly.type}: ${anomaly.description} (severity: ${anomaly.severity})`);
            });
        }
        else {
            logger_1.logger.info('No anomalies detected in current behavior');
        }
        // Predict future behavior
        const predictionContext = {
            currentPage: 'dashboard',
            timeOfDay: new Date().getHours().toString() + ':00',
            sessionDuration: 300,
            recentActions: ['view', 'click', 'search']
        };
        const predictions = await this.learningService.patternAnalyzer.predictUserBehavior(userId, predictionContext);
        logger_1.logger.info(`Behavior Predictions:`);
        predictions.slice(0, 3).forEach((prediction, index) => {
            logger_1.logger.info(`  ${index + 1}. ${prediction.type}: ${prediction.prediction} (confidence: ${prediction.confidence.toFixed(3)})`);
        });
    }
    async demoPersonalizedRecommendations() {
        logger_1.logger.info('\n🎯 Demo 3: Personalized Recommendations');
        const userId = 'alice@example.com';
        // Get personalized recommendations
        const recommendationContext = {
            currentPage: 'dashboard',
            timeOfDay: '14:30',
            userActivity: 'browsing',
            sessionDuration: 600
        };
        const recommendations = await this.learningService.personalizationEngine.getPersonalizedRecommendations(userId, recommendationContext, 8);
        logger_1.logger.info(`Personalized Recommendations for ${userId}:`);
        recommendations.forEach((rec, index) => {
            logger_1.logger.info(`  ${index + 1}. [${rec.type}] ${rec.title}`);
            logger_1.logger.info(`     Score: ${rec.score.toFixed(3)} | Confidence: ${rec.confidence.toFixed(3)}`);
            logger_1.logger.info(`     Reasoning: ${rec.reasoning}`);
            if (rec.metadata?.algorithm) {
                logger_1.logger.info(`     Algorithm: ${rec.metadata.algorithm}`);
            }
        });
        // Test personalized content
        const personalizedContent = await this.learningService.personalizationEngine.getPersonalizedContent(userId, learning_1.ContentType.TEXT, { topic: 'machine-learning', difficulty: 'intermediate' });
        logger_1.logger.info(`Personalized Content (${personalizedContent.length} items):`);
        personalizedContent.slice(0, 3).forEach((content, index) => {
            logger_1.logger.info(`  ${index + 1}. ${content.title}`);
            logger_1.logger.info(`     Personalization Score: ${content.metadata.personalizationScore.toFixed(3)}`);
            logger_1.logger.info(`     Description: ${content.description.substring(0, 100)}...`);
        });
        // Simulate user feedback on recommendations
        const feedback = {
            type: learning_1.FeedbackType.RATING,
            rating: 4,
            comment: 'Good recommendation, very relevant!',
            context: {
                recommendationId: recommendations[0]?.id,
                contentType: 'text',
                feature: 'personalized-recommendations'
            }
        };
        await this.learningService.personalizationEngine.updatePersonalizationModel(userId, feedback);
        logger_1.logger.info('Updated personalization model based on user feedback');
    }
    async demoInterfaceAdaptation() {
        logger_1.logger.info('\n🎨 Demo 4: Interface Adaptation');
        const userId = 'alice@example.com';
        // Current interface state
        const currentInterface = {
            layout: 'grid',
            theme: 'light',
            density: 'comfortable',
            navigation: 'sidebar',
            fontSize: 'medium',
            animations: true
        };
        // Get interface adaptations
        const adaptation = await this.learningService.personalizationEngine.adaptInterface(userId, currentInterface);
        logger_1.logger.info(`Interface Adaptation for ${userId}:`);
        logger_1.logger.info(`  - Adaptation ID: ${adaptation.adaptationId}`);
        logger_1.logger.info(`  - Confidence: ${adaptation.confidence.toFixed(3)}`);
        logger_1.logger.info(`  - Reasoning: ${adaptation.reasoning}`);
        if (adaptation.changes.length > 0) {
            logger_1.logger.info(`  - Proposed Changes:`);
            adaptation.changes.forEach((change, index) => {
                logger_1.logger.info(`    ${index + 1}. ${change.type}: ${change.description}`);
                logger_1.logger.info(`       From: ${change.oldValue} → To: ${change.newValue}`);
                logger_1.logger.info(`       Confidence: ${change.confidence.toFixed(3)}`);
            });
        }
        else {
            logger_1.logger.info('  - No interface changes recommended at this time');
        }
        // Predict user needs
        const predictionContext = {
            currentPage: 'editor',
            timeOfDay: '10:30',
            sessionDuration: 1200,
            recentActions: ['create', 'edit', 'save']
        };
        const needPredictions = await this.learningService.personalizationEngine.predictUserNeeds(userId, predictionContext);
        logger_1.logger.info(`Predicted User Needs:`);
        needPredictions.slice(0, 5).forEach((need, index) => {
            logger_1.logger.info(`  ${index + 1}. ${need.type}: ${need.description}`);
            logger_1.logger.info(`     Confidence: ${need.confidence.toFixed(3)} | Priority: ${need.priority}`);
            if (need.suggestedAction) {
                logger_1.logger.info(`     Suggested Action: ${need.suggestedAction}`);
            }
        });
    }
    async demoCollaborativeFiltering() {
        logger_1.logger.info('\n👥 Demo 5: User Similarity and Collaborative Filtering');
        const userId = 'alice@example.com';
        // Simulate other users with similar interests
        await this.simulateOtherUsers();
        // Find similar users
        const similarUsers = await this.learningService.patternAnalyzer.findSimilarUsers(userId, 5);
        logger_1.logger.info(`Similar Users to ${userId}:`);
        similarUsers.forEach((user, index) => {
            logger_1.logger.info(`  ${index + 1}. ${user.userId} (similarity: ${user.score.toFixed(3)})`);
            logger_1.logger.info(`     Shared preferences: ${user.sharedPreferences.join(', ')}`);
            logger_1.logger.info(`     Shared patterns: ${user.sharedPatterns.join(', ')}`);
        });
        // Get comprehensive personalization insights
        const insights = await this.learningService.personalizationEngine.getPersonalizationInsights(userId);
        logger_1.logger.info(`Personalization Insights for ${userId}:`);
        logger_1.logger.info(`  - Profile Strength: ${insights.profileStrength.toFixed(3)}`);
        logger_1.logger.info(`  - Top Preferences:`);
        insights.topPreferences.slice(0, 5).forEach((pref, index) => {
            logger_1.logger.info(`    ${index + 1}. ${pref.type}: ${pref.score.toFixed(3)}`);
        });
        logger_1.logger.info(`  - Similar Users:`);
        insights.similarUsers.forEach((user, index) => {
            logger_1.logger.info(`    ${index + 1}. ${user.userId} (${user.similarity.toFixed(3)}) - ${user.sharedInterests.join(', ')}`);
        });
        logger_1.logger.info(`  - Recommendations:`);
        logger_1.logger.info(`    Content Types to Explore: ${insights.recommendations.contentTypes.join(', ')}`);
        logger_1.logger.info(`    Suggested Features: ${insights.recommendations.features.join(', ')}`);
        logger_1.logger.info(`    Improvements: ${insights.recommendations.improvements.join(', ')}`);
        // Update user similarity (this would normally be done in background)
        await this.learningService.patternAnalyzer.updateUserSimilarity(userId);
        logger_1.logger.info('Updated user similarity vectors');
    }
    async simulateExtendedBehavior(userId) {
        // Simulate a week of user behavior for pattern analysis
        const sessions = ['morning', 'afternoon', 'evening'];
        const pages = ['dashboard', 'search', 'content', 'profile', 'settings'];
        const actions = [learning_1.BehaviorAction.VIEW, learning_1.BehaviorAction.CLICK, learning_1.BehaviorAction.SEARCH, learning_1.BehaviorAction.SCROLL];
        for (let day = 0; day < 7; day++) {
            for (const session of sessions) {
                const sessionId = `${session}_day${day}_${Date.now()}`;
                // Simulate 3-8 actions per session
                const actionCount = 3 + Math.floor(Math.random() * 6);
                for (let i = 0; i < actionCount; i++) {
                    const behavior = {
                        userId,
                        sessionId,
                        action: actions[Math.floor(Math.random() * actions.length)],
                        context: {
                            page: pages[Math.floor(Math.random() * pages.length)],
                            timeOfDay: session,
                            dayOfWeek: day
                        },
                        metadata: {
                            duration: 1000 + Math.floor(Math.random() * 5000),
                            sequence: i
                        }
                    };
                    await this.learningService.behaviorTracker.trackBehavior(behavior);
                }
            }
        }
    }
    async simulateOtherUsers() {
        const otherUsers = ['bob@example.com', 'charlie@example.com', 'diana@example.com'];
        for (const userId of otherUsers) {
            // Simulate some behavior for each user
            const behaviors = [
                {
                    userId,
                    sessionId: `session_${userId}_${Date.now()}`,
                    action: learning_1.BehaviorAction.VIEW,
                    context: { page: 'dashboard', contentType: 'article' },
                    metadata: { duration: 3000 }
                },
                {
                    userId,
                    sessionId: `session_${userId}_${Date.now()}`,
                    action: learning_1.BehaviorAction.SEARCH,
                    context: { page: 'search', query: 'artificial intelligence' },
                    metadata: { duration: 2000 }
                }
            ];
            for (const behavior of behaviors) {
                await this.learningService.behaviorTracker.trackBehavior(behavior);
            }
            // Set some preferences
            await this.learningService.behaviorTracker.updateUserPreferences(userId, {
                contentTypes: {
                    text: 0.7 + Math.random() * 0.3,
                    image: 0.4 + Math.random() * 0.4,
                    video: 0.3 + Math.random() * 0.5
                },
                topics: {
                    ai: 0.8 + Math.random() * 0.2,
                    tech: 0.6 + Math.random() * 0.3
                }
            });
            // Update similarity vectors
            await this.learningService.patternAnalyzer.updateUserSimilarity(userId);
        }
    }
}
exports.LearningDemo = LearningDemo;
// Example usage
async function runLearningDemo() {
    const redis = new ioredis_1.Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
    });
    const demo = new LearningDemo(redis);
    try {
        await demo.runDemo();
    }
    finally {
        await redis.quit();
    }
}
// Run demo if this file is executed directly
if (require.main === module) {
    runLearningDemo().catch(console.error);
}
//# sourceMappingURL=learning-demo.js.map