"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityAdapter = exports.CriterionStatus = exports.AssistiveTechType = exports.BenefitLevel = exports.EvidenceType = exports.ComplianceLevel = exports.NeedSeverity = exports.NeedCategory = exports.AccessibilityTrigger = exports.BehaviorType = exports.AdaptationScope = exports.TargetType = exports.AdaptationType = void 0;
const logger_1 = require("../../utils/logger");
var AdaptationType;
(function (AdaptationType) {
    AdaptationType["VISUAL"] = "visual";
    AdaptationType["MOTOR"] = "motor";
    AdaptationType["COGNITIVE"] = "cognitive";
    AdaptationType["AUDITORY"] = "auditory";
    AdaptationType["MULTI_MODAL"] = "multi_modal";
})(AdaptationType || (exports.AdaptationType = AdaptationType = {}));
var TargetType;
(function (TargetType) {
    TargetType["ELEMENT"] = "element";
    TargetType["COMPONENT"] = "component";
    TargetType["PAGE"] = "page";
    TargetType["GLOBAL"] = "global";
})(TargetType || (exports.TargetType = TargetType = {}));
var AdaptationScope;
(function (AdaptationScope) {
    AdaptationScope["SINGLE_ELEMENT"] = "single_element";
    AdaptationScope["COMPONENT_GROUP"] = "component_group";
    AdaptationScope["PAGE_WIDE"] = "page_wide";
    AdaptationScope["APPLICATION_WIDE"] = "application_wide";
})(AdaptationScope || (exports.AdaptationScope = AdaptationScope = {}));
var BehaviorType;
(function (BehaviorType) {
    BehaviorType["KEYBOARD_NAVIGATION"] = "keyboard_navigation";
    BehaviorType["FOCUS_MANAGEMENT"] = "focus_management";
    BehaviorType["SCREEN_READER"] = "screen_reader";
    BehaviorType["VOICE_CONTROL"] = "voice_control";
    BehaviorType["GESTURE_CONTROL"] = "gesture_control";
})(BehaviorType || (exports.BehaviorType = BehaviorType = {}));
var AccessibilityTrigger;
(function (AccessibilityTrigger) {
    AccessibilityTrigger["USER_PREFERENCE"] = "user_preference";
    AccessibilityTrigger["SYSTEM_DETECTION"] = "system_detection";
    AccessibilityTrigger["USAGE_PATTERN"] = "usage_pattern";
    AccessibilityTrigger["ERROR_PATTERN"] = "error_pattern";
    AccessibilityTrigger["ASSISTIVE_TECHNOLOGY"] = "assistive_technology";
})(AccessibilityTrigger || (exports.AccessibilityTrigger = AccessibilityTrigger = {}));
var NeedCategory;
(function (NeedCategory) {
    NeedCategory["VISUAL_IMPAIRMENT"] = "visual_impairment";
    NeedCategory["HEARING_IMPAIRMENT"] = "hearing_impairment";
    NeedCategory["MOTOR_IMPAIRMENT"] = "motor_impairment";
    NeedCategory["COGNITIVE_IMPAIRMENT"] = "cognitive_impairment";
    NeedCategory["TEMPORARY_DISABILITY"] = "temporary_disability";
    NeedCategory["SITUATIONAL_DISABILITY"] = "situational_disability";
})(NeedCategory || (exports.NeedCategory = NeedCategory = {}));
var NeedSeverity;
(function (NeedSeverity) {
    NeedSeverity["MILD"] = "mild";
    NeedSeverity["MODERATE"] = "moderate";
    NeedSeverity["SEVERE"] = "severe";
    NeedSeverity["PROFOUND"] = "profound";
})(NeedSeverity || (exports.NeedSeverity = NeedSeverity = {}));
var ComplianceLevel;
(function (ComplianceLevel) {
    ComplianceLevel["A"] = "A";
    ComplianceLevel["AA"] = "AA";
    ComplianceLevel["AAA"] = "AAA";
})(ComplianceLevel || (exports.ComplianceLevel = ComplianceLevel = {}));
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["USER_AGENT"] = "user_agent";
    EvidenceType["ASSISTIVE_TECH"] = "assistive_tech";
    EvidenceType["INTERACTION_PATTERN"] = "interaction_pattern";
    EvidenceType["ERROR_RATE"] = "error_rate";
    EvidenceType["TIME_ON_TASK"] = "time_on_task";
    EvidenceType["USER_FEEDBACK"] = "user_feedback";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
