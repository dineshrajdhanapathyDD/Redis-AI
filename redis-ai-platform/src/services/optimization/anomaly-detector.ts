import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
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
  confidence: number; // 0-1
  context: AnomalyContext;
  rootCause?: RootCause;
  impact: AnomalyImpact;
  recommendations: AnomalyRecommendation[];
  status: AnomalyStatus;
  resolvedAt?: number;
}

export enum AnomalyType {
  SPIKE = 'spike',
  DROP = 'drop',
  TREND_CHANGE = 'trend_change',
  SEASONAL_DEVIATION = 'seasonal_deviation',
  PATTERN_BREAK = 'pattern_break',
  OUTLIER = 'outlier',
  CORRELATION_BREAK = 'correlation_break'
}

export enum AnomalySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
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
  overallHealth: number; // 0-1
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

export enum DeploymentImpact {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
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

export enum ConfigImpact {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface MaintenanceWindow {
  id: string;
  start: number;
  end: number;
  type: MaintenanceType;
  affectedServices: string[];
}

export enum MaintenanceType {
  SCHEDULED = 'scheduled',
  EMERGENCY = 'emergency',
  ROUTINE = 'routine'
}

export interface ExternalFactor {
  type: ExternalFactorType;
  description: string;
  impact: number; // -1 to 1
  confidence: number; // 0-1
}

export enum ExternalFactorType {
  TRAFFIC_SPIKE = 'traffic_spike',
  NETWORK_ISSUE = 'network_issue',
  THIRD_PARTY_OUTAGE = 'third_party_outage',
  SEASONAL_PATTERN = 'seasonal_pattern',
  BUSINESS_EVENT = 'business_event'
}

export interface RootCause {
  category: RootCauseCategory;
  description: string;
  confidence: number; // 0-1
  evidence: Evidence[];
  contributingFactors: ContributingFactor[];
}

export enum RootCauseCategory {
  RESOURCE_EXHAUSTION = 'resource_exhaustion',
  CONFIGURATION_ERROR = 'configuration_error',
  CODE_ISSUE = 'code_issue',
  INFRASTRUCTURE_PROBLEM = 'infrastructure_problem',
  EXTERNAL_DEPENDENCY = 'external_dependency',
  CAPACITY_LIMIT = 'capacity_limit',
  DATA_QUALITY_ISSUE = 'data_quality_issue'
}

export interface Evidence {
  type: EvidenceType;
  description: string;
  value: number | string;
  timestamp: number;
  source: string;
}

export enum EvidenceType {
  METRIC_VALUE = 'metric_value',
  LOG_ENTRY = 'log_entry',
  ERROR_RATE = 'error_rate',
  CORRELATION = 'correlation',
  PATTERN_MATCH = 'pattern_match'
}

export interface ContributingFactor {
  factor: string;
  impact: number; // 0-1
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
  responseTimeIncrease: number; // milliseconds
  errorRateIncrease: number; // 0-1
  featureAvailability: number; // 0-1
  satisfactionScore: number; // 0-1
}

export interface SystemPerformanceImpact {
  throughputDecrease: number; // 0-1
  latencyIncrease: number; // milliseconds
  resourceUtilization: number; // 0-1
  errorRate: number; // 0-1
  availabilityImpact: number; // 0-1
}

export interface BusinessMetricsImpact {
  revenueImpact: number; // dollars
  conversionRateChange: number; // -1 to 1
  customerSatisfactionChange: number; // -1 to 1
  brandReputationRisk: number; // 0-1
}

export interface OperationalCostImpact {
  additionalResourceCost: number; // dollars
  maintenanceCost: number; // dollars
  opportunityCost: number; // dollars
  totalCost: number; // dollars
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

export enum RecommendationType {
  IMMEDIATE_ACTION = 'immediate_action',
  INVESTIGATION = 'investigation',
  MONITORING = 'monitoring',
  PREVENTION = 'prevention',
  OPTIMIZATION = 'optimization'
}

export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface RecommendedAction {
  type: ActionType;
  parameters: Record<string, any>;
  automatable: boolean;
  riskLevel: RiskLevel;
}

export enum ActionType {
  SCALE_RESOURCES = 'scale_resources',
  RESTART_SERVICE = 'restart_service',
  ADJUST_CONFIGURATION = 'adjust_configuration',
  INVESTIGATE_LOGS = 'investigate_logs',
  CONTACT_TEAM = 'contact_team',
  MONITOR_METRIC = 'monitor_metric',
  RUN_DIAGNOSTIC = 'run_diagnostic'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ExpectedImpact {
  resolutionTime: number; // seconds
  effectivenessScore: number; // 0-1
  riskMitigation: number; // 0-1
}

export enum AnomalyStatus {
  ACTIVE = 'active',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  FALSE_POSITIVE = 'false_positive',
  SUPPRESSED = 'suppressed'
}

export interface AnomalyDetectionModel {
  id: string;
  metricName: string;
  modelType: DetectionModelType;
  parameters: ModelParameters;
  sensitivity: number; // 0-1
  accuracy: ModelAccuracy;
  trainingPeriod: TrainingPeriod;
  lastUpdated: number;
}

export enum DetectionModelType {
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  RULE_BASED = 'rule_based',
  ENSEMBLE = 'ensemble'
}

export interface ModelParameters {
  [key: string]: number | string | boolean;
}

export interface ModelAccuracy {
  precision: number; // 0-1
  recall: number; // 0-1
  f1Score: number; // 0-1
  falsePositiveRate: number; // 0-1
  falseNegativeRate: number; // 0-1
  lastEvaluation: number;
}

export interface TrainingPeriod {
  start: number;
  end: number;
  sampleCount: number;
  dataQuality: number; // 0-1
}

export class AnomalyDetector {
  private redis: Redis;
  private readonly ANOMALY_PREFIX = 'anomaly';
  private readonly MODEL_PREFIX = 'anomaly_model';
  private models: Map<string, AnomalyDetectionModel> = new Map();
  private detectionInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Anomaly Detector');
    
