import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { BehaviorTracker } from './behavior-tracker';
export interface UserProfile {
    userId: string;
    createdAt: Date;
    updatedAt: Date;
    preferences: UserPreferences;
    skills: SkillProfile;
    interests: InterestProfile;
    collaborationStyle: CollaborationStyle;
    workingPatterns: WorkingPatterns;
    personalityTraits: PersonalityTraits;
    learningStyle: LearningStyle;
    contextualPreferences: ContextualPreferences;
}
export interface UserPreferences {
    contentTypes: ContentTypePreference[];
    uiPreferences: UIPreferences;
    notificationPreferences: NotificationPreferences;
    privacySettings: PrivacySettings;
    workspacePreferences: WorkspacePreferences;
    aiModelPreferences: AIModelPreferences;
}
export interface ContentTypePreference {
    type: string;
    weight: number;
    lastUpdated: Date;
    confidence: number;
}
export interface UIPreferences {
    theme: 'light' | 'dark' | 'auto';
    layout: 'compact' | 'comfortable' | 'spacious';
    sidebarPosition: 'left' | 'right';
    showAdvancedFeatures: boolean;
    customizations: Record<string, any>;
}
export interface NotificationPreferences {
    email: boolean;
    push: boolean;
    inApp: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    categories: NotificationCategory[];
}
export interface NotificationCategory {
    category: string;
    enabled: boolean;
    priority: 'low' | 'medium' | 'high';
}
export interface PrivacySettings {
    shareUsageData: boolean;
    allowPersonalization: boolean;
    shareWithTeam: boolean;
    dataRetentionDays: number;
}
export interface WorkspacePreferences {
    defaultView: string;
    autoSave: boolean;
    collaborationMode: 'active' | 'passive' | 'observer';
    knowledgeSharing: boolean;
}
export interface AIModelPreferences {
    preferredModels: ModelPreference[];
    fallbackStrategy: 'performance' | 'cost' | 'accuracy';
    maxLatency: number;
    qualityThreshold: number;
}
export interface ModelPreference {
    modelId: string;
    weight: number;
    contexts: string[];
}
export interface SkillProfile {
    technicalSkills: Skill[];
    domainKnowledge: Skill[];
    softSkills: Skill[];
    learningVelocity: number;
    expertiseAreas: string[];
}
export interface Skill {
    name: string;
    level: number;
    confidence: number;
    lastAssessed: Date;
    evidenceCount: number;
}
export interface InterestProfile {
    topics: TopicInterest[];
    trendingInterests: TopicInterest[];
    seasonalPatterns: SeasonalPattern[];
    diversityScore: number;
}
export interface TopicInterest {
    topic: string;
    weight: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    lastEngagement: Date;
    engagementCount: number;
}
export interface SeasonalPattern {
    pattern: string;
    months: number[];
    strength: number;
}
export interface CollaborationStyle {
    preferredTeamSize: number;
    communicationStyle: 'direct' | 'diplomatic' | 'supportive';
    leadershipTendency: number;
    mentorshipStyle: 'hands-on' | 'guidance' | 'autonomous';
    conflictResolution: 'collaborative' | 'competitive' | 'accommodating';
}
export interface WorkingPatterns {
    peakHours: number[];
    productiveDays: number[];
    sessionDuration: number;
    breakPatterns: BreakPattern[];
    focusScore: number;
    multitaskingTendency: number;
}
export interface BreakPattern {
    afterMinutes: number;
    durationMinutes: number;
    frequency: number;
}
export interface PersonalityTraits {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    riskTolerance: number;
    innovationIndex: number;
}
export interface LearningStyle {
    preferredFormats: LearningFormat[];
    pace: 'fast' | 'moderate' | 'slow';
    depth: 'overview' | 'detailed' | 'comprehensive';
    interactivity: 'passive' | 'interactive' | 'hands-on';
    feedback: 'immediate' | 'periodic' | 'final';
}
export interface LearningFormat {
    format: string;
    effectiveness: number;
    preference: number;
}
export interface ContextualPreferences {
    deviceSpecific: DevicePreferences[];
    locationBased: LocationPreferences[];
    timeBasedPreferences: TimeBasedPreferences[];
    workspaceSpecific: WorkspaceSpecificPreferences[];
}
export interface DevicePreferences {
    deviceType: string;
    preferences: Record<string, any>;
}
export interface LocationPreferences {
    location: string;
    preferences: Record<string, any>;
}
export interface TimeBasedPreferences {
    timeRange: string;
    preferences: Record<string, any>;
}
export interface WorkspaceSpecificPreferences {
    workspaceId: string;
    preferences: Record<string, any>;
}
export interface PersonalizationRecommendation {
    id: string;
    userId: string;
    type: RecommendationType;
    title: string;
    description: string;
    confidence: number;
    priority: number;
    expectedImpact: number;
    category: RecommendationCategory;
    context: RecommendationContext;
    actions: RecommendationAction[];
    metadata: Record<string, any>;
    createdAt: Date;
    expiresAt?: Date;
    applied?: boolean;
    feedback?: RecommendationFeedback;
}
export declare enum RecommendationType {
    CONTENT_SUGGESTION = "content_suggestion",
    FEATURE_RECOMMENDATION = "feature_recommendation",
    WORKFLOW_OPTIMIZATION = "workflow_optimization",
    COLLABORATION_SUGGESTION = "collaboration_suggestion",
    LEARNING_PATH = "learning_path",
    UI_CUSTOMIZATION = "ui_customization",
    PRODUCTIVITY_TIP = "productivity_tip",
    SKILL_DEVELOPMENT = "skill_development"
}
export declare enum RecommendationCategory {
    IMMEDIATE = "immediate",
    SHORT_TERM = "short_term",
    LONG_TERM = "long_term",
    EXPERIMENTAL = "experimental"
}
export interface RecommendationContext {
    workspaceId?: string;
    sessionId?: string;
    currentActivity?: string;
    timeOfDay?: string;
    deviceType?: string;
    collaborators?: string[];
}
export interface RecommendationAction {
    type: 'navigate' | 'configure' | 'learn' | 'try' | 'connect';
    label: string;
    url?: string;
    parameters?: Record<string, any>;
}
export interface RecommendationFeedback {
    rating: number;
    applied: boolean;
    helpful: boolean;
    comments?: string;
    timestamp: Date;
}
export declare class PersonalizationEngine {
    private redis;
    private embeddingManager;
    private behaviorTracker;
    private readonly PROFILE_PREFIX;
    private readonly RECOMMENDATION_PREFIX;
    private readonly SIMILARITY_PREFIX;
    private readonly FEATURE_STORE_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager, behaviorTracker: BehaviorTracker);
    createUserProfile(userId: string): Promise<UserProfile>;
    getUserProfile(userId: string): Promise<UserProfile | null>;
    updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile>;
    analyzeUserBehavior(userId: string): Promise<UserProfile>;
    generateRecommendations(userId: string, context?: RecommendationContext): Promise<PersonalizationRecommendation[]>;
    findSimilarUsers(userId: string, limit?: number): Promise<SimilarUser[]>;
    applyRecommendation(userId: string, recommendationId: string, feedback: RecommendationFeedback): Promise<void>;
    private updatePreferencesFromBehavior;
    private updateSkillsFromBehavior;
    private updateInterestsFromBehavior;
    private updateCollaborationStyleFromBehavior;
    private updateWorkingPatternsFromBehavior;
    private updatePersonalityTraitsFromBehavior;
    private generateContentRecommendations;
    private generateFeatureRecommendations;
    private generateWorkflowRecommendations;
    private generateCollaborationRecommendations;
    private generateLearningRecommendations;
    private generateUserEmbedding;
    private findSharedInterests;
    private calculateCollaborationPotential;
    private saveUserProfile;
    private updateFeatureStore;
    private storeRecommendation;
    private reinforceLearning;
    private getDefaultPreferences;
    private getDefaultSkillProfile;
    private getDefaultInterestProfile;
    private getDefaultCollaborationStyle;
    private getDefaultWorkingPatterns;
    private getDefaultPersonalityTraits;
    private getDefaultLearningStyle;
    private getDefaultContextualPreferences;
    private generateRecommendationId;
}
export interface SimilarUser {
    userId: string;
    similarity: number;
    profile: UserProfile;
    sharedInterests: string[];
    collaborationPotential: number;
}
//# sourceMappingURL=personalization-engine.d.ts.map