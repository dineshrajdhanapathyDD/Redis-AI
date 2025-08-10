import { Redis } from 'ioredis';
import { InteractionTracker, UsagePattern, UserPreferences } from './interaction-tracker';
import { UIPersonalizer, PersonalizationSuggestion } from './ui-personalizer';
import { ContextualAssistant, AssistanceContext } from './contextual-assistant';
import { FeatureIntroducer, FeatureIntroduction } from './feature-introducer';
import { WorkflowSuggester, WorkflowSuggestion } from './workflow-suggester';
import { AccessibilityAdapter, AccessibilityProfile } from './accessibility-adapter';
export interface AdaptiveUIState {
    userId: string;
    preferences: UserPreferences;
    patterns: UsagePattern[];
    personalizations: PersonalizationSuggestion[];
    assistanceContext: AssistanceContext;
    features: FeatureIntroduction[];
    workflows: WorkflowSuggestion[];
    accessibility: AccessibilityProfile;
    lastUpdated: number;
}
export interface AdaptationRequest {
    userId: string;
    context: AdaptationContext;
    priority: AdaptationPriority;
    constraints: AdaptationConstraint[];
}
export interface AdaptationContext {
    page: string;
    component: string;
    task: string;
    userState: UserState;
    environment: EnvironmentContext;
}
export interface UserState {
    authenticated: boolean;
    role: string;
    experience: ExperienceLevel;
    currentSession: SessionInfo;
}
export declare enum ExperienceLevel {
    BEGINNER = "beginner",
    INTERMEDIATE = "intermediate",
    ADVANCED = "advanced",
    EXPERT = "expert"
}
export interface SessionInfo {
    startTime: number;
    duration: number;
    interactions: number;
    errors: number;
    completedTasks: string[];
}
export interface EnvironmentContext {
    device: DeviceInfo;
    network: NetworkInfo;
    accessibility: AccessibilityContext;
}
export interface DeviceInfo {
    type: DeviceType;
    screenSize: ScreenSize;
    inputMethods: InputMethod[];
    capabilities: DeviceCapability[];
}
export declare enum DeviceType {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE = "mobile",
    TV = "tv",
    WEARABLE = "wearable"
}
export interface ScreenSize {
    width: number;
    height: number;
    density: number;
    orientation: ScreenOrientation;
}
export declare enum ScreenOrientation {
    PORTRAIT = "portrait",
    LANDSCAPE = "landscape"
}
export declare enum InputMethod {
    MOUSE = "mouse",
    TOUCH = "touch",
    KEYBOARD = "keyboard",
    VOICE = "voice",
    GESTURE = "gesture",
    EYE_TRACKING = "eye_tracking"
}
export interface DeviceCapability {
    feature: string;
    supported: boolean;
    version?: string;
}
export interface NetworkInfo {
    type: NetworkType;
    speed: NetworkSpeed;
    latency: number;
    reliability: number;
}
export declare enum NetworkType {
    WIFI = "wifi",
    CELLULAR = "cellular",
    ETHERNET = "ethernet",
    SATELLITE = "satellite"
}
export declare enum NetworkSpeed {
    SLOW = "slow",
    MODERATE = "moderate",
    FAST = "fast",
    VERY_FAST = "very_fast"
}
export interface AccessibilityContext {
    assistiveTechnology: string[];
    preferences: AccessibilityPreference[];
    limitations: AccessibilityLimitation[];
}
export interface AccessibilityPreference {
    type: string;
    value: any;
    importance: PreferenceImportance;
}
export declare enum PreferenceImportance {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface AccessibilityLimitation {
    type: string;
    severity: LimitationSeverity;
    description: string;
    workarounds: string[];
}
export declare enum LimitationSeverity {
    MINOR = "minor",
    MODERATE = "moderate",
    MAJOR = "major",
    BLOCKING = "blocking"
}
export declare enum AdaptationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
}
export interface AdaptationConstraint {
    type: ConstraintType;
    value: any;
    description: string;
}
export declare enum ConstraintType {
    PERFORMANCE = "performance",
    ACCESSIBILITY = "accessibility",
    BRANDING = "branding",
    TECHNICAL = "technical",
    BUSINESS = "business"
}
export interface AdaptationResult {
    success: boolean;
    adaptations: AdaptationApplied[];
    errors: AdaptationError[];
    metrics: AdaptationMetrics;
}
export interface AdaptationApplied {
    type: AdaptationType;
    component: string;
    changes: AdaptationChange[];
    impact: AdaptationImpact;
}
export declare enum AdaptationType {
    LAYOUT = "layout",
    STYLING = "styling",
    BEHAVIOR = "behavior",
    CONTENT = "content",
    NAVIGATION = "navigation",
    ACCESSIBILITY = "accessibility"
}
export interface AdaptationChange {
    property: string;
    oldValue: any;
    newValue: any;
    reason: string;
}
export interface AdaptationImpact {
    usability: number;
    performance: number;
    accessibility: number;
    satisfaction: number;
}
export interface AdaptationError {
    type: ErrorType;
    message: string;
    component: string;
    severity: ErrorSeverity;
}
export declare enum ErrorType {
    VALIDATION = "validation",
    EXECUTION = "execution",
    CONFLICT = "conflict",
    RESOURCE = "resource"
}
export declare enum ErrorSeverity {
    WARNING = "warning",
    ERROR = "error",
    CRITICAL = "critical"
}
export interface AdaptationMetrics {
    executionTime: number;
    adaptationsApplied: number;
    errorsEncountered: number;
    performanceImpact: number;
    userSatisfactionScore: number;
}
export declare class AdaptiveUIController {
    private redis;
    private interactionTracker;
    private uiPersonalizer;
    private contextualAssistant;
    private featureIntroducer;
    private workflowSuggester;
    private accessibilityAdapter;
    private readonly STATE_PREFIX;
    constructor(redis: Redis, interactionTracker: InteractionTracker, uiPersonalizer: UIPersonalizer, contextualAssistant: ContextualAssistant, featureIntroducer: FeatureIntroducer, workflowSuggester: WorkflowSuggester, accessibilityAdapter: AccessibilityAdapter);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    processAdaptationRequest(request: AdaptationRequest): Promise<AdaptationResult>;
    getUIState(userId: string): Promise<AdaptiveUIState>;
    private generatePersonalizations;
    private generateAccessibilityAdaptations;
    private generateWorkflowOptimizations;
    private applyPersonalization;
    private applyAccessibilityAdaptation;
    private updateUIState;
    private calculatePerformanceImpact;
    private calculateSatisfactionScore;
}
//# sourceMappingURL=adaptive-ui-controller.d.ts.map