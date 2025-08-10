import { Redis } from 'ioredis';
import { SystemMetrics } from './metrics-collector';
export interface Anomaly {
    id: string;
    metricName: string;
    anomalyType: AnomalyType;
    severity: AnomalySeverity;
    detectedAt: number;
    value: number;
    expectedValue: number;
    deviation: number;
    confidence: number;
    context: AnomalyContext;
    rootCause?: RootCause;
    impact: AnomalyImpact;
    recommendations: AnomalyRecommendation[];
    status: AnomalyStatus;
    resolvedAt?: number;
}
export declare enum AnomalyType {
    SPIKE = "spike",
    DROP = "drop",
    TREND_CHANGE = "trend_change",
    SEASONAL_DEVIATION = "seasonal_deviation",
    PATTERN_BREAK = "pattern_break",
    OUTLIER = "outlier",
    CORRELATION_BREAK = "correlation_break"
}
export declare enum AnomalySeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
export interface AnomalyContext {
    timeWindow: TimeWindow;
    relatedMetrics: RelatedMetric[];
    systemState: SystemState;
    externalFactors: ExternalFactor[];
}
export interface TimeWindow {
    start: number;
    end: number;
    duration: number;
    precedingPeriod: number;
}
export interface RelatedMetric {
    metricName: string;
    correlation: number;
    value: number;
    normalValue: number;
    deviation: number;
}
export interface SystemState {
    overallHealth: number;
    activeAlerts: number;
    recentDeployments: Deployment[];
    configurationChanges: ConfigChange[];
    maintenanceWindows: MaintenanceWindow[];
}
export interface Deployment {
    id: string;
    timestamp: number;
    service: string;
    version: string;
    impact: DeploymentImpact;
}
export declare enum DeploymentImpact {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export interface ConfigChange {
    id: string;
    timestamp: number;
    component: string;
    parameter: string;
    oldValue: string;
    newValue: string;
    impact: ConfigImpact;
}
export declare enum ConfigImpact {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high"
}
export interface MaintenanceWindow {
    id: string;
    start: number;
    end: number;
    type: MaintenanceType;
    affectedServices: string[];
}
export declare enum MaintenanceType {
    SCHEDULED = "scheduled",
    EMERGENCY = "emergency",
    ROUTINE = "routine"
}
export interface ExternalFactor {
    type: ExternalFactorType;
    description: string;
    impact: number;
    confidence: number;
}
export declare enum ExternalFactorType {
    TRAFFIC_SPIKE = "traffic_spike",
    NETWORK_ISSUE = "network_issue",
    THIRD_PARTY_OUTAGE = "third_party_outage",
    SEASONAL_PATTERN = "seasonal_pattern",
    BUSINESS_EVENT = "business_event"
}
export interface RootCause {
    category: RootCauseCategory;
    description: string;
    confidence: number;
    evidence: Evidence[];
    contributingFactors: ContributingFactor[];
}
export declare enum RootCauseCategory {
    RESOURCE_EXHAUSTION = "resource_exhaustion",
    CONFIGURATION_ERROR = "configuration_error",
    CODE_ISSUE = "code_issue",
    INFRASTRUCTURE_PROBLEM = "infrastructure_problem",
    EXTERNAL_DEPENDENCY = "external_dependency",
    CAPACITY_LIMIT = "capacity_limit",
    DATA_QUALITY_ISSUE = "data_quality_issue"
}
export interface Evidence {
    type: EvidenceType;
    description: string;
    value: number | string;
    timestamp: number;
    source: string;
}
export declare enum EvidenceType {
    METRIC_VALUE = "metric_value",
    LOG_ENTRY = "log_entry",
    ERROR_RATE = "error_rate",
    CORRELATION = "correlation",
    PATTERN_MATCH = "pattern_match"
}
export interface ContributingFactor {
    factor: string;
    impact: number;
    description: string;
}
export interface AnomalyImpact {
    userExperience: UserExperienceImpact;
    systemPerformance: SystemPerformanceImpact;
    businessMetrics: BusinessMetricsImpact;
    operationalCost: OperationalCostImpact;
}
export interface UserExperienceImpact {
    affectedUsers: number;
    responseTimeIncrease: number;
    errorRateIncrease: number;
    featureAvailability: number;
    satisfactionScore: number;
}
export interface SystemPerformanceImpact {
    throughputDecrease: number;
    latencyIncrease: number;
    resourceUtilization: number;
    errorRate: number;
    availabilityImpact: number;
}
export interface BusinessMetricsImpact {
    revenueImpact: number;
    conversionRateChange: number;
    customerSatisfactionChange: number;
    brandReputationRisk: number;
}
export interface OperationalCostImpact {
    additionalResourceCost: number;
    maintenanceCost: number;
    opportunityCost: number;
    totalCost: number;
}
export interface AnomalyRecommendation {
    id: string;
    type: RecommendationType;
    priority: RecommendationPriority;
    title: string;
    description: string;
    action: RecommendedAction;
    expectedImpact: ExpectedImpact;
    timeframe: string;
    prerequisites: string[];
}
export declare enum RecommendationType {
    IMMEDIATE_ACTION = "immediate_action",
    INVESTIGATION = "investigation",
    MONITORING = "monitoring",
    PREVENTION = "prevention",
    OPTIMIZATION = "optimization"
}
export declare enum RecommendationPriority {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface RecommendedAction {
    type: ActionType;
    parameters: Record<string, any>;
    automatable: boolean;
    riskLevel: RiskLevel;
}
export declare enum ActionType {
    SCALE_RESOURCES = "scale_resources",
    RESTART_SERVICE = "restart_service",
    ADJUST_CONFIGURATION = "adjust_configuration",
    INVESTIGATE_LOGS = "investigate_logs",
    CONTACT_TEAM = "contact_team",
    MONITOR_METRIC = "monitor_metric",
    RUN_DIAGNOSTIC = "run_diagnostic"
}
export declare enum RiskLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ExpectedImpact {
    resolutionTime: number;
    effectivenessScore: number;
    riskMitigation: number;
}
export declare enum AnomalyStatus {
    ACTIVE = "active",
    INVESTIGATING = "investigating",
    RESOLVED = "resolved",
    FALSE_POSITIVE = "false_positive",
    SUPPRESSED = "suppressed"
}
export interface AnomalyDetectionModel {
    id: string;
    metricName: string;
    modelType: DetectionModelType;
    parameters: ModelParameters;
    sensitivity: number;
    accuracy: ModelAccuracy;
    trainingPeriod: TrainingPeriod;
    lastUpdated: number;
}
export declare enum DetectionModelType {
    STATISTICAL = "statistical",
    MACHINE_LEARNING = "machine_learning",
    RULE_BASED = "rule_based",
    ENSEMBLE = "ensemble"
}
export interface ModelParameters {
    [key: string]: number | string | boolean;
}
export interface ModelAccuracy {
    precision: number;
    recall: number;
    f1Score: number;
    falsePositiveRate: number;
    falseNegativeRate: number;
    lastEvaluation: number;
}
export interface TrainingPeriod {
    start: number;
    end: number;
    sampleCount: number;
    dataQuality: number;
}
export declare class AnomalyDetector {
    private redis;
    private readonly ANOMALY_PREFIX;
    private readonly MODEL_PREFIX;
    private models;
    private detectionInterval?;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    detectAnomalies(metrics: SystemMetrics): Promise<Anomaly[]>;
    getActiveAnomalies(): Promise<Anomaly[]>;
    resolveAnomaly(anomalyId: string, resolution: string): Promise<void>;
    suppressAnomaly(anomalyId: string, reason: string): Promise<void>;
    updateModel(metricName: string, actualValue: number, isAnomaly: boolean): Promise<void>;
    private loadModels;
    private saveModels;
    private initializeDefaultModels;
    private startDetection;
    private getLatestMetrics;
    private extractMetricValues;
    private detectMetricAnomaly;
    private predictAnomaly;
    private detectCorrelationAnomalies;
    private checkCorrelationBreak;
    private getHistoricalCorrelation;
    private calculateCurrentCorrelation;
    private createCorrelationAnomaly;
    private buildAnomalyContext;
    private findRelatedMetrics;
    private getSystemState;
    private identifyExternalFactors;
    private analyzeRootCause;
    private assessAnomalyImpact;
    private generateRecommendations;
    private generateCorrelationRecommendations;
    private getHistoricalData;
    private updateModelFromResolution;
    private retrainModel;
    private assessDataQuality;
    private getAnomaly;
    private storeAnomaly;
    private generateModelId;
    private generateAnomalyId;
    private generateRecommendationId;
}
//# sourceMappingURL=anomaly-detector.d.ts.map