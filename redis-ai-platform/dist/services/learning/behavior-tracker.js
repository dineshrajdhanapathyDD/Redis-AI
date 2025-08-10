"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BehaviorTracker = exports.RecommendationType = exports.InsightType = exports.PatternType = exports.DeviceType = exports.BehaviorAction = void 0;
const logger_1 = require("../../utils/logger");
var BehaviorAction;
(function (BehaviorAction) {
    BehaviorAction["SEARCH"] = "search";
    BehaviorAction["CLICK"] = "click";
    BehaviorAction["VIEW"] = "view";
    BehaviorAction["EDIT"] = "edit";
    BehaviorAction["CREATE"] = "create";
    BehaviorAction["DELETE"] = "delete";
    BehaviorAction["SHARE"] = "share";
    BehaviorAction["LIKE"] = "like";
    BehaviorAction["DISLIKE"] = "dislike";
    BehaviorAction["BOOKMARK"] = "bookmark";
    BehaviorAction["COMMENT"] = "comment";
    BehaviorAction["NAVIGATE"] = "navigate";
    BehaviorAction["DOWNLOAD"] = "download";
    BehaviorAction["UPLOAD"] = "upload";
    BehaviorAction["COLLABORATE"] = "collaborate";
    BehaviorAction["AI_QUERY"] = "ai_query";
    BehaviorAction["MODEL_SWITCH"] = "model_switch";
    BehaviorAction["WORKSPACE_JOIN"] = "workspace_join";
    BehaviorAction["KNOWLEDGE_ADD"] = "knowledge_add";
})(BehaviorAction || (exports.BehaviorAction = BehaviorAction = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["TABLET"] = "tablet";
    DeviceType["MOBILE"] = "mobile";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var PatternType;
(function (PatternType) {
    PatternType["SEQUENTIAL"] = "sequential";
    PatternType["FREQUENT"] = "frequent";
    PatternType["CONTEXTUAL"] = "contextual";
    PatternType["TEMPORAL"] = "temporal";
    PatternType["COLLABORATIVE"] = "collaborative";
    PatternType["GOAL_ORIENTED"] = "goal_oriented"; // Actions leading to specific outcomes
})(PatternType || (exports.PatternType = PatternType = {}));
var InsightType;
(function (InsightType) {
    InsightType["PREFERENCE"] = "preference";
    InsightType["SKILL_LEVEL"] = "skill_level";
    InsightType["WORKFLOW"] = "workflow";
    InsightType["COLLABORATION_STYLE"] = "collaboration_style";
    InsightType["CONTENT_INTEREST"] = "content_interest";
    InsightType["PRODUCTIVITY_PATTERN"] = "productivity_pattern";
    InsightType["LEARNING_STYLE"] = "learning_style";
})(InsightType || (exports.InsightType = InsightType = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["FEATURE"] = "feature";
    RecommendationType["CONTENT"] = "content";
    RecommendationType["WORKFLOW"] = "workflow";
    RecommendationType["COLLABORATION"] = "collaboration";
    RecommendationType["LEARNING"] = "learning";
    RecommendationType["OPTIMIZATION"] = "optimization";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
class BehaviorTracker {
    redis;
    BEHAVIOR_STREAM = 'user_behavior';
    PATTERN_PREFIX = 'behavior_pattern';
    INSIGHT_PREFIX = 'behavior_insight';
    SESSION_PREFIX = 'user_session';
    ANALYTICS_PREFIX = 'behavior_analytics';
    constructor(redis) {
        this.redis = redis;
    }
    async trackBehavior(behavior) {
        const behaviorRecord = {
            ...behavior,
            id: this.generateBehaviorId(),
            timestamp: new Date()
        };
        // Store in Redis Stream for real-time processing
        await this.redis.xadd(`${this.BEHAVIOR_STREAM}:${behavior.userId}`, '*', 'data', JSON.stringify(behaviorRecord));
        // Update session information
        await this.updateSession(behavior.userId, behavior.sessionId, behaviorRecord);
        // Trigger pattern analysis (async)
        this.analyzePatterns(behavior.userId).catch(error => logger_1.logger.error(`Pattern analysis failed: ${error.message}`));
        logger_1.logger.debug(`Tracked behavior: ${behavior.action} for user ${behavior.userId}`);
    }
    async getBehaviorHistory(userId, limit = 100, startTime, endTime) {
        const streamKey = `${this.BEHAVIOR_STREAM}:${userId}`;
        let start = '-';
        let end = '+';
        if (startTime) {
            start = `${startTime.getTime()}-0`;
        }
        if (endTime) {
            end = `${endTime.getTime()}-0`;
        }
        const results = await this.redis.xrevrange(streamKey, end, start, 'COUNT', limit);
        return results.map(([id, fields]) => {
            const data = fields[1]; // fields is ['data', jsonString]
            return JSON.parse(data);
        });
    }
    async analyzePatterns(userId) {
        // Get recent behavior history
        const behaviors = await this.getBehaviorHistory(userId, 1000);
        if (behaviors.length < 10) {
            return []; // Need minimum data for pattern analysis
        }
        const patterns = [];
        // Analyze sequential patterns
        const sequentialPatterns = this.findSequentialPatterns(behaviors);
        patterns.push(...sequentialPatterns);
        // Analyze frequent patterns
        const frequentPatterns = this.findFrequentPatterns(behaviors);
        patterns.push(...frequentPatterns);
        // Analyze contextual patterns
        const contextualPatterns = this.findContextualPatterns(behaviors);
        patterns.push(...contextualPatterns);
        // Analyze temporal patterns
        const temporalPatterns = this.findTemporalPatterns(behaviors);
        patterns.push(...temporalPatterns);
        // Store patterns
        for (const pattern of patterns) {
            await this.storePattern(userId, pattern);
        }
        logger_1.logger.info(`Analyzed ${patterns.length} behavior patterns for user ${userId}`);
        return patterns;
    }
    async generateInsights(userId) {
        const patterns = await this.getStoredPatterns(userId);
        const behaviors = await this.getBehaviorHistory(userId, 500);
        const insights = [];
        // Generate preference insights
        const preferenceInsights = this.generatePreferenceInsights(userId, behaviors, patterns);
        insights.push(...preferenceInsights);
        // Generate workflow insights
        const workflowInsights = this.generateWorkflowInsights(userId, behaviors, patterns);
        insights.push(...workflowInsights);
        // Generate collaboration insights
        const collaborationInsights = this.generateCollaborationInsights(userId, behaviors, patterns);
        insights.push(...collaborationInsights);
        // Generate productivity insights
        const productivityInsights = this.generateProductivityInsights(userId, behaviors, patterns);
        insights.push(...productivityInsights);
        // Store insights
        for (const insight of insights) {
            await this.storeInsight(userId, insight);
        }
        logger_1.logger.info(`Generated ${insights.length} behavior insights for user ${userId}`);
        return insights;
    }
    async getInsights(userId, insightType) {
        const pattern = insightType
            ? `${this.INSIGHT_PREFIX}:${userId}:${insightType}:*`
            : `${this.INSIGHT_PREFIX}:${userId}:*`;
        const keys = await this.redis.keys(pattern);
        const insights = [];
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                const insight = JSON.parse(data);
                // Check if insight is still valid
                if (!insight.validUntil || new Date() < new Date(insight.validUntil)) {
                    insights.push(insight);
                }
            }
        }
        return insights.sort((a, b) => b.confidence - a.confidence);
    }
    async getSessionAnalytics(userId, sessionId) {
        const sessionKey = `${this.SESSION_PREFIX}:${userId}:${sessionId}`;
        const sessionData = await this.redis.hgetall(sessionKey);
        if (!sessionData.startTime) {
            throw new Error(`Session ${sessionId} not found for user ${userId}`);
        }
        const behaviors = await this.getBehaviorHistory(userId, 1000, new Date(sessionData.startTime), sessionData.endTime ? new Date(sessionData.endTime) : undefined);
        return this.calculateSessionAnalytics(sessionId, behaviors, sessionData);
    }
    async updateSession(userId, sessionId, behavior) {
        const sessionKey = `${this.SESSION_PREFIX}:${userId}:${sessionId}`;
        const now = new Date().toISOString();
        // Update session data
        await this.redis.hmset(sessionKey, 'lastActivity', now, 'actionCount', await this.redis.hincrby(sessionKey, 'actionCount', 1));
        // Set start time if this is the first action
        const startTime = await this.redis.hget(sessionKey, 'startTime');
        if (!startTime) {
            await this.redis.hset(sessionKey, 'startTime', now);
        }
        // Set TTL for session (24 hours)
        await this.redis.expire(sessionKey, 86400);
    }
    findSequentialPatterns(behaviors) {
        const patterns = [];
        const sequences = new Map();
        // Look for sequences of 2-5 actions
        for (let seqLength = 2; seqLength <= 5; seqLength++) {
            for (let i = 0; i <= behaviors.length - seqLength; i++) {
                const sequence = behaviors.slice(i, i + seqLength)
                    .map(b => b.action)
                    .join('->');
                sequences.set(sequence, (sequences.get(sequence) || 0) + 1);
            }
        }
        // Convert frequent sequences to patterns
        for (const [sequence, frequency] of sequences) {
            if (frequency >= 3) { // Minimum frequency threshold
                const actions = sequence.split('->');
                patterns.push({
                    id: this.generatePatternId(),
                    userId: behaviors[0]?.userId || '',
                    patternType: PatternType.SEQUENTIAL,
                    actions,
                    frequency,
                    confidence: Math.min(frequency / 10, 1), // Normalize confidence
                    lastSeen: new Date(),
                    contexts: [],
                    outcomes: []
                });
            }
        }
        return patterns;
    }
    findFrequentPatterns(behaviors) {
        const actionCounts = new Map();
        behaviors.forEach(behavior => {
            actionCounts.set(behavior.action, (actionCounts.get(behavior.action) || 0) + 1);
        });
        const patterns = [];
        const totalBehaviors = behaviors.length;
        for (const [action, count] of actionCounts) {
            const frequency = count / totalBehaviors;
            if (frequency > 0.1) { // Actions that occur more than 10% of the time
                patterns.push({
                    id: this.generatePatternId(),
                    userId: behaviors[0]?.userId || '',
                    patternType: PatternType.FREQUENT,
                    actions: [action],
                    frequency: count,
                    confidence: frequency,
                    lastSeen: new Date(),
                    contexts: [],
                    outcomes: []
                });
            }
        }
        return patterns;
    }
    findContextualPatterns(behaviors) {
        const contextPatterns = new Map();
        behaviors.forEach(behavior => {
            if (behavior.context.workspaceId || behavior.context.contentType) {
                const contextKey = `${behavior.context.workspaceId || 'global'}_${behavior.context.contentType || 'any'}`;
                if (!contextPatterns.has(contextKey)) {
                    contextPatterns.set(contextKey, { actions: [], count: 0, contexts: [] });
                }
                const pattern = contextPatterns.get(contextKey);
                pattern.actions.push(behavior.action);
                pattern.count++;
                pattern.contexts.push(behavior.context);
            }
        });
        const patterns = [];
        for (const [contextKey, data] of contextPatterns) {
            if (data.count >= 5) { // Minimum occurrences in context
                patterns.push({
                    id: this.generatePatternId(),
                    userId: behaviors[0]?.userId || '',
                    patternType: PatternType.CONTEXTUAL,
                    actions: [...new Set(data.actions)], // Unique actions
                    frequency: data.count,
                    confidence: Math.min(data.count / 20, 1),
                    lastSeen: new Date(),
                    contexts: data.contexts.slice(0, 5), // Sample contexts
                    outcomes: []
                });
            }
        }
        return patterns;
    }
    findTemporalPatterns(behaviors) {
        const hourlyPatterns = new Map();
        const dayPatterns = new Map();
        behaviors.forEach(behavior => {
            const hour = behavior.timestamp.getHours();
            const day = behavior.timestamp.getDay();
            if (!hourlyPatterns.has(hour))
                hourlyPatterns.set(hour, []);
            if (!dayPatterns.has(day))
                dayPatterns.set(day, []);
            hourlyPatterns.get(hour).push(behavior.action);
            dayPatterns.get(day).push(behavior.action);
        });
        const patterns = [];
        // Analyze hourly patterns
        for (const [hour, actions] of hourlyPatterns) {
            if (actions.length >= 10) {
                const uniqueActions = [...new Set(actions)];
                patterns.push({
                    id: this.generatePatternId(),
                    userId: behaviors[0]?.userId || '',
                    patternType: PatternType.TEMPORAL,
                    actions: uniqueActions,
                    frequency: actions.length,
                    confidence: Math.min(actions.length / 50, 1),
                    lastSeen: new Date(),
                    contexts: [{ page: `hour_${hour}` }],
                    outcomes: []
                });
            }
        }
        return patterns;
    }
    generatePreferenceInsights(userId, behaviors, patterns) {
        const insights = [];
        // Analyze content type preferences
        const contentTypes = new Map();
        behaviors.forEach(b => {
            if (b.context.contentType) {
                contentTypes.set(b.context.contentType, (contentTypes.get(b.context.contentType) || 0) + 1);
            }
        });
        const topContentType = [...contentTypes.entries()]
            .sort((a, b) => b[1] - a[1])[0];
        if (topContentType && topContentType[1] > 10) {
            insights.push({
                id: this.generateInsightId(),
                userId,
                insightType: InsightType.PREFERENCE,
                description: `User shows strong preference for ${topContentType[0]} content (${topContentType[1]} interactions)`,
                confidence: Math.min(topContentType[1] / 50, 1),
                actionable: true,
                recommendations: [{
                        type: RecommendationType.CONTENT,
                        title: `More ${topContentType[0]} Content`,
                        description: `Recommend more ${topContentType[0]} content based on usage patterns`,
                        priority: 8,
                        expectedImpact: 0.7
                    }],
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        }
        return insights;
    }
    generateWorkflowInsights(userId, behaviors, patterns) {
        const insights = [];
        // Find sequential patterns that indicate workflows
        const workflowPatterns = patterns.filter(p => p.patternType === PatternType.SEQUENTIAL && p.actions.length >= 3);
        workflowPatterns.forEach(pattern => {
            insights.push({
                id: this.generateInsightId(),
                userId,
                insightType: InsightType.WORKFLOW,
                description: `User follows consistent workflow: ${pattern.actions.join(' → ')}`,
                confidence: pattern.confidence,
                actionable: true,
                recommendations: [{
                        type: RecommendationType.WORKFLOW,
                        title: 'Workflow Automation',
                        description: `Create shortcuts for the workflow: ${pattern.actions.join(' → ')}`,
                        priority: 7,
                        expectedImpact: 0.6
                    }],
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            });
        });
        return insights;
    }
    generateCollaborationInsights(userId, behaviors, patterns) {
        const insights = [];
        // Analyze collaboration patterns
        const collaborationActions = behaviors.filter(b => b.action === BehaviorAction.COLLABORATE ||
            b.action === BehaviorAction.WORKSPACE_JOIN ||
            b.action === BehaviorAction.SHARE ||
            b.context.collaborators && b.context.collaborators.length > 0);
        if (collaborationActions.length > 20) {
            const avgCollaborators = collaborationActions
                .filter(b => b.context.collaborators)
                .reduce((sum, b) => sum + (b.context.collaborators?.length || 0), 0) / collaborationActions.length;
            insights.push({
                id: this.generateInsightId(),
                userId,
                insightType: InsightType.COLLABORATION_STYLE,
                description: `User is highly collaborative (${collaborationActions.length} collaborative actions, avg ${avgCollaborators.toFixed(1)} collaborators)`,
                confidence: Math.min(collaborationActions.length / 100, 1),
                actionable: true,
                recommendations: [{
                        type: RecommendationType.COLLABORATION,
                        title: 'Enhanced Collaboration Tools',
                        description: 'Provide advanced collaboration features and team workspace suggestions',
                        priority: 8,
                        expectedImpact: 0.8
                    }],
                generatedAt: new Date(),
                validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }
        return insights;
    }
    generateProductivityInsights(userId, behaviors, patterns) {
        const insights = [];
        // Analyze productivity patterns based on time and action efficiency
        const temporalPatterns = patterns.filter(p => p.patternType === PatternType.TEMPORAL);
        temporalPatterns.forEach(pattern => {
            const hourContext = pattern.contexts.find(c => c.page?.startsWith('hour_'));
            if (hourContext) {
                const hour = parseInt(hourContext.page.split('_')[1]);
                const isProductiveHour = pattern.frequency > 20; // High activity threshold
                if (isProductiveHour) {
                    insights.push({
                        id: this.generateInsightId(),
                        userId,
                        insightType: InsightType.PRODUCTIVITY_PATTERN,
                        description: `User is most productive at ${hour}:00 (${pattern.frequency} actions)`,
                        confidence: pattern.confidence,
                        actionable: true,
                        recommendations: [{
                                type: RecommendationType.OPTIMIZATION,
                                title: 'Peak Productivity Scheduling',
                                description: `Schedule important tasks around ${hour}:00 when you're most active`,
                                priority: 6,
                                expectedImpact: 0.5
                            }],
                        generatedAt: new Date(),
                        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
                    });
                }
            }
        });
        return insights;
    }
    async storePattern(userId, pattern) {
        const patternKey = `${this.PATTERN_PREFIX}:${userId}:${pattern.id}`;
        await this.redis.setex(patternKey, 2592000, JSON.stringify(pattern)); // 30 days TTL
    }
    async getStoredPatterns(userId) {
        const keys = await this.redis.keys(`${this.PATTERN_PREFIX}:${userId}:*`);
        const patterns = [];
        for (const key of keys) {
            const data = await this.redis.get(key);
            if (data) {
                patterns.push(JSON.parse(data));
            }
        }
        return patterns;
    }
    async storeInsight(userId, insight) {
        const insightKey = `${this.INSIGHT_PREFIX}:${userId}:${insight.insightType}:${insight.id}`;
        const ttl = insight.validUntil
            ? Math.floor((new Date(insight.validUntil).getTime() - Date.now()) / 1000)
            : 2592000; // 30 days default
        await this.redis.setex(insightKey, ttl, JSON.stringify(insight));
    }
    calculateSessionAnalytics(sessionId, behaviors, sessionData) {
        const startTime = new Date(sessionData.startTime);
        const endTime = sessionData.endTime ? new Date(sessionData.endTime) : new Date();
        const duration = endTime.getTime() - startTime.getTime();
        const actionCounts = new Map();
        behaviors.forEach(b => {
            actionCounts.set(b.action, (actionCounts.get(b.action) || 0) + 1);
        });
        return {
            sessionId,
            userId: behaviors[0]?.userId || '',
            startTime,
            endTime: sessionData.endTime ? endTime : undefined,
            duration,
            totalActions: behaviors.length,
            uniqueActions: actionCounts.size,
            actionBreakdown: Object.fromEntries(actionCounts),
            averageActionInterval: behaviors.length > 1 ? duration / (behaviors.length - 1) : 0,
            mostFrequentAction: [...actionCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0],
            engagementScore: this.calculateEngagementScore(behaviors, duration)
        };
    }
    calculateEngagementScore(behaviors, duration) {
        // Simple engagement score based on actions per minute and action diversity
        const actionsPerMinute = behaviors.length / (duration / 60000);
        const uniqueActions = new Set(behaviors.map(b => b.action)).size;
        const diversityScore = uniqueActions / Object.keys(BehaviorAction).length;
        return Math.min((actionsPerMinute * 0.7 + diversityScore * 0.3) * 10, 10);
    }
    generateBehaviorId() {
        return `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generatePatternId() {
        return `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateInsightId() {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.BehaviorTracker = BehaviorTracker;
a;
sync;
getUserBehaviorSummary(userId, string, timeRange ?  : TimeRange);
Promise < BehaviorSummary > {
    const: range = timeRange || { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() },
    // Get behavior events from Redis Streams
    const: streamKey = `${this.BEHAVIOR_STREAM_PREFIX}:${userId}`,
    const: events = await this.redis.xrange(streamKey, this.dateToStreamId(range.start), this.dateToStreamId(range.end)),
    const: behaviors, UserBehavior, []:  = events.map(([id, fields]) => {
        const fieldsObj = {};
        for (let i = 0; i < fields.length; i += 2) {
            fieldsObj[fields[i]] = fields[i + 1];
        }
        return {
            userId,
            sessionId: fieldsObj.sessionId,
            action: fieldsObj.action,
            context: JSON.parse(fieldsObj.context || '{}'),
            timestamp: this.streamIdToDate(id),
            metadata: JSON.parse(fieldsObj.metadata || '{}')
        };
    }),
    return: this.generateBehaviorSummary(behaviors)
};
async;
getUserPreferences(userId, string);
Promise < UserPreferences > {
    const: preferencesKey = `${this.USER_PREFERENCES_PREFIX}:${userId}`,
    const: preferencesData = await this.redis.hgetall(preferencesKey),
    if(Object) { }, : .keys(preferencesData).length === 0
};
{
    // Return default preferences
    return {
        contentTypes: {},
        interactionStyles: {},
        responseFormats: {},
        topics: {},
        learningRate: 0.1,
        privacyLevel: PrivacyLevel.MEDIUM,
        lastUpdated: new Date()
    };
}
return {
    contentTypes: JSON.parse(preferencesData.contentTypes || '{}'),
    interactionStyles: JSON.parse(preferencesData.interactionStyles || '{}'),
    responseFormats: JSON.parse(preferencesData.responseFormats || '{}'),
    topics: JSON.parse(preferencesData.topics || '{}'),
    learningRate: parseFloat(preferencesData.learningRate || '0.1'),
    privacyLevel: preferencesData.privacyLevel || PrivacyLevel.MEDIUM,
    lastUpdated: new Date(preferencesData.lastUpdated)
};
async;
updateUserPreferences(userId, string, preferences, (Partial));
Promise < void  > {
    const: preferencesKey = `${this.USER_PREFERENCES_PREFIX}:${userId}`,
    const: currentPreferences = await this.getUserPreferences(userId),
    const: updatedPreferences = {
        ...currentPreferences,
        ...preferences,
        lastUpdated: new Date()
    },
    await, this: .redis.hset(preferencesKey, 'contentTypes', JSON.stringify(updatedPreferences.contentTypes), 'interactionStyles', JSON.stringify(updatedPreferences.interactionStyles), 'responseFormats', JSON.stringify(updatedPreferences.responseFormats), 'topics', JSON.stringify(updatedPreferences.topics), 'learningRate', updatedPreferences.learningRate.toString(), 'privacyLevel', updatedPreferences.privacyLevel, 'lastUpdated', updatedPreferences.lastUpdated.toISOString()),
    // Publish preference update event
    await, this: .redis.publish(`preferences:${userId}`, JSON.stringify({
        type: 'preferences_updated',
        userId,
        preferences: updatedPreferences,
        timestamp: new Date()
    })),
    logger: logger_1.logger, : .info(`Updated preferences for user ${userId}`)
};
async;
getBehaviorPatterns(userId, string, limit, number = 10);
Promise < BehaviorPattern[] > {
    const: patternsKey = `${this.BEHAVIOR_PATTERNS_PREFIX}:${userId}`,
    const: patternIds = await this.redis.zrevrange(patternsKey, 0, limit - 1),
    const: patterns, BehaviorPattern, []:  = [],
    for(, patternId, of, patternIds) {
        const patternData = await this.redis.hget(`pattern:${patternId}`, 'data');
        if (patternData) {
            patterns.push(JSON.parse(patternData));
        }
    },
    return: patterns
};
async;
recordFeedback(userId, string, feedback, UserFeedback);
Promise < void  > {
    const: feedbackKey = `${this.FEEDBACK_PREFIX}:${userId}`,
    const: feedbackId = this.generateFeedbackId(),
    const: feedbackData = {
        ...feedback,
        id: feedbackId,
        timestamp: new Date()
    },
    // Store feedback in Redis Stream
    await, this: .redis.xadd(feedbackKey, '*', 'id', feedbackId, 'type', feedback.type, 'rating', feedback.rating.toString(), 'comment', feedback.comment || '', 'context', JSON.stringify(feedback.context || {}), 'timestamp', feedbackData.timestamp.toISOString()),
    // Update user preferences based on feedback
    await, this: .processFeedbackForPreferences(userId, feedbackData),
    logger: logger_1.logger, : .info(`Recorded feedback ${feedbackId} for user ${userId}`)
};
async;
getRecentFeedback(userId, string, limit, number = 50);
Promise < UserFeedback[] > {
    const: feedbackKey = `${this.FEEDBACK_PREFIX}:${userId}`,
    const: feedbackEntries = await this.redis.xrevrange(feedbackKey, '+', '-', 'COUNT', limit),
    return: feedbackEntries.map(([id, fields]) => {
        const fieldsObj = {};
        for (let i = 0; i < fields.length; i += 2) {
            fieldsObj[fields[i]] = fields[i + 1];
        }
        return {
            id: fieldsObj.id,
            type: fieldsObj.type,
            rating: parseInt(fieldsObj.rating),
            comment: fieldsObj.comment,
            context: JSON.parse(fieldsObj.context || '{}'),
            timestamp: new Date(fieldsObj.timestamp)
        };
    })
};
async;
generateBehaviorSummary(behaviors, UserBehavior[]);
Promise < BehaviorSummary > {
    const: actionCounts
};
{ }
;
const contextCounts = {};
const sessionCounts = {};
let totalDuration = 0;
const sessions = new Set();
for (const behavior of behaviors) {
    // Count actions
    actionCounts[behavior.action] = (actionCounts[behavior.action] || 0) + 1;
    // Count contexts
    if (behavior.context.page) {
        contextCounts[behavior.context.page] = (contextCounts[behavior.context.page] || 0) + 1;
    }
    // Track sessions
    sessions.add(behavior.sessionId);
    sessionCounts[behavior.sessionId] = (sessionCounts[behavior.sessionId] || 0) + 1;
    // Add duration if available
    if (behavior.metadata.duration) {
        totalDuration += behavior.metadata.duration;
    }
}
return {
    totalEvents: behaviors.length,
    uniqueSessions: sessions.size,
    averageSessionLength: sessions.size > 0 ? behaviors.length / sessions.size : 0,
    totalDuration,
    mostCommonActions: Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([action, count]) => ({ action, count })),
    mostVisitedPages: Object.entries(contextCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([page, count]) => ({ page, count })),
    timeRange: {
        start: behaviors.length > 0 ? behaviors[behaviors.length - 1].timestamp : new Date(),
        end: behaviors.length > 0 ? behaviors[0].timestamp : new Date()
    }
};
async;
processFeedbackForPreferences(userId, string, feedback, UserFeedback);
Promise < void  > {
    const: preferences = await this.getUserPreferences(userId),
    // Adjust preferences based on feedback
    if(feedback) { }, : .context?.contentType
};
{
    const contentType = feedback.context.contentType;
    const currentScore = preferences.contentTypes[contentType] || 0.5;
    // Update score based on rating (1-5 scale)
    const adjustment = (feedback.rating - 3) * 0.1; // -0.2 to +0.2
    preferences.contentTypes[contentType] = Math.max(0, Math.min(1, currentScore + adjustment));
}
if (feedback.context?.responseFormat) {
    const format = feedback.context.responseFormat;
    const currentScore = preferences.responseFormats[format] || 0.5;
    const adjustment = (feedback.rating - 3) * 0.1;
    preferences.responseFormats[format] = Math.max(0, Math.min(1, currentScore + adjustment));
}
await this.updateUserPreferences(userId, preferences);
dateToStreamId(date, Date);
string;
{
    return `${date.getTime()}-0`;
}
streamIdToDate(streamId, string);
Date;
{
    const timestamp = streamId.split('-')[0];
    return new Date(parseInt(timestamp));
}
generateBehaviorId();
string;
{
    return `behavior_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
generateFeedbackId();
string;
{
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
//# sourceMappingURL=behavior-tracker.js.map