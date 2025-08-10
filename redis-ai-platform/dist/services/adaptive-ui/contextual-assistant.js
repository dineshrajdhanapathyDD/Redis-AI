"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextualAssistant = exports.ResolutionMethod = exports.StruggeSeverity = exports.IndicatorType = exports.StruggleType = exports.Importance = exports.TriggerFrequency = exports.ComparisonOperator = exports.ConditionType = exports.TriggerEvent = exports.TipType = exports.ValidationType = exports.Difficulty = exports.HelpCategory = exports.Priority = exports.ActionType = exports.SuggestionType = void 0;
const logger_1 = require("../../utils/logger");
var SuggestionType;
(function (SuggestionType) {
    SuggestionType["NEXT_STEP"] = "next_step";
    SuggestionType["ALTERNATIVE_PATH"] = "alternative_path";
    SuggestionType["SHORTCUT"] = "shortcut";
    SuggestionType["FEATURE_DISCOVERY"] = "feature_discovery";
    SuggestionType["TROUBLESHOOTING"] = "troubleshooting";
    SuggestionType["BEST_PRACTICE"] = "best_practice";
})(SuggestionType || (exports.SuggestionType = SuggestionType = {}));
var ActionType;
(function (ActionType) {
    ActionType["NAVIGATE"] = "navigate";
    ActionType["CLICK"] = "click";
    ActionType["HIGHLIGHT"] = "highlight";
    ActionType["SHOW_TUTORIAL"] = "show_tutorial";
    ActionType["OPEN_HELP"] = "open_help";
    ActionType["EXECUTE_COMMAND"] = "execute_command";
})(ActionType || (exports.ActionType = ActionType = {}));
var Priority;
(function (Priority) {
    Priority["CRITICAL"] = "critical";
    Priority["HIGH"] = "high";
    Priority["MEDIUM"] = "medium";
    Priority["LOW"] = "low";
})(Priority || (exports.Priority = Priority = {}));
var HelpCategory;
(function (HelpCategory) {
    HelpCategory["NAVIGATION"] = "navigation";
    HelpCategory["FUNCTIONALITY"] = "functionality";
    HelpCategory["EFFICIENCY"] = "efficiency";
    HelpCategory["TROUBLESHOOTING"] = "troubleshooting";
    HelpCategory["LEARNING"] = "learning";
})(HelpCategory || (exports.HelpCategory = HelpCategory = {}));
var Difficulty;
(function (Difficulty) {
    Difficulty["BEGINNER"] = "beginner";
    Difficulty["INTERMEDIATE"] = "intermediate";
    Difficulty["ADVANCED"] = "advanced";
})(Difficulty || (exports.Difficulty = Difficulty = {}));
var ValidationType;
(function (ValidationType) {
    ValidationType["ELEMENT_EXISTS"] = "element_exists";
    ValidationType["ELEMENT_VISIBLE"] = "element_visible";
    ValidationType["VALUE_EQUALS"] = "value_equals";
    ValidationType["PAGE_LOADED"] = "page_loaded";
    ValidationType["CUSTOM"] = "custom";
})(ValidationType || (exports.ValidationType = ValidationType = {}));
var TipType;
(function (TipType) {
    TipType["FEATURE_HIGHLIGHT"] = "feature_highlight";
    TipType["EFFICIENCY_TIP"] = "efficiency_tip";
    TipType["KEYBOARD_SHORTCUT"] = "keyboard_shortcut";
    TipType["BEST_PRACTICE"] = "best_practice";
    TipType["WARNING"] = "warning";
    TipType["CELEBRATION"] = "celebration";
})(TipType || (exports.TipType = TipType = {}));
var TriggerEvent;
(function (TriggerEvent) {
    TriggerEvent["PAGE_LOAD"] = "page_load";
    TriggerEvent["ELEMENT_HOVER"] = "element_hover";
    TriggerEvent["ACTION_COMPLETE"] = "action_complete";
    TriggerEvent["ERROR_OCCURRED"] = "error_occurred";
    TriggerEvent["TIME_SPENT"] = "time_spent";
    TriggerEvent["PATTERN_DETECTED"] = "pattern_detected";
})(TriggerEvent || (exports.TriggerEvent = TriggerEvent = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["USER_LEVEL"] = "user_level";
    ConditionType["FEATURE_USAGE"] = "feature_usage";
    ConditionType["TIME_OF_DAY"] = "time_of_day";
    ConditionType["SESSION_LENGTH"] = "session_length";
    ConditionType["ERROR_COUNT"] = "error_count";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["EQUALS"] = "equals";
    ComparisonOperator["GREATER_THAN"] = "greater_than";
    ComparisonOperator["LESS_THAN"] = "less_than";
    ComparisonOperator["CONTAINS"] = "contains";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var TriggerFrequency;
(function (TriggerFrequency) {
    TriggerFrequency["ONCE"] = "once";
    TriggerFrequency["DAILY"] = "daily";
    TriggerFrequency["WEEKLY"] = "weekly";
    TriggerFrequency["ALWAYS"] = "always";
})(TriggerFrequency || (exports.TriggerFrequency = TriggerFrequency = {}));
var Importance;
(function (Importance) {
    Importance["CRITICAL"] = "critical";
    Importance["HIGH"] = "high";
    Importance["MEDIUM"] = "medium";
    Importance["LOW"] = "low";
})(Importance || (exports.Importance = Importance = {}));
var StruggleType;
(function (StruggleType) {
    StruggleType["NAVIGATION_CONFUSION"] = "navigation_confusion";
    StruggleType["FEATURE_DISCOVERY"] = "feature_discovery";
    StruggleType["TASK_COMPLETION"] = "task_completion";
    StruggleType["ERROR_RECOVERY"] = "error_recovery";
    StruggleType["EFFICIENCY_ISSUE"] = "efficiency_issue";
})(StruggleType || (exports.StruggleType = StruggleType = {}));
var IndicatorType;
(function (IndicatorType) {
    IndicatorType["TIME_SPENT"] = "time_spent";
    IndicatorType["CLICK_COUNT"] = "click_count";
    IndicatorType["ERROR_RATE"] = "error_rate";
    IndicatorType["HELP_REQUESTS"] = "help_requests";
    IndicatorType["BACKTRACK_COUNT"] = "backtrack_count";
    IndicatorType["HOVER_TIME"] = "hover_time";
})(IndicatorType || (exports.IndicatorType = IndicatorType = {}));
var StruggeSeverity;
(function (StruggeSeverity) {
    StruggeSeverity["MINOR"] = "minor";
    StruggeSeverity["MODERATE"] = "moderate";
    StruggeSeverity["MAJOR"] = "major";
    StruggeSeverity["CRITICAL"] = "critical";
})(StruggeSeverity || (exports.StruggeSeverity = StruggeSeverity = {}));
var ResolutionMethod;
(function (ResolutionMethod) {
    ResolutionMethod["CONTEXTUAL_HELP"] = "contextual_help";
    ResolutionMethod["TUTORIAL"] = "tutorial";
    ResolutionMethod["DIRECT_ASSISTANCE"] = "direct_assistance";
    ResolutionMethod["SELF_RESOLVED"] = "self_resolved";
})(ResolutionMethod || (exports.ResolutionMethod = ResolutionMethod = {}));
class ContextualAssistant {
    redis;
    HELP_PREFIX = 'contextual_help';
    STRUGGLE_PREFIX = 'user_struggle';
    TIP_PREFIX = 'contextual_tip';
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Contextual Assistant');
        // Initialize default tutorials and tips
        await this.initializeDefaultContent();
        logger_1.logger.info('Contextual Assistant initialized');
    }
    async shutdown() {
        logger_1.logger.info('Contextual Assistant shutdown complete');
    }
    async generateContextualHelp(userId, context, patterns) {
        // Analyze current context and user patterns
        const suggestions = await this.generateSuggestions(context, patterns);
        const tutorials = await this.findRelevantTutorials(context, patterns);
        const tips = await this.generateContextualTips(context, patterns);
        const relevanceScore = this.calculateRelevanceScore(context, patterns);
        const help = {
            id: this.generateHelpId(),
            userId,
            context,
            suggestions,
            tutorials,
            tips,
            generatedAt: Date.now(),
            relevanceScore
        };
        await this.storeContextualHelp(help);
        return help;
    }
    async detectUserStruggle(userId, recentInteractions) {
        const indicators = this.analyzeStruggleIndicators(recentInteractions);
        const struggleType = this.identifyStruggleType(indicators);
        if (!struggleType)
            return null;
        const severity = this.calculateStruggeSeverity(indicators);
        const struggle = {
            userId,
            context: recentInteractions[0]?.context.page || 'unknown',
            issue: struggleType,
            indicators,
            severity,
            detectedAt: Date.now(),
            resolved: false
        };
        await this.storeUserStruggle(struggle);
        return struggle;
    }
    async provideProactiveHelp(userId, currentContext) {
        // Check if user might need help based on context
        const needsHelp = this.assessHelpNeed(currentContext);
        if (!needsHelp)
            return null;
        // Generate proactive help
        const patterns = await this.getUserPatterns(userId);
        return this.generateContextualHelp(userId, currentContext, patterns);
    }
    async generateSuggestions(context, patterns) {
        const suggestions = [];
        // Next step suggestions based on current task
        if (context.currentTask) {
            const nextSteps = this.getNextStepSuggestions(context.currentTask);
            suggestions.push(...nextSteps);
        }
        // Shortcut suggestions based on patterns
        const shortcutSuggestions = this.getShortcutSuggestions(patterns);
        suggestions.push(...shortcutSuggestions);
        // Troubleshooting suggestions if errors detected
        if (context.errorCount > 0) {
            const troubleshooting = this.getTroubleshootingSuggestions(context);
            suggestions.push(...troubleshooting);
        }
        return suggestions.sort((a, b) => b.confidence - a.confidence);
    }
    getNextStepSuggestions(currentTask) {
        const taskSteps = {
            'create_project': [
                {
                    title: 'Add project details',
                    description: 'Fill in the project name and description',
                    target: 'project-form'
                },
                {
                    title: 'Configure settings',
                    description: 'Set up project configuration options',
                    target: 'settings-panel'
                }
            ],
            'search_data': [
                {
                    title: 'Refine search filters',
                    description: 'Use filters to narrow down your results',
                    target: 'search-filters'
                },
                {
                    title: 'Save search query',
                    description: 'Save this search for future use',
                    target: 'save-search-button'
                }
            ]
        };
        const steps = taskSteps[currentTask] || [];
        return steps.map((step, index) => ({
            id: `next_step_${index}`,
            type: SuggestionType.NEXT_STEP,
            title: step.title,
            description: step.description,
            action: {
                type: ActionType.HIGHLIGHT,
                target: step.target,
                parameters: {},
                description: `Highlight ${step.target}`
            },
            confidence: 0.8,
            priority: Priority.HIGH,
            category: HelpCategory.NAVIGATION
        }));
    }
    getShortcutSuggestions(patterns) {
        const suggestions = [];
        const frequentActions = patterns.filter(p => p.frequency > 20);
        frequentActions.forEach(pattern => {
            suggestions.push({
                id: `shortcut_${pattern.elements[0]}`,
                type: SuggestionType.SHORTCUT,
                title: 'Use keyboard shortcut',
                description: `Press Ctrl+${pattern.elements[0].charAt(0).toUpperCase()} for ${pattern.elements[0]}`,
                action: {
                    type: ActionType.SHOW_TUTORIAL,
                    target: 'keyboard-shortcuts',
                    parameters: { action: pattern.elements[0] },
                    description: 'Show keyboard shortcuts tutorial'
                },
                confidence: pattern.confidence,
                priority: Priority.MEDIUM,
                category: HelpCategory.EFFICIENCY
            });
        });
        return suggestions;
    }
    getTroubleshootingSuggestions(context) {
        return [
            {
                id: 'troubleshoot_errors',
                type: SuggestionType.TROUBLESHOOTING,
                title: 'Resolve errors',
                description: `You've encountered ${context.errorCount} errors. Let me help you fix them.`,
                action: {
                    type: ActionType.OPEN_HELP,
                    target: 'error-help',
                    parameters: { errorCount: context.errorCount },
                    description: 'Open error troubleshooting guide'
                },
                confidence: 0.9,
                priority: Priority.HIGH,
                category: HelpCategory.TROUBLESHOOTING
            }
        ];
    }
    async findRelevantTutorials(context, patterns) {
        // Get all available tutorials
        const allTutorials = await this.getAllTutorials();
        // Score tutorials based on relevance to current context
        const scoredTutorials = allTutorials.map(tutorial => ({
            ...tutorial,
            relevanceScore: this.calculateTutorialRelevance(tutorial, context, patterns)
        }));
        // Return top 3 most relevant tutorials
        return scoredTutorials
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, 3);
    }
    calculateTutorialRelevance(tutorial, context, patterns) {
        let score = 0;
        // Context relevance
        if (tutorial.title.toLowerCase().includes(context.currentTask.toLowerCase())) {
            score += 0.5;
        }
        // Pattern relevance
        const tutorialElements = tutorial.steps.map(step => step.action.target);
        const userElements = patterns.flatMap(p => p.elements);
        const overlap = tutorialElements.filter(el => userElements.includes(el)).length;
        score += (overlap / tutorialElements.length) * 0.3;
        // Difficulty appropriateness
        const userExperience = this.estimateUserExperience(patterns);
        if (tutorial.difficulty === Difficulty.BEGINNER && userExperience < 0.3)
            score += 0.2;
        if (tutorial.difficulty === Difficulty.INTERMEDIATE && userExperience >= 0.3 && userExperience < 0.7)
            score += 0.2;
        if (tutorial.difficulty === Difficulty.ADVANCED && userExperience >= 0.7)
            score += 0.2;
        return Math.min(1, score);
    }
    estimateUserExperience(patterns) {
        const totalInteractions = patterns.reduce((sum, p) => sum + p.frequency, 0);
        const uniqueFeatures = new Set(patterns.flatMap(p => p.elements)).size;
        // Simple experience estimation based on interaction volume and feature diversity
        return Math.min(1, (totalInteractions / 1000) * 0.7 + (uniqueFeatures / 50) * 0.3);
    }
    async generateContextualTips(context, patterns) {
        const tips = [];
        // Feature highlight tips for unused features
        const unusedFeatures = this.identifyUnusedFeatures(patterns);
        unusedFeatures.forEach(feature => {
            tips.push({
                id: `tip_${feature}`,
                type: TipType.FEATURE_HIGHLIGHT,
                title: `Try ${feature}`,
                content: `${feature} can help you work more efficiently`,
                trigger: {
                    event: TriggerEvent.PAGE_LOAD,
                    conditions: [],
                    frequency: TriggerFrequency.WEEKLY
                },
                displayConditions: [],
                dismissible: true,
                importance: Importance.MEDIUM
            });
        });
        // Efficiency tips based on patterns
        const inefficiencies = this.identifyInefficiencies(patterns);
        inefficiencies.forEach(inefficiency => {
            tips.push({
                id: `efficiency_${inefficiency.action}`,
                type: TipType.EFFICIENCY_TIP,
                title: 'Work smarter',
                content: inefficiency.suggestion,
                trigger: {
                    event: TriggerEvent.PATTERN_DETECTED,
                    conditions: [
                        {
                            type: ConditionType.FEATURE_USAGE,
                            value: inefficiency.action,
                            operator: ComparisonOperator.GREATER_THAN
                        }
                    ],
                    frequency: TriggerFrequency.ONCE
                },
                displayConditions: [],
                dismissible: true,
                importance: Importance.HIGH
            });
        });
        return tips;
    }
    identifyUnusedFeatures(patterns) {
        const usedFeatures = new Set(patterns.flatMap(p => p.elements));
        const allFeatures = ['search', 'filters', 'export', 'share', 'collaborate', 'automate'];
        return allFeatures.filter(feature => !usedFeatures.has(feature));
    }
    identifyInefficiencies(patterns) {
        const inefficiencies = [];
        patterns.forEach(pattern => {
            if (pattern.frequency > 50 && pattern.pattern === 'workflow_sequence') {
                inefficiencies.push({
                    action: pattern.elements.join('_'),
                    suggestion: `Consider creating a shortcut for this common workflow: ${pattern.elements.join(' → ')}`
                });
            }
        });
        return inefficiencies;
    }
    analyzeStruggleIndicators(interactions) {
        const indicators = [];
        // Time spent indicator
        const totalTime = interactions.reduce((sum, i) => sum + (i.metadata.duration || 0), 0);
        if (totalTime > 300000) { // 5 minutes
            indicators.push({
                type: IndicatorType.TIME_SPENT,
                value: totalTime,
                threshold: 300000,
                weight: 0.3
            });
        }
        // Error rate indicator
        const errors = interactions.filter(i => i.metadata.errorOccurred).length;
        const errorRate = errors / interactions.length;
        if (errorRate > 0.1) {
            indicators.push({
                type: IndicatorType.ERROR_RATE,
                value: errorRate,
                threshold: 0.1,
                weight: 0.4
            });
        }
        // Click count indicator (excessive clicking might indicate confusion)
        const clicks = interactions.filter(i => i.type === 'click').length;
        if (clicks > 20) {
            indicators.push({
                type: IndicatorType.CLICK_COUNT,
                value: clicks,
                threshold: 20,
                weight: 0.2
            });
        }
        return indicators;
    }
    identifyStruggleType(indicators) {
        if (indicators.length === 0)
            return null;
        // Simple rule-based struggle type identification
        const hasTimeIssue = indicators.some(i => i.type === IndicatorType.TIME_SPENT);
        const hasErrorIssue = indicators.some(i => i.type === IndicatorType.ERROR_RATE);
        const hasClickIssue = indicators.some(i => i.type === IndicatorType.CLICK_COUNT);
        if (hasErrorIssue)
            return StruggleType.ERROR_RECOVERY;
        if (hasTimeIssue && hasClickIssue)
            return StruggleType.NAVIGATION_CONFUSION;
        if (hasTimeIssue)
            return StruggleType.TASK_COMPLETION;
        return StruggleType.EFFICIENCY_ISSUE;
    }
    calculateStruggeSeverity(indicators) {
        const totalWeight = indicators.reduce((sum, i) => sum + i.weight, 0);
        const weightedScore = indicators.reduce((sum, i) => {
            const severity = Math.min(1, i.value / i.threshold);
            return sum + (severity * i.weight);
        }, 0);
        const normalizedScore = weightedScore / totalWeight;
        if (normalizedScore > 0.8)
            return StruggeSeverity.CRITICAL;
        if (normalizedScore > 0.6)
            return StruggeSeverity.MAJOR;
        if (normalizedScore > 0.4)
            return StruggeSeverity.MODERATE;
        return StruggeSeverity.MINOR;
    }
    assessHelpNeed(context) {
        // Assess if user might need proactive help
        return context.timeSpent > 180000 || // 3 minutes on same task
            context.errorCount > 2 ||
            context.helpRequests > 0;
    }
    calculateRelevanceScore(context, patterns) {
        let score = 0.5; // Base score
        // Increase score based on context indicators
        if (context.errorCount > 0)
            score += 0.2;
        if (context.timeSpent > 300000)
            score += 0.2; // 5 minutes
        if (context.helpRequests > 0)
            score += 0.3;
        // Adjust based on user patterns
        const relevantPatterns = patterns.filter(p => p.context.includes(context.currentPage) ||
            p.elements.some(e => context.recentActions.includes(e)));
        if (relevantPatterns.length > 0) {
            score += 0.1 * relevantPatterns.length;
        }
        return Math.min(1, score);
    }
    async initializeDefaultContent() {
        // Initialize default tutorials and tips
        const defaultTutorials = this.getDefaultTutorials();
        for (const tutorial of defaultTutorials) {
            await this.storeTutorial(tutorial);
        }
    }
    getDefaultTutorials() {
        return [
            {
                id: 'getting_started',
                title: 'Getting Started',
                description: 'Learn the basics of using the platform',
                steps: [
                    {
                        id: 'step1',
                        title: 'Welcome',
                        description: 'Welcome to the platform',
                        action: {
                            type: ActionType.HIGHLIGHT,
                            target: 'main-navigation',
                            parameters: {}
                        },
                        validation: {
                            type: ValidationType.ELEMENT_VISIBLE,
                            condition: 'main-navigation',
                            errorMessage: 'Navigation not visible'
                        },
                        hints: ['Look for the main navigation at the top']
                    }
                ],
                difficulty: Difficulty.BEGINNER,
                estimatedTime: 300,
                prerequisites: [],
                relevanceScore: 0.8
            }
        ];
    }
    async getAllTutorials() {
        const tutorialKeys = await this.redis.keys('tutorial:*');
        const tutorials = [];
        for (const key of tutorialKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                tutorials.push(JSON.parse(data));
            }
        }
        return tutorials;
    }
    async getUserPatterns(userId) {
        const patternKeys = await this.redis.keys(`pattern:${userId}:*`);
        const patterns = [];
        for (const key of patternKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                patterns.push(JSON.parse(data));
            }
        }
        return patterns;
    }
    async storeContextualHelp(help) {
        await this.redis.hset(`${this.HELP_PREFIX}:${help.userId}:${help.id}`, 'data', JSON.stringify(help));
    }
    async storeUserStruggle(struggle) {
        await this.redis.hset(`${this.STRUGGLE_PREFIX}:${struggle.userId}:${struggle.detectedAt}`, 'data', JSON.stringify(struggle));
    }
    async storeTutorial(tutorial) {
        await this.redis.hset(`tutorial:${tutorial.id}`, 'data', JSON.stringify(tutorial));
    }
    generateHelpId() {
        return `help_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.ContextualAssistant = ContextualAssistant;
//# sourceMappingURL=contextual-assistant.js.map