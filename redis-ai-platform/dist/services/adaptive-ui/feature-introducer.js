"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureIntroducer = exports.AcceleratorType = exports.BlockerSeverity = exports.BlockerType = exports.TrendDirection = exports.IntroductionStatus = exports.IntroductionFrequency = exports.AvoidanceReason = exports.ComparisonOperator = exports.ConditionType = exports.MomentTrigger = exports.ReadinessType = exports.FollowUpTrigger = exports.InteractivityLevel = exports.ActionType = exports.VisualType = exports.IntroductionMethod = exports.IntroductionType = exports.ImpactLevel = exports.BenefitType = exports.FeatureComplexity = exports.FeatureCategory = void 0;
const logger_1 = require("../../utils/logger");
var FeatureCategory;
(function (FeatureCategory) {
    FeatureCategory["CORE"] = "core";
    FeatureCategory["PRODUCTIVITY"] = "productivity";
    FeatureCategory["COLLABORATION"] = "collaboration";
    FeatureCategory["ANALYTICS"] = "analytics";
    FeatureCategory["CUSTOMIZATION"] = "customization";
    FeatureCategory["INTEGRATION"] = "integration";
    FeatureCategory["ADVANCED"] = "advanced";
})(FeatureCategory || (exports.FeatureCategory = FeatureCategory = {}));
var FeatureComplexity;
(function (FeatureComplexity) {
    FeatureComplexity["SIMPLE"] = "simple";
    FeatureComplexity["MODERATE"] = "moderate";
    FeatureComplexity["COMPLEX"] = "complex";
    FeatureComplexity["EXPERT"] = "expert";
})(FeatureComplexity || (exports.FeatureComplexity = FeatureComplexity = {}));
var BenefitType;
(function (BenefitType) {
    BenefitType["TIME_SAVING"] = "time_saving";
    BenefitType["EFFICIENCY"] = "efficiency";
    BenefitType["QUALITY"] = "quality";
    BenefitType["COLLABORATION"] = "collaboration";
    BenefitType["INSIGHTS"] = "insights";
    BenefitType["AUTOMATION"] = "automation";
})(BenefitType || (exports.BenefitType = BenefitType = {}));
var ImpactLevel;
(function (ImpactLevel) {
    ImpactLevel["LOW"] = "low";
    ImpactLevel["MEDIUM"] = "medium";
    ImpactLevel["HIGH"] = "high";
    ImpactLevel["TRANSFORMATIVE"] = "transformative";
})(ImpactLevel || (exports.ImpactLevel = ImpactLevel = {}));
var IntroductionType;
(function (IntroductionType) {
    IntroductionType["TOOLTIP"] = "tooltip";
    IntroductionType["MODAL"] = "modal";
    IntroductionType["GUIDED_TOUR"] = "guided_tour";
    IntroductionType["INLINE_HINT"] = "inline_hint";
    IntroductionType["NOTIFICATION"] = "notification";
    IntroductionType["PROGRESSIVE_DISCLOSURE"] = "progressive_disclosure";
})(IntroductionType || (exports.IntroductionType = IntroductionType = {}));
var IntroductionMethod;
(function (IntroductionMethod) {
    IntroductionMethod["CONTEXTUAL"] = "contextual";
    IntroductionMethod["PROACTIVE"] = "proactive";
    IntroductionMethod["ON_DEMAND"] = "on_demand";
    IntroductionMethod["GRADUAL"] = "gradual";
    IntroductionMethod["IMMERSIVE"] = "immersive";
})(IntroductionMethod || (exports.IntroductionMethod = IntroductionMethod = {}));
var VisualType;
(function (VisualType) {
    VisualType["IMAGE"] = "image";
    VisualType["GIF"] = "gif";
    VisualType["VIDEO"] = "video";
    VisualType["DIAGRAM"] = "diagram";
    VisualType["SCREENSHOT"] = "screenshot";
})(VisualType || (exports.VisualType = VisualType = {}));
var ActionType;
(function (ActionType) {
    ActionType["TRY_NOW"] = "try_now";
    ActionType["LEARN_MORE"] = "learn_more";
    ActionType["WATCH_DEMO"] = "watch_demo";
    ActionType["START_TUTORIAL"] = "start_tutorial";
    ActionType["DISMISS"] = "dismiss";
    ActionType["REMIND_LATER"] = "remind_later";
})(ActionType || (exports.ActionType = ActionType = {}));
var InteractivityLevel;
(function (InteractivityLevel) {
    InteractivityLevel["PASSIVE"] = "passive";
    InteractivityLevel["INTERACTIVE"] = "interactive";
    InteractivityLevel["HANDS_ON"] = "hands_on";
    InteractivityLevel["GUIDED"] = "guided";
})(InteractivityLevel || (exports.InteractivityLevel = InteractivityLevel = {}));
var FollowUpTrigger;
(function (FollowUpTrigger) {
    FollowUpTrigger["IMMEDIATE"] = "immediate";
    FollowUpTrigger["AFTER_USE"] = "after_use";
    FollowUpTrigger["TIME_BASED"] = "time_based";
    FollowUpTrigger["USAGE_MILESTONE"] = "usage_milestone";
    FollowUpTrigger["COMPLETION"] = "completion";
})(FollowUpTrigger || (exports.FollowUpTrigger = FollowUpTrigger = {}));
var ReadinessType;
(function (ReadinessType) {
    ReadinessType["USER_EXPERIENCE"] = "user_experience";
    ReadinessType["FEATURE_USAGE"] = "feature_usage";
    ReadinessType["SESSION_ACTIVITY"] = "session_activity";
    ReadinessType["TASK_COMPLETION"] = "task_completion";
    ReadinessType["ERROR_RATE"] = "error_rate";
    ReadinessType["HELP_SEEKING"] = "help_seeking";
})(ReadinessType || (exports.ReadinessType = ReadinessType = {}));
var MomentTrigger;
(function (MomentTrigger) {
    MomentTrigger["TASK_COMPLETION"] = "task_completion";
    MomentTrigger["WORKFLOW_START"] = "workflow_start";
    MomentTrigger["IDLE_TIME"] = "idle_time";
    MomentTrigger["REPEATED_ACTION"] = "repeated_action";
    MomentTrigger["CONTEXT_SWITCH"] = "context_switch";
    MomentTrigger["SUCCESS_MOMENT"] = "success_moment";
})(MomentTrigger || (exports.MomentTrigger = MomentTrigger = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["TIME_OF_DAY"] = "time_of_day";
    ConditionType["SESSION_LENGTH"] = "session_length";
    ConditionType["RECENT_ACTIVITY"] = "recent_activity";
    ConditionType["USER_MOOD"] = "user_mood";
    ConditionType["COGNITIVE_LOAD"] = "cognitive_load";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["EQUALS"] = "equals";
    ComparisonOperator["GREATER_THAN"] = "greater_than";
    ComparisonOperator["LESS_THAN"] = "less_than";
    ComparisonOperator["BETWEEN"] = "between";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var AvoidanceReason;
(function (AvoidanceReason) {
    AvoidanceReason["HIGH_STRESS"] = "high_stress";
    AvoidanceReason["TASK_FOCUS"] = "task_focus";
    AvoidanceReason["ERROR_RECOVERY"] = "error_recovery";
    AvoidanceReason["TIME_PRESSURE"] = "time_pressure";
    AvoidanceReason["COGNITIVE_OVERLOAD"] = "cognitive_overload";
})(AvoidanceReason || (exports.AvoidanceReason = AvoidanceReason = {}));
var IntroductionFrequency;
(function (IntroductionFrequency) {
    IntroductionFrequency["ONCE"] = "once";
    IntroductionFrequency["PERIODIC"] = "periodic";
    IntroductionFrequency["CONTEXTUAL"] = "contextual";
    IntroductionFrequency["ADAPTIVE"] = "adaptive";
})(IntroductionFrequency || (exports.IntroductionFrequency = IntroductionFrequency = {}));
var IntroductionStatus;
(function (IntroductionStatus) {
    IntroductionStatus["PENDING"] = "pending";
    IntroductionStatus["SCHEDULED"] = "scheduled";
    IntroductionStatus["PRESENTED"] = "presented";
    IntroductionStatus["ACCEPTED"] = "accepted";
    IntroductionStatus["DISMISSED"] = "dismissed";
    IntroductionStatus["DEFERRED"] = "deferred";
})(IntroductionStatus || (exports.IntroductionStatus = IntroductionStatus = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["DECLINING"] = "declining";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var BlockerType;
(function (BlockerType) {
    BlockerType["SKILL_GAP"] = "skill_gap";
    BlockerType["COGNITIVE_OVERLOAD"] = "cognitive_overload";
    BlockerType["RESISTANCE_TO_CHANGE"] = "resistance_to_change";
    BlockerType["TIME_CONSTRAINTS"] = "time_constraints";
    BlockerType["TECHNICAL_ISSUES"] = "technical_issues";
})(BlockerType || (exports.BlockerType = BlockerType = {}));
var BlockerSeverity;
(function (BlockerSeverity) {
    BlockerSeverity["MINOR"] = "minor";
    BlockerSeverity["MODERATE"] = "moderate";
    BlockerSeverity["MAJOR"] = "major";
    BlockerSeverity["CRITICAL"] = "critical";
})(BlockerSeverity || (exports.BlockerSeverity = BlockerSeverity = {}));
var AcceleratorType;
(function (AcceleratorType) {
    AcceleratorType["HIGH_MOTIVATION"] = "high_motivation";
    AcceleratorType["RELEVANT_CONTEXT"] = "relevant_context";
    AcceleratorType["PEER_INFLUENCE"] = "peer_influence";
    AcceleratorType["SUCCESS_MOMENTUM"] = "success_momentum";
    AcceleratorType["CURIOSITY"] = "curiosity";
})(AcceleratorType || (exports.AcceleratorType = AcceleratorType = {}));
class FeatureIntroducer {
    redis;
    FEATURE_PREFIX = 'feature';
    INTRODUCTION_PREFIX = 'introduction';
    READINESS_PREFIX = 'readiness';
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Feature Introducer');
        // Initialize available features
        await this.initializeFeatures();
        logger_1.logger.info('Feature Introducer initialized');
    }
    async shutdown() {
        logger_1.logger.info('Feature Introducer shutdown complete');
    }
    async assessUserReadiness(userId, patterns, preferences) {
        const dimensions = this.assessReadinessDimensions(patterns, preferences);
        const overallScore = this.calculateOverallReadiness(dimensions);
        const blockers = this.identifyBlockers(patterns, preferences);
        const accelerators = this.identifyAccelerators(patterns, preferences);
        const readiness = {
            userId,
            overallScore,
            dimensions,
            blockers,
            accelerators,
            assessedAt: Date.now()
        };
        await this.storeUserReadiness(readiness);
        return readiness;
    }
    async identifyIntroductionOpportunities(userId, readiness, patterns) {
        const availableFeatures = await this.getAvailableFeatures();
        const opportunities = [];
        for (const feature of availableFeatures) {
            const relevanceScore = this.calculateFeatureRelevance(feature, patterns);
            const readinessScore = this.calculateFeatureReadiness(feature, readiness);
            if (relevanceScore > 0.6 && readinessScore > 0.7) {
                const introduction = await this.createFeatureIntroduction(userId, feature, relevanceScore, readinessScore, patterns);
                opportunities.push(introduction);
            }
        }
        return opportunities.sort((a, b) => (b.relevanceScore * b.readinessScore) - (a.relevanceScore * a.readinessScore));
    }
    async scheduleIntroduction(introduction, patterns) {
        const timing = this.calculateOptimalTiming(introduction, patterns);
        introduction.timing = timing;
        introduction.status = IntroductionStatus.SCHEDULED;
        await this.storeFeatureIntroduction(introduction);
        logger_1.logger.info(`Scheduled introduction for feature ${introduction.feature.name} for user ${introduction.userId}`);
    }
    assessReadinessDimensions(patterns, preferences) {
        const dimensions = [];
        // Experience dimension
        const experienceScore = this.calculateExperienceScore(patterns);
        dimensions.push({
            name: 'experience',
            score: experienceScore,
            factors: [
                {
                    name: 'total_interactions',
                    value: patterns.reduce((sum, p) => sum + p.frequency, 0),
                    weight: 0.4,
                    description: 'Total number of interactions'
                },
                {
                    name: 'feature_diversity',
                    value: new Set(patterns.flatMap(p => p.elements)).size,
                    weight: 0.6,
                    description: 'Number of unique features used'
                }
            ],
            trend: TrendDirection.STABLE
        });
        // Engagement dimension
        const engagementScore = this.calculateEngagementScore(patterns);
        dimensions.push({
            name: 'engagement',
            score: engagementScore,
            factors: [
                {
                    name: 'session_frequency',
                    value: patterns.filter(p => p.lastSeen > Date.now() - 7 * 24 * 60 * 60 * 1000).length,
                    weight: 0.5,
                    description: 'Recent session activity'
                },
                {
                    name: 'feature_exploration',
                    value: patterns.filter(p => p.confidence < 0.5).length,
                    weight: 0.5,
                    description: 'Willingness to try new features'
                }
            ],
            trend: TrendDirection.IMPROVING
        });
        // Adaptability dimension
        const adaptabilityScore = this.calculateAdaptabilityScore(preferences);
        dimensions.push({
            name: 'adaptability',
            score: adaptabilityScore,
            factors: [
                {
                    name: 'customization_usage',
                    value: Object.keys(preferences.layout.shortcuts).length,
                    weight: 0.3,
                    description: 'Use of customization features'
                },
                {
                    name: 'preference_changes',
                    value: preferences.personalization.showTips ? 1 : 0,
                    weight: 0.7,
                    description: 'Openness to learning'
                }
            ],
            trend: TrendDirection.STABLE
        });
        return dimensions;
    }
    calculateExperienceScore(patterns) {
        const totalInteractions = patterns.reduce((sum, p) => sum + p.frequency, 0);
        const uniqueFeatures = new Set(patterns.flatMap(p => p.elements)).size;
        // Normalize scores
        const interactionScore = Math.min(1, totalInteractions / 1000);
        const diversityScore = Math.min(1, uniqueFeatures / 50);
        return (interactionScore * 0.4) + (diversityScore * 0.6);
    }
    calculateEngagementScore(patterns) {
        const recentPatterns = patterns.filter(p => p.lastSeen > Date.now() - 7 * 24 * 60 * 60 * 1000);
        const engagementScore = Math.min(1, recentPatterns.length / 20);
        const explorationScore = Math.min(1, patterns.filter(p => p.confidence < 0.5).length / 10);
        return (engagementScore * 0.6) + (explorationScore * 0.4);
    }
    calculateAdaptabilityScore(preferences) {
        let score = 0.5; // Base score
        // Customization usage
        if (Object.keys(preferences.layout.shortcuts).length > 0)
            score += 0.2;
        if (preferences.layout.hiddenElements.length > 0)
            score += 0.1;
        if (preferences.layout.pinnedElements.length > 0)
            score += 0.1;
        // Learning preferences
        if (preferences.personalization.showTips)
            score += 0.1;
        if (preferences.personalization.showWelcomeMessages)
            score += 0.1;
        return Math.min(1, score);
    }
    calculateOverallReadiness(dimensions) {
        const weights = { experience: 0.4, engagement: 0.4, adaptability: 0.2 };
        return dimensions.reduce((sum, dim) => {
            const weight = weights[dim.name] || 0.33;
            return sum + (dim.score * weight);
        }, 0);
    }
    identifyBlockers(patterns, preferences) {
        const blockers = [];
        // Check for cognitive overload
        const recentActivity = patterns.filter(p => p.lastSeen > Date.now() - 24 * 60 * 60 * 1000).length;
        if (recentActivity > 50) {
            blockers.push({
                type: BlockerType.COGNITIVE_OVERLOAD,
                severity: BlockerSeverity.MODERATE,
                description: 'High recent activity may indicate cognitive overload',
                resolution: 'Wait for a quieter period before introducing new features'
            });
        }
        // Check for resistance to change
        if (!preferences.personalization.showTips) {
            blockers.push({
                type: BlockerType.RESISTANCE_TO_CHANGE,
                severity: BlockerSeverity.MINOR,
                description: 'User has disabled tips, may resist new feature introductions',
                resolution: 'Use subtle, contextual introductions'
            });
        }
        return blockers;
    }
    identifyAccelerators(patterns, preferences) {
        const accelerators = [];
        // High exploration activity
        const explorationPatterns = patterns.filter(p => p.confidence < 0.3);
        if (explorationPatterns.length > 5) {
            accelerators.push({
                type: AcceleratorType.CURIOSITY,
                impact: ImpactLevel.HIGH,
                description: 'User shows high exploration behavior',
                activation: 'Leverage curiosity with feature discovery prompts'
            });
        }
        // Recent success patterns
        const successPatterns = patterns.filter(p => p.confidence > 0.8 && p.lastSeen > Date.now() - 24 * 60 * 60 * 1000);
        if (successPatterns.length > 3) {
            accelerators.push({
                type: AcceleratorType.SUCCESS_MOMENTUM,
                impact: ImpactLevel.MEDIUM,
                description: 'User has recent successful interactions',
                activation: 'Introduce features that build on recent successes'
            });
        }
        return accelerators;
    }
    calculateFeatureRelevance(feature, patterns) {
        let relevance = 0;
        // Context relevance
        const userContexts = new Set(patterns.flatMap(p => p.context));
        const contextOverlap = feature.usageContext.filter(ctx => userContexts.has(ctx)).length;
        relevance += (contextOverlap / feature.usageContext.length) * 0.4;
        // Prerequisite satisfaction
        const userFeatures = new Set(patterns.flatMap(p => p.elements));
        const prerequisitesSatisfied = feature.prerequisites.filter(req => userFeatures.has(req)).length;
        relevance += (prerequisitesSatisfied / (feature.prerequisites.length || 1)) * 0.3;
        // Category relevance based on user patterns
        const categoryRelevance = this.calculateCategoryRelevance(feature.category, patterns);
        relevance += categoryRelevance * 0.3;
        return Math.min(1, relevance);
    }
    calculateCategoryRelevance(category, patterns) {
        // Simple category relevance based on user activity patterns
        const categoryScores = {
            [FeatureCategory.CORE]: 0.8,
            [FeatureCategory.PRODUCTIVITY]: 0.7,
            [FeatureCategory.COLLABORATION]: 0.6,
            [FeatureCategory.ANALYTICS]: 0.5,
            [FeatureCategory.CUSTOMIZATION]: 0.6,
            [FeatureCategory.INTEGRATION]: 0.4,
            [FeatureCategory.ADVANCED]: 0.3
        };
        return categoryScores[category] || 0.5;
    }
    calculateFeatureReadiness(feature, readiness) {
        let score = readiness.overallScore;
        // Adjust based on feature complexity
        const complexityPenalty = {
            [FeatureComplexity.SIMPLE]: 0,
            [FeatureComplexity.MODERATE]: 0.1,
            [FeatureComplexity.COMPLEX]: 0.2,
            [FeatureComplexity.EXPERT]: 0.3
        };
        score -= complexityPenalty[feature.complexity];
        // Adjust for blockers
        const blockerPenalty = readiness.blockers.reduce((penalty, blocker) => {
            const severityPenalty = {
                [BlockerSeverity.MINOR]: 0.05,
                [BlockerSeverity.MODERATE]: 0.1,
                [BlockerSeverity.MAJOR]: 0.2,
                [BlockerSeverity.CRITICAL]: 0.4
            };
            return penalty + severityPenalty[blocker.severity];
        }, 0);
        score -= blockerPenalty;
        // Boost for accelerators
        const acceleratorBoost = readiness.accelerators.reduce((boost, accelerator) => {
            const impactBoost = {
                [ImpactLevel.LOW]: 0.05,
                [ImpactLevel.MEDIUM]: 0.1,
                [ImpactLevel.HIGH]: 0.15,
                [ImpactLevel.TRANSFORMATIVE]: 0.2
            };
            return boost + impactBoost[accelerator.impact];
        }, 0);
        score += acceleratorBoost;
        return Math.max(0, Math.min(1, score));
    }
    async createFeatureIntroduction(userId, feature, relevanceScore, readinessScore, patterns) {
        const strategy = this.createIntroductionStrategy(feature, patterns);
        const timing = this.calculateOptimalTiming({ feature }, patterns);
        return {
            id: this.generateIntroductionId(),
            userId,
            feature,
            introduction: strategy,
            timing,
            readinessScore,
            relevanceScore,
            createdAt: Date.now(),
            status: IntroductionStatus.PENDING
        };
    }
    createIntroductionStrategy(feature, patterns) {
        // Choose strategy based on feature complexity and user patterns
        const userExperience = this.calculateExperienceScore(patterns);
        let type;
        let method;
        let interactivity;
        if (feature.complexity === FeatureComplexity.SIMPLE) {
            type = IntroductionType.TOOLTIP;
            method = IntroductionMethod.CONTEXTUAL;
            interactivity = InteractivityLevel.PASSIVE;
        }
        else if (userExperience > 0.7) {
            type = IntroductionType.INLINE_HINT;
            method = IntroductionMethod.PROACTIVE;
            interactivity = InteractivityLevel.INTERACTIVE;
        }
        else {
            type = IntroductionType.GUIDED_TOUR;
            method = IntroductionMethod.IMMERSIVE;
            interactivity = InteractivityLevel.GUIDED;
        }
        return {
            type,
            method,
            content: {
                title: `Introducing ${feature.name}`,
                description: feature.description,
                visualAids: [],
                examples: [],
                callToAction: {
                    text: 'Try it now',
                    action: ActionType.TRY_NOW,
                    target: feature.id,
                    parameters: {}
                }
            },
            interactivity,
            duration: feature.complexity === FeatureComplexity.SIMPLE ? 5000 : 15000,
            followUp: [
                {
                    trigger: FollowUpTrigger.AFTER_USE,
                    delay: 300000, // 5 minutes
                    action: ActionType.LEARN_MORE,
                    content: 'How was your experience with this feature?'
                }
            ]
        };
    }
    calculateOptimalTiming(introduction, patterns) {
        return {
            readinessIndicators: [
                {
                    type: ReadinessType.USER_EXPERIENCE,
                    threshold: 0.5,
                    weight: 0.3,
                    currentValue: this.calculateExperienceScore(patterns)
                }
            ],
            optimalMoments: [
                {
                    context: 'task_completion',
                    trigger: MomentTrigger.SUCCESS_MOMENT,
                    conditions: [],
                    priority: 1
                }
            ],
            avoidancePeriods: [
                {
                    reason: AvoidanceReason.HIGH_STRESS,
                    conditions: [
                        {
                            type: ConditionType.RECENT_ACTIVITY,
                            value: 10,
                            operator: ComparisonOperator.GREATER_THAN
                        }
                    ],
                    duration: 3600000 // 1 hour
                }
            ],
            frequency: IntroductionFrequency.ONCE
        };
    }
    async initializeFeatures() {
        const defaultFeatures = this.getDefaultFeatures();
        for (const feature of defaultFeatures) {
            await this.storeFeature(feature);
        }
    }
    getDefaultFeatures() {
        return [
            {
                id: 'advanced_search',
                name: 'Advanced Search',
                description: 'Use filters and operators for more precise search results',
                category: FeatureCategory.PRODUCTIVITY,
                complexity: FeatureComplexity.MODERATE,
                prerequisites: ['basic_search'],
                benefits: [
                    {
                        type: BenefitType.TIME_SAVING,
                        description: 'Find information 50% faster',
                        impact: ImpactLevel.HIGH,
                        measurable: true
                    }
                ],
                usageContext: ['search', 'data_analysis'],
                releaseDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
                adoptionRate: 0.3
            },
            {
                id: 'collaboration_tools',
                name: 'Real-time Collaboration',
                description: 'Work together with team members in real-time',
                category: FeatureCategory.COLLABORATION,
                complexity: FeatureComplexity.MODERATE,
                prerequisites: ['workspace_access'],
                benefits: [
                    {
                        type: BenefitType.COLLABORATION,
                        description: 'Improve team productivity by 40%',
                        impact: ImpactLevel.TRANSFORMATIVE,
                        measurable: true
                    }
                ],
                usageContext: ['teamwork', 'project_management'],
                releaseDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
                adoptionRate: 0.15
            }
        ];
    }
    async getAvailableFeatures() {
        const featureKeys = await this.redis.keys(`${this.FEATURE_PREFIX}:*`);
        const features = [];
        for (const key of featureKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                features.push(JSON.parse(data));
            }
        }
        return features;
    }
    async storeFeature(feature) {
        await this.redis.hset(`${this.FEATURE_PREFIX}:${feature.id}`, 'data', JSON.stringify(feature));
    }
    async storeFeatureIntroduction(introduction) {
        await this.redis.hset(`${this.INTRODUCTION_PREFIX}:${introduction.userId}:${introduction.id}`, 'data', JSON.stringify(introduction));
    }
    async storeUserReadiness(readiness) {
        await this.redis.hset(`${this.READINESS_PREFIX}:${readiness.userId}`, 'data', JSON.stringify(readiness));
    }
    generateIntroductionId() {
        return `intro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.FeatureIntroducer = FeatureIntroducer;
//# sourceMappingURL=feature-introducer.js.map