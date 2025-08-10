import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { SystemMetrics, MetricsAggregation, TimeRange, AggregationType } from './metrics-collector';

export interface PerformancePrediction {
  id: string;
  metricName: string;
  predictionType: PredictionType;
  timeHorizon: number; // seconds into the future
  predictedValue: number;
  confidence: number; // 0-1
  trend: TrendDirection;
  seasonality: SeasonalityPattern;
  anomalyScore: number;
  factors: PredictionFactor[];
  generatedAt: number;
  validUntil: number;
}

export enum PredictionType {
  RESOURCE_USAGE = 'resource_usage',
  PERFORMANCE_DEGRADATION = 'performance_degradation',
  CAPACITY_LIMIT = 'capacity_limit',
  ANOMALY_DETECTION = 'anomaly_detection',
  COST_PROJECTION = 'cost_projection'
}

export enum TrendDirection {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable',
  VOLATILE = 'volatile',
  CYCLICAL = 'cyclical'
}

export interface SeasonalityPattern {
  detected: boolean;
  period: number; // seconds
  amplitude: number;
  phase: number;
  confidence: number;
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 to 1
  confidence: number; // 0-1
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

export enum ModelType {
  LINEAR_REGRESSION = 'linear_regression',
  ARIMA = 'arima',
  EXPONENTIAL_SMOOTHING = 'exponential_smoothing',
  NEURAL_NETWORK = 'neural_network',
  ENSEMBLE = 'ensemble'
}

export interface ModelParameters {
  [key: string]: number | string | boolean;
}

export interface ModelAccuracy {
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  r2: number; // R-squared
  lastValidation: number;
  validationSamples: number;
}

export interface TrainingDataInfo {
  startTime: number;
  endTime: number;
  sampleCount: number;
  dataQuality: number; // 0-1
  missingValues: number;
  outliers: number;
}

export interface BottleneckPrediction {
  id: string;
  resourceType: ResourceType;
  severity: BottleneckSeverity;
  estimatedTime: number; // when bottleneck will occur
  duration: number; // how long it will last
  impact: BottleneckImpact;
  mitigation: MitigationStrategy[];
  confidence: number;
  generatedAt: number;
}

export enum ResourceType {
  CPU = 'cpu',
  MEMORY = 'memory',
  REDIS_MEMORY = 'redis_memory',
  NETWORK_BANDWIDTH = 'network_bandwidth',
  DISK_IO = 'disk_io',
  CONNECTION_POOL = 'connection_pool',
  QUEUE_CAPACITY = 'queue_capacity'
}

export enum BottleneckSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface BottleneckImpact {
  affectedServices: string[];
  performanceDegradation: number; // 0-1
  userImpact: UserImpactLevel;
  businessImpact: BusinessImpactLevel;
  estimatedCost: number;
}

export enum UserImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum BusinessImpactLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface MitigationStrategy {
  id: string;
  name: string;
  description: string;
  type: MitigationType;
  effectiveness: number; // 0-1
  cost: number;
  implementationTime: number; // seconds
  prerequisites: string[];
  risks: string[];
}

export enum MitigationType {
  SCALE_UP = 'scale_up',
  SCALE_OUT = 'scale_out',
  OPTIMIZE_CONFIG = 'optimize_config',
  CACHE_WARMING = 'cache_warming',
  LOAD_BALANCING = 'load_balancing',
  RESOURCE_REALLOCATION = 'resource_reallocation',
  THROTTLING = 'throttling'
}

export class PerformancePredictor {
  private redis: Redis;
  private readonly PREDICTION_PREFIX = 'prediction';
  private readonly MODEL_PREFIX = 'model';
  private readonly BOTTLENECK_PREFIX = 'bottleneck';
  private models: Map<string, PredictionModel> = new Map();
  private predictionInterval?: NodeJS.Timeout;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Performance Predictor');
    
    // Load existing models
    await this.loadModels();
    
    // Start prediction generation
    await this.startPredictionGeneration();
    
    logger.info('Performance Predictor initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Performance Predictor');
    
    if (this.predictionInterval) {
      clearInterval(this.predictionInterval);
    }
    
    // Save models
    await this.saveModels();
    
    logger.info('Performance Predictor shutdown complete');
  }

