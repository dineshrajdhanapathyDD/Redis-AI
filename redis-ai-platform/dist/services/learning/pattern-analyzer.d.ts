import { Redis } from 'ioredis';
import { UserBehavior, BehaviorAction, PatternType } from './behavior-tracker';
export interface AnalysisResult {
    userId: string;
    analysisId: string;
    timestamp: Date;
    patterns: DetectedPattern[];
    insights: PatternInsight[];
    predictions: BehaviorPrediction[];
    anomalies: BehaviorAnomaly[];
    recommendations: PatternRecommendation[];
}
export interface DetectedPattern {
    id: string;
    type: PatternType;
    description: string;
    confidence: number;
    frequency: number;
    significance: number;
    timeRange: TimeRange;
    context: PatternContext;
    examples: PatternExample[];
}
export interface TimeRange {
    start: Date;
    end: Date;
    duration: number;
}
export interface PatternContext {
    workspaces: string[];
    contentTypes: string[];
    collaborators: string[];
    timeOfDay: number[];
    dayOfWeek: number[];
    deviceTypes: string[];
}
export interface PatternExample {
    timestamp: Date;
    sequence: BehaviorAction[];
    context: any;
    outcome?: string;
}
export interface PatternInsight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    confidence: number;
    actionable: boolean;
    impact: ImpactLevel;
    category: InsightCategory;
    evidence: Evidence[];
    relatedPatterns: string[];
}
export declare enum InsightType {
    EFFICIENCY = "efficiency",
    PRODUCTIVITY = "productivity",
    COLLABORATION = "collaboration",
    LEARNING = "learning",
    PREFERENCE = "preference",
    WORKFLOW = "workflow",
    TEMPORAL = "temporal",
    SOCIAL = "social"
}
export declare enum ImpactLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum InsightCategory {
    PERFORMANCE = "performance",
    BEHAVIOR = "behavior",
    ENGAGEMENT = "engagement",
    SATISFACTION = "satisfaction",
    GROWTH = "growth"
}
export interface Evidence {
    type: 'statistical' | 'behavioral' | 'temporal' | 'contextual';
    description: string;
    strength: number;
    data: any;
}
export interface BehaviorPrediction {
    id: string;
    predictedAction: BehaviorAction;
    probability: number;
    timeframe: string;
    context: PredictionContext;
    confidence: number;
    factors: PredictionFactor[];
}
export interface PredictionContext {
    currentActivity?: string;
    timeOfDay?: number;
    dayOfWeek?: number;
    workspaceId?: string;
    collaborators?: string[];
    recentActions?: BehaviorAction[];
}
export interface PredictionFactor {
    factor: string;
    weight: number;
    description: string;
}
export interface BehaviorAnomaly {
    id: string;
    type: AnomalyType;
    description: string;
    severity: number;
    timestamp: Date;
    context: any;
    expectedBehavior: BehaviorAction[];
    actualBehavior: BehaviorAction[];
    possibleCauses: string[];
}
export declare enum AnomalyType {
    UNUSUAL_PATTERN = "unusual_pattern",
    PERFORMANCE_DROP = "performance_drop",
    ENGAGEMENT_CHANGE = "engagement_change",
    WORKFLOW_DISRUPTION = "workflow_disruption",
    COLLABORATION_ANOMALY = "collaboration_anomaly"
}
export interface PatternRecommendation {
    id: string;
    type: RecommendationType;
    title: string;
    description: string;
    priority: number;
    expectedBenefit: string;
    implementation: ImplementationGuide;
    basedOnPatterns: string[];
}
export declare enum RecommendationType {
    WORKFLOW_OPTIMIZATION = "workflow_optimization",
    HABIT_FORMATION = "habit_formation",
    COLLABORATION_IMPROVEMENT = "collaboration_improvement",
    PRODUCTIVITY_ENHANCEMENT = "productivity_enhancement",
    LEARNING_ACCELERATION = "learning_acceleration",
    ENGAGEMENT_BOOST = "engagement_boost"
}
export interface ImplementationGuide {
    steps: string[];
    estimatedTime: string;
    difficulty: 'easy' | 'medium' | 'hard';
    prerequisites: string[];
}
export declare class PatternAnalyzer {
    private redis;
    private readonly ANALYSIS_PREFIX;
    private readonly MODEL_PREFIX;
    private readonly PREDICTION_PREFIX;
    constructor(redis: Redis);
    detectPatterns(userId: string, behaviors: UserBehavior[]): Promise<DetectedPattern[]>;
    private detectSequentialPatterns;
    private detectTemporalPatterns;
    private detectContextualPatterns;
    private detectFrequencyPatterns;
    a: any;
    sync: any;
    detectAnomalies(userId: string, currentBehavior: UserBehavior): Promise<Anomaly[]>;
    predictUserBehavior(userId: string, context: PredictionContext): Promise<BehaviorPrediction[]>;
    findSimilarUsers(userId: string, limit?: number): Promise<SimilarUser[]>;
    updateUserSimilarity(userId: string): Promise<void>;
    private analyzeTemporalPatterns;
    private analyzeInteractionPatterns;
    private analyzeContentPatterns;
    private generateInsights;
    private calculateUserSimilarity;
    private createUserVector;
    private calculatePreferenceSimilarity;
    private calculatePatternSimilarity;
    private extractPatternFeatures;
    private calculateOverallConfidence;
    private calculatePatternFrequency;
    private getHourlyActivity;
    private getDailyActivity;
    private getActionSequences;
    private getSessionPatterns;
    private getContentTypePreferences;
    private getTopicInterests;
    private findPeakActivityHours;
    private findCommonActionSequences;
    private findPreferredContentTypes;
    private findSharedPreferences;
    private findSharedPatterns;
    private detectTemporalAnomaly;
    private detectBehavioralAnomaly;
    private detectContextAnomaly;
    private predictNextActions;
    private predictContentPreferences;
    private predictSessionDuration;
}
//# sourceMappingURL=pattern-analyzer.d.ts.map