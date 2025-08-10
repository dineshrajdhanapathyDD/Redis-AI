import { Redis } from 'ioredis';
import { ResourceType } from './performance-predictor';
export interface CostOptimization {
    id: string;
    type: CostOptimizationType;
    resourceType: ResourceType;
    description: string;
    currentCost: CostBreakdown;
    optimizedCost: CostBreakdown;
    savings: CostSavings;
    implementation: ImplementationPlan;
    risks: CostOptimizationRisk[];
    status: OptimizationStatus;
    createdAt: number;
    implementedAt?: number;
    result?: OptimizationResult;
}
export declare enum CostOptimizationType {
    RIGHT_SIZING = "right_sizing",
    RESERVED_INSTANCES = "reserved_instances",
    SPOT_INSTANCES = "spot_instances",
    AUTO_SCALING = "auto_scaling",
    RESOURCE_SCHEDULING = "resource_scheduling",
    DATA_LIFECYCLE = "data_lifecycle",
    COMPRESSION = "compression",
    CACHING_OPTIMIZATION = "caching_optimization",
    NETWORK_OPTIMIZATION = "network_optimization"
}
export interface CostBreakdown {
    compute: number;
    storage: number;
    network: number;
    memory: number;
    licensing: number;
    support: number;
    total: number;
    currency: string;
    period: CostPeriod;
}
export declare enum CostPeriod {
    HOURLY = "hourly",
    DAILY = "daily",
    MONTHLY = "monthly",
    YEARLY = "yearly"
}
export interface CostSavings {
    amount: number;
    percentage: number;
    currency: string;
    period: CostPeriod;
    paybackPeriod: number;
    roi: number;
    netPresentValue: number;
}
export interface ImplementationPlan {
    phases: ImplementationPhase[];
    totalDuration: number;
    requiredResources: RequiredResource[];
    dependencies: string[];
    rollbackPlan: RollbackPlan;
}
export interface ImplementationPhase {
    id: string;
    name: string;
    description: string;
    duration: number;
    cost: number;
    risks: string[];
    deliverables: string[];
    prerequisites: string[];
}
export interface RequiredResource {
    type: ResourceRequirementType;
    quantity: number;
    duration: number;
    cost: number;
}
export declare enum ResourceRequirementType {
    ENGINEER_TIME = "engineer_time",
    ADMIN_TIME = "admin_time",
    CONSULTANT = "consultant",
    TOOLS = "tools",
    INFRASTRUCTURE = "infrastructure"
}
export interface RollbackPlan {
    steps: RollbackStep[];
    estimatedTime: number;
    dataBackupRequired: boolean;
    riskLevel: RiskLevel;
}
export interface RollbackStep {
    id: string;
    description: string;
    estimatedTime: number;
    prerequisites: string[];
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface CostOptimizationRisk {
    type: CostRiskType;
    severity: RiskSeverity;
    probability: number;
    description: string;
    impact: RiskImpact;
    mitigation: string;
}
export declare enum CostRiskType {
    PERFORMANCE_DEGRADATION = "performance_degradation",
    SERVICE_INTERRUPTION = "service_interruption",
    DATA_LOSS = "data_loss",
    VENDOR_LOCK_IN = "vendor_lock_in",
    COMPLIANCE_VIOLATION = "compliance_violation",
    HIDDEN_COSTS = "hidden_costs"
}
export declare enum RiskSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface RiskImpact {
    financial: number;
    operational: string;
    reputation: string;
    compliance: string;
}
export declare enum OptimizationStatus {
    IDENTIFIED = "identified",
    ANALYZED = "analyzed",
    APPROVED = "approved",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled"
}
export interface OptimizationResult {
    success: boolean;
    actualSavings: CostSavings;
    performanceImpact: PerformanceImpact;
    implementationCost: number;
    lessonsLearned: string[];
    recommendations: string[];
}
export interface PerformanceImpact {
    latencyChange: number;
    throughputChange: number;
    availabilityChange: number;
    errorRateChange: number;
}
export interface CostForecast {
    id: string;
    resourceType: ResourceType;
    timeHorizon: number;
    currentTrend: CostTrend;
    projectedCost: CostProjection;
    optimizationOpportunities: OptimizationOpportunity[];
    confidence: number;
    generatedAt: number;
}
export interface CostTrend {
    direction: TrendDirection;
    rate: number;
    factors: TrendFactor[];
}
export declare enum TrendDirection {
    INCREASING = "increasing",
    DECREASING = "decreasing",
    STABLE = "stable",
    VOLATILE = "volatile"
}
export interface TrendFactor {
    name: string;
    impact: number;
    confidence: number;
    description: string;
}
export interface CostProjection {
    timeline: CostDataPoint[];
    scenarios: CostScenario[];
    assumptions: string[];
}
export interface CostDataPoint {
    date: number;
    cost: number;
    confidence: number;
}
export interface CostScenario {
    name: string;
    description: string;
    probability: number;
    costImpact: number;
    timeline: CostDataPoint[];
}
export interface OptimizationOpportunity {
    type: CostOptimizationType;
    potentialSavings: number;
    confidence: number;
    effort: EffortLevel;
    timeframe: string;
}
export declare enum EffortLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERY_HIGH = "very_high"
}
export interface CostAlert {
    id: string;
    type: CostAlertType;
    severity: AlertSeverity;
    threshold: CostThreshold;
    currentValue: number;
    projectedValue: number;
    timeframe: string;
    recommendations: string[];
    createdAt: number;
    acknowledged: boolean;
}
export declare enum CostAlertType {
    BUDGET_EXCEEDED = "budget_exceeded",
    BUDGET_FORECAST_EXCEEDED = "budget_forecast_exceeded",
    UNUSUAL_SPENDING = "unusual_spending",
    COST_SPIKE = "cost_spike",
    INEFFICIENT_RESOURCE_USAGE = "inefficient_resource_usage"
}
export declare enum AlertSeverity {
    INFO = "info",
    WARNING = "warning",
    CRITICAL = "critical"
}
export interface CostThreshold {
    type: ThresholdType;
    value: number;
    period: CostPeriod;
    comparison: ComparisonOperator;
}
export declare enum ThresholdType {
    ABSOLUTE = "absolute",
    PERCENTAGE = "percentage",
    RATE_OF_CHANGE = "rate_of_change"
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    EQUAL = "eq"
}
export declare class CostOptimizer {
    private redis;
    private readonly OPTIMIZATION_PREFIX;
    private readonly FORECAST_PREFIX;
    private readonly ALERT_PREFIX;
    private optimizationInterval?;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    identifyOptimizations(resourceType?: ResourceType): Promise<CostOptimization[]>;
    generateCostForecast(resourceType: ResourceType, timeHorizon: number): Promise<CostForecast>;
    implementOptimization(optimizationId: string): Promise<OptimizationResult>;
    createCostAlert(type: CostAlertType, threshold: CostThreshold, currentValue: number, projectedValue: number): Promise<CostAlert>;
    getActiveAlerts(): Promise<CostAlert[]>;
    acknowledgeAlert(alertId: string): Promise<void>;
    private startOptimizationAnalysis;
    private performRoutineAnalysis;
    private getCurrentResourceUsage;
    private getCurrentCosts;
    private identifyResourceOptimizations;
    private createRightSizingOptimization;
    private createAutoScalingOptimization;
    private createCompressionOptimization;
    private createNetworkOptimization;
    private createImplementationPlan;
    private assessOptimizationRisks;
    private getHistoricalCosts;
    private analyzeCostTrend;
    private generateCostProjection;
    private identifyOptimizationOpportunities;
    private calculateForecastConfidence;
    private executeOptimization;
    private checkCostAlerts;
    private calculateAlertSeverity;
    private generateAlertRecommendations;
    private getAlertTimeframe;
    private getOptimization;
    private storeOptimization;
    private storeForecast;
    private getAlert;
    private storeAlert;
    private generateOptimizationId;
    private generateForecastId;
    private generateAlertId;
}
//# sourceMappingURL=cost-optimizer.d.ts.map