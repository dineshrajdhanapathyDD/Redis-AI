import { Redis } from 'ioredis';
import { UsagePattern, UserPreferences } from './interaction-tracker';
export interface FeatureIntroduction {
    id: string;
    userId: string;
    feature: Feature;
    introduction: IntroductionStrategy;
    timing: IntroductionTiming;
    readinessScore: number;
    relevanceScore: number;
    createdAt: number;
    status: IntroductionStatus;
}
export interface Feature {
    id: string;
    name: string;
    description: string;
    category: FeatureCategory;
    complexity: FeatureComplexity;
    prerequisites: string[];
    benefits: FeatureBenefit[];
    usageContext: string[];
    releaseDate: number;
    adoptionRate: number;
}
export declare enum FeatureCategory {
    CORE = "core",
    PRODUCTIVITY = "productivity",
    COLLABORATION = "collaboration",
    ANALYTICS = "analytics",
    CUSTOMIZATION = "customization",
    INTEGRATION = "integration",
    ADVANCED = "advanced"
}
export declare enum FeatureComplexity {
    SIMPLE = "simple",
    MODERATE = "moderate",
    COMPLEX = "complex",
    EXPERT = "expert"
}
export interface FeatureBenefit {
    type: BenefitType;
    description: string;
    impact: ImpactLevel;
    measurable: boolean;
}
export declare enum BenefitType {
    TIME_SAVING = "time_saving",
    EFFICIENCY = "efficiency",
    QUALITY = "quality",
    COLLABORATION = "collaboration",
    INSIGHTS = "insights",
    AUTOMATION = "automation"
}
export declare enum ImpactLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    TRANSFORMATIVE = "transformative"
}
export interface IntroductionStrategy {
    type: IntroductionType;
    method: IntroductionMethod;
    content: IntroductionContent;
    interactivity: InteractivityLevel;
    duration: number;
    followUp: FollowUpAction[];
}
export declare enum IntroductionType {
    TOOLTIP = "tooltip",
    MODAL = "modal",
    GUIDED_TOUR = "guided_tour",
    INLINE_HINT = "inline_hint",
    NOTIFICATION = "notification",
    PROGRESSIVE_DISCLOSURE = "progressive_disclosure"
}
export declare enum IntroductionMethod {
    CONTEXTUAL = "contextual",
    PROACTIVE = "proactive",
    ON_DEMAND = "on_demand",
    GRADUAL = "gradual",
    IMMERSIVE = "immersive"
}
export interface IntroductionContent {
    title: string;
    description: string;
    visualAids: VisualAid[];
    examples: Example[];
    callToAction: CallToAction;
}
export interface VisualAid {
    type: VisualType;
    src: string;
    alt: string;
    caption?: string;
}
export declare enum VisualType {
    IMAGE = "image",
    GIF = "gif",
    VIDEO = "video",
    DIAGRAM = "diagram",
    SCREENSHOT = "screenshot"
}
export interface Example {
    title: string;
    description: string;
    scenario: string;
    outcome: string;
}
export interface CallToAction {
    text: string;
    action: ActionType;
    target: string;
    parameters: Record<string, any>;
}
export declare enum ActionType {
    TRY_NOW = "try_now",
    LEARN_MORE = "learn_more",
    WATCH_DEMO = "watch_demo",
    START_TUTORIAL = "start_tutorial",
    DISMISS = "dismiss",
    REMIND_LATER = "remind_later"
}
export declare enum InteractivityLevel {
    PASSIVE = "passive",
    INTERACTIVE = "interactive",
    HANDS_ON = "hands_on",
    GUIDED = "guided"
}
export interface FollowUpAction {
    trigger: FollowUpTrigger;
    delay: number;
    action: ActionType;
    content: string;
}
export declare enum FollowUpTrigger {
    IMMEDIATE = "immediate",
    AFTER_USE = "after_use",
    TIME_BASED = "time_based",
    USAGE_MILESTONE = "usage_milestone",
    COMPLETION = "completion"
}
export interface IntroductionTiming {
    readinessIndicators: ReadinessIndicator[];
    optimalMoments: OptimalMoment[];
    avoidancePeriods: AvoidancePeriod[];
    frequency: IntroductionFrequency;
}
export interface ReadinessIndicator {
    type: ReadinessType;
    threshold: number;
    weight: number;
    currentValue: number;
}
export declare enum ReadinessType {
    USER_EXPERIENCE = "user_experience",
    FEATURE_USAGE = "feature_usage",
    SESSION_ACTIVITY = "session_activity",
    TASK_COMPLETION = "task_completion",
    ERROR_RATE = "error_rate",
    HELP_SEEKING = "help_seeking"
}
export interface OptimalMoment {
    context: string;
    trigger: MomentTrigger;
    conditions: MomentCondition[];
    priority: number;
}
export declare enum MomentTrigger {
    TASK_COMPLETION = "task_completion",
    WORKFLOW_START = "workflow_start",
    IDLE_TIME = "idle_time",
    REPEATED_ACTION = "repeated_action",
    CONTEXT_SWITCH = "context_switch",
    SUCCESS_MOMENT = "success_moment"
}
export interface MomentCondition {
    type: ConditionType;
    value: any;
    operator: ComparisonOperator;
}
export declare enum ConditionType {
    TIME_OF_DAY = "time_of_day",
    SESSION_LENGTH = "session_length",
    RECENT_ACTIVITY = "recent_activity",
    USER_MOOD = "user_mood",
    COGNITIVE_LOAD = "cognitive_load"
}
export declare enum ComparisonOperator {
    EQUALS = "equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    BETWEEN = "between"
}
export interface AvoidancePeriod {
    reason: AvoidanceReason;
    conditions: MomentCondition[];
    duration: number;
}
export declare enum AvoidanceReason {
    HIGH_STRESS = "high_stress",
    TASK_FOCUS = "task_focus",
    ERROR_RECOVERY = "error_recovery",
    TIME_PRESSURE = "time_pressure",
    COGNITIVE_OVERLOAD = "cognitive_overload"
}
export declare enum IntroductionFrequency {
    ONCE = "once",
    PERIODIC = "periodic",
    CONTEXTUAL = "contextual",
    ADAPTIVE = "adaptive"
}
export declare enum IntroductionStatus {
    PENDING = "pending",
    SCHEDULED = "scheduled",
    PRESENTED = "presented",
    ACCEPTED = "accepted",
    DISMISSED = "dismissed",
    DEFERRED = "deferred"
}
export interface UserReadiness {
    userId: string;
    overallScore: number;
    dimensions: ReadinessDimension[];
    blockers: ReadinessBlocker[];
    accelerators: ReadinessAccelerator[];
    assessedAt: number;
}
export interface ReadinessDimension {
    name: string;
    score: number;
    factors: ReadinessFactor[];
    trend: TrendDirection;
}
export declare enum TrendDirection {
    IMPROVING = "improving",
    STABLE = "stable",
    DECLINING = "declining"
}
export interface ReadinessFactor {
    name: string;
    value: number;
    weight: number;
    description: string;
}
export interface ReadinessBlocker {
    type: BlockerType;
    severity: BlockerSeverity;
    description: string;
    resolution: string;
}
export declare enum BlockerType {
    SKILL_GAP = "skill_gap",
    COGNITIVE_OVERLOAD = "cognitive_overload",
    RESISTANCE_TO_CHANGE = "resistance_to_change",
    TIME_CONSTRAINTS = "time_constraints",
    TECHNICAL_ISSUES = "technical_issues"
}
export declare enum BlockerSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major",
    CRITICAL = "critical"
}
export interface ReadinessAccelerator {
    type: AcceleratorType;
    impact: ImpactLevel;
    description: string;
    activation: string;
}
export declare enum AcceleratorType {
    HIGH_MOTIVATION = "high_motivation",
    RELEVANT_CONTEXT = "relevant_context",
    PEER_INFLUENCE = "peer_influence",
    SUCCESS_MOMENTUM = "success_momentum",
    CURIOSITY = "curiosity"
}
export declare class FeatureIntroducer {
    private redis;
    private readonly FEATURE_PREFIX;
    private readonly INTRODUCTION_PREFIX;
    private readonly READINESS_PREFIX;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    assessUserReadiness(userId: string, patterns: UsagePattern[], preferences: UserPreferences): Promise<UserReadiness>;
    identifyIntroductionOpportunities(userId: string, readiness: UserReadiness, patterns: UsagePattern[]): Promise<FeatureIntroduction[]>;
    scheduleIntroduction(introduction: FeatureIntroduction, patterns: UsagePattern[]): Promise<void>;
    private assessReadinessDimensions;
    private calculateExperienceScore;
    private calculateEngagementScore;
    private calculateAdaptabilityScore;
    private calculateOverallReadiness;
    private identifyBlockers;
    private identifyAccelerators;
    private calculateFeatureRelevance;
    private calculateCategoryRelevance;
    private calculateFeatureReadiness;
    private createFeatureIntroduction;
    private createIntroductionStrategy;
    private calculateOptimalTiming;
    private initializeFeatures;
    private getDefaultFeatures;
    private getAvailableFeatures;
    private storeFeature;
    private storeFeatureIntroduction;
    private storeUserReadiness;
    private generateIntroductionId;
}
//# sourceMappingURL=feature-introducer.d.ts.map