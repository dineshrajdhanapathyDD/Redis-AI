"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformancePredictor = exports.MitigationType = exports.BusinessImpactLevel = exports.UserImpactLevel = exports.BottleneckSeverity = exports.ResourceType = exports.ModelType = exports.TrendDirection = exports.PredictionType = void 0;
const logger_1 = require("../../utils/logger");
var PredictionType;
(function (PredictionType) {
    PredictionType["RESOURCE_USAGE"] = "resource_usage";
    PredictionType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    PredictionType["CAPACITY_LIMIT"] = "capacity_limit";
    PredictionType["ANOMALY_DETECTION"] = "anomaly_detection";
    PredictionType["COST_PROJECTION"] = "cost_projection";
})(PredictionType || (exports.PredictionType = PredictionType = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["INCREASING"] = "increasing";
    TrendDirection["DECREASING"] = "decreasing";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
    TrendDirection["CYCLICAL"] = "cyclical";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var ModelType;
(function (ModelType) {
    ModelType["LINEAR_REGRESSION"] = "linear_regression";
    ModelType["ARIMA"] = "arima";
    ModelType["EXPONENTIAL_SMOOTHING"] = "exponential_smoothing";
    ModelType["NEURAL_NETWORK"] = "neural_network";
    ModelType["ENSEMBLE"] = "ensemble";
})(ModelType || (exports.ModelType = ModelType = {}));
var ResourceType;
(function (ResourceType) {
    ResourceType["CPU"] = "cpu";
    ResourceType["MEMORY"] = "memory";
    ResourceType["REDIS_MEMORY"] = "redis_memory";
    ResourceType["NETWORK_BANDWIDTH"] = "network_bandwidth";
    ResourceType["DISK_IO"] = "disk_io";
    ResourceType["CONNECTION_POOL"] = "connection_pool";
    ResourceType["QUEUE_CAPACITY"] = "queue_capacity";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
var BottleneckSeverity;
(function (BottleneckSeverity) {
    BottleneckSeverity["CRITICAL"] = "critical";
    BottleneckSeverity["HIGH"] = "high";
    BottleneckSeverity["MEDIUM"] = "medium";
    BottleneckSeverity["LOW"] = "low";
})(BottleneckSeverity || (exports.BottleneckSeverity = BottleneckSeverity = {}));
var UserImpactLevel;
(function (UserImpactLevel) {
    UserImpactLevel["NONE"] = "none";
    UserImpactLevel["LOW"] = "low";
    UserImpactLevel["MEDIUM"] = "medium";
    UserImpactLevel["HIGH"] = "high";
    UserImpactLevel["CRITICAL"] = "critical";
})(UserImpactLevel || (exports.UserImpactLevel = UserImpactLevel = {}));
var BusinessImpactLevel;
(function (BusinessImpactLevel) {
    BusinessImpactLevel["NONE"] = "none";
    BusinessImpactLevel["LOW"] = "low";
    BusinessImpactLevel["MEDIUM"] = "medium";
    BusinessImpactLevel["HIGH"] = "high";
    BusinessImpactLevel["CRITICAL"] = "critical";
})(BusinessImpactLevel || (exports.BusinessImpactLevel = BusinessImpactLevel = {}));
var MitigationType;
(function (MitigationType) {
    MitigationType["SCALE_UP"] = "scale_up";
    MitigationType["SCALE_OUT"] = "scale_out";
    MitigationType["OPTIMIZE_CONFIG"] = "optimize_config";
    MitigationType["CACHE_WARMING"] = "cache_warming";
    MitigationType["LOAD_BALANCING"] = "load_balancing";
    MitigationType["RESOURCE_REALLOCATION"] = "resource_reallocation";
    MitigationType["THROTTLING"] = "throttling";
})(MitigationType || (exports.MitigationType = MitigationType = {}));
class PerformancePredictor {
    redis;
    PREDICTION_PREFIX = 'prediction';
    MODEL_PREFIX = 'model';
    BOTTLENECK_PREFIX = 'bottleneck';
    models = new Map();
    predictionInterval;
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Performance Predictor');
        // Load existing models
        await this.loadModels();
        // Start prediction generation
        await this.startPredictionGeneration();
        logger_1.logger.info('Performance Predictor initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Performance Predictor');
        if (this.predictionInterval) {
            clearInterval(this.predictionInterval);
        }
        // Save models
        await this.saveModels();
        logger_1.logger.info('Performance Predictor shutdown complete');
    }
    async generatePrediction(metricName, timeHorizon, predictionType = PredictionType.RESOURCE_USAGE) {
        // Get historical data for the metric
        const timeRange = {
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
    async predictBottlenecks(timeHorizon = 3600) {
        const bottlenecks = [];
        // Predict bottlenecks for different resource types
        const resourceMetrics = [
            { type: ResourceType.CPU, metric: 'cpu.usage', threshold: 0.8 },
            { type: ResourceType.MEMORY, metric: 'memory.usage', threshold: 0.85 },
            { type: ResourceType.REDIS_MEMORY, metric: 'redis.memory_usage', threshold: 0.9 },
            { type: ResourceType.NETWORK_BANDWIDTH, metric: 'network.bytes_in', threshold: 1000000 },
            { type: ResourceType.CONNECTION_POOL, metric: 'redis.connected_clients', threshold: 1000 }
        ];
        for (const resource of resourceMetrics) {
            const prediction = await this.generatePrediction(resource.metric, timeHorizon, PredictionType.CAPACITY_LIMIT);
            if (prediction.predictedValue > resource.threshold && prediction.confidence > 0.7) {
                const bottleneck = await this.createBottleneckPrediction(resource.type, prediction, resource.threshold);
                bottlenecks.push(bottleneck);
            }
        }
        return bottlenecks.sort((a, b) => a.estimatedTime - b.estimatedTime);
    }
    async updateModel(metricName, actualValue, timestamp) {
        const model = this.models.get(metricName);
        if (!model)
            return;
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
    async getActivePredictions() {
        const predictionKeys = await this.redis.keys(`${this.PREDICTION_PREFIX}:*`);
        const predictions = [];
        const now = Date.now();
        for (const key of predictionKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const prediction = JSON.parse(data);
                if (prediction.validUntil > now) {
                    predictions.push(prediction);
                }
            }
        }
        return predictions.sort((a, b) => a.generatedAt - b.generatedAt);
    }
    async loadModels() {
        const modelKeys = await this.redis.keys(`${this.MODEL_PREFIX}:*`);
        for (const key of modelKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const model = JSON.parse(data);
                this.models.set(model.metricName, model);
            }
        }
        logger_1.logger.info(`Loaded ${this.models.size} prediction models`);
    }
    async saveModels() {
        for (const [metricName, model] of this.models) {
            await this.redis.hset(`${this.MODEL_PREFIX}:${metricName}`, 'data', JSON.stringify(model));
        }
        logger_1.logger.info(`Saved ${this.models.size} prediction models`);
    }
    async startPredictionGeneration() {
        // Generate predictions every 5 minutes
        this.predictionInterval = setInterval(async () => {
            try {
                await this.generateRoutinePredictions();
            }
            catch (error) {
                logger_1.logger.error('Error generating routine predictions:', error);
            }
        }, 5 * 60 * 1000);
        // Generate initial predictions
        await this.generateRoutinePredictions();
    }
    async generateRoutinePredictions() {
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
                }
                catch (error) {
                    logger_1.logger.error(`Error generating prediction for ${metric}:`, error);
                }
            }
        }
    }
    async getHistoricalData(metricName, timeRange) {
        try {
            const key = `metrics:${metricName}`;
            const data = await this.redis.call('TS.RANGE', key, timeRange.start, timeRange.end, 'AGGREGATION', 'avg', timeRange.interval * 1000);
            return data.map(([, value]) => parseFloat(value));
        }
        catch (error) {
            logger_1.logger.error(`Error getting historical data for ${metricName}:`, error);
            return [];
        }
    }
    async createModel(metricName, historicalData) {
        const model = {
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
    async predict(model, historicalData, timeHorizon, predictionType) {
        // Simple exponential smoothing prediction
        const alpha = model.parameters.alpha || 0.3;
        const trend = this.calculateTrend(historicalData);
        const seasonality = this.detectSeasonality(historicalData);
        let predictedValue;
        let confidence;
        if (historicalData.length === 0) {
            predictedValue = 0;
            confidence = 0;
        }
        else {
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
    calculateTrend(data) {
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
        let direction;
        if (Math.abs(slope) < 0.01) {
            direction = TrendDirection.STABLE;
        }
        else if (slope > 0) {
            direction = TrendDirection.INCREASING;
        }
        else {
            direction = TrendDirection.DECREASING;
        }
        return { direction, slope };
    }
    detectSeasonality(data) {
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
    calculateAutocorrelation(data, lag) {
        if (data.length <= lag)
            return 0;
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
    calculateAmplitude(data) {
        const max = Math.max(...data);
        const min = Math.min(...data);
        return (max - min) / 2;
    }
    identifyPredictionFactors(data, trend, seasonality) {
        const factors = [];
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
    calculateVolatility(data) {
        if (data.length < 2)
            return 0;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const variance = data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length;
        const stdDev = Math.sqrt(variance);
        return mean === 0 ? 0 : stdDev / Math.abs(mean);
    }
    calculateAnomalyScore(predictedValue, historicalData) {
        if (historicalData.length === 0)
            return 0;
        const mean = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
        const stdDev = Math.sqrt(historicalData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalData.length);
        if (stdDev === 0)
            return 0;
        const zScore = Math.abs(predictedValue - mean) / stdDev;
        return Math.min(1, zScore / 3); // Normalize to 0-1 range
    }
    async createBottleneckPrediction(resourceType, prediction, threshold) {
        const severity = this.calculateBottleneckSeverity(prediction.predictedValue, threshold);
        const impact = this.assessBottleneckImpact(resourceType, severity);
        const mitigation = this.generateMitigationStrategies(resourceType, severity);
        const bottleneck = {
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
    calculateBottleneckSeverity(predictedValue, threshold) {
        const ratio = predictedValue / threshold;
        if (ratio >= 1.5)
            return BottleneckSeverity.CRITICAL;
        if (ratio >= 1.2)
            return BottleneckSeverity.HIGH;
        if (ratio >= 1.1)
            return BottleneckSeverity.MEDIUM;
        return BottleneckSeverity.LOW;
    }
    assessBottleneckImpact(resourceType, severity) {
        const baseImpact = {
            affectedServices: this.getAffectedServices(resourceType),
            performanceDegradation: this.getPerformanceDegradation(severity),
            userImpact: this.getUserImpact(severity),
            businessImpact: this.getBusinessImpact(severity),
            estimatedCost: this.getEstimatedCost(resourceType, severity)
        };
        return baseImpact;
    }
    getAffectedServices(resourceType) {
        const serviceMap = {
            [ResourceType.CPU]: ['search', 'ai-routing', 'code-intelligence'],
            [ResourceType.MEMORY]: ['embedding-manager', 'vector-storage', 'caching'],
            [ResourceType.REDIS_MEMORY]: ['all-services'],
            [ResourceType.NETWORK_BANDWIDTH]: ['api-gateway', 'websocket-gateway'],
            [ResourceType.CONNECTION_POOL]: ['database-operations', 'caching-layer']
        };
        return serviceMap[resourceType] || ['unknown'];
    }
    getPerformanceDegradation(severity) {
        const degradationMap = {
            [BottleneckSeverity.CRITICAL]: 0.8,
            [BottleneckSeverity.HIGH]: 0.5,
            [BottleneckSeverity.MEDIUM]: 0.3,
            [BottleneckSeverity.LOW]: 0.1
        };
        return degradationMap[severity];
    }
    getUserImpact(severity) {
        const impactMap = {
            [BottleneckSeverity.CRITICAL]: UserImpactLevel.CRITICAL,
            [BottleneckSeverity.HIGH]: UserImpactLevel.HIGH,
            [BottleneckSeverity.MEDIUM]: UserImpactLevel.MEDIUM,
            [BottleneckSeverity.LOW]: UserImpactLevel.LOW
        };
        return impactMap[severity];
    }
    getBusinessImpact(severity) {
        const impactMap = {
            [BottleneckSeverity.CRITICAL]: BusinessImpactLevel.CRITICAL,
            [BottleneckSeverity.HIGH]: BusinessImpactLevel.HIGH,
            [BottleneckSeverity.MEDIUM]: BusinessImpactLevel.MEDIUM,
            [BottleneckSeverity.LOW]: BusinessImpactLevel.LOW
        };
        return impactMap[severity];
    }
    getEstimatedCost(resourceType, severity) {
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
    generateMitigationStrategies(resourceType, severity) {
        const strategies = [];
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
    estimateBottleneckDuration(resourceType, severity) {
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
    calculateModelParameters(data) {
        // Simple exponential smoothing parameters
        return {
            alpha: 0.3, // Smoothing parameter
            beta: 0.1, // Trend parameter
            gamma: 0.1 // Seasonal parameter
        };
    }
    initializeAccuracy() {
        return {
            mape: 0.15, // 15% initial error estimate
            rmse: 0,
            mae: 0,
            r2: 0,
            lastValidation: Date.now(),
            validationSamples: 0
        };
    }
    assessDataQuality(data) {
        if (data.length === 0)
            return 0;
        // Simple data quality assessment
        const hasNaN = data.some(val => isNaN(val));
        const hasInfinite = data.some(val => !isFinite(val));
        const hasNegative = data.some(val => val < 0);
        let quality = 1.0;
        if (hasNaN)
            quality -= 0.3;
        if (hasInfinite)
            quality -= 0.3;
        if (hasNegative)
            quality -= 0.1;
        return Math.max(0, quality);
    }
    countOutliers(data) {
        if (data.length < 3)
            return 0;
        const mean = data.reduce((a, b) => a + b, 0) / data.length;
        const stdDev = Math.sqrt(data.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / data.length);
        const threshold = 2 * stdDev;
        return data.filter(val => Math.abs(val - mean) > threshold).length;
    }
    async getRecentPredictions(metricName, since) {
        const predictionKeys = await this.redis.keys(`${this.PREDICTION_PREFIX}:*`);
        const predictions = [];
        for (const key of predictionKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const prediction = JSON.parse(data);
                if (prediction.metricName === metricName && prediction.generatedAt >= since) {
                    predictions.push(prediction);
                }
            }
        }
        return predictions;
    }
    calculateModelAccuracy(predictions, actualValue) {
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
    async retrainModel(model) {
        logger_1.logger.info(`Retraining model for ${model.metricName}`);
        // Get fresh training data
        const timeRange = {
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
        logger_1.logger.info(`Model retrained for ${model.metricName}, version ${model.version}`);
    }
    async storePrediction(prediction) {
        await this.redis.hset(`${this.PREDICTION_PREFIX}:${prediction.id}`, 'data', JSON.stringify(prediction));
        // Set expiration
        await this.redis.expire(`${this.PREDICTION_PREFIX}:${prediction.id}`, Math.ceil(prediction.timeHorizon * 2) // Keep for twice the prediction horizon
        );
    }
    async storeBottleneckPrediction(bottleneck) {
        await this.redis.hset(`${this.BOTTLENECK_PREFIX}:${bottleneck.id}`, 'data', JSON.stringify(bottleneck));
        // Set expiration for 24 hours
        await this.redis.expire(`${this.BOTTLENECK_PREFIX}:${bottleneck.id}`, 86400);
    }
    generateModelId() {
        return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generatePredictionId() {
        return `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateBottleneckId() {
        return `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.PerformancePredictor = PerformancePredictor;
//# sourceMappingURL=performance-predictor.js.map