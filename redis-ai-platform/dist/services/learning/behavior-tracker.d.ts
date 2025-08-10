import { Redis } from 'ioredis';
export interface UserBehavior {
    id: string;
    userId: string;
    sessionId: string;
    timestamp: Date;
    action: BehaviorAction;
    context: BehaviorContext;
    metadata: BehaviorMetadata;
}
export declare enum BehaviorAction {
    SEARCH = "search",
    CLICK = "click",
    VIEW = "view",
    EDIT = "edit",
    CREATE = "create",
    DELETE = "delete",
    SHARE = "share",
    LIKE = "like",
    DISLIKE = "dislike",
    BOOKMARK = "bookmark",
    COMMENT = "comment",
    NAVIGATE = "navigate",
    DOWNLOAD = "download",
    UPLOAD = "upload",
    COLLABORATE = "collaborate",
    AI_QUERY = "ai_query",
    MODEL_SWITCH = "model_switch",
    WORKSPACE_JOIN = "workspace_join",
    KNOWLEDGE_ADD = "knowledge_add"
}
export interface BehaviorContext {
    page?: string;
    section?: string;
    elementId?: string;
    workspaceId?: string;
    contentType?: string;
    contentId?: string;
    query?: string;
    modelId?: string;
    collaborators?: string[];
    deviceType?: DeviceType;
    browserType?: string;
    location?: GeographicLocation;
}
export declare enum DeviceType {
    DESKTOP = "desktop",
    TABLET = "tablet",
    MOBILE = "mobile"
}
export interface GeographicLocation {
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
}
export interface BehaviorMetadata {
    duration?: number;
    success?: boolean;
    errorCode?: string;
    confidence?: number;
    tags?: string[];
    referrer?: string;
    userAgent?: string;
    sessionDuration?: number;
    previousAction?: BehaviorAction;
    nextAction?: BehaviorAction;
}
export interface BehaviorPattern {
    id: string;
    userId: string;
    patternType: PatternType;
    actions: BehaviorAction[];
    frequency: number;
    confidence: number;
    lastSeen: Date;
    contexts: BehaviorContext[];
    outcomes: PatternOutcome[];
}
export declare enum PatternType {
    SEQUENTIAL = "sequential",// Actions in specific order
    FREQUENT = "frequent",// Frequently performed actions
    CONTEXTUAL = "contextual",// Actions in specific contexts
    TEMPORAL = "temporal",// Time-based patterns
    COLLABORATIVE = "collaborative",// Multi-user patterns
    GOAL_ORIENTED = "goal_oriented"
}
export interface PatternOutcome {
    outcome: string;
    probability: number;
    value: number;
}
export interface BehaviorInsight {
    id: string;
    userId: string;
    insightType: InsightType;
    description: string;
    confidence: number;
    actionable: boolean;
    recommendations: Recommendation[];
    generatedAt: Date;
    validUntil?: Date;
}
export declare enum InsightType {
    PREFERENCE = "preference",
    SKILL_LEVEL = "skill_level",
    WORKFLOW = "workflow",
    COLLABORATION_STYLE = "collaboration_style",
    CONTENT_INTEREST = "content_interest",
    PRODUCTIVITY_PATTERN = "productivity_pattern",
    LEARNING_STYLE = "learning_style"
}
export interface Recommendation {
    type: RecommendationType;
    title: string;
    description: string;
    priority: number;
    expectedImpact: number;
    actionUrl?: string;
    metadata?: Record<string, any>;
}
export declare enum RecommendationType {
    FEATURE = "feature",
    CONTENT = "content",
    WORKFLOW = "workflow",
    COLLABORATION = "collaboration",
    LEARNING = "learning",
    OPTIMIZATION = "optimization"
}
export declare class BehaviorTracker {
    private redis;
    private readonly BEHAVIOR_STREAM;
    private readonly PATTERN_PREFIX;
    private readonly INSIGHT_PREFIX;
    private readonly SESSION_PREFIX;
    private readonly ANALYTICS_PREFIX;
    constructor(redis: Redis);
    trackBehavior(behavior: Omit<UserBehavior, 'id' | 'timestamp'>): Promise<void>;
    getBehaviorHistory(userId: string, limit?: number, startTime?: Date, endTime?: Date): Promise<UserBehavior[]>;
    analyzePatterns(userId: string): Promise<BehaviorPattern[]>;
    generateInsights(userId: string): Promise<BehaviorInsight[]>;
    getInsights(userId: string, insightType?: InsightType): Promise<BehaviorInsight[]>;
    getSessionAnalytics(userId: string, sessionId: string): Promise<SessionAnalytics>;
    private updateSession;
    private findSequentialPatterns;
    private findFrequentPatterns;
    private findContextualPatterns;
    private findTemporalPatterns;
    private generatePreferenceInsights;
    private generateWorkflowInsights;
    private generateCollaborationInsights;
    private generateProductivityInsights;
    private storePattern;
    private getStoredPatterns;
    private storeInsight;
    private calculateSessionAnalytics;
    private calculateEngagementScore;
    private generateBehaviorId;
    private generatePatternId;
    private generateInsightId;
}
export interface SessionAnalytics {
    sessionId: string;
    userId: string;
    startTime: Date;
    endTime?: Date;
    duration: number;
    totalActions: number;
    uniqueActions: number;
    actionBreakdown: Record<string, number>;
    averageActionInterval: number;
    mostFrequentAction?: BehaviorAction;
    engagementScore: number;
}
//# sourceMappingURL=behavior-tracker.d.ts.map