  async generatePrediction(
    metricName: string,
    timeHorizon: number,
    predictionType: PredictionType = PredictionType.RESOURCE_USAGE
  ): Promise<PerformancePrediction> {
    // Get historical data for the metric
    const timeRange: TimeRange = {
      start: Date.now() - (7 * 24 * 60 * 60 * 1000), // 7 days ago
      end: Date.now(),
      interval: 300 // 5 minutes
    };

    const historicalData = await this.getHistoricalData(metricName, timeRange);
    
    // Get or create model for this metric
    let model = this.models.get(metricName);
    if (!model) {
      model = await this.createModel(metricName, historicalData);
      this.models.set(metricName, model);
    }

    // Generate prediction using the model
    const prediction = await this.predict(model, historicalData, timeHorizon, predictionType);
    
    // Store prediction
    await this.storePrediction(prediction);
    
    return prediction;
  }

  async predictBottlenecks(timeHorizon: number = 3600): Promise<BottleneckPrediction[]> {
    const bottlenecks: BottleneckPrediction[] = [];
    
    // Predict bottlenecks for different resource types
    const resourceMetrics = [
      { type: ResourceType.CPU, metric: 'cpu.usage', threshold: 0.8 },
      { type: ResourceType.MEMORY, metric: 'memory.usage', threshold: 0.85 },
      { type: ResourceType.REDIS_MEMORY, metric: 'redis.memory_usage', threshold: 0.9 },
      { type: ResourceType.NETWORK_BANDWIDTH, metric: 'network.bytes_in', threshold: 1000000 },
      { type: ResourceType.CONNECTION_POOL, metric: 'redis.connected_clients', threshold: 1000 }
    ];

    for (const resource of resourceMetrics) {
      const prediction = await this.generatePrediction(
        resource.metric,
        timeHorizon,
        PredictionType.CAPACITY_LIMIT
      );

      if (prediction.predictedValue > resource.threshold && prediction.confidence > 0.7) {
        const bottleneck = await this.createBottleneckPrediction(
          resource.type,
          prediction,
          resource.threshold
        );
        bottlenecks.push(bottleneck);
      }
    }

    return bottlenecks.sort((a, b) => a.estimatedTime - b.estimatedTime);
  }

  async updateModel(metricName: string, actualValue: number, timestamp: number): Promise<void> {
    const model = this.models.get(metricName);
    if (!model) return;

    // Update model accuracy based on actual vs predicted values
    const recentPredictions = await this.getRecentPredictions(metricName, timestamp - 3600000); // 1 hour ago
    
    if (recentPredictions.length > 0) {
      const accuracy = this.calculateModelAccuracy(recentPredictions, actualValue);
      model.accuracy = accuracy;
      model.lastUpdated = timestamp;
      
      // Retrain model if accuracy drops below threshold
      if (accuracy.mape > 0.2) { // 20% error threshold
        await this.retrainModel(model);
      }
    }
  }

  async getActivePredictions(): Promise<PerformancePrediction[]> {
    const predictionKeys = await this.redis.keys(`${this.PREDICTION_PREFIX}:*`);
    const predictions: PerformancePrediction[] = [];
    const now = Date.now();

    for (const key of predictionKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const prediction = JSON.parse(data) as PerformancePrediction;
        if (prediction.validUntil > now) {
          predictions.push(prediction);
        }
      }
    }