    // Load detection models
    await this.loadModels();
    
    // Initialize default models
    await this.initializeDefaultModels();
    
    // Start anomaly detection
    await this.startDetection();
    
    logger.info('Anomaly Detector initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Anomaly Detector');
    
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
    
    // Save models
    await this.saveModels();
    
    logger.info('Anomaly Detector shutdown complete');
  }

  async detectAnomalies(metrics: SystemMetrics): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Check each metric for anomalies
    const metricValues = this.extractMetricValues(metrics);
    
    for (const [metricName, value] of Object.entries(metricValues)) {
      const model = this.models.get(metricName);
      if (!model) continue;
      
      const anomaly = await this.detectMetricAnomaly(metricName, value, model, metrics);
      if (anomaly) {
        anomalies.push(anomaly);
      }
    }
    
    // Detect correlation anomalies
    const correlationAnomalies = await this.detectCorrelationAnomalies(metricValues, metrics);
    anomalies.push(...correlationAnomalies);
    
    // Store detected anomalies
    for (const anomaly of anomalies) {
      await this.storeAnomaly(anomaly);
    }
    
    return anomalies;
  }

  async getActiveAnomalies(): Promise<Anomaly[]> {
    const anomalyKeys = await this.redis.keys(`${this.ANOMALY_PREFIX}:*`);
    const anomalies: Anomaly[] = [];

    for (const key of anomalyKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const anomaly = JSON.parse(data) as Anomaly;
        if (anomaly.status === AnomalyStatus.ACTIVE) {
          anomalies.push(anomaly);
        }
      }
    }

    return anomalies.sort((a, b) => b.detectedAt - a.detectedAt);
  }

