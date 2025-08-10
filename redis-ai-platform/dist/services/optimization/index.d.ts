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
export declare class PredictiveOptimizationService {
    readonly metricsCollector: MetricsCollector;
    readonly performancePredictor: PerformancePredictor;
    readonly resourceOptimizer: ResourceOptimizer;
    readonly anomalyDetector: AnomalyDetector;
    readonly costOptimizer: CostOptimizer;
    readonly optimizationEngine: OptimizationEngine;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map