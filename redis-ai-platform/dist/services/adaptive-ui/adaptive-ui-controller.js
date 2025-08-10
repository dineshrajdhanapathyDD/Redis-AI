"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdaptiveUIController = exports.ErrorSeverity = exports.ErrorType = exports.AdaptationType = exports.ConstraintType = exports.AdaptationPriority = exports.LimitationSeverity = exports.PreferenceImportance = exports.NetworkSpeed = exports.NetworkType = exports.InputMethod = exports.ScreenOrientation = exports.DeviceType = exports.ExperienceLevel = void 0;
const logger_1 = require("../../utils/logger");
var ExperienceLevel;
(function (ExperienceLevel) {
    ExperienceLevel["BEGINNER"] = "beginner";
    ExperienceLevel["INTERMEDIATE"] = "intermediate";
    ExperienceLevel["ADVANCED"] = "advanced";
    ExperienceLevel["EXPERT"] = "expert";
})(ExperienceLevel || (exports.ExperienceLevel = ExperienceLevel = {}));
var DeviceType;
(function (DeviceType) {
    DeviceType["DESKTOP"] = "desktop";
    DeviceType["TABLET"] = "tablet";
    DeviceType["MOBILE"] = "mobile";
    DeviceType["TV"] = "tv";
    DeviceType["WEARABLE"] = "wearable";
})(DeviceType || (exports.DeviceType = DeviceType = {}));
var ScreenOrientation;
(function (ScreenOrientation) {
    ScreenOrientation["PORTRAIT"] = "portrait";
    ScreenOrientation["LANDSCAPE"] = "landscape";
})(ScreenOrientation || (exports.ScreenOrientation = ScreenOrientation = {}));
var InputMethod;
(function (InputMethod) {
    InputMethod["MOUSE"] = "mouse";
    InputMethod["TOUCH"] = "touch";
    InputMethod["KEYBOARD"] = "keyboard";
    InputMethod["VOICE"] = "voice";
    InputMethod["GESTURE"] = "gesture";
    InputMethod["EYE_TRACKING"] = "eye_tracking";
})(InputMethod || (exports.InputMethod = InputMethod = {}));
var NetworkType;
(function (NetworkType) {
    NetworkType["WIFI"] = "wifi";
    NetworkType["CELLULAR"] = "cellular";
    NetworkType["ETHERNET"] = "ethernet";
    NetworkType["SATELLITE"] = "satellite";
})(NetworkType || (exports.NetworkType = NetworkType = {}));
var NetworkSpeed;
(function (NetworkSpeed) {
    NetworkSpeed["SLOW"] = "slow";
    NetworkSpeed["MODERATE"] = "moderate";
    NetworkSpeed["FAST"] = "fast";
    NetworkSpeed["VERY_FAST"] = "very_fast";
})(NetworkSpeed || (exports.NetworkSpeed = NetworkSpeed = {}));
var PreferenceImportance;
(function (PreferenceImportance) {
    PreferenceImportance["LOW"] = "low";
    PreferenceImportance["MEDIUM"] = "medium";
    PreferenceImportance["HIGH"] = "high";
    PreferenceImportance["CRITICAL"] = "critical";
})(PreferenceImportance || (exports.PreferenceImportance = PreferenceImportance = {}));
var LimitationSeverity;
(function (LimitationSeverity) {
    LimitationSeverity["MINOR"] = "minor";
    LimitationSeverity["MODERATE"] = "moderate";
    LimitationSeverity["MAJOR"] = "major";
    LimitationSeverity["BLOCKING"] = "blocking";
})(LimitationSeverity || (exports.LimitationSeverity = LimitationSeverity = {}));
var AdaptationPriority;
(function (AdaptationPriority) {
    AdaptationPriority["LOW"] = "low";
    AdaptationPriority["MEDIUM"] = "medium";
    AdaptationPriority["HIGH"] = "high";
    AdaptationPriority["URGENT"] = "urgent";
})(AdaptationPriority || (exports.AdaptationPriority = AdaptationPriority = {}));
var ConstraintType;
(function (ConstraintType) {
    ConstraintType["PERFORMANCE"] = "performance";
    ConstraintType["ACCESSIBILITY"] = "accessibility";
    ConstraintType["BRANDING"] = "branding";
    ConstraintType["TECHNICAL"] = "technical";
    ConstraintType["BUSINESS"] = "business";
})(ConstraintType || (exports.ConstraintType = ConstraintType = {}));
var AdaptationType;
(function (AdaptationType) {
    AdaptationType["LAYOUT"] = "layout";
    AdaptationType["STYLING"] = "styling";
    AdaptationType["BEHAVIOR"] = "behavior";
    AdaptationType["CONTENT"] = "content";
    AdaptationType["NAVIGATION"] = "navigation";
    AdaptationType["ACCESSIBILITY"] = "accessibility";
})(AdaptationType || (exports.AdaptationType = AdaptationType = {}));
var ErrorType;
(function (ErrorType) {
    ErrorType["VALIDATION"] = "validation";
    ErrorType["EXECUTION"] = "execution";
    ErrorType["CONFLICT"] = "conflict";
    ErrorType["RESOURCE"] = "resource";
})(ErrorType || (exports.ErrorType = ErrorType = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["WARNING"] = "warning";
    ErrorSeverity["ERROR"] = "error";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class AdaptiveUIController {
    redis;
    interactionTracker;
    uiPersonalizer;
    contextualAssistant;
    featureIntroducer;
    workflowSuggester;
    accessibilityAdapter;
    STATE_PREFIX = 'adaptive_ui_state';
    constructor(redis, interactionTracker, uiPersonalizer, contextualAssistant, featureIntroducer, workflowSuggester, accessibilityAdapter) {
        this.redis = redis;
        this.interactionTracker = interactionTracker;
        this.uiPersonalizer = uiPersonalizer;
        this.contextualAssistant = contextualAssistant;
        this.featureIntroducer = featureIntroducer;
        this.workflowSuggester = workflowSuggester;
        this.accessibilityAdapter = accessibilityAdapter;
    }
    async initialize() {
        logger_1.logger.info('Initializing Adaptive UI Controller');
        logger_1.logger.info('Adaptive UI Controller initialized');
    }
    async shutdown() {
        logger_1.logger.info('Adaptive UI Controller shutdown complete');
    }
    async processAdaptationRequest(request) {
        const startTime = Date.now();
        const adaptations = [];
        const errors = [];
        try {
            // Get current UI state
            const state = await this.getUIState(request.userId);
            // Generate adaptations based on context and constraints
            const personalizations = await this.generatePersonalizations(request, state);
            const accessibilityAdaptations = await this.generateAccessibilityAdaptations(request, state);
            const workflowOptimizations = await this.generateWorkflowOptimizations(request, state);
            // Apply adaptations
            for (const personalization of personalizations) {
                try {
                    const applied = await this.applyPersonalization(personalization, request.context);
                    adaptations.push(applied);
                }
                catch (error) {
                    errors.push({
                        type: ErrorType.EXECUTION,
                        message: error.message,
                        component: personalization.component,
                        severity: ErrorSeverity.ERROR
                    });
                }
            }
            for (const accessibilityAdaptation of accessibilityAdaptations) {
                try {
                    const applied = await this.applyAccessibilityAdaptation(accessibilityAdaptation, request.context);
                    adaptations.push(applied);
                }
                catch (error) {
                    errors.push({
                        type: ErrorType.EXECUTION,
                        message: error.message,
                        component: accessibilityAdaptation.target.component,
                        severity: ErrorSeverity.ERROR
                    });
                }
            }
            // Update UI state
            await this.updateUIState(request.userId, state);
            const executionTime = Date.now() - startTime;
            return {
                success: errors.length === 0,
                adaptations,
                errors,
                metrics: {
                    executionTime,
                    adaptationsApplied: adaptations.length,
                    errorsEncountered: errors.length,
                    performanceImpact: this.calculatePerformanceImpact(adaptations),
                    userSatisfactionScore: this.calculateSatisfactionScore(adaptations)
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Failed to process adaptation request:', error);
            return {
                success: false,
                adaptations: [],
                errors: [{
                        type: ErrorType.EXECUTION,
                        message: error.message,
                        component: 'controller',
                        severity: ErrorSeverity.CRITICAL
                    }],
                metrics: {
                    executionTime: Date.now() - startTime,
                    adaptationsApplied: 0,
                    errorsEncountered: 1,
                    performanceImpact: 0,
                    userSatisfactionScore: 0
                }
            };
        }
    }
    async getUIState(userId) {
        const stateData = await this.redis.hget(`${this.STATE_PREFIX}:${userId}`, 'data');
        if (stateData) {
            return JSON.parse(stateData);
        }
        // Create initial state
        const preferences = await this.interactionTracker.getUserPreferences(userId);
        const patterns = await this.interactionTracker.getUsagePatterns(userId);
        const accessibilityProfile = await this.accessibilityAdapter.createAccessibilityProfile(userId, preferences);
        const initialState = {
            userId,
            preferences,
            patterns,
            personalizations: [],
            assistanceContext: {
                userId,
                currentTask: '',
                strugglingAreas: [],
                helpHistory: [],
                preferences: {
                    proactiveHelp: true,
                    tutorialStyle: 'interactive',
                    helpFrequency: 'moderate'
                },
                lastUpdated: Date.now()
            },
            features: [],
            workflows: [],
            accessibility: accessibilityProfile,
            lastUpdated: Date.now()
        };
        await this.updateUIState(userId, initialState);
        return initialState;
    }
    async generatePersonalizations(request, state) {
        return await this.uiPersonalizer.generatePersonalizationSuggestions(request.userId, state.patterns);
    }
    async generateAccessibilityAdaptations(request, state) {
        return await this.accessibilityAdapter.generateAdaptations(request.userId, state.accessibility);
    }
    async generateWorkflowOptimizations(request, state) {
        return await this.workflowSuggester.generateAutomationSuggestions(request.userId, state.patterns);
    }
    async applyPersonalization(personalization, context) {
        // In a real implementation, this would apply the personalization to the UI
        logger_1.logger.info(`Applying personalization: ${personalization.type} to ${personalization.component}`);
        return {
            type: AdaptationType.LAYOUT,
            component: personalization.component,
            changes: [
                {
                    property: 'layout',
                    oldValue: 'default',
                    newValue: personalization.suggestion,
                    reason: personalization.reason
                }
            ],
            impact: {
                usability: personalization.impact.usabilityImprovement,
                performance: personalization.impact.performanceImpact,
                accessibility: 0,
                satisfaction: personalization.impact.userSatisfaction
            }
        };
    }
    async applyAccessibilityAdaptation(adaptation, context) {
        // In a real implementation, this would apply the accessibility adaptation
        logger_1.logger.info(`Applying accessibility adaptation: ${adaptation.adaptationType} to ${adaptation.target.component}`);
        return {
            type: AdaptationType.ACCESSIBILITY,
            component: adaptation.target.component,
            changes: adaptation.modifications.map(mod => ({
                property: mod.property,
                oldValue: mod.originalValue,
                newValue: mod.adaptedValue,
                reason: adaptation.reason.userNeed.description
            })),
            impact: {
                usability: adaptation.impact.usability.taskCompletionRate,
                performance: adaptation.impact.performance.loadTimeChange,
                accessibility: adaptation.impact.compliance.riskReduction,
                satisfaction: adaptation.impact.user.feedbackScore
            }
        };
    }
    async updateUIState(userId, state) {
        state.lastUpdated = Date.now();
        await this.redis.hset(`${this.STATE_PREFIX}:${userId}`, 'data', JSON.stringify(state));
    }
    calculatePerformanceImpact(adaptations) {
        if (adaptations.length === 0)
            return 0;
        const totalImpact = adaptations.reduce((sum, adaptation) => sum + adaptation.impact.performance, 0);
        return totalImpact / adaptations.length;
    }
    calculateSatisfactionScore(adaptations) {
        if (adaptations.length === 0)
            return 0;
        const totalSatisfaction = adaptations.reduce((sum, adaptation) => sum + adaptation.impact.satisfaction, 0);
        return totalSatisfaction / adaptations.length;
    }
}
exports.AdaptiveUIController = AdaptiveUIController;
//# sourceMappingURL=adaptive-ui-controller.js.map