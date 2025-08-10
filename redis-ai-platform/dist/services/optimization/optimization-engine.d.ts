import { Redis } from 'ioredis';
import { MetricsCollector } from './metrics-collector';
import { PerformancePredictor } from './performance-predictor';
import { ResourceOptimizer, OptimizationAction } from './resource-optimizer';
import { AnomalyDetector } from './anomaly-detector';
import { CostOptimizer, CostOptimization } from './cost-optimizer';
export interface OptimizationDecision {
    id: string;
    type: OptimizationDecisionType;
    priority: OptimizationPriority;
    trigger: OptimizationTrigger;
    actions: OptimizationAction[];
    costOptimizations: CostOptimization[];
    expectedImpact: OptimizationImpact;
    risks: OptimizationRisk[];
    autoApprove: boolean;
    createdAt: number;
    approvedAt?: number;
    executedAt?: number;
    status: DecisionStatus;
    result?: OptimizationDecisionResult;
}
export declare enum OptimizationDecisionType {
    REACTIVE = "reactive",// Response to current issues
    PREDICTIVE = "predictive",// Based on predictions
    PROACTIVE = "proactive",// Preventive optimizations
    COST_DRIVEN = "cost_driven",// Cost optimization focused
    EMERGENCY = "emergency"
}
export declare enum OptimizationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface OptimizationTrigger {
    type: TriggerType;
    source: string;
    description: string;
    severity: TriggerSeverity;
    data: any;
}
export declare enum TriggerType {
    ANOMALY_DETECTED = "anomaly_detected",
    BOTTLENECK_PREDICTED = "bottleneck_predicted",
    PERFORMANCE_DEGRADATION = "performance_degradation",
    COST_THRESHOLD_EXCEEDED = "cost_threshold_exceeded",
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    SCHEDULED_OPTIMIZATION = "scheduled_optimization"
}
export declare enum TriggerSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface OptimizationImpact {
    performance: PerformanceImpact;
    cost: CostImpact;
    reliability: ReliabilityImpact;
    user: UserImpact;
    confidence: number;
}
export interface PerformanceImpact {
    latencyImprovement: number;
    throughputIncrease: number;
    resourceEfficiency: number;
    errorRateReduction: number;
}
export interface CostImpact {
    monthlySavings: number;
    implementationCost: number;
    paybackPeriod: number;
    roi: number;
}
export interface ReliabilityImpact {
    availabilityImprovement: number;
    mttrReduction: number;
    incidentReduction: number;
    resilienceIncrease: number;
}
export interface UserImpact {
    affectedUsers: number;
    experienceImprovement: number;
    satisfactionIncrease: number;
    featureAvailability: number;
}
export interface OptimizationRisk {
    type: RiskType;
    severity: RiskSeverity;
    probability: number;
    description: string;
    mitigation: string;
    impact: RiskImpact;
}
export declare enum RiskType {
    PERFORMANCE_DEGRADATION = "performance_degradation",
    SERVICE_INTERRUPTION = "service_interruption",
    DATA_LOSS = "data_loss",
    COST_OVERRUN = "cost_overrun",
    ROLLBACK_REQUIRED = "rollback_required",
    COMPLIANCE_VIOLATION = "compliance_violation"
}
export declare enum RiskSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface RiskImpact {
    financial: number;
    operational: string;
    reputation: string;
    compliance: string;
}
export declare enum DecisionStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected",
    EXECUTING = "executing",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface OptimizationDecisionResult {
    success: boolean;
    actualImpact: OptimizationImpact;
    executionTime: number;
    errors: string[];
    lessonsLearned: string[];
    recommendations: string[];
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    conditions: StrategyCondition[];
    actions: StrategyAction[];
    priority: number;
    enabled: boolean;
    autoApprove: boolean;
    cooldownPeriod: number;
    lastExecuted?: number;
}
export interface StrategyCondition {
    type: ConditionType;
    metric: string;
    operator: ComparisonOperator;
    threshold: number;
    duration: number;
    weight: number;
}
export declare enum ConditionType {
    METRIC_THRESHOLD = "metric_threshold",
    ANOMALY_DETECTED = "anomaly_detected",
    PREDICTION_CONFIDENCE = "prediction_confidence",
    COST_THRESHOLD = "cost_threshold",
    TIME_BASED = "time_based"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    GREATER_EQUAL = "gte",
    LESS_EQUAL = "lte",
    EQUAL = "eq"
}
export interface StrategyAction {
    type: string;
    parameters: Record<string, any>;
    weight: number;
    conditions: string[];
}
export interface OptimizationReport {
    id: string;
    period: ReportPeriod;
    timeRange: TimeRange;
    summary: OptimizationSummary;
    decisions: OptimizationDecision[];
    metrics: OptimizationMetrics;
    trends: OptimizationTrend[];
    recommendations: OptimizationRecommendation[];
    generatedAt: number;
}
export interface ReportPeriod {
    start: number;
    end: number;
    duration: number;
    type: PeriodType;
}
export declare enum PeriodType {
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export interface TimeRange {
    start: number;
    end: number;
}
export interface OptimizationSummary {
    totalDecisions: number;
    successfulOptimizations: number;
    failedOptimizations: number;
    totalCostSavings: number;
    totalPerformanceImprovement: number;
    averageExecutionTime: number;
    topOptimizationTypes: OptimizationTypeStats[];
}
export interface OptimizationTypeStats {
    type: OptimizationDecisionType;
    count: number;
    successRate: number;
    averageSavings: number;
    averageImpact: number;
}
export interface OptimizationMetrics {
    systemHealth: number;
    optimizationEffectiveness: number;
    costEfficiency: number;
    automationRate: number;
    userSatisfaction: number;
}
export interface OptimizationTrend {
    metric: string;
    direction: TrendDirection;
    magnitude: number;
    confidence: number;
    timeframe: string;
}
export declare enum TrendDirection {
    IMPROVING = "improving",
    DEGRADING = "degrading",
    STABLE = "stable",
    VOLATILE = "volatile"
}
export interface OptimizationRecommendation {
    id: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    expectedBenefit: string;
    effort: EffortLevel;
    timeframe: string;
}
export declare enum RecommendationType {
    STRATEGY_IMPROVEMENT = "strategy_improvement",
    NEW_OPTIMIZATION = "new_optimization",
    PROCESS_IMPROVEMENT = "process_improvement",
    MONITORING_ENHANCEMENT = "monitoring_enhancement",
    AUTOMATION_OPPORTUNITY = "automation_opportunity"
}
export declare enum RecommendationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export declare enum EffortLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export declare class OptimizationEngine {
    private redis;
    private metricsCollector;
    private performancePredictor;
    private resourceOptimizer;
    private anomalyDetector;
    private costOptimizer;
    private readonly DECISION_PREFIX;
    private readonly STRATEGY_PREFIX;
    private readonly REPORT_PREFIX;
    private strategies;
    private optimizationInterval?;
    private isRunning;
    constructor(redis: Redis, metricsCollector: MetricsCollector, performancePredictor: PerformancePredictor, resourceOptimizer: ResourceOptimizer, anomalyDetector: AnomalyDetector, costOptimizer: CostOptimizer);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    processOptimizationCycle(): Promise<OptimizationDecision[]>;
    approveDecision(decisionId: string): Promise<void>;
    rejectDecision(decisionId: string, reason: string): Promise<void>;
    generateOptimizationReport(period: PeriodType): Promise<OptimizationReport>;
    private startOptimizationLoop;
    private loadStrategies;
    private saveStrategies;
    private initializeDefaultStrategies;
    private generatePredictions;
    private processAnomalies;
    private processPredictions;
    private processBottlenecks;
    private processCostOptimizations;
    private processScheduledOptimizations;
    private createOptimizationDecision;
    private calculateExpectedImpact;
    private assessDecisionRisks;
    private calculatePriority;
    private shouldAutoApprove;
    private prioritizeDecisions;
    private autoApproveDecisions;
    private executeDecision;
    private calculateActualImpact;
    private mapAnomalySeverityToTriggerSeverity;
    private mapBottleneckSeverityToTriggerSeverity;
    private getTimeRangeForPeriod;
    private getDecisionsInTimeRange;
    private generateOptimizationSummary;
    private calculateOptimizationMetrics;
    private analyzeTrends;
    private generateRecommendations;
    private getDecision;
    private storeDecision;
    private storeReport;
    private generateDecisionId;
    private generateReportId;
    private generateRecommendationId;
}
//# sourceMappingURL=optimization-engine.d.ts.map