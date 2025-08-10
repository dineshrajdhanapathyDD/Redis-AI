export * from './metrics-collector';
export * from './performance-predictor';
export * from './resource-optimizer';
export * from './anomaly-detector';
export * from './cost-optimizer';
export * from './optimization-engine';

import { Redis } from 'ioredis';
import { MetricsCollector } from './metrics-collector';
import { PerformancePredictor } from './performance-predictor';
import { ResourceOptimizer } from './resource-optimizer';
import { AnomalyDetector } from './anomaly-detector';
import { CostOptimizer } from './cost-optimizer';
import { OptimizationEngine } from './optimization-engine';
import { logger } from '../../utils/logger';

export class PredictiveOptimizationService {
  public readonly metricsCollector: MetricsCollector;
  public readonly performancePredictor: PerformancePredictor;
  public readonly resourceOptimizer: ResourceOptimizer;
  public readonly anomalyDetector: AnomalyDetector;
  public readonly costOptimizer: CostOptimizer;
  public readonly optimizationEngine: OptimizationEngine;

  constructor(redis: Redis) {
    this.metricsCollector = new MetricsCollector(redis);
    this.performancePredictor = new PerformancePredictor(redis);
    this.resourceOptimizer = new ResourceOptimizer(redis);
    this.anomalyDetector = new AnomalyDetector(redis);
    this.costOptimizer = new CostOptimizer(redis);
    this.optimizationEngine = new OptimizationEngine(
      redis,
      this.metricsCollector,
      this.performancePredictor,
      this.resourceOptimizer,
      this.anomalyDetector,
      this.costOptimizer
    );
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Predictive Optimization Service');
    
    // Initialize all components
    await this.metricsCollector.initialize();
    await this.performancePredictor.initialize();
    await this.resourceOptimizer.initialize();
    await this.anomalyDetector.initialize();
    await this.costOptimizer.initialize();
    await this.optimizationEngine.initialize();
    
    logger.info('Predictive Optimization Service initialized successfully');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Predictive Optimization Service');
    
    // Shutdown all components
    await this.optimizationEngine.shutdown();
    await this.costOptimizer.shutdown();
    await this.anomalyDetector.shutdown();
    await this.resourceOptimizer.shutdown();
    await this.performancePredictor.shutdown();
    await this.metricsCollector.shutdown();
    
    logger.info('Predictive Optimization Service shutdown complete');
  }
}