var BenefitLevel;
(function (BenefitLevel) {
    BenefitLevel["MINIMAL"] = "minimal";
    BenefitLevel["MODERATE"] = "moderate";
    BenefitLevel["SIGNIFICANT"] = "significant";
    BenefitLevel["TRANSFORMATIVE"] = "transformative";
})(BenefitLevel || (exports.BenefitLevel = BenefitLevel = {}));
var AssistiveTechType;
(function (AssistiveTechType) {
    AssistiveTechType["SCREEN_READER"] = "screen_reader";
    AssistiveTechType["MAGNIFIER"] = "magnifier";
    AssistiveTechType["VOICE_CONTROL"] = "voice_control";
    AssistiveTechType["SWITCH_CONTROL"] = "switch_control";
    AssistiveTechType["EYE_TRACKING"] = "eye_tracking";
    AssistiveTechType["KEYBOARD_ALTERNATIVE"] = "keyboard_alternative";
})(AssistiveTechType || (exports.AssistiveTechType = AssistiveTechType = {}));
var CriterionStatus;
(function (CriterionStatus) {
    CriterionStatus["PASS"] = "pass";
    CriterionStatus["FAIL"] = "fail";
    CriterionStatus["NOT_APPLICABLE"] = "not_applicable";
    CriterionStatus["NEEDS_REVIEW"] = "needs_review";
})(CriterionStatus || (exports.CriterionStatus = CriterionStatus = {}));
class AccessibilityAdapter {
    redis;
    ADAPTATION_PREFIX = 'accessibility_adaptation';
    PROFILE_PREFIX = 'accessibility_profile';
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Accessibility Adapter');
        logger_1.logger.info('Accessibility Adapter initialized');
    }
    async shutdown() {
        logger_1.logger.info('Accessibility Adapter shutdown complete');
    }
    async createAccessibilityProfile(userId, preferences) {
        const needs = await this.assessAccessibilityNeeds(preferences);
        const assistiveTechnology = await this.detectAssistiveTechnology(userId);
        const compliance = await this.assessCompliance(userId);
        const profile = {
            userId,
            needs,
            preferences: preferences.accessibility,
            assistiveTechnology,
            adaptations: [],
            compliance,
            lastUpdated: Date.now()
        };
        await this.storeAccessibilityProfile(profile);
        return profile;
    }
    async generateAdaptations(userId, profile) {
        const adaptations = [];
        // Generate visual adaptations
        const visualAdaptations = await this.generateVisualAdaptations(profile);
        adaptations.push(...visualAdaptations);
        // Generate motor adaptations
        const motorAdaptations = await this.generateMotorAdaptations(profile);
        adaptations.push(...motorAdaptations);
        // Generate cognitive adaptations
        const cognitiveAdaptations = await this.generateCognitiveAdaptations(profile);
        adaptations.push(...cognitiveAdaptations);
        // Store adaptations
        for (const adaptation of adaptations) {
            await this.storeAdaptation(adaptation);
        }
        return adaptations;
    }
    async assessAccessibilityNeeds(preferences) {
        const needs = [];
        const accessibility = preferences.accessibility;
        // Visual needs
        if (accessibility.highContrast || accessibility.largeText) {
            needs.push({
                category: NeedCategory.VISUAL_IMPAIRMENT,
                severity: accessibility.largeText ? NeedSeverity.MODERATE : NeedSeverity.MILD,
                description: 'User requires enhanced visual accessibility',
                standards: [
                    {
                        name: 'WCAG 2.1',
                        level: ComplianceLevel.AA,
                        criteria: ['1.4.3', '1.4.4', '1.4.6'],
                        guidelines: ['Contrast', 'Resize text', 'Enhanced contrast']
                    }
                ]
            });
        }
        return needs;
    }
    async detectAssistiveTechnology(userId) {
        // Simplified detection for demo
        return [];
    }
    async assessCompliance(userId) {
        return {
            currentLevel: ComplianceLevel.A,
            targetLevel: ComplianceLevel.AA,
            criteriaStatus: [],
            overallScore: 0.75,
            lastAssessment: Date.now()
        };
    }
    async generateVisualAdaptations(profile) {
        const adaptations = [];
        const preferences = profile.preferences;
        if (preferences.highContrast) {
            adaptations.push({
                id: this.generateAdaptationId(),
                userId: profile.userId,
                adaptationType: AdaptationType.VISUAL,
                target: {
                    type: TargetType.GLOBAL,
                    selector: 'body',
                    component: 'application',
                    scope: AdaptationScope.APPLICATION_WIDE
                },
                modifications: [
                    {
                        property: 'filter',
                        originalValue: 'none',
                        adaptedValue: 'contrast(150%) brightness(120%)',
                        cssRule: 'body { filter: contrast(150%) brightness(120%); }'
                    }
                ],
                reason: {
                    trigger: AccessibilityTrigger.USER_PREFERENCE,
                    userNeed: {
                        category: NeedCategory.VISUAL_IMPAIRMENT,
                        severity: NeedSeverity.MODERATE,
                        description: 'User requires high contrast for better visibility',
                        standards: []
                    },
                    evidence: [],
                    confidence: 1.0
                },
                impact: {
                    usability: {
                        taskCompletionRate: 25,
                        errorReduction: 30,
                        timeToComplete: -15,
                        userSatisfaction: 40
                    },
                    compliance: {
                        wcagLevel: ComplianceLevel.AA,
                        criteriaImproved: ['1.4.6'],
                        riskReduction: 80
                    },
                    performance: {
                        loadTimeChange: 0,
                        renderTimeChange: 5,
                        memoryUsageChange: 0,
                        bandwidthChange: 0
                    },
                    user: {
                        affectedUsers: 1,
                        benefitLevel: BenefitLevel.SIGNIFICANT,
                        adoptionRate: 1.0,
                        feedbackScore: 4.5
                    }
                },
                appliedAt: 0,
                active: false
            });
        }
        return adaptations;
    }
    async generateMotorAdaptations(profile) {
        return [];
    }
    async generateCognitiveAdaptations(profile) {
        return [];
    }
    async storeAccessibilityProfile(profile) {
        await this.redis.hset(`${this.PROFILE_PREFIX}:${profile.userId}`, 'data', JSON.stringify(profile));
    }
    async storeAdaptation(adaptation) {
        await this.redis.hset(`${this.ADAPTATION_PREFIX}:${adaptation.userId}:${adaptation.id}`, 'data', JSON.stringify(adaptation));
    }
    generateAdaptationId() {
        return `adaptation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AccessibilityAdapter = AccessibilityAdapter;
//# sourceMappingURL=accessibility-adapter.js.map