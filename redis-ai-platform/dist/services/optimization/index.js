"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictiveOptimizationService = void 0;
__exportStar(require("./metrics-collector"), exports);
__exportStar(require("./performance-predictor"), exports);
__exportStar(require("./resource-optimizer"), exports);
__exportStar(require("./anomaly-detector"), exports);
__exportStar(require("./cost-optimizer"), exports);
__exportStar(require("./optimization-engine"), exports);
const metrics_collector_1 = require("./metrics-collector");
const performance_predictor_1 = require("./performance-predictor");
const resource_optimizer_1 = require("./resource-optimizer");
const anomaly_detector_1 = require("./anomaly-detector");
const cost_optimizer_1 = require("./cost-optimizer");
const optimization_engine_1 = require("./optimization-engine");
const logger_1 = require("../../utils/logger");
class PredictiveOptimizationService {
    metricsCollector;
    performancePredictor;
    resourceOptimizer;
    anomalyDetector;
    costOptimizer;
    optimizationEngine;
    constructor(redis) {
        this.metricsCollector = new metrics_collector_1.MetricsCollector(redis);
        this.performancePredictor = new performance_predictor_1.PerformancePredictor(redis);
        this.resourceOptimizer = new resource_optimizer_1.ResourceOptimizer(redis);
        this.anomalyDetector = new anomaly_detector_1.AnomalyDetector(redis);
        this.costOptimizer = new cost_optimizer_1.CostOptimizer(redis);
        this.optimizationEngine = new optimization_engine_1.OptimizationEngine(redis, this.metricsCollector, this.performancePredictor, this.resourceOptimizer, this.anomalyDetector, this.costOptimizer);
    }
    async initialize() {
        logger_1.logger.info('Initializing Predictive Optimization Service');
        // Initialize all components
        await this.metricsCollector.initialize();
        await this.performancePredictor.initialize();
        await this.resourceOptimizer.initialize();
        await this.anomalyDetector.initialize();
        await this.costOptimizer.initialize();
        await this.optimizationEngine.initialize();
        logger_1.logger.info('Predictive Optimization Service initialized successfully');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Predictive Optimization Service');
        // Shutdown all components
        await this.optimizationEngine.shutdown();
        await this.costOptimizer.shutdown();
        await this.anomalyDetector.shutdown();
        await this.resourceOptimizer.shutdown();
        await this.performancePredictor.shutdown();
        await this.metricsCollector.shutdown();
        logger_1.logger.info('Predictive Optimization Service shutdown complete');
    }
}
exports.PredictiveOptimizationService = PredictiveOptimizationService;
//# sourceMappingURL=index.js.map