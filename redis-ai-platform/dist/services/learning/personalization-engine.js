"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PersonalizationEngine = exports.RecommendationCategory = exports.RecommendationType = void 0;
const logger_1 = require("../../utils/logger");
const behavior_tracker_1 = require("./behavior-tracker");
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["CONTENT_SUGGESTION"] = "content_suggestion";
    RecommendationType["FEATURE_RECOMMENDATION"] = "feature_recommendation";
    RecommendationType["WORKFLOW_OPTIMIZATION"] = "workflow_optimization";
    RecommendationType["COLLABORATION_SUGGESTION"] = "collaboration_suggestion";
    RecommendationType["LEARNING_PATH"] = "learning_path";
    RecommendationType["UI_CUSTOMIZATION"] = "ui_customization";
    RecommendationType["PRODUCTIVITY_TIP"] = "productivity_tip";
    RecommendationType["SKILL_DEVELOPMENT"] = "skill_development";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationCategory;
(function (RecommendationCategory) {
    RecommendationCategory["IMMEDIATE"] = "immediate";
    RecommendationCategory["SHORT_TERM"] = "short_term";
    RecommendationCategory["LONG_TERM"] = "long_term";
    RecommendationCategory["EXPERIMENTAL"] = "experimental";
})(RecommendationCategory || (exports.RecommendationCategory = RecommendationCategory = {}));
class PersonalizationEngine {
    redis;
    embeddingManager;
    behaviorTracker;
    PROFILE_PREFIX = 'user_profile';
    RECOMMENDATION_PREFIX = 'recommendation';
    SIMILARITY_PREFIX = 'user_similarity';
    FEATURE_STORE_PREFIX = 'feature_store';
    constructor(redis, embeddingManager, behaviorTracker) {
        this.redis = redis;
        this.embeddingManager = embeddingManager;
        this.behaviorTracker = behaviorTracker;
    }
    async createUserProfile(userId) {
        const profile = {
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: this.getDefaultPreferences(),
            skills: this.getDefaultSkillProfile(),
            interests: this.getDefaultInterestProfile(),
            collaborationStyle: this.getDefaultCollaborationStyle(),
            workingPatterns: this.getDefaultWorkingPatterns(),
            personalityTraits: this.getDefaultPersonalityTraits(),
            learningStyle: this.getDefaultLearningStyle(),
            contextualPreferences: this.getDefaultContextualPreferences()
        };
        await this.saveUserProfile(profile);
        logger_1.logger.info(`Created user profile for ${userId}`);
        return profile;
    }
    async getUserProfile(userId) {
        const profileKey = `${this.PROFILE_PREFIX}:${userId}`;
        const data = await this.redis.get(profileKey);
        if (!data) {
            return null;
        }
        return JSON.parse(data);
    }
    async updateUserProfile(userId, updates) {
        let profile = await this.getUserProfile(userId);
        if (!profile) {
            profile = await this.createUserProfile(userId);
        }
        const updatedProfile = {
            ...profile,
            ...updates,
            updatedAt: new Date()
        };
        await this.saveUserProfile(updatedProfile);
        // Update feature store for ML models
        await this.updateFeatureStore(userId, updatedProfile);
        logger_1.logger.info(`Updated user profile for ${userId}`);
        return updatedProfile;
    }
    async analyzeUserBehavior(userId) {
        const behaviors = await this.behaviorTracker.getBehaviorHistory(userId, 1000);
        const insights = await this.behaviorTracker.getInsights(userId);
        let profile = await this.getUserProfile(userId);
        if (!profile) {
            profile = await this.createUserProfile(userId);
        }
        // Update preferences based on behavior
        profile.preferences = await this.updatePreferencesFromBehavior(profile.preferences, behaviors);
        // Update skills based on behavior patterns
        profile.skills = await this.updateSkillsFromBehavior(profile.skills, behaviors, insights);
        // Update interests based on content interaction
        profile.interests = await this.updateInterestsFromBehavior(profile.interests, behaviors);
        // Update collaboration style
        profile.collaborationStyle = await this.updateCollaborationStyleFromBehavior(profile.collaborationStyle, behaviors);
        // Update working patterns
        profile.workingPatterns = await this.updateWorkingPatternsFromBehavior(profile.workingPatterns, behaviors);
        // Update personality traits (gradual changes)
        profile.personalityTraits = await this.updatePersonalityTraitsFromBehavior(profile.personalityTraits, behaviors, insights);
        profile.updatedAt = new Date();
        await this.saveUserProfile(profile);
        logger_1.logger.info(`Analyzed and updated user profile for ${userId} based on ${behaviors.length} behaviors`);
        return profile;
    }
    async generateRecommendations(userId, context) {
        const profile = await this.getUserProfile(userId);
        if (!profile) {
            return [];
        }
        const insights = await this.behaviorTracker.getInsights(userId);
        const recommendations = [];
        // Generate content recommendations
        const contentRecs = await this.generateContentRecommendations(userId, profile, context);
        recommendations.push(...contentRecs);
        // Generate feature recommendations
        const featureRecs = await this.generateFeatureRecommendations(userId, profile, insights);
        recommendations.push(...featureRecs);
        // Generate workflow optimizations
        const workflowRecs = await this.generateWorkflowRecommendations(userId, profile, insights);
        recommendations.push(...workflowRecs);
        // Generate collaboration suggestions
        const collabRecs = await this.generateCollaborationRecommendations(userId, profile, context);
        recommendations.push(...collabRecs);
        // Generate learning path recommendations
        const learningRecs = await this.generateLearningRecommendations(userId, profile);
        recommendations.push(...learningRecs);
        // Sort by priority and confidence
        recommendations.sort((a, b) => (b.priority * b.confidence) - (a.priority * a.confidence));
        // Store recommendations
        for (const rec of recommendations.slice(0, 20)) { // Limit to top 20
            await this.storeRecommendation(rec);
        }
        logger_1.logger.info(`Generated ${recommendations.length} recommendations for user ${userId}`);
        return recommendations;
    }
    async findSimilarUsers(userId, limit = 10) {
        const profile = await this.getUserProfile(userId);
        if (!profile) {
            return [];
        }
        // Generate user embedding based on profile
        const userEmbedding = await this.generateUserEmbedding(profile);
        // Search for similar users using vector similarity
        const indexName = 'user_similarity_index';
        try {
            const results = await this.redis.call('FT.SEARCH', indexName, `*=>[KNN ${limit} @embedding $user_vec AS score]`, 'PARAMS', '2', 'user_vec', Buffer.from(new Float32Array(userEmbedding).buffer), 'SORTBY', 'score', 'RETURN', '3', 'userId', 'profile', 'score', 'DIALECT', '2');
            const similarUsers = [];
            for (let i = 1; i < results.length; i += 2) {
                const fields = results[i + 1];
                const fieldsObj = {};
                for (let j = 0; j < fields.length; j += 2) {
                    fieldsObj[fields[j]] = fields[j + 1];
                }
                if (fieldsObj.userId !== userId) { // Exclude self
                    similarUsers.push({
                        userId: fieldsObj.userId,
                        similarity: 1 - parseFloat(fieldsObj.score), // Convert distance to similarity
                        profile: JSON.parse(fieldsObj.profile),
                        sharedInterests: this.findSharedInterests(profile, JSON.parse(fieldsObj.profile)),
                        collaborationPotential: this.calculateCollaborationPotential(profile, JSON.parse(fieldsObj.profile))
                    });
                }
            }
            return similarUsers;
        }
        catch (error) {
            logger_1.logger.error(`Similar user search failed: ${error.message}`);
            return [];
        }
    }
    async applyRecommendation(userId, recommendationId, feedback) {
        const recKey = `${this.RECOMMENDATION_PREFIX}:${userId}:${recommendationId}`;
        const recData = await this.redis.get(recKey);
        if (!recData) {
            throw new Error(`Recommendation ${recommendationId} not found`);
        }
        const recommendation = JSON.parse(recData);
        recommendation.applied = true;
        recommendation.feedback = feedback;
        await this.redis.setex(recKey, 2592000, JSON.stringify(recommendation)); // 30 days TTL
        // Update user profile based on feedback
        if (feedback.applied && feedback.helpful) {
            await this.reinforceLearning(userId, recommendation, feedback);
        }
        logger_1.logger.info(`Applied recommendation ${recommendationId} for user ${userId} with rating ${feedback.rating}`);
    }
    async updatePreferencesFromBehavior(preferences, behaviors) {
        // Update content type preferences
        const contentTypeCounts = new Map();
        behaviors.forEach(b => {
            if (b.context.contentType) {
                contentTypeCounts.set(b.context.contentType, (contentTypeCounts.get(b.context.contentType) || 0) + 1);
            }
        });
        const totalContentInteractions = Array.from(contentTypeCounts.values()).reduce((sum, count) => sum + count, 0);
        preferences.contentTypes = Array.from(contentTypeCounts.entries()).map(([type, count]) => ({
            type,
            weight: count / totalContentInteractions,
            lastUpdated: new Date(),
            confidence: Math.min(count / 50, 1) // Higher confidence with more interactions
        }));
        return preferences;
    }
    async updateSkillsFromBehavior(skills, behaviors, insights) {
        // Analyze technical skills from behavior patterns
        const skillIndicators = new Map();
        behaviors.forEach(behavior => {
            if (behavior.context.contentType === 'code') {
                skillIndicators.set('programming', (skillIndicators.get('programming') || 0) + 1);
            }
            if (behavior.action === 'ai_query') {
                skillIndicators.set('ai_interaction', (skillIndicators.get('ai_interaction') || 0) + 1);
            }
            if (behavior.action === 'collaborate') {
                skillIndicators.set('collaboration', (skillIndicators.get('collaboration') || 0) + 1);
            }
        });
        // Update existing skills or add new ones
        skillIndicators.forEach((count, skillName) => {
            const existingSkill = skills.technicalSkills.find(s => s.name === skillName);
            const level = Math.min(count / 100, 1); // Normalize to 0-1 scale
            if (existingSkill) {
                existingSkill.level = Math.max(existingSkill.level, level);
                existingSkill.evidenceCount += count;
                existingSkill.lastAssessed = new Date();
                existingSkill.confidence = Math.min(existingSkill.evidenceCount / 50, 1);
            }
            else {
                skills.technicalSkills.push({
                    name: skillName,
                    level,
                    confidence: Math.min(count / 50, 1),
                    lastAssessed: new Date(),
                    evidenceCount: count
                });
            }
        });
        return skills;
    }
    async updateInterestsFromBehavior(interests, behaviors) {
        const topicCounts = new Map();
        behaviors.forEach(behavior => {
            if (behavior.metadata?.tags) {
                behavior.metadata.tags.forEach(tag => {
                    const current = topicCounts.get(tag) || { count: 0, lastSeen: new Date(0) };
                    topicCounts.set(tag, {
                        count: current.count + 1,
                        lastSeen: behavior.timestamp > current.lastSeen ? behavior.timestamp : current.lastSeen
                    });
                });
            }
        });
        const totalInteractions = Array.from(topicCounts.values()).reduce((sum, data) => sum + data.count, 0);
        interests.topics = Array.from(topicCounts.entries()).map(([topic, data]) => ({
            topic,
            weight: data.count / totalInteractions,
            trend: 'stable', // Would need historical data for trend analysis
            lastEngagement: data.lastSeen,
            engagementCount: data.count
        }));
        // Calculate diversity score
        interests.diversityScore = interests.topics.length / Math.max(totalInteractions / 10, 1);
        return interests;
    }
    async updateCollaborationStyleFromBehavior(style, behaviors) {
        const collaborationBehaviors = behaviors.filter(b => b.action === 'collaborate' ||
            b.action === 'share' ||
            b.context.collaborators && b.context.collaborators.length > 0);
        if (collaborationBehaviors.length > 10) {
            const avgTeamSize = collaborationBehaviors
                .filter(b => b.context.collaborators)
                .reduce((sum, b) => sum + (b.context.collaborators?.length || 0), 0) / collaborationBehaviors.length;
            style.preferredTeamSize = Math.round(avgTeamSize);
            // Analyze communication patterns (simplified)
            const shareActions = behaviors.filter(b => b.action === 'share').length;
            const totalActions = behaviors.length;
            if (shareActions / totalActions > 0.1) {
                style.communicationStyle = 'supportive';
            }
            else if (shareActions / totalActions > 0.05) {
                style.communicationStyle = 'diplomatic';
            }
            else {
                style.communicationStyle = 'direct';
            }
        }
        return style;
    }
    async updateWorkingPatternsFromBehavior(patterns, behaviors) {
        // Analyze peak hours
        const hourCounts = new Map();
        behaviors.forEach(b => {
            const hour = b.timestamp.getHours();
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
        });
        const sortedHours = Array.from(hourCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([hour]) => hour);
        patterns.peakHours = sortedHours;
        // Analyze session duration (simplified)
        if (behaviors.length > 0) {
            const sessionStart = behaviors[behaviors.length - 1].timestamp;
            const sessionEnd = behaviors[0].timestamp;
            patterns.sessionDuration = sessionEnd.getTime() - sessionStart.getTime();
        }
        return patterns;
    }
    async updatePersonalityTraitsFromBehavior(traits, behaviors, insights) {
        // Gradual updates based on behavior patterns
        const explorationBehaviors = behaviors.filter(b => b.action === 'search' || b.action === 'navigate' || b.action === 'view').length;
        const totalBehaviors = behaviors.length;
        const explorationRatio = explorationBehaviors / totalBehaviors;
        // Update openness based on exploration behavior
        traits.openness = (traits.openness * 0.9) + (explorationRatio * 0.1);
        // Update conscientiousness based on consistent patterns
        const consistentPatterns = insights.filter(i => i.insightType === behavior_tracker_1.InsightType.WORKFLOW).length;
        if (consistentPatterns > 0) {
            traits.conscientiousness = Math.min(traits.conscientiousness + 0.01, 1);
        }
        return traits;
    }
    async generateContentRecommendations(userId, profile, context) {
        const recommendations = [];
        // Recommend content based on interests
        profile.interests.topics.slice(0, 3).forEach((interest, index) => {
            recommendations.push({
                id: this.generateRecommendationId(),
                userId,
                type: RecommendationType.CONTENT_SUGGESTION,
                title: `Explore ${interest.topic} Content`,
                description: `Based on your interest in ${interest.topic}, here are some relevant resources`,
                confidence: interest.weight,
                priority: 8 - index,
                expectedImpact: 0.7,
                category: RecommendationCategory.IMMEDIATE,
                context: context || {},
                actions: [{
                        type: 'navigate',
                        label: `Browse ${interest.topic}`,
                        url: `/content/search?topic=${encodeURIComponent(interest.topic)}`
                    }],
                metadata: { topic: interest.topic, weight: interest.weight },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
            });
        });
        return recommendations;
    }
    async generateFeatureRecommendations(userId, profile, insights) {
        const recommendations = [];
        // Recommend features based on skill level and usage patterns
        if (profile.skills.technicalSkills.some(s => s.name === 'programming' && s.level > 0.7)) {
            recommendations.push({
                id: this.generateRecommendationId(),
                userId,
                type: RecommendationType.FEATURE_RECOMMENDATION,
                title: 'Advanced Code Analysis Tools',
                description: 'Based on your programming skills, try our advanced code analysis features',
                confidence: 0.8,
                priority: 7,
                expectedImpact: 0.8,
                category: RecommendationCategory.SHORT_TERM,
                context: {},
                actions: [{
                        type: 'try',
                        label: 'Enable Advanced Tools',
                        parameters: { feature: 'advanced_code_analysis' }
                    }],
                metadata: { skillBased: true },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
            });
        }
        return recommendations;
    }
    async generateWorkflowRecommendations(userId, profile, insights) {
        const recommendations = [];
        // Find workflow insights and suggest optimizations
        const workflowInsights = insights.filter(i => i.insightType === behavior_tracker_1.InsightType.WORKFLOW);
        workflowInsights.forEach(insight => {
            recommendations.push({
                id: this.generateRecommendationId(),
                userId,
                type: RecommendationType.WORKFLOW_OPTIMIZATION,
                title: 'Optimize Your Workflow',
                description: insight.description,
                confidence: insight.confidence,
                priority: 6,
                expectedImpact: 0.6,
                category: RecommendationCategory.SHORT_TERM,
                context: {},
                actions: insight.recommendations.map(rec => ({
                    type: 'configure',
                    label: rec.title,
                    parameters: { workflow: rec.type }
                })),
                metadata: { insightId: insight.id },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000) // 21 days
            });
        });
        return recommendations;
    }
    async generateCollaborationRecommendations(userId, profile, context) {
        const recommendations = [];
        // Find similar users for collaboration
        const similarUsers = await this.findSimilarUsers(userId, 5);
        if (similarUsers.length > 0 && profile.collaborationStyle.preferredTeamSize > 1) {
            recommendations.push({
                id: this.generateRecommendationId(),
                userId,
                type: RecommendationType.COLLABORATION_SUGGESTION,
                title: 'Connect with Similar Users',
                description: `Found ${similarUsers.length} users with similar interests and working styles`,
                confidence: 0.7,
                priority: 5,
                expectedImpact: 0.6,
                category: RecommendationCategory.LONG_TERM,
                context: context || {},
                actions: [{
                        type: 'connect',
                        label: 'View Suggestions',
                        url: '/collaboration/suggestions'
                    }],
                metadata: { similarUserCount: similarUsers.length },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }
        return recommendations;
    }
    async generateLearningRecommendations(userId, profile) {
        const recommendations = [];
        // Recommend learning paths based on skill gaps
        const skillGaps = profile.skills.technicalSkills.filter(s => s.level < 0.5);
        skillGaps.slice(0, 2).forEach(skill => {
            recommendations.push({
                id: this.generateRecommendationId(),
                userId,
                type: RecommendationType.LEARNING_PATH,
                title: `Improve ${skill.name} Skills`,
                description: `Personalized learning path to enhance your ${skill.name} abilities`,
                confidence: 1 - skill.level, // Higher confidence for bigger gaps
                priority: 4,
                expectedImpact: 0.8,
                category: RecommendationCategory.LONG_TERM,
                context: {},
                actions: [{
                        type: 'learn',
                        label: `Start ${skill.name} Path`,
                        url: `/learning/path/${encodeURIComponent(skill.name)}`
                    }],
                metadata: { skill: skill.name, currentLevel: skill.level },
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
            });
        });
        return recommendations;
    }
    async generateUserEmbedding(profile) {
        // Create a text representation of the user profile
        const profileText = [
            ...profile.interests.topics.map(t => `${t.topic}:${t.weight}`),
            ...profile.skills.technicalSkills.map(s => `${s.name}:${s.level}`),
            `collaboration:${profile.collaborationStyle.preferredTeamSize}`,
            `communication:${profile.collaborationStyle.communicationStyle}`,
            ...profile.preferences.contentTypes.map(c => `content:${c.type}:${c.weight}`)
        ].join(' ');
        return await this.embeddingManager.generateEmbedding(profileText);
    }
    findSharedInterests(profile1, profile2) {
        const interests1 = new Set(profile1.interests.topics.map(t => t.topic));
        const interests2 = new Set(profile2.interests.topics.map(t => t.topic));
        return Array.from(interests1).filter(interest => interests2.has(interest));
    }
    calculateCollaborationPotential(profile1, profile2) {
        let score = 0;
        // Shared interests
        const sharedInterests = this.findSharedInterests(profile1, profile2);
        score += sharedInterests.length * 0.2;
        // Complementary skills
        const skills1 = new Set(profile1.skills.technicalSkills.map(s => s.name));
        const skills2 = new Set(profile2.skills.technicalSkills.map(s => s.name));
        const complementarySkills = Array.from(skills1).filter(skill => !skills2.has(skill)).length;
        score += Math.min(complementarySkills * 0.1, 0.3);
        // Compatible collaboration styles
        if (profile1.collaborationStyle.communicationStyle === profile2.collaborationStyle.communicationStyle) {
            score += 0.2;
        }
        // Similar working patterns
        const sharedPeakHours = profile1.workingPatterns.peakHours.filter(hour => profile2.workingPatterns.peakHours.includes(hour)).length;
        score += (sharedPeakHours / 4) * 0.3; // Normalize by max peak hours
        return Math.min(score, 1);
    }
    async saveUserProfile(profile) {
        const profileKey = `${this.PROFILE_PREFIX}:${profile.userId}`;
        await this.redis.setex(profileKey, 2592000, JSON.stringify(profile)); // 30 days TTL
    }
    async updateFeatureStore(userId, profile) {
        // Store features for ML models
        const features = {
            userId,
            interests: profile.interests.topics.map(t => ({ topic: t.topic, weight: t.weight })),
            skills: profile.skills.technicalSkills.map(s => ({ skill: s.name, level: s.level })),
            collaborationScore: profile.collaborationStyle.preferredTeamSize / 10,
            productivityScore: profile.workingPatterns.focusScore,
            timestamp: new Date()
        };
        const featureKey = `${this.FEATURE_STORE_PREFIX}:${userId}`;
        await this.redis.setex(featureKey, 604800, JSON.stringify(features)); // 7 days TTL
    }
    async storeRecommendation(recommendation) {
        const recKey = `${this.RECOMMENDATION_PREFIX}:${recommendation.userId}:${recommendation.id}`;
        const ttl = recommendation.expiresAt
            ? Math.floor((new Date(recommendation.expiresAt).getTime() - Date.now()) / 1000)
            : 2592000; // 30 days default
        await this.redis.setex(recKey, ttl, JSON.stringify(recommendation));
    }
    async reinforceLearning(userId, recommendation, feedback) {
        // Update user profile based on positive feedback
        const profile = await this.getUserProfile(userId);
        if (!profile)
            return;
        if (recommendation.type === RecommendationType.CONTENT_SUGGESTION && feedback.rating >= 4) {
            // Reinforce content preferences
            const topic = recommendation.metadata.topic;
            const interest = profile.interests.topics.find(t => t.topic === topic);
            if (interest) {
                interest.weight = Math.min(interest.weight * 1.1, 1); // Increase weight by 10%
                await this.saveUserProfile(profile);
            }
        }
        logger_1.logger.info(`Reinforced learning for user ${userId} based on recommendation feedback`);
    }
    getDefaultPreferences() {
        return {
            contentTypes: [],
            uiPreferences: {
                theme: 'auto',
                layout: 'comfortable',
                sidebarPosition: 'left',
                showAdvancedFeatures: false,
                customizations: {}
            },
            notificationPreferences: {
                email: true,
                push: true,
                inApp: true,
                frequency: 'daily',
                categories: []
            },
            privacySettings: {
                shareUsageData: true,
                allowPersonalization: true,
                shareWithTeam: false,
                dataRetentionDays: 365
            },
            workspacePreferences: {
                defaultView: 'dashboard',
                autoSave: true,
                collaborationMode: 'active',
                knowledgeSharing: true
            },
            aiModelPreferences: {
                preferredModels: [],
                fallbackStrategy: 'performance',
                maxLatency: 5000,
                qualityThreshold: 0.8
            }
        };
    }
    getDefaultSkillProfile() {
        return {
            technicalSkills: [],
            domainKnowledge: [],
            softSkills: [],
            learningVelocity: 0.5,
            expertiseAreas: []
        };
    }
    getDefaultInterestProfile() {
        return {
            topics: [],
            trendingInterests: [],
            seasonalPatterns: [],
            diversityScore: 0
        };
    }
    getDefaultCollaborationStyle() {
        return {
            preferredTeamSize: 3,
            communicationStyle: 'diplomatic',
            leadershipTendency: 0.5,
            mentorshipStyle: 'guidance',
            conflictResolution: 'collaborative'
        };
    }
    getDefaultWorkingPatterns() {
        return {
            peakHours: [9, 10, 14, 15],
            productiveDays: [1, 2, 3, 4, 5],
            sessionDuration: 3600000, // 1 hour
            breakPatterns: [],
            focusScore: 0.5,
            multitaskingTendency: 0.5
        };
    }
    getDefaultPersonalityTraits() {
        return {
            openness: 0.5,
            conscientiousness: 0.5,
            extraversion: 0.5,
            agreeableness: 0.5,
            neuroticism: 0.5,
            riskTolerance: 0.5,
            innovationIndex: 0.5
        };
    }
    getDefaultLearningStyle() {
        return {
            preferredFormats: [],
            pace: 'moderate',
            depth: 'detailed',
            interactivity: 'interactive',
            feedback: 'periodic'
        };
    }
    getDefaultContextualPreferences() {
        return {
            deviceSpecific: [],
            locationBased: [],
            timeBasedPreferences: [],
            workspaceSpecific: []
        };
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.PersonalizationEngine = PersonalizationEngine;
asyn;
c;
getPersonalizedRecommendations(userId, string, context, RecommendationContext, limit, number = 10);
Promise < PersonalizedRecommendation[] > {
    // Get user profile and patterns
    const: userProfile = await this.buildUserProfile(userId),
    const: patterns = await this.patternAnalyzer.analyzeUserPatterns(userId),
    // Generate content-based recommendations
    const: contentRecommendations = await this.generateContentRecommendations(userId, userProfile, context, limit),
    // Generate collaborative filtering recommendations
    const: collaborativeRecommendations = await this.generateCollaborativeRecommendations(userId, userProfile, context, limit),
    // Combine and rank recommendations
    const: allRecommendations = [...contentRecommendations, ...collaborativeRecommendations],
    const: rankedRecommendations = await this.rankRecommendations(userId, allRecommendations, context),
    // Apply personalization filters
    const: personalizedRecommendations = await this.applyPersonalizationFilters(userId, rankedRecommendations, userProfile),
    return: personalizedRecommendations.slice(0, limit)
};
async;
updatePersonalizationModel(userId, string, feedback, PersonalizationFeedback);
Promise < void  > {
    // Record feedback
    await, this: .behaviorTracker.recordFeedback(userId, {
        type: feedback.type,
        rating: feedback.rating,
        comment: feedback.comment,
        context: feedback.context
    }),
    // Update user preferences based on feedback
    await, this: .updatePreferencesFromFeedback(userId, feedback),
    // Update collaborative filtering model
    await, this: .updateCollaborativeModel(userId, feedback),
    // Trigger model retraining if needed
    await, this: .checkModelRetrainingNeeds(userId),
    logger: logger_1.logger, : .info(`Updated personalization model for user ${userId} based on feedback`)
};
async;
getPersonalizedContent(userId, string, contentType, ContentType, context, ContentContext);
Promise < PersonalizedContent[] > {
    const: userProfile = await this.buildUserProfile(userId),
    const: preferences = await this.behaviorTracker.getUserPreferences(userId),
    // Get base content
    const: baseContent = await this.getBaseContent(contentType, context),
    // Apply personalization
    const: personalizedContent, PersonalizedContent, []:  = [],
    for(, content, of, baseContent) {
        const personalizationScore = await this.calculatePersonalizationScore(userId, content, userProfile, preferences);
        if (personalizationScore > 0.3) { // Minimum relevance threshold
            const personalizedItem = {
                id: content.id,
                type: contentType,
                title: content.title,
                description: content.description,
                content: await this.personalizeContentText(content.content, userProfile, preferences),
                metadata: {
                    ...content.metadata,
                    personalizationScore,
                    personalizedFor: userId,
                    personalizedAt: new Date()
                },
                tags: content.tags,
                createdAt: content.createdAt
            };
            personalizedContent.push(personalizedItem);
        }
    },
    return: personalizedContent.sort((a, b) => b.metadata.personalizationScore - a.metadata.personalizationScore)
};
async;
adaptInterface(userId, string, currentInterface, InterfaceState);
Promise < InterfaceAdaptation > {
    const: userProfile = await this.buildUserProfile(userId),
    const: patterns = await this.patternAnalyzer.analyzeUserPatterns(userId),
    const: preferences = await this.behaviorTracker.getUserPreferences(userId),
    const: adaptations, InterfaceChange, []:  = [],
    // Adapt layout based on usage patterns
    const: layoutAdaptations = await this.adaptLayout(userId, currentInterface, patterns),
    adaptations, : .push(...layoutAdaptations),
    // Adapt content presentation based on preferences
    const: presentationAdaptations = await this.adaptPresentation(userId, currentInterface, preferences),
    adaptations, : .push(...presentationAdaptations),
    // Adapt navigation based on behavior patterns
    const: navigationAdaptations = await this.adaptNavigation(userId, currentInterface, patterns),
    adaptations, : .push(...navigationAdaptations),
    // Adapt accessibility features
    const: accessibilityAdaptations = await this.adaptAccessibility(userId, currentInterface, userProfile),
    adaptations, : .push(...accessibilityAdaptations),
    return: {
        userId,
        adaptationId: this.generateAdaptationId(),
        timestamp: new Date(),
        changes: adaptations,
        confidence: this.calculateAdaptationConfidence(adaptations),
        reasoning: this.generateAdaptationReasoning(adaptations, patterns)
    }
};
async;
predictUserNeeds(userId, string, context, PredictionContext);
Promise < UserNeedPrediction[] > {
    const: userProfile = await this.buildUserProfile(userId),
    const: patterns = await this.patternAnalyzer.analyzeUserPatterns(userId),
    const: behaviorPredictions = await this.patternAnalyzer.predictUserBehavior(userId, context),
    const: predictions, UserNeedPrediction, []:  = [],
    // Predict information needs
    const: informationNeeds = await this.predictInformationNeeds(userId, context, patterns),
    predictions, : .push(...informationNeeds),
    // Predict tool needs
    const: toolNeeds = await this.predictToolNeeds(userId, context, behaviorPredictions),
    predictions, : .push(...toolNeeds),
    // Predict assistance needs
    const: assistanceNeeds = await this.predictAssistanceNeeds(userId, context, userProfile),
    predictions, : .push(...assistanceNeeds),
    return: predictions.sort((a, b) => b.confidence - a.confidence)
};
async;
getPersonalizationInsights(userId, string);
Promise < PersonalizationInsights > {
    const: userProfile = await this.buildUserProfile(userId),
    const: patterns = await this.patternAnalyzer.analyzeUserPatterns(userId),
    const: preferences = await this.behaviorTracker.getUserPreferences(userId),
    const: similarUsers = await this.patternAnalyzer.findSimilarUsers(userId, 5),
    return: {
        userId,
        generatedAt: new Date(),
        profileStrength: this.calculateProfileStrength(userProfile),
        topPreferences: this.extractTopPreferences(preferences),
        behaviorInsights: patterns.insights,
        similarUsers: similarUsers.map(u => ({
            userId: u.userId,
            similarity: u.score,
            sharedInterests: u.sharedPreferences
        })),
        recommendations: {
            contentTypes: this.recommendContentTypes(preferences),
            features: this.recommendFeatures(patterns),
            improvements: this.recommendImprovements(userProfile, patterns)
        }
    }
};
async;
buildUserProfile(userId, string);
Promise < UserProfile > {
    const: preferences = await this.behaviorTracker.getUserPreferences(userId),
    const: behaviorSummary = await this.behaviorTracker.getUserBehaviorSummary(userId),
    const: patterns = await this.behaviorTracker.getBehaviorPatterns(userId, 10),
    const: recentFeedback = await this.behaviorTracker.getRecentFeedback(userId, 20),
    return: {
        userId,
        preferences,
        behaviorSummary,
        patterns,
        recentFeedback,
        profileStrength: this.calculateProfileStrength({ preferences, behaviorSummary, patterns, recentFeedback }),
        lastUpdated: new Date()
    }
};
async;
generateContentRecommendations(userId, string, userProfile, UserProfile, context, RecommendationContext, limit, number);
Promise < PersonalizedRecommendation[] > {
    const: recommendations, PersonalizedRecommendation, []:  = [],
    // Get user's preferred content types
    const: preferredTypes = Object.entries(userProfile.preferences.contentTypes)
        .filter(([, score]) => score > 0.6)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([type]) => type),
    for(, contentType, of, preferredTypes) {
        const contentRecommendations = await this.getContentByType(contentType, context, limit);
        for (const content of contentRecommendations) {
            const relevanceScore = await this.calculateContentRelevance(userId, content, userProfile);
            if (relevanceScore > 0.4) {
                recommendations.push({
                    id: this.generateRecommendationId(),
                    type: RecommendationType.CONTENT,
                    title: content.title,
                    description: content.description,
                    score: relevanceScore,
                    confidence: 0.8,
                    reasoning: `Based on your preference for ${contentType} content`,
                    metadata: {
                        contentType,
                        sourceId: content.id,
                        algorithm: 'content-based'
                    }
                });
            }
        }
    },
    return: recommendations
};
async;
generateCollaborativeRecommendations(userId, string, userProfile, UserProfile, context, RecommendationContext, limit, number);
Promise < PersonalizedRecommendation[] > {
    const: recommendations, PersonalizedRecommendation, []:  = [],
    const: similarUsers = await this.patternAnalyzer.findSimilarUsers(userId, 10),
    for(, similarUser, of, similarUsers) {
        const similarUserPreferences = await this.behaviorTracker.getUserPreferences(similarUser.userId);
        const similarUserFeedback = await this.behaviorTracker.getRecentFeedback(similarUser.userId, 10);
        // Find highly rated content from similar users
        const highlyRatedContent = similarUserFeedback
            .filter(feedback => feedback.rating >= 4)
            .slice(0, 5);
        for (const feedback of highlyRatedContent) {
            if (feedback.context?.contentId) {
                const content = await this.getContentById(feedback.context.contentId);
                if (content) {
                    const collaborativeScore = similarUser.score * (feedback.rating / 5);
                    recommendations.push({
                        id: this.generateRecommendationId(),
                        type: RecommendationType.COLLABORATIVE,
                        title: content.title,
                        description: content.description,
                        score: collaborativeScore,
                        confidence: 0.7,
                        reasoning: `Users similar to you rated this highly`,
                        metadata: {
                            similarUserId: similarUser.userId,
                            similarity: similarUser.score,
                            rating: feedback.rating,
                            algorithm: 'collaborative-filtering'
                        }
                    });
                }
            }
        }
    },
    return: recommendations
};
async;
rankRecommendations(userId, string, recommendations, PersonalizedRecommendation[], context, RecommendationContext);
Promise < PersonalizedRecommendation[] > {
    // Apply context-based ranking
    for(, recommendation, of, recommendations) {
        let contextBoost = 0;
        // Time-based boost
        if (context.timeContext) {
            contextBoost += this.calculateTimeContextBoost(recommendation, context.timeContext);
        }
        // Location-based boost
        if (context.locationContext) {
            contextBoost += this.calculateLocationContextBoost(recommendation, context.locationContext);
        }
        // Activity-based boost
        if (context.currentActivity) {
            contextBoost += this.calculateActivityContextBoost(recommendation, context.currentActivity);
        }
        recommendation.score += contextBoost;
    },
    return: recommendations.sort((a, b) => b.score - a.score)
};
async;
applyPersonalizationFilters(userId, string, recommendations, PersonalizedRecommendation[], userProfile, UserProfile);
Promise < PersonalizedRecommendation[] > {
    const: filtered, PersonalizedRecommendation, []:  = [],
    for(, recommendation, of, recommendations) {
        // Apply privacy filters
        if (userProfile.preferences.privacyLevel === PrivacyLevel.HIGH) {
            if (recommendation.type === RecommendationType.COLLABORATIVE) {
                continue; // Skip collaborative recommendations for high privacy users
            }
        }
        // Apply content filters based on preferences
        if (recommendation.metadata?.contentType) {
            const contentTypeScore = userProfile.preferences.contentTypes[recommendation.metadata.contentType];
            if (contentTypeScore && contentTypeScore < 0.3) {
                continue; // Skip content types user doesn't prefer
            }
        }
        // Apply diversity filters
        const isDiverse = await this.checkRecommendationDiversity(recommendation, filtered);
        if (!isDiverse && filtered.length > 5) {
            continue; // Skip similar recommendations to maintain diversity
        }
        filtered.push(recommendation);
    },
    return: filtered
};
async;
updatePreferencesFromFeedback(userId, string, feedback, PersonalizationFeedback);
Promise < void  > {
    const: preferences = await this.behaviorTracker.getUserPreferences(userId),
    // Update preferences based on feedback type and rating
    if(feedback) { }, : .context?.contentType
};
{
    const contentType = feedback.context.contentType;
    const currentScore = preferences.contentTypes[contentType] || 0.5;
    const adjustment = (feedback.rating - 3) * 0.1 * preferences.learningRate;
    preferences.contentTypes[contentType] = Math.max(0, Math.min(1, currentScore + adjustment));
}
if (feedback.context?.feature) {
    const feature = feedback.context.feature;
    const currentScore = preferences.interactionStyles[feature] || 0.5;
    const adjustment = (feedback.rating - 3) * 0.1 * preferences.learningRate;
    preferences.interactionStyles[feature] = Math.max(0, Math.min(1, currentScore + adjustment));
}
await this.behaviorTracker.updateUserPreferences(userId, preferences);
async;
updateCollaborativeModel(userId, string, feedback, PersonalizationFeedback);
Promise < void  > {
    // Update user similarity vectors
    await, this: .patternAnalyzer.updateUserSimilarity(userId),
    // Store feedback for collaborative filtering
    const: feedbackKey = `collaborative:feedback:${userId}`,
    await, this: .redis.zadd(feedbackKey, feedback.rating, JSON.stringify({
        contentId: feedback.context?.contentId,
        rating: feedback.rating,
        timestamp: new Date()
    })),
    // Set expiration for feedback data
    await, this: .redis.expire(feedbackKey, 86400 * 30)
};
async;
checkModelRetrainingNeeds(userId, string);
Promise < void  > {
    const: lastRetraining = await this.redis.get(`model:retrain:${userId}`),
    const: lastRetrainingDate = lastRetraining ? new Date(lastRetraining) : new Date(0),
    const: daysSinceRetraining = (Date.now() - lastRetrainingDate.getTime()) / (1000 * 60 * 60 * 24),
    if(daysSinceRetraining) { }
} > 7;
{ // Retrain weekly
    await this.retrainPersonalizationModel(userId);
    await this.redis.set(`model:retrain:${userId}`, new Date().toISOString());
}
async;
retrainPersonalizationModel(userId, string);
Promise < void  > {
    // This would implement model retraining logic
    logger: logger_1.logger, : .info(`Retraining personalization model for user ${userId}`)
};
calculateProfileStrength(profile, any);
number;
{
    let strength = 0;
    let factors = 0;
    // Factor in preference completeness
    const prefCount = Object.keys(profile.preferences?.contentTypes || {}).length;
    strength += Math.min(1, prefCount / 10) * 0.3;
    factors += 0.3;
    // Factor in behavior data richness
    const behaviorEvents = profile.behaviorSummary?.totalEvents || 0;
    strength += Math.min(1, behaviorEvents / 100) * 0.4;
    factors += 0.4;
    // Factor in feedback quantity
    const feedbackCount = profile.recentFeedback?.length || 0;
    strength += Math.min(1, feedbackCount / 20) * 0.3;
    factors += 0.3;
    return factors > 0 ? strength / factors : 0;
}
generateRecommendationId();
string;
{
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
generateAdaptationId();
string;
{
    return `adapt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
async;
getBaseContent(contentType, ContentType, context, ContentContext);
Promise < any[] > {
    // Implementation would fetch base content
    return: []
};
async;
calculatePersonalizationScore(userId, string, content, any, userProfile, UserProfile, preferences, UserPreferences);
Promise < number > {
    // Implementation would calculate personalization score
    return: 0.5
};
async;
personalizeContentText(content, string, userProfile, UserProfile, preferences, UserPreferences);
Promise < string > {
    // Implementation would personalize content text
    return: content
};
async;
getContentByType(contentType, string, context, RecommendationContext, limit, number);
Promise < any[] > {
    // Implementation would get content by type
    return: []
};
async;
calculateContentRelevance(userId, string, content, any, userProfile, UserProfile);
Promise < number > {
    // Implementation would calculate content relevance
    return: 0.5
};
async;
getContentById(contentId, string);
Promise < any > {
    // Implementation would get content by ID
    return: null
};
calculateTimeContextBoost(recommendation, PersonalizedRecommendation, timeContext, string);
number;
{
    // Implementation would calculate time context boost
    return 0;
}
calculateLocationContextBoost(recommendation, PersonalizedRecommendation, locationContext, string);
number;
{
    // Implementation would calculate location context boost
    return 0;
}
calculateActivityContextBoost(recommendation, PersonalizedRecommendation, activity, string);
number;
{
    // Implementation would calculate activity context boost
    return 0;
}
async;
checkRecommendationDiversity(recommendation, PersonalizedRecommendation, existing, PersonalizedRecommendation[]);
Promise < boolean > {
    // Implementation would check recommendation diversity
    return: true
};
extractTopPreferences(preferences, UserPreferences);
Array < { type: string, score: number } > {
    const: allPrefs = [
        ...Object.entries(preferences.contentTypes).map(([type, score]) => ({ type: `${type} content`, score })),
        ...Object.entries(preferences.interactionStyles).map(([type, score]) => ({ type: `${type} interaction`, score }))
    ],
    return: allPrefs
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
};
recommendContentTypes(preferences, UserPreferences);
string[];
{
    return Object.entries(preferences.contentTypes)
        .filter(([, score]) => score < 0.3)
        .map(([type]) => type)
        .slice(0, 3);
}
recommendFeatures(patterns, any);
string[];
{
    // Implementation would recommend features based on patterns
    return [];
}
recommendImprovements(userProfile, UserProfile, patterns, any);
string[];
{
    const improvements = [];
    if (userProfile.profileStrength < 0.5) {
        improvements.push('Provide more feedback to improve recommendations');
    }
    if (patterns.insights.length < 3) {
        improvements.push('Use the system more regularly to generate better insights');
    }
    return improvements;
}
calculateAdaptationConfidence(adaptations, InterfaceChange[]);
number;
{
    if (adaptations.length === 0)
        return 0;
    const avgConfidence = adaptations.reduce((sum, change) => sum + change.confidence, 0) / adaptations.length;
    return avgConfidence;
}
generateAdaptationReasoning(adaptations, InterfaceChange[], patterns, any);
string;
{
    if (adaptations.length === 0)
        return 'No adaptations needed';
    const mainAdaptation = adaptations[0];
    return `Based on your ${mainAdaptation.type} patterns, we've adapted the interface to better suit your needs`;
}
async;
adaptLayout(userId, string, currentInterface, InterfaceState, patterns, any);
Promise < InterfaceChange[] > {
    // Implementation would adapt layout based on patterns
    return: []
};
async;
adaptPresentation(userId, string, currentInterface, InterfaceState, preferences, UserPreferences);
Promise < InterfaceChange[] > {
    // Implementation would adapt presentation based on preferences
    return: []
};
async;
adaptNavigation(userId, string, currentInterface, InterfaceState, patterns, any);
Promise < InterfaceChange[] > {
    // Implementation would adapt navigation based on patterns
    return: []
};
async;
adaptAccessibility(userId, string, currentInterface, InterfaceState, userProfile, UserProfile);
Promise < InterfaceChange[] > {
    // Implementation would adapt accessibility features
    return: []
};
async;
predictInformationNeeds(userId, string, context, PredictionContext, patterns, any);
Promise < UserNeedPrediction[] > {
    // Implementation would predict information needs
    return: []
};
async;
predictToolNeeds(userId, string, context, PredictionContext, behaviorPredictions, any[]);
Promise < UserNeedPrediction[] > {
    // Implementation would predict tool needs
    return: []
};
async;
predictAssistanceNeeds(userId, string, context, PredictionContext, userProfile, UserProfile);
Promise < UserNeedPrediction[] > {
    // Implementation would predict assistance needs
    return: []
};
//# sourceMappingURL=personalization-engine.js.map