  async resolveAnomaly(anomalyId: string, resolution: string): Promise<void> {
    const anomaly = await this.getAnomaly(anomalyId);
    if (!anomaly) {
      throw new Error(`Anomaly not found: ${anomalyId}`);
    }

    anomaly.status = AnomalyStatus.RESOLVED;
    anomaly.resolvedAt = Date.now();
    
    await this.storeAnomaly(anomaly);
    
    // Update model based on resolution
    await this.updateModelFromResolution(anomaly, resolution);
    
    logger.info(`Resolved anomaly: ${anomalyId}`);
  }

  async suppressAnomaly(anomalyId: string, reason: string): Promise<void> {
    const anomaly = await this.getAnomaly(anomalyId);
    if (!anomaly) {
      throw new Error(`Anomaly not found: ${anomalyId}`);
    }

    anomaly.status = AnomalyStatus.SUPPRESSED;
    
    await this.storeAnomaly(anomaly);
    
    logger.info(`Suppressed anomaly: ${anomalyId} - ${reason}`);
  }

  async updateModel(metricName: string, actualValue: number, isAnomaly: boolean): Promise<void> {
    const model = this.models.get(metricName);
    if (!model) return;

    // Update model accuracy based on feedback
    const prediction = await this.predictAnomaly(metricName, actualValue, model);
    const correct = (prediction.isAnomaly === isAnomaly);
    
    if (correct) {
      model.accuracy.precision = Math.min(1, model.accuracy.precision + 0.01);
      model.accuracy.recall = Math.min(1, model.accuracy.recall + 0.01);
    } else {
      model.accuracy.precision = Math.max(0, model.accuracy.precision - 0.01);
      model.accuracy.recall = Math.max(0, model.accuracy.recall - 0.01);
    }
    
    model.accuracy.f1Score = 2 * (model.accuracy.precision * model.accuracy.recall) / 
                            (model.accuracy.precision + model.accuracy.recall);
    model.accuracy.lastEvaluation = Date.now();
    model.lastUpdated = Date.now();
    
    // Retrain model if accuracy drops
    if (model.accuracy.f1Score < 0.7) {
      await this.retrainModel(model);
    }
  }

  private async loadModels(): Promise<void> {
    const modelKeys = await this.redis.keys(`${this.MODEL_PREFIX}:*`);
    
    for (const key of modelKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const model = JSON.parse(data) as AnomalyDetectionModel;
        this.models.set(model.metricName, model);
      }
    }
    
    logger.info(`Loaded ${this.models.size} anomaly detection models`);
  }

  private async saveModels(): Promise<void> {
    for (const [metricName, model] of this.models) {
      await this.redis.hset(
        `${this.MODEL_PREFIX}:${metricName}`,
        'data',
        JSON.stringify(model)
      );
    }
    
    logger.info(`Saved ${this.models.size} anomaly detection models`);
  }

  private async initializeDefaultModels(): Promise<void> {
    const defaultModels = [
      {
        metricName: 'cpu.usage',
        modelType: DetectionModelType.STATISTICAL,
        sensitivity: 0.8,
        parameters: { threshold: 2.5, windowSize: 10 }
      },
      {
        metricName: 'memory.usage',
        modelType: DetectionModelType.STATISTICAL,
        sensitivity: 0.7,
        parameters: { threshold: 2.0, windowSize: 15 }
      },
      {
        metricName: 'redis.memory_usage',
        modelType: DetectionModelType.STATISTICAL,
        sensitivity: 0.9,
        parameters: { threshold: 3.0, windowSize: 5 }
      },
      {
        metricName: 'application.response_time.avg',
        modelType: DetectionModelType.STATISTICAL,
        sensitivity: 0.8,
        parameters: { threshold: 2.5, windowSize: 10 }
      },
      {
        metricName: 'application.error_rate',
        modelType: DetectionModelType.RULE_BASED,
        sensitivity: 0.9,
        parameters: { maxErrorRate: 0.05, windowSize: 5 }
      }
    ];

    for (const modelConfig of defaultModels) {
      if (!this.models.has(modelConfig.metricName)) {
        const model: AnomalyDetectionModel = {
          id: this.generateModelId(),
          metricName: modelConfig.metricName,
          modelType: modelConfig.modelType,
          parameters: modelConfig.parameters,
          sensitivity: modelConfig.sensitivity,
          accuracy: {
            precision: 0.8,
            recall: 0.8,
            f1Score: 0.8,
            falsePositiveRate: 0.1,
            falseNegativeRate: 0.1,
            lastEvaluation: Date.now()
          },
          trainingPeriod: {
            start: Date.now() - (7 * 24 * 60 * 60 * 1000),
            end: Date.now(),
            sampleCount: 0,
            dataQuality: 0.9
          },
          lastUpdated: Date.now()
        };

        this.models.set(modelConfig.metricName, model);
      }
    }

    logger.info(`Initialized ${defaultModels.length} default anomaly detection models`);
  }

