import { Redis } from 'ioredis';
import { UsagePattern, UserInteraction } from './interaction-tracker';
export interface ContextualHelp {
    id: string;
    userId: string;
    context: HelpContext;
    suggestions: HelpSuggestion[];
    tutorials: Tutorial[];
    tips: ContextualTip[];
    generatedAt: number;
    relevanceScore: number;
}
export interface HelpContext {
    currentPage: string;
    currentTask: string;
    userGoal: string;
    recentActions: string[];
    strugglingWith?: string;
    timeSpent: number;
    errorCount: number;
    helpRequests: number;
}
export interface HelpSuggestion {
    id: string;
    type: SuggestionType;
    title: string;
    description: string;
    action: SuggestionAction;
    confidence: number;
    priority: Priority;
    category: HelpCategory;
}
export declare enum SuggestionType {
    NEXT_STEP = "next_step",
    ALTERNATIVE_PATH = "alternative_path",
    SHORTCUT = "shortcut",
    FEATURE_DISCOVERY = "feature_discovery",
    TROUBLESHOOTING = "troubleshooting",
    BEST_PRACTICE = "best_practice"
}
export interface SuggestionAction {
    type: ActionType;
    target: string;
    parameters: Record<string, any>;
    description: string;
}
export declare enum ActionType {
    NAVIGATE = "navigate",
    CLICK = "click",
    HIGHLIGHT = "highlight",
    SHOW_TUTORIAL = "show_tutorial",
    OPEN_HELP = "open_help",
    EXECUTE_COMMAND = "execute_command"
}
export declare enum Priority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum HelpCategory {
    NAVIGATION = "navigation",
    FUNCTIONALITY = "functionality",
    EFFICIENCY = "efficiency",
    TROUBLESHOOTING = "troubleshooting",
    LEARNING = "learning"
}
export interface Tutorial {
    id: string;
    title: string;
    description: string;
    steps: TutorialStep[];
    difficulty: Difficulty;
    estimatedTime: number;
    prerequisites: string[];
    relevanceScore: number;
}
export declare enum Difficulty {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced"
}
export interface TutorialStep {
    id: string;
    title: string;
    description: string;
    action: StepAction;
    validation: StepValidation;
    hints: string[];
}
export interface StepAction {
    type: ActionType;
    target: string;
    parameters: Record<string, any>;
    waitFor?: string;
}
export interface StepValidation {
    type: ValidationType;
    condition: string;
    errorMessage: string;
    retryAction?: StepAction;
}
export declare enum ValidationType {
    ELEMENT_EXISTS = "element_exists",
    ELEMENT_VISIBLE = "element_visible",
    VALUE_EQUALS = "value_equals",
    PAGE_LOADED = "page_loaded",
    CUSTOM = "custom"
}
export interface ContextualTip {
    id: string;
    type: TipType;
    title: string;
    content: string;
    trigger: TipTrigger;
    displayConditions: DisplayCondition[];
    dismissible: boolean;
    importance: Importance;
}
export declare enum TipType {
    FEATURE_HIGHLIGHT = "feature_highlight",
    EFFICIENCY_TIP = "efficiency_tip",
    KEYBOARD_SHORTCUT = "keyboard_shortcut",
    BEST_PRACTICE = "best_practice",
    WARNING = "warning",
    CELEBRATION = "celebration"
}
export interface TipTrigger {
    event: TriggerEvent;
    conditions: TriggerCondition[];
    delay?: number;
    frequency: TriggerFrequency;
}
export declare enum TriggerEvent {
    PAGE_LOAD = "page_load",
    ELEMENT_HOVER = "element_hover",
    ACTION_COMPLETE = "action_complete",
    ERROR_OCCURRED = "error_occurred",
    TIME_SPENT = "time_spent",
    PATTERN_DETECTED = "pattern_detected"
}
export interface TriggerCondition {
    type: ConditionType;
    value: any;
    operator: ComparisonOperator;
}
export declare enum ConditionType {
    USER_LEVEL = "user_level",
    FEATURE_USAGE = "feature_usage",
    TIME_OF_DAY = "time_of_day",
    SESSION_LENGTH = "session_length",
    ERROR_COUNT = "error_count"
}
export declare enum ComparisonOperator {
    EQUALS = "equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains"
}
export declare enum TriggerFrequency {
    ONCE = "once",
    DAILY = "daily",
    WEEKLY = "weekly",
    ALWAYS = "always"
}
export interface DisplayCondition {
    type: ConditionType;
    value: any;
    operator: ComparisonOperator;
}
export declare enum Importance {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface UserStruggle {
    userId: string;
    context: string;
    issue: StruggleType;
    indicators: StruggleIndicator[];
    severity: StruggeSeverity;
    detectedAt: number;
    resolved: boolean;
    resolution?: StruggleResolution;
}
export declare enum StruggleType {
    NAVIGATION_CONFUSION = "navigation_confusion",
    FEATURE_DISCOVERY = "feature_discovery",
    TASK_COMPLETION = "task_completion",
    ERROR_RECOVERY = "error_recovery",
    EFFICIENCY_ISSUE = "efficiency_issue"
}
export interface StruggleIndicator {
    type: IndicatorType;
    value: number;
    threshold: number;
    weight: number;
}
export declare enum IndicatorType {
    TIME_SPENT = "time_spent",
    CLICK_COUNT = "click_count",
    ERROR_RATE = "error_rate",
    HELP_REQUESTS = "help_requests",
    BACKTRACK_COUNT = "backtrack_count",
    HOVER_TIME = "hover_time"
}
export declare enum StruggeSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major",
    CRITICAL = "critical"
}
export interface StruggleResolution {
    method: ResolutionMethod;
    helpProvided: string[];
    timeToResolve: number;
    userSatisfaction: number;
    effectiveness: number;
}
export declare enum ResolutionMethod {
    CONTEXTUAL_HELP = "contextual_help",
    TUTORIAL = "tutorial",
    DIRECT_ASSISTANCE = "direct_assistance",
    SELF_RESOLVED = "self_resolved"
}
export declare class ContextualAssistant {
    private redis;
    private readonly HELP_PREFIX;
    private readonly STRUGGLE_PREFIX;
    private readonly TIP_PREFIX;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    generateContextualHelp(userId: string, context: HelpContext, patterns: UsagePattern[]): Promise<ContextualHelp>;
    detectUserStruggle(userId: string, recentInteractions: UserInteraction[]): Promise<UserStruggle | null>;
    provideProactiveHelp(userId: string, currentContext: HelpContext): Promise<ContextualHelp | null>;
    private generateSuggestions;
    private getNextStepSuggestions;
    private getShortcutSuggestions;
    private getTroubleshootingSuggestions;
    private findRelevantTutorials;
    private calculateTutorialRelevance;
    private estimateUserExperience;
    private generateContextualTips;
    private identifyUnusedFeatures;
    private identifyInefficiencies;
    private analyzeStruggleIndicators;
    private identifyStruggleType;
    private calculateStruggeSeverity;
    private assessHelpNeed;
    private calculateRelevanceScore;
    private initializeDefaultContent;
    private getDefaultTutorials;
    private getAllTutorials;
    private getUserPatterns;
    private storeContextualHelp;
    private storeUserStruggle;
    private storeTutorial;
    private generateHelpId;
}
//# sourceMappingURL=contextual-assistant.d.ts.map