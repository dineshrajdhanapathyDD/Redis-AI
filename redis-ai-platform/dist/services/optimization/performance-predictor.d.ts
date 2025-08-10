import { Redis } from 'ioredis';
export interface PerformancePrediction {
    id: string;
    metricName: string;
    predictionType: PredictionType;
    timeHorizon: number;
    predictedValue: number;
    confidence: number;
    trend: TrendDirection;
    seasonality: SeasonalityPattern;
    anomalyScore: number;
    factors: PredictionFactor[];
    generatedAt: number;
    validUntil: number;
}
export declare enum PredictionType {
    RESOURCE_USAGE = "resource_usage",
    PERFORMANCE_DEGRADATION = "performance_degradation",
    CAPACITY_LIMIT = "capacity_limit",
    ANOMALY_DETECTION = "anomaly_detection",
    COST_PROJECTION = "cost_projection"
}
export declare enum TrendDirection {
    INCREASING = "increasing",
    DECREASING = "decreasing",
    STABLE = "stable",
    VOLATILE = "volatile",
    CYCLICAL = "cyclical"
}
export interface SeasonalityPattern {
    detected: boolean;
    period: number;
    amplitude: number;
    phase: number;
    confidence: number;
}
export interface PredictionFactor {
    name: string;
    impact: number;
    confidence: number;
    description: string;
}
export interface PredictionModel {
    id: string;
    metricName: string;
    modelType: ModelType;
    parameters: ModelParameters;
    accuracy: ModelAccuracy;
    trainingData: TrainingDataInfo;
    lastUpdated: number;
    version: number;
}
export declare enum ModelType {
    LINEAR_REGRESSION = "linear_regression",
    ARIMA = "arima",
    EXPONENTIAL_SMOOTHING = "exponential_smoothing",
    NEURAL_NETWORK = "neural_network",
    ENSEMBLE = "ensemble"
}
export interface ModelParameters {
    [key: string]: number | string | boolean;
}
export interface ModelAccuracy {
    mape: number;
    rmse: number;
    mae: number;
    r2: number;
    lastValidation: number;
    validationSamples: number;
}
export interface TrainingDataInfo {
    startTime: number;
    endTime: number;
    sampleCount: number;
    dataQuality: number;
    missingValues: number;
    outliers: number;
}
export interface BottleneckPrediction {
    id: string;
    resourceType: ResourceType;
    severity: BottleneckSeverity;
    estimatedTime: number;
    duration: number;
    impact: BottleneckImpact;
    mitigation: MitigationStrategy[];
    confidence: number;
    generatedAt: number;
}
export declare enum ResourceType {
    CPU = "cpu",
    MEMORY = "memory",
    REDIS_MEMORY = "redis_memory",
    NETWORK_BANDWIDTH = "network_bandwidth",
    DISK_IO = "disk_io",
    CONNECTION_POOL = "connection_pool",
    QUEUE_CAPACITY = "queue_capacity"
}
export declare enum BottleneckSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low"
}
export interface BottleneckImpact {
    affectedServices: string[];
    performanceDegradation: number;
    userImpact: UserImpactLevel;
    businessImpact: BusinessImpactLevel;
    estimatedCost: number;
}
export declare enum UserImpactLevel {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum BusinessImpactLevel {
    NONE = "none",
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface MitigationStrategy {
    id: string;
    name: string;
    description: string;
    type: MitigationType;
    effectiveness: number;
    cost: number;
    implementationTime: number;
    prerequisites: string[];
    risks: string[];
}
export declare enum MitigationType {
    SCALE_UP = "scale_up",
    SCALE_OUT = "scale_out",
    OPTIMIZE_CONFIG = "optimize_config",
    CACHE_WARMING = "cache_warming",
    LOAD_BALANCING = "load_balancing",
    RESOURCE_REALLOCATION = "resource_reallocation",
    THROTTLING = "throttling"
}
export declare class PerformancePredictor {
    private redis;
    private readonly PREDICTION_PREFIX;
    private readonly MODEL_PREFIX;
    private readonly BOTTLENECK_PREFIX;
    private models;
    private predictionInterval?;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    generatePrediction(metricName: string, timeHorizon: number, predictionType?: PredictionType): Promise<PerformancePrediction>;
    predictBottlenecks(timeHorizon?: number): Promise<BottleneckPrediction[]>;
    updateModel(metricName: string, actualValue: number, timestamp: number): Promise<void>;
    getActivePredictions(): Promise<PerformancePrediction[]>;
    private loadModels;
    private saveModels;
    private startPredictionGeneration;
    private generateRoutinePredictions;
    private getHistoricalData;
    private createModel;
    private predict;
    private calculateTrend;
    private detectSeasonality;
    private calculateAutocorrelation;
    private calculateAmplitude;
    private identifyPredictionFactors;
    private calculateVolatility;
    private calculateAnomalyScore;
    private createBottleneckPrediction;
    private calculateBottleneckSeverity;
    private assessBottleneckImpact;
    private getAffectedServices;
    private getPerformanceDegradation;
    private getUserImpact;
    private getBusinessImpact;
    private getEstimatedCost;
    private generateMitigationStrategies;
    private estimateBottleneckDuration;
    private calculateModelParameters;
    private initializeAccuracy;
    private assessDataQuality;
    private countOutliers;
    private getRecentPredictions;
    private calculateModelAccuracy;
    private retrainModel;
    private storePrediction;
    private storeBottleneckPrediction;
    private generateModelId;
    private generatePredictionId;
    private generateBottleneckId;
}
//# sourceMappingURL=performance-predictor.d.ts.map