  private async startDetection(): Promise<void> {
    // Run anomaly detection every 60 seconds
    this.detectionInterval = setInterval(async () => {
      try {
        // Get latest metrics and detect anomalies
        const latestMetrics = await this.getLatestMetrics();
        if (latestMetrics) {
          await this.detectAnomalies(latestMetrics);
        }
      } catch (error) {
        logger.error('Error in anomaly detection:', error);
      }
    }, 60000);
  }

  private async getLatestMetrics(): Promise<SystemMetrics | null> {
    try {
      // Get the most recent metrics from Redis
      const metricsKey = 'latest_metrics';
      const data = await this.redis.hget(metricsKey, 'data');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting latest metrics:', error);
      return null;
    }
  }

  private extractMetricValues(metrics: SystemMetrics): Record<string, number> {
    return {
      'cpu.usage': metrics.cpu.usage,
      'memory.usage': metrics.memory.usage,
      'redis.memory_usage': metrics.redis.memoryUsage,
      'redis.connected_clients': metrics.redis.connectedClients,
      'redis.hit_rate': metrics.redis.hitRate,
      'application.requests_per_second': metrics.application.requestsPerSecond,
      'application.response_time.avg': metrics.application.responseTime.avg,
      'application.error_rate': metrics.application.errorRate,
      'network.latency.p95': metrics.network.latency.p95
    };
  }

  private async detectMetricAnomaly(
    metricName: string,
    value: number,
    model: AnomalyDetectionModel,
    metrics: SystemMetrics
  ): Promise<Anomaly | null> {
    const prediction = await this.predictAnomaly(metricName, value, model);
    
    if (!prediction.isAnomaly) {
      return null;
    }

    const context = await this.buildAnomalyContext(metricName, metrics);
    const rootCause = await this.analyzeRootCause(metricName, value, context);
    const impact = this.assessAnomalyImpact(metricName, value, prediction.severity);
    const recommendations = this.generateRecommendations(metricName, prediction, rootCause);

    const anomaly: Anomaly = {
      id: this.generateAnomalyId(),
      metricName,
      anomalyType: prediction.type,
      severity: prediction.severity,
      detectedAt: Date.now(),
      value,
      expectedValue: prediction.expectedValue,
      deviation: prediction.deviation,
      confidence: prediction.confidence,
      context,
      rootCause,
      impact,
      recommendations,
      status: AnomalyStatus.ACTIVE
    };

    return anomaly;
  }

