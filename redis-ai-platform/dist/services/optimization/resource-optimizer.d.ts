import { Redis } from 'ioredis';
import { PerformancePrediction, BottleneckPrediction, ResourceType } from './performance-predictor';
export interface OptimizationAction {
    id: string;
    type: OptimizationActionType;
    resourceType: ResourceType;
    description: string;
    parameters: OptimizationParameters;
    expectedImpact: ExpectedImpact;
    cost: OptimizationCost;
    risks: OptimizationRisk[];
    prerequisites: string[];
    executedAt?: number;
    status: OptimizationStatus;
    result?: OptimizationResult;
}
export declare enum OptimizationActionType {
    SCALE_RESOURCES = "scale_resources",
    ADJUST_CACHE_CONFIG = "adjust_cache_config",
    OPTIMIZE_CONNECTION_POOL = "optimize_connection_pool",
    TUNE_VECTOR_INDEX = "tune_vector_index",
    ADJUST_SEARCH_PARAMS = "adjust_search_params",
    REBALANCE_LOAD = "rebalance_load",
    ENABLE_COMPRESSION = "enable_compression",
    ADJUST_TTL_POLICIES = "adjust_ttl_policies",
    OPTIMIZE_QUERY_PATTERNS = "optimize_query_patterns"
}
export interface OptimizationParameters {
    [key: string]: number | string | boolean;
}
export interface ExpectedImpact {
    performanceImprovement: number;
    resourceSavings: number;
    latencyReduction: number;
    throughputIncrease: number;
    costReduction: number;
    confidence: number;
}
export interface OptimizationCost {
    implementation: number;
    ongoing: number;
    downtime: number;
    complexity: ComplexityLevel;
}
export declare enum ComplexityLevel {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface OptimizationRisk {
    type: RiskType;
    severity: RiskSeverity;
    probability: number;
    description: string;
    mitigation: string;
}
export declare enum RiskType {
    PERFORMANCE_DEGRADATION = "performance_degradation",
    DATA_LOSS = "data_loss",
    SERVICE_INTERRUPTION = "service_interruption",
    CONFIGURATION_CORRUPTION = "configuration_corruption",
    RESOURCE_EXHAUSTION = "resource_exhaustion"
}
export declare enum RiskSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum OptimizationStatus {
    PENDING = "pending",
    APPROVED = "approved",
    EXECUTING = "executing",
    COMPLETED = "completed",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back"
}
export interface OptimizationResult {
    success: boolean;
    actualImpact: ActualImpact;
    executionTime: number;
    errors: string[];
    rollbackRequired: boolean;
    rollbackReason?: string;
}
export interface ActualImpact {
    performanceChange: number;
    resourceChange: number;
    latencyChange: number;
    throughputChange: number;
    costChange: number;
}
export interface ResourceConfiguration {
    resourceType: ResourceType;
    currentConfig: ConfigurationSettings;
    optimalConfig: ConfigurationSettings;
    configHistory: ConfigurationChange[];
}
export interface ConfigurationSettings {
    [key: string]: number | string | boolean;
}
export interface ConfigurationChange {
    timestamp: number;
    parameter: string;
    oldValue: number | string | boolean;
    newValue: number | string | boolean;
    reason: string;
    impact: ActualImpact;
}
export interface OptimizationStrategy {
    id: string;
    name: string;
    description: string;
    applicableResources: ResourceType[];
    conditions: OptimizationCondition[];
    actions: OptimizationActionTemplate[];
    priority: number;
    enabled: boolean;
}
export interface OptimizationCondition {
    metric: string;
    operator: ComparisonOperator;
    threshold: number;
    duration: number;
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    GREATER_EQUAL = "gte",
    LESS_EQUAL = "lte",
    EQUAL = "eq"
}
export interface OptimizationActionTemplate {
    type: OptimizationActionType;
    parameters: OptimizationParameters;
    conditions: string[];
}
export declare class ResourceOptimizer {
    private redis;
    private readonly OPTIMIZATION_PREFIX;
    private readonly CONFIG_PREFIX;
    private readonly STRATEGY_PREFIX;
    private strategies;
    private configurations;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    optimizeForPrediction(prediction: PerformancePrediction): Promise<OptimizationAction[]>;
    optimizeForBottleneck(bottleneck: BottleneckPrediction): Promise<OptimizationAction[]>;
    executeOptimization(actionId: string): Promise<OptimizationResult>;
    rollbackOptimization(actionId: string): Promise<void>;
    getOptimizationHistory(resourceType?: ResourceType): Promise<OptimizationAction[]>;
    updateConfiguration(resourceType: ResourceType, settings: ConfigurationSettings): Promise<void>;
    private loadStrategies;
    private loadConfigurations;
    private saveConfigurations;
    private initializeDefaultStrategies;
    private findApplicableStrategies;
    private generateActionsFromStrategy;
    private createOptimizationAction;
    private inferResourceType;
    private calculateExpectedImpact;
    private calculateOptimizationCost;
    private assessOptimizationRisks;
    private getPrerequisites;
    private generateCPUOptimizations;
    private generateMemoryOptimizations;
    private generateRedisOptimizations;
    private generateNetworkOptimizations;
    private generateConnectionOptimizations;
    private performOptimization;
    private simulateOptimizationExecution;
    private performRollback;
    private applyConfiguration;
    private updateConfigurationHistory;
    private getOptimizationAction;
    private storeOptimizationAction;
    private generateActionId;
}
//# sourceMappingURL=resource-optimizer.d.ts.map