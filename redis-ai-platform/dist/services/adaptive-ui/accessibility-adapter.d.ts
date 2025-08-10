import { Redis } from 'ioredis';
import { UserPreferences, AccessibilityPreferences } from './interaction-tracker';
export interface AccessibilityAdaptation {
    id: string;
    userId: string;
    adaptationType: AdaptationType;
    target: AdaptationTarget;
    modifications: AccessibilityModification[];
    reason: AdaptationReason;
    impact: AccessibilityImpact;
    appliedAt: number;
    active: boolean;
}
export declare enum AdaptationType {
    VISUAL = "visual",
    MOTOR = "motor",
    COGNITIVE = "cognitive",
    AUDITORY = "auditory",
    MULTI_MODAL = "multi_modal"
}
export interface AdaptationTarget {
    type: TargetType;
    selector: string;
    component: string;
    scope: AdaptationScope;
}
export declare enum TargetType {
    ELEMENT = "element",
    COMPONENT = "component",
    PAGE = "page",
    GLOBAL = "global"
}
export declare enum AdaptationScope {
    SINGLE_ELEMENT = "single_element",
    COMPONENT_GROUP = "component_group",
    PAGE_WIDE = "page_wide",
    APPLICATION_WIDE = "application_wide"
}
export interface AccessibilityModification {
    property: string;
    originalValue: any;
    adaptedValue: any;
    cssRule?: string;
    ariaAttribute?: string;
    behaviorChange?: BehaviorChange;
}
export interface BehaviorChange {
    type: BehaviorType;
    description: string;
    implementation: string;
}
export declare enum BehaviorType {
    KEYBOARD_NAVIGATION = "keyboard_navigation",
    FOCUS_MANAGEMENT = "focus_management",
    SCREEN_READER = "screen_reader",
    VOICE_CONTROL = "voice_control",
    GESTURE_CONTROL = "gesture_control"
}
export interface AdaptationReason {
    trigger: AccessibilityTrigger;
    userNeed: AccessibilityNeed;
    evidence: AccessibilityEvidence[];
    confidence: number;
}
export declare enum AccessibilityTrigger {
    USER_PREFERENCE = "user_preference",
    SYSTEM_DETECTION = "system_detection",
    USAGE_PATTERN = "usage_pattern",
    ERROR_PATTERN = "error_pattern",
    ASSISTIVE_TECHNOLOGY = "assistive_technology"
}
export interface AccessibilityNeed {
    category: NeedCategory;
    severity: NeedSeverity;
    description: string;
    standards: AccessibilityStandard[];
}
export declare enum NeedCategory {
    VISUAL_IMPAIRMENT = "visual_impairment",
    HEARING_IMPAIRMENT = "hearing_impairment",
    MOTOR_IMPAIRMENT = "motor_impairment",
    COGNITIVE_IMPAIRMENT = "cognitive_impairment",
    TEMPORARY_DISABILITY = "temporary_disability",
    SITUATIONAL_DISABILITY = "situational_disability"
}
export declare enum NeedSeverity {
    MILD = "mild",
    MODERATE = "moderate",
    SEVERE = "severe",
    PROFOUND = "profound"
}
export interface AccessibilityStandard {
    name: string;
    level: ComplianceLevel;
    criteria: string[];
    guidelines: string[];
}
export declare enum ComplianceLevel {
    A = "A",
    AA = "AA",
    AAA = "AAA"
}
export interface AccessibilityEvidence {
    type: EvidenceType;
    source: string;
    data: any;
    timestamp: number;
    reliability: number;
}
export declare enum EvidenceType {
    USER_AGENT = "user_agent",
    ASSISTIVE_TECH = "assistive_tech",
    INTERACTION_PATTERN = "interaction_pattern",
    ERROR_RATE = "error_rate",
    TIME_ON_TASK = "time_on_task",
    USER_FEEDBACK = "user_feedback"
}
export interface AccessibilityImpact {
    usability: UsabilityImpact;
    compliance: ComplianceImpact;
    performance: PerformanceImpact;
    user: UserImpact;
}
export interface UsabilityImpact {
    taskCompletionRate: number;
    errorReduction: number;
    timeToComplete: number;
    userSatisfaction: number;
}
export interface ComplianceImpact {
    wcagLevel: ComplianceLevel;
    criteriaImproved: string[];
    riskReduction: number;
}
export interface PerformanceImpact {
    loadTimeChange: number;
    renderTimeChange: number;
    memoryUsageChange: number;
    bandwidthChange: number;
}
export interface UserImpact {
    affectedUsers: number;
    benefitLevel: BenefitLevel;
    adoptionRate: number;
    feedbackScore: number;
}
export declare enum BenefitLevel {
    MINIMAL = "minimal",
    MODERATE = "moderate",
    SIGNIFICANT = "significant",
    TRANSFORMATIVE = "transformative"
}
export interface AccessibilityProfile {
    userId: string;
    needs: AccessibilityNeed[];
    preferences: AccessibilityPreferences;
    assistiveTechnology: AssistiveTechnology[];
    adaptations: AccessibilityAdaptation[];
    compliance: ComplianceStatus;
    lastUpdated: number;
}
export interface AssistiveTechnology {
    type: AssistiveTechType;
    name: string;
    version: string;
    capabilities: TechCapability[];
    detected: boolean;
    confidence: number;
}
export declare enum AssistiveTechType {
    SCREEN_READER = "screen_reader",
    MAGNIFIER = "magnifier",
    VOICE_CONTROL = "voice_control",
    SWITCH_CONTROL = "switch_control",
    EYE_TRACKING = "eye_tracking",
    KEYBOARD_ALTERNATIVE = "keyboard_alternative"
}
export interface TechCapability {
    feature: string;
    supported: boolean;
    version: string;
    limitations: string[];
}
export interface ComplianceStatus {
    currentLevel: ComplianceLevel;
    targetLevel: ComplianceLevel;
    criteriaStatus: CriteriaStatus[];
    overallScore: number;
    lastAssessment: number;
}
export interface CriteriaStatus {
    criterion: string;
    level: ComplianceLevel;
    status: CriterionStatus;
    evidence: string[];
    recommendations: string[];
}
export declare enum CriterionStatus {
    PASS = "pass",
    FAIL = "fail",
    NOT_APPLICABLE = "not_applicable",
    NEEDS_REVIEW = "needs_review"
}
export declare class AccessibilityAdapter {
    private redis;
    private readonly ADAPTATION_PREFIX;
    private readonly PROFILE_PREFIX;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    createAccessibilityProfile(userId: string, preferences: UserPreferences): Promise<AccessibilityProfile>;
    generateAdaptations(userId: string, profile: AccessibilityProfile): Promise<AccessibilityAdaptation[]>;
    private assessAccessibilityNeeds;
    private detectAssistiveTechnology;
    private assessCompliance;
    private generateVisualAdaptations;
    private generateMotorAdaptations;
    private generateCognitiveAdaptations;
    private storeAccessibilityProfile;
    private storeAdaptation;
    private generateAdaptationId;
}
//# sourceMappingURL=accessibility-adapter.d.ts.map