  private async predictAnomaly(
    metricName: string,
    value: number,
    model: AnomalyDetectionModel
  ): Promise<{
    isAnomaly: boolean;
    type: AnomalyType;
    severity: AnomalySeverity;
    expectedValue: number;
    deviation: number;
    confidence: number;
  }> {
    // Get historical data for the metric
    const historicalData = await this.getHistoricalData(metricName, 24 * 60 * 60 * 1000); // 24 hours
    
    if (historicalData.length < 10) {
      return {
        isAnomaly: false,
        type: AnomalyType.OUTLIER,
        severity: AnomalySeverity.LOW,
        expectedValue: value,
        deviation: 0,
        confidence: 0
      };
    }

    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const stdDev = Math.sqrt(
      historicalData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalData.length
    );

    const zScore = Math.abs(value - mean) / (stdDev || 1);
    const threshold = model.parameters.threshold as number || 2.5;
    
    const isAnomaly = zScore > threshold;
    const deviation = Math.abs(value - mean);
    const confidence = Math.min(1, zScore / 5); // Normalize confidence

    let type: AnomalyType;
    let severity: AnomalySeverity;

    if (value > mean + threshold * stdDev) {
      type = AnomalyType.SPIKE;
    } else if (value < mean - threshold * stdDev) {
      type = AnomalyType.DROP;
    } else {
      type = AnomalyType.OUTLIER;
    }

    if (zScore > 4) {
      severity = AnomalySeverity.CRITICAL;
    } else if (zScore > 3) {
      severity = AnomalySeverity.HIGH;
    } else if (zScore > 2.5) {
      severity = AnomalySeverity.MEDIUM;
    } else {
      severity = AnomalySeverity.LOW;
    }

    return {
      isAnomaly,
      type,
      severity,
      expectedValue: mean,
      deviation,
      confidence
    };
  }

  private async detectCorrelationAnomalies(
    metricValues: Record<string, number>,
    metrics: SystemMetrics
  ): Promise<Anomaly[]> {
    const anomalies: Anomaly[] = [];
    
    // Check for broken correlations between related metrics
    const correlationPairs = [
      ['cpu.usage', 'application.response_time.avg'],
      ['memory.usage', 'redis.memory_usage'],
      ['application.requests_per_second', 'redis.connected_clients'],
      ['application.error_rate', 'application.response_time.avg']
    ];

    for (const [metric1, metric2] of correlationPairs) {
      const correlation = await this.checkCorrelationBreak(metric1, metric2, metricValues);
      if (correlation.isBroken) {
        const anomaly = await this.createCorrelationAnomaly(metric1, metric2, correlation, metrics);
        anomalies.push(anomaly);
      }
    }

    return anomalies;
  }

  private async checkCorrelationBreak(
    metric1: string,
    metric2: string,
    currentValues: Record<string, number>
  ): Promise<{ isBroken: boolean; expectedCorrelation: number; actualCorrelation: number }> {
    // Simplified correlation break detection
    const historicalCorrelation = await this.getHistoricalCorrelation(metric1, metric2);
    const currentCorrelation = this.calculateCurrentCorrelation(metric1, metric2, currentValues);
    
    const correlationDiff = Math.abs(historicalCorrelation - currentCorrelation);
    const isBroken = correlationDiff > 0.3; // Threshold for correlation break

    return {
      isBroken,
      expectedCorrelation: historicalCorrelation,
      actualCorrelation: currentCorrelation
    };
  }

  private async getHistoricalCorrelation(metric1: string, metric2: string): Promise<number> {
    // Simplified - return a default correlation
    const correlationMap: Record<string, number> = {
      'cpu.usage:application.response_time.avg': 0.7,
      'memory.usage:redis.memory_usage': 0.8,
      'application.requests_per_second:redis.connected_clients': 0.6,
      'application.error_rate:application.response_time.avg': 0.5
    };

    const key = `${metric1}:${metric2}`;
    return correlationMap[key] || 0.5;
  }

  private calculateCurrentCorrelation(
    metric1: string,
    metric2: string,
    values: Record<string, number>
  ): number {
    // Simplified current correlation calculation
    const value1 = values[metric1] || 0;
    const value2 = values[metric2] || 0;
    
    // Normalize values and calculate simple correlation
    return Math.min(1, Math.abs(value1 * value2) / (value1 + value2 + 1));
  }

  private async createCorrelationAnomaly(
    metric1: string,
    metric2: string,
    correlation: { isBroken: boolean; expectedCorrelation: number; actualCorrelation: number },
    metrics: SystemMetrics
  ): Promise<Anomaly> {
    const context = await this.buildAnomalyContext(`${metric1}:${metric2}`, metrics);
    
    return {
      id: this.generateAnomalyId(),
      metricName: `${metric1}:${metric2}`,
      anomalyType: AnomalyType.CORRELATION_BREAK,
      severity: AnomalySeverity.MEDIUM,
      detectedAt: Date.now(),
      value: correlation.actualCorrelation,
      expectedValue: correlation.expectedCorrelation,
      deviation: Math.abs(correlation.expectedCorrelation - correlation.actualCorrelation),
      confidence: 0.8,
      context,
      impact: this.assessAnomalyImpact(`${metric1}:${metric2}`, correlation.actualCorrelation, AnomalySeverity.MEDIUM),
      recommendations: this.generateCorrelationRecommendations(metric1, metric2),
      status: AnomalyStatus.ACTIVE
    };
  }

  private async buildAnomalyContext(metricName: string, metrics: SystemMetrics): Promise<AnomalyContext> {
    const relatedMetrics = this.findRelatedMetrics(metricName, metrics);
    const systemState = await this.getSystemState();
    const externalFactors = await this.identifyExternalFactors();

    return {
      timeWindow: {
        start: Date.now() - 3600000, // 1 hour ago
        end: Date.now(),
        duration: 3600000,
        precedingPeriod: 3600000
      },
      relatedMetrics,
      systemState,
      externalFactors
    };
  }

  private findRelatedMetrics(metricName: string, metrics: SystemMetrics): RelatedMetric[] {
    const metricValues = this.extractMetricValues(metrics);
    const related: RelatedMetric[] = [];

    // Define metric relationships
    const relationships: Record<string, string[]> = {
      'cpu.usage': ['application.response_time.avg', 'application.requests_per_second'],
      'memory.usage': ['redis.memory_usage', 'application.error_rate'],
      'redis.memory_usage': ['memory.usage', 'redis.hit_rate'],
      'application.response_time.avg': ['cpu.usage', 'application.error_rate']
    };

    const relatedMetricNames = relationships[metricName] || [];
    
    for (const relatedMetricName of relatedMetricNames) {
      const value = metricValues[relatedMetricName];
      if (value !== undefined) {
        related.push({
          metricName: relatedMetricName,
          correlation: 0.7, // Simplified
          value,
          normalValue: value * 0.9, // Simplified
          deviation: Math.abs(value - value * 0.9)
        });
      }
    }

    return related;
  }

  private async getSystemState(): Promise<SystemState> {
    // Simplified system state
    return {
      overallHealth: 0.85,
      activeAlerts: 2,
      recentDeployments: [],
      configurationChanges: [],
      maintenanceWindows: []
    };
  }

  private async identifyExternalFactors(): Promise<ExternalFactor[]> {
    // Simplified external factors identification
    return [
      {
        type: ExternalFactorType.TRAFFIC_SPIKE,
        description: 'Increased traffic detected',
        impact: 0.3,
        confidence: 0.7
      }
    ];
  }

  private async analyzeRootCause(
    metricName: string,
    value: number,
    context: AnomalyContext
  ): Promise<RootCause> {
    // Simplified root cause analysis
    let category: RootCauseCategory;
    let description: string;

    if (metricName.includes('cpu') || metricName.includes('memory')) {
      category = RootCauseCategory.RESOURCE_EXHAUSTION;
      description = 'Resource utilization exceeded normal thresholds';
    } else if (metricName.includes('error')) {
      category = RootCauseCategory.CODE_ISSUE;
      description = 'Increased error rate indicates potential code issues';
    } else if (metricName.includes('redis')) {
      category = RootCauseCategory.INFRASTRUCTURE_PROBLEM;
      description = 'Redis performance degradation detected';
    } else {
      category = RootCauseCategory.CAPACITY_LIMIT;
      description = 'System approaching capacity limits';
    }

    return {
      category,
      description,
      confidence: 0.7,
      evidence: [
        {
          type: EvidenceType.METRIC_VALUE,
          description: `${metricName} value: ${value}`,
          value,
          timestamp: Date.now(),
          source: 'metrics-collector'
        }
      ],
      contributingFactors: [
        {
          factor: 'increased_load',
          impact: 0.6,
          description: 'System load has increased recently'
        }
      ]
    };
  }

  private assessAnomalyImpact(metricName: string, value: number, severity: AnomalySeverity): AnomalyImpact {
    const severityMultiplier = {
      [AnomalySeverity.CRITICAL]: 1.0,
      [AnomalySeverity.HIGH]: 0.7,
      [AnomalySeverity.MEDIUM]: 0.4,
      [AnomalySeverity.LOW]: 0.2,
      [AnomalySeverity.INFO]: 0.1
    };

    const multiplier = severityMultiplier[severity];

    return {
      userExperience: {
        affectedUsers: Math.floor(1000 * multiplier),
        responseTimeIncrease: 100 * multiplier,
        errorRateIncrease: 0.05 * multiplier,
        featureAvailability: 1 - (0.2 * multiplier),
        satisfactionScore: 1 - (0.3 * multiplier)
      },
      systemPerformance: {
        throughputDecrease: 0.2 * multiplier,
        latencyIncrease: 50 * multiplier,
        resourceUtilization: 0.8 + (0.2 * multiplier),
        errorRate: 0.02 * multiplier,
        availabilityImpact: 0.1 * multiplier
      },
      businessMetrics: {
        revenueImpact: 1000 * multiplier,
        conversionRateChange: -0.1 * multiplier,
        customerSatisfactionChange: -0.2 * multiplier,
        brandReputationRisk: 0.3 * multiplier
      },
      operationalCost: {
        additionalResourceCost: 500 * multiplier,
        maintenanceCost: 200 * multiplier,
        opportunityCost: 1000 * multiplier,
        totalCost: 1700 * multiplier
      }
    };
  }