    return predictions.sort((a, b) => a.generatedAt - b.generatedAt);
  }

  private async loadModels(): Promise<void> {
    const modelKeys = await this.redis.keys(`${this.MODEL_PREFIX}:*`);
    
    for (const key of modelKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const model = JSON.parse(data) as PredictionModel;
        this.models.set(model.metricName, model);
      }
    }
    
    logger.info(`Loaded ${this.models.size} prediction models`);
  }

  private async saveModels(): Promise<void> {
    for (const [metricName, model] of this.models) {
      await this.redis.hset(
        `${this.MODEL_PREFIX}:${metricName}`,
        'data',
        JSON.stringify(model)
      );
    }
    
    logger.info(`Saved ${this.models.size} prediction models`);
  }

  private async startPredictionGeneration(): Promise<void> {
    // Generate predictions every 5 minutes
    this.predictionInterval = setInterval(async () => {
      try {
        await this.generateRoutinePredictions();
      } catch (error) {
        logger.error('Error generating routine predictions:', error);
      }
    }, 5 * 60 * 1000);

    // Generate initial predictions
    await this.generateRoutinePredictions();
  }

  private async generateRoutinePredictions(): Promise<void> {
    const metrics = [
      'cpu.usage',
      'memory.usage',
      'redis.memory_usage',
      'redis.connected_clients',
      'application.requests_per_second',
      'application.response_time.avg'
    ];

    const timeHorizons = [300, 900, 1800, 3600]; // 5min, 15min, 30min, 1hour

    for (const metric of metrics) {
      for (const horizon of timeHorizons) {
        try {
          await this.generatePrediction(metric, horizon);
        } catch (error) {
          logger.error(`Error generating prediction for ${metric}:`, error);
        }
      }
    }
  }

  private async getHistoricalData(metricName: string, timeRange: TimeRange): Promise<number[]> {
    try {
      const key = `metrics:${metricName}`;
      const data = await this.redis.call(
        'TS.RANGE',
        key,
        timeRange.start,
        timeRange.end,
        'AGGREGATION',
        'avg',
        timeRange.interval * 1000
      ) as [number, string][];

      return data.map(([, value]) => parseFloat(value));
    } catch (error) {
      logger.error(`Error getting historical data for ${metricName}:`, error);
      return [];
    }
  }

  private async createModel(metricName: string, historicalData: number[]): Promise<PredictionModel> {
    const model: PredictionModel = {
      id: this.generateModelId(),
      metricName,
      modelType: ModelType.EXPONENTIAL_SMOOTHING, // Default model type
      parameters: this.calculateModelParameters(historicalData),
      accuracy: this.initializeAccuracy(),
      trainingData: {
        startTime: Date.now() - (7 * 24 * 60 * 60 * 1000),
        endTime: Date.now(),
        sampleCount: historicalData.length,
        dataQuality: this.assessDataQuality(historicalData),
        missingValues: 0,
        outliers: this.countOutliers(historicalData)
      },
      lastUpdated: Date.now(),
      version: 1
    };

    return model;
  }

  private async predict(
    model: PredictionModel,
    historicalData: number[],
    timeHorizon: number,
    predictionType: PredictionType
  ): Promise<PerformancePrediction> {
    // Simple exponential smoothing prediction
    const alpha = model.parameters.alpha as number || 0.3;
    const trend = this.calculateTrend(historicalData);
    const seasonality = this.detectSeasonality(historicalData);
    
    let predictedValue: number;
    let confidence: number;

    if (historicalData.length === 0) {
      predictedValue = 0;
      confidence = 0;
    } else {
      const lastValue = historicalData[historicalData.length - 1];
      const trendAdjustment = trend.slope * (timeHorizon / 300); // Adjust for time horizon
      predictedValue = lastValue + trendAdjustment;
      confidence = Math.max(0.1, 1 - (timeHorizon / 3600) * 0.5); // Confidence decreases with time
    }

    const factors = this.identifyPredictionFactors(historicalData, trend, seasonality);
    const anomalyScore = this.calculateAnomalyScore(predictedValue, historicalData);

    return {
      id: this.generatePredictionId(),
      metricName: model.metricName,
      predictionType,
      timeHorizon,
      predictedValue,
      confidence,
      trend: trend.direction,
      seasonality,
      anomalyScore,
      factors,
      generatedAt: Date.now(),
      validUntil: Date.now() + timeHorizon * 1000
    };
  }

  private calculateTrend(data: number[]): { direction: TrendDirection; slope: number } {
    if (data.length < 2) {
      return { direction: TrendDirection.STABLE, slope: 0 };
    }

    // Simple linear regression to calculate trend
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);

    let direction: TrendDirection;
    if (Math.abs(slope) < 0.01) {
      direction = TrendDirection.STABLE;
    } else if (slope > 0) {
      direction = TrendDirection.INCREASING;
    } else {
      direction = TrendDirection.DECREASING;
    }

    return { direction, slope };
  }

  private detectSeasonality(data: number[]): SeasonalityPattern {
    // Simple seasonality detection using autocorrelation
    if (data.length < 24) { // Need at least 24 data points
      return {
        detected: false,
        period: 0,
        amplitude: 0,
        phase: 0,
        confidence: 0
      };
    }

    // Check for daily seasonality (assuming 5-minute intervals)
    const dailyPeriod = 288; // 24 hours * 60 minutes / 5 minutes
    const correlation = this.calculateAutocorrelation(data, dailyPeriod);

    return {
      detected: correlation > 0.3,
      period: dailyPeriod * 300, // Convert to seconds
      amplitude: this.calculateAmplitude(data),
      phase: 0, // Simplified
      confidence: Math.max(0, correlation)
    };
  }

  private calculateAutocorrelation(data: number[], lag: number): number {
    if (data.length <= lag) return 0;

    const n = data.length - lag;
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    
    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (data[i] - mean) * (data[i + lag] - mean);
    }

    for (let i = 0; i < data.length; i++) {
      denominator += Math.pow(data[i] - mean, 2);
    }

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateAmplitude(data: number[]): number {
    const max = Math.max(...data);
    const min = Math.min(...data);
    return (max - min) / 2;
  }

  private identifyPredictionFactors(
    data: number[],
    trend: { direction: TrendDirection; slope: number },
    seasonality: SeasonalityPattern
  ): PredictionFactor[] {
    const factors: PredictionFactor[] = [];

    // Trend factor
    if (Math.abs(trend.slope) > 0.01) {
      factors.push({
        name: 'trend',
        impact: Math.sign(trend.slope) * Math.min(1, Math.abs(trend.slope) * 10),
        confidence: 0.8,
        description: `${trend.direction} trend detected`
      });
    }

    // Seasonality factor
    if (seasonality.detected) {
      factors.push({
        name: 'seasonality',
        impact: seasonality.amplitude / (Math.max(...data) || 1),
        confidence: seasonality.confidence,
        description: `Seasonal pattern with ${seasonality.period}s period`
      });
    }

    // Volatility factor
    const volatility = this.calculateVolatility(data);
    if (volatility > 0.1) {
      factors.push({
        name: 'volatility',
        impact: -volatility,
        confidence: 0.7,
        description: `High volatility detected (${(volatility * 100).toFixed(1)}%)`
      });
    }

    return factors;
  }

  private calculateVolatility(data: number[]): number {
    if (data.length < 2) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);

    return mean === 0 ? 0 : stdDev / Math.abs(mean);
  }

  private calculateAnomalyScore(predictedValue: number, historicalData: number[]): number {
    if (historicalData.length === 0) return 0;

    const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
    const stdDev = Math.sqrt(
      historicalData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalData.length
    );

    if (stdDev === 0) return 0;

    const zScore = Math.abs(predictedValue - mean) / stdDev;
    return Math.min(1, zScore / 3); // Normalize to 0-1 range
  }

  private async createBottleneckPrediction(
    resourceType: ResourceType,
    prediction: PerformancePrediction,
    threshold: number
  ): Promise<BottleneckPrediction> {
    const severity = this.calculateBottleneckSeverity(prediction.predictedValue, threshold);
    const impact = this.assessBottleneckImpact(resourceType, severity);
    const mitigation = this.generateMitigationStrategies(resourceType, severity);

    const bottleneck: BottleneckPrediction = {
      id: this.generateBottleneckId(),
      resourceType,
      severity,
      estimatedTime: prediction.generatedAt + (prediction.timeHorizon * 1000),
      duration: this.estimateBottleneckDuration(resourceType, severity),
      impact,
      mitigation,
      confidence: prediction.confidence,
      generatedAt: Date.now()
    };

    await this.storeBottleneckPrediction(bottleneck);
    return bottleneck;
  }

  private calculateBottleneckSeverity(predictedValue: number, threshold: number): BottleneckSeverity {
    const ratio = predictedValue / threshold;
    
    if (ratio >= 1.5) return BottleneckSeverity.CRITICAL;
    if (ratio >= 1.2) return BottleneckSeverity.HIGH;
    if (ratio >= 1.1) return BottleneckSeverity.MEDIUM;
    return BottleneckSeverity.LOW;
  }

  private assessBottleneckImpact(resourceType: ResourceType, severity: BottleneckSeverity): BottleneckImpact {
    const baseImpact = {
      affectedServices: this.getAffectedServices(resourceType),
      performanceDegradation: this.getPerformanceDegradation(severity),
      userImpact: this.getUserImpact(severity),
      businessImpact: this.getBusinessImpact(severity),
      estimatedCost: this.getEstimatedCost(resourceType, severity)
    };

    return baseImpact;
  }

  private getAffectedServices(resourceType: ResourceType): string[] {
    const serviceMap = {
      [ResourceType.CPU]: ['search', 'ai-routing', 'code-intelligence'],
      [ResourceType.MEMORY]: ['embedding-manager', 'vector-storage', 'caching'],
      [ResourceType.REDIS_MEMORY]: ['all-services'],
      [ResourceType.NETWORK_BANDWIDTH]: ['api-gateway', 'websocket-gateway'],
      [ResourceType.CONNECTION_POOL]: ['database-operations', 'caching-layer']
    };

    return serviceMap[resourceType] || ['unknown'];
  }

  private getPerformanceDegradation(severity: BottleneckSeverity): number {
    const degradationMap = {
      [BottleneckSeverity.CRITICAL]: 0.8,
      [BottleneckSeverity.HIGH]: 0.5,
      [BottleneckSeverity.MEDIUM]: 0.3,
      [BottleneckSeverity.LOW]: 0.1
    };

    return degradationMap[severity];
  }

  private getUserImpact(severity: BottleneckSeverity): UserImpactLevel {
    const impactMap = {
      [BottleneckSeverity.CRITICAL]: UserImpactLevel.CRITICAL,
      [BottleneckSeverity.HIGH]: UserImpactLevel.HIGH,
      [BottleneckSeverity.MEDIUM]: UserImpactLevel.MEDIUM,
      [BottleneckSeverity.LOW]: UserImpactLevel.LOW
    };

    return impactMap[severity];
  }

  private getBusinessImpact(severity: BottleneckSeverity): BusinessImpactLevel {
    const impactMap = {
      [BottleneckSeverity.CRITICAL]: BusinessImpactLevel.CRITICAL,
      [BottleneckSeverity.HIGH]: BusinessImpactLevel.HIGH,
      [BottleneckSeverity.MEDIUM]: BusinessImpactLevel.MEDIUM,
      [BottleneckSeverity.LOW]: BusinessImpactLevel.LOW
    };

    return impactMap[severity];
  }

  private getEstimatedCost(resourceType: ResourceType, severity: BottleneckSeverity): number {
    // Simplified cost estimation
    const baseCosts = {
      [ResourceType.CPU]: 100,
      [ResourceType.MEMORY]: 80,
      [ResourceType.REDIS_MEMORY]: 150,
      [ResourceType.NETWORK_BANDWIDTH]: 200,
      [ResourceType.CONNECTION_POOL]: 50
    };

    const severityMultiplier = {
      [BottleneckSeverity.CRITICAL]: 5,
      [BottleneckSeverity.HIGH]: 3,
      [BottleneckSeverity.MEDIUM]: 2,
      [BottleneckSeverity.LOW]: 1
    };

    return (baseCosts[resourceType] || 100) * severityMultiplier[severity];
  }

  private generateMitigationStrategies(resourceType: ResourceType, severity: BottleneckSeverity): MitigationStrategy[] {
    const strategies: MitigationStrategy[] = [];

    // Resource-specific strategies
    switch (resourceType) {
      case ResourceType.CPU:
        strategies.push({
          id: 'cpu-scale-up',
          name: 'Scale Up CPU',
          description: 'Increase CPU allocation for the service',
          type: MitigationType.SCALE_UP,
          effectiveness: 0.8,
          cost: 200,
          implementationTime: 300,
          prerequisites: ['admin-access'],
          risks: ['service-restart-required']
        });
        break;

      case ResourceType.MEMORY:
        strategies.push({
          id: 'memory-scale-up',
          name: 'Scale Up Memory',
          description: 'Increase memory allocation for the service',
          type: MitigationType.SCALE_UP,
          effectiveness: 0.9,
          cost: 150,
          implementationTime: 300,
          prerequisites: ['admin-access'],
          risks: ['service-restart-required']
        });
        break;

      case ResourceType.REDIS_MEMORY:
        strategies.push({
          id: 'redis-optimize',
          name: 'Optimize Redis Configuration',
          description: 'Adjust Redis memory policies and eviction settings',
          type: MitigationType.OPTIMIZE_CONFIG,
          effectiveness: 0.7,
          cost: 0,
          implementationTime: 600,
          prerequisites: ['redis-admin-access'],
          risks: ['potential-data-loss']
        });
        break;
    }

    return strategies;
  }

  private estimateBottleneckDuration(resourceType: ResourceType, severity: BottleneckSeverity): number {
    // Simplified duration estimation in seconds
    const baseDuration = {
      [ResourceType.CPU]: 1800, // 30 minutes
      [ResourceType.MEMORY]: 3600, // 1 hour
      [ResourceType.REDIS_MEMORY]: 7200, // 2 hours
      [ResourceType.NETWORK_BANDWIDTH]: 900, // 15 minutes
      [ResourceType.CONNECTION_POOL]: 600 // 10 minutes
    };

    const severityMultiplier = {
      [BottleneckSeverity.CRITICAL]: 3,
      [BottleneckSeverity.HIGH]: 2,
      [BottleneckSeverity.MEDIUM]: 1.5,
      [BottleneckSeverity.LOW]: 1
    };

    return (baseDuration[resourceType] || 1800) * severityMultiplier[severity];
  }

  private calculateModelParameters(data: number[]): ModelParameters {
    // Simple exponential smoothing parameters
    return {
      alpha: 0.3, // Smoothing parameter
      beta: 0.1,  // Trend parameter
      gamma: 0.1  // Seasonal parameter
    };
  }

  private initializeAccuracy(): ModelAccuracy {
    return {
      mape: 0.15, // 15% initial error estimate
      rmse: 0,
      mae: 0,
      r2: 0,
      lastValidation: Date.now(),
      validationSamples: 0
    };
  }

  private assessDataQuality(data: number[]): number {
    if (data.length === 0) return 0;

    // Simple data quality assessment
    const hasNaN = data.some(val => isNaN(val));
    const hasInfinite = data.some(val => !isFinite(val));
    const hasNegative = data.some(val => val < 0);
    
    let quality = 1.0;
    if (hasNaN) quality -= 0.3;
    if (hasInfinite) quality -= 0.3;
    if (hasNegative) quality -= 0.1;
    
    return Math.max(0, quality);
  }

  private countOutliers(data: number[]): number {
    if (data.length < 3) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length
    );

    const threshold = 2 * stdDev;
    return data.filter(val => Math.abs(val - mean) > threshold).length;
  }

  private async getRecentPredictions(metricName: string, since: number): Promise<PerformancePrediction[]> {
    const predictionKeys = await this.redis.keys(`${this.PREDICTION_PREFIX}:*`);
    const predictions: PerformancePrediction[] = [];

    for (const key of predictionKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const prediction = JSON.parse(data) as PerformancePrediction;
        if (prediction.metricName === metricName && prediction.generatedAt >= since) {
          predictions.push(prediction);
        }
      }
    }

    return predictions;
  }

  private calculateModelAccuracy(predictions: PerformancePrediction[], actualValue: number): ModelAccuracy {
    // Simplified accuracy calculation
    const errors = predictions.map(p => Math.abs(p.predictedValue - actualValue));
    const mape = errors.reduce((a, b) => a + b, 0) / (errors.length * actualValue);
    const mae = errors.reduce((a, b) => a + b, 0) / errors.length;
    const rmse = Math.sqrt(errors.reduce((acc, err) => acc + err * err, 0) / errors.length);

    return {
      mape,
      rmse,
      mae,
      r2: 0.8, // Simplified
      lastValidation: Date.now(),
      validationSamples: predictions.length
    };
  }

  private async retrainModel(model: PredictionModel): Promise<void> {
    logger.info(`Retraining model for ${model.metricName}`);
    
    // Get fresh training data
    const timeRange: TimeRange = {
      start: Date.now() - (14 * 24 * 60 * 60 * 1000), // 14 days
      end: Date.now(),
      interval: 300
    };

    const newData = await this.getHistoricalData(model.metricName, timeRange);
    
    // Update model parameters
    model.parameters = this.calculateModelParameters(newData);
    model.trainingData = {
      startTime: timeRange.start,
      endTime: timeRange.end,
      sampleCount: newData.length,
      dataQuality: this.assessDataQuality(newData),
      missingValues: 0,
      outliers: this.countOutliers(newData)
    };
    model.lastUpdated = Date.now();
    model.version += 1;

    logger.info(`Model retrained for ${model.metricName}, version ${model.version}`);
  }

  private async storePrediction(prediction: PerformancePrediction): Promise<void> {
    await this.redis.hset(
      `${this.PREDICTION_PREFIX}:${prediction.id}`,
      'data',
      JSON.stringify(prediction)
    );

    // Set expiration
    await this.redis.expire(
      `${this.PREDICTION_PREFIX}:${prediction.id}`,
      Math.ceil(prediction.timeHorizon * 2) // Keep for twice the prediction horizon
    );
  }

  private async storeBottleneckPrediction(bottleneck: BottleneckPrediction): Promise<void> {
    await this.redis.hset(
      `${this.BOTTLENECK_PREFIX}:${bottleneck.id}`,
      'data',
      JSON.stringify(bottleneck)
    );

    // Set expiration for 24 hours
    await this.redis.expire(`${this.BOTTLENECK_PREFIX}:${bottleneck.id}`, 86400);
  }

  private generateModelId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generatePredictionId(): string {
    return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateBottleneckId(): string {
    return `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}