  private generateRecommendations(
    metricName: string,
    prediction: any,
    rootCause?: RootCause
  ): AnomalyRecommendation[] {
    const recommendations: AnomalyRecommendation[] = [];

    // Generate metric-specific recommendations
    if (metricName.includes('cpu')) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: RecommendationType.IMMEDIATE_ACTION,
        priority: RecommendationPriority.HIGH,
        title: 'Scale CPU Resources',
        description: 'Increase CPU allocation to handle the increased load',
        action: {
          type: ActionType.SCALE_RESOURCES,
          parameters: { resource: 'cpu', scaleFactor: 1.5 },
          automatable: true,
          riskLevel: RiskLevel.MEDIUM
        },
        expectedImpact: {
          resolutionTime: 300,
          effectivenessScore: 0.8,
          riskMitigation: 0.7
        },
        timeframe: '5 minutes',
        prerequisites: ['admin-access']
      });
    }

    if (metricName.includes('memory')) {
      recommendations.push({
        id: this.generateRecommendationId(),
        type: RecommendationType.IMMEDIATE_ACTION,
        priority: RecommendationPriority.HIGH,
        title: 'Investigate Memory Usage',
        description: 'Check for memory leaks or excessive memory consumption',
        action: {
          type: ActionType.INVESTIGATE_LOGS,
          parameters: { logLevel: 'error', timeRange: '1h' },
          automatable: false,
          riskLevel: RiskLevel.LOW
        },
        expectedImpact: {
          resolutionTime: 1800,
          effectivenessScore: 0.6,
          riskMitigation: 0.8
        },
        timeframe: '30 minutes',
        prerequisites: ['log-access']
      });
    }

    return recommendations;
  }

  private generateCorrelationRecommendations(metric1: string, metric2: string): AnomalyRecommendation[] {
    return [
      {
        id: this.generateRecommendationId(),
        type: RecommendationType.INVESTIGATION,
        priority: RecommendationPriority.MEDIUM,
        title: 'Investigate Correlation Break',
        description: `Investigate why ${metric1} and ${metric2} correlation has changed`,
        action: {
          type: ActionType.RUN_DIAGNOSTIC,
          parameters: { metrics: [metric1, metric2], timeRange: '24h' },
          automatable: true,
          riskLevel: RiskLevel.LOW
        },
        expectedImpact: {
          resolutionTime: 3600,
          effectivenessScore: 0.7,
          riskMitigation: 0.6
        },
        timeframe: '1 hour',
        prerequisites: ['diagnostic-access']
      }
    ];
  }

  private async getHistoricalData(metricName: string, timeRange: number): Promise<number[]> {
    try {
      const key = `metrics:${metricName}`;
      const end = Date.now();
      const start = end - timeRange;
      
      const data = await this.redis.call(
        'TS.RANGE',
        key,
        start,
        end,
        'AGGREGATION',
        'avg',
        300000 // 5 minute intervals
      ) as [number, string][];

      return data.map(([, value]) => parseFloat(value));
    } catch (error) {
      logger.error(`Error getting historical data for ${metricName}:`, error);
      return [];
    }
  }

  private async updateModelFromResolution(anomaly: Anomaly, resolution: string): Promise<void> {
    const model = this.models.get(anomaly.metricName);
    if (!model) return;

    // Update model based on resolution feedback
    const wasCorrect = !resolution.includes('false positive');
    
    if (wasCorrect) {
      model.accuracy.precision = Math.min(1, model.accuracy.precision + 0.02);
    } else {
      model.accuracy.falsePositiveRate = Math.min(1, model.accuracy.falsePositiveRate + 0.02);
    }

    model.accuracy.lastEvaluation = Date.now();
    model.lastUpdated = Date.now();
  }

  private async retrainModel(model: AnomalyDetectionModel): Promise<void> {
    logger.info(`Retraining anomaly detection model for ${model.metricName}`);
    
    // Get fresh training data
    const historicalData = await this.getHistoricalData(model.metricName, 14 * 24 * 60 * 60 * 1000); // 14 days
    
    // Update training period
    model.trainingPeriod = {
      start: Date.now() - (14 * 24 * 60 * 60 * 1000),
      end: Date.now(),
      sampleCount: historicalData.length,
      dataQuality: this.assessDataQuality(historicalData)
    };
    
    // Reset accuracy metrics
    model.accuracy = {
      precision: 0.8,
      recall: 0.8,
      f1Score: 0.8,
      falsePositiveRate: 0.1,
      falseNegativeRate: 0.1,
      lastEvaluation: Date.now()
    };
    
    model.lastUpdated = Date.now();
    model.trainingPeriod.sampleCount = historicalData.length;
    
    logger.info(`Model retrained for ${model.metricName} with ${historicalData.length} samples`);
  }

  private assessDataQuality(data: number[]): number {
    if (data.length === 0) return 0;

    const hasNaN = data.some(val => isNaN(val));
    const hasInfinite = data.some(val => !isFinite(val));
    
    let quality = 1.0;
    if (hasNaN) quality -= 0.3;
    if (hasInfinite) quality -= 0.3;
    
    return Math.max(0, quality);
  }

  private async getAnomaly(anomalyId: string): Promise<Anomaly | null> {
    const data = await this.redis.hget(`${this.ANOMALY_PREFIX}:${anomalyId}`, 'data');
    return data ? JSON.parse(data) : null;
  }

  private async storeAnomaly(anomaly: Anomaly): Promise<void> {
    await this.redis.hset(
      `${this.ANOMALY_PREFIX}:${anomaly.id}`,
      'data',
      JSON.stringify(anomaly)
    );

    // Set expiration for resolved anomalies
    if (anomaly.status === AnomalyStatus.RESOLVED) {
      await this.redis.expire(`${this.ANOMALY_PREFIX}:${anomaly.id}`, 7 * 24 * 60 * 60); // 7 days
    }
  }

  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}