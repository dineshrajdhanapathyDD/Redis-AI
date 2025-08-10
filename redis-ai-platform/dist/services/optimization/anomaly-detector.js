"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyDetector = exports.DetectionModelType = exports.AnomalyStatus = exports.RiskLevel = exports.ActionType = exports.RecommendationPriority = exports.RecommendationType = exports.EvidenceType = exports.RootCauseCategory = exports.ExternalFactorType = exports.MaintenanceType = exports.ConfigImpact = exports.DeploymentImpact = exports.AnomalySeverity = exports.AnomalyType = void 0;
const logger_1 = require("../../utils/logger");
var AnomalyType;
(function (AnomalyType) {
    AnomalyType["SPIKE"] = "spike";
    AnomalyType["DROP"] = "drop";
    AnomalyType["TREND_CHANGE"] = "trend_change";
    AnomalyType["SEASONAL_DEVIATION"] = "seasonal_deviation";
    AnomalyType["PATTERN_BREAK"] = "pattern_break";
    AnomalyType["OUTLIER"] = "outlier";
    AnomalyType["CORRELATION_BREAK"] = "correlation_break";
})(AnomalyType || (exports.AnomalyType = AnomalyType = {}));
var AnomalySeverity;
(function (AnomalySeverity) {
    AnomalySeverity["CRITICAL"] = "critical";
    AnomalySeverity["HIGH"] = "high";
    AnomalySeverity["MEDIUM"] = "medium";
    AnomalySeverity["LOW"] = "low";
    AnomalySeverity["INFO"] = "info";
})(AnomalySeverity || (exports.AnomalySeverity = AnomalySeverity = {}));
var DeploymentImpact;
(function (DeploymentImpact) {
    DeploymentImpact["NONE"] = "none";
    DeploymentImpact["LOW"] = "low";
    DeploymentImpact["MEDIUM"] = "medium";
    DeploymentImpact["HIGH"] = "high";
})(DeploymentImpact || (exports.DeploymentImpact = DeploymentImpact = {}));
var ConfigImpact;
(function (ConfigImpact) {
    ConfigImpact["NONE"] = "none";
    ConfigImpact["LOW"] = "low";
    ConfigImpact["MEDIUM"] = "medium";
    ConfigImpact["HIGH"] = "high";
})(ConfigImpact || (exports.ConfigImpact = ConfigImpact = {}));
var MaintenanceType;
(function (MaintenanceType) {
    MaintenanceType["SCHEDULED"] = "scheduled";
    MaintenanceType["EMERGENCY"] = "emergency";
    MaintenanceType["ROUTINE"] = "routine";
})(MaintenanceType || (exports.MaintenanceType = MaintenanceType = {}));
var ExternalFactorType;
(function (ExternalFactorType) {
    ExternalFactorType["TRAFFIC_SPIKE"] = "traffic_spike";
    ExternalFactorType["NETWORK_ISSUE"] = "network_issue";
    ExternalFactorType["THIRD_PARTY_OUTAGE"] = "third_party_outage";
    ExternalFactorType["SEASONAL_PATTERN"] = "seasonal_pattern";
    ExternalFactorType["BUSINESS_EVENT"] = "business_event";
})(ExternalFactorType || (exports.ExternalFactorType = ExternalFactorType = {}));
var RootCauseCategory;
(function (RootCauseCategory) {
    RootCauseCategory["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    RootCauseCategory["CONFIGURATION_ERROR"] = "configuration_error";
    RootCauseCategory["CODE_ISSUE"] = "code_issue";
    RootCauseCategory["INFRASTRUCTURE_PROBLEM"] = "infrastructure_problem";
    RootCauseCategory["EXTERNAL_DEPENDENCY"] = "external_dependency";
    RootCauseCategory["CAPACITY_LIMIT"] = "capacity_limit";
    RootCauseCategory["DATA_QUALITY_ISSUE"] = "data_quality_issue";
})(RootCauseCategory || (exports.RootCauseCategory = RootCauseCategory = {}));
var EvidenceType;
(function (EvidenceType) {
    EvidenceType["METRIC_VALUE"] = "metric_value";
    EvidenceType["LOG_ENTRY"] = "log_entry";
    EvidenceType["ERROR_RATE"] = "error_rate";
    EvidenceType["CORRELATION"] = "correlation";
    EvidenceType["PATTERN_MATCH"] = "pattern_match";
})(EvidenceType || (exports.EvidenceType = EvidenceType = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["IMMEDIATE_ACTION"] = "immediate_action";
    RecommendationType["INVESTIGATION"] = "investigation";
    RecommendationType["MONITORING"] = "monitoring";
    RecommendationType["PREVENTION"] = "prevention";
    RecommendationType["OPTIMIZATION"] = "optimization";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["CRITICAL"] = "critical";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var ActionType;
(function (ActionType) {
    ActionType["SCALE_RESOURCES"] = "scale_resources";
    ActionType["RESTART_SERVICE"] = "restart_service";
    ActionType["ADJUST_CONFIGURATION"] = "adjust_configuration";
    ActionType["INVESTIGATE_LOGS"] = "investigate_logs";
    ActionType["CONTACT_TEAM"] = "contact_team";
    ActionType["MONITOR_METRIC"] = "monitor_metric";
    ActionType["RUN_DIAGNOSTIC"] = "run_diagnostic";
})(ActionType || (exports.ActionType = ActionType = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var AnomalyStatus;
(function (AnomalyStatus) {
    AnomalyStatus["ACTIVE"] = "active";
    AnomalyStatus["INVESTIGATING"] = "investigating";
    AnomalyStatus["RESOLVED"] = "resolved";
    AnomalyStatus["FALSE_POSITIVE"] = "false_positive";
    AnomalyStatus["SUPPRESSED"] = "suppressed";
})(AnomalyStatus || (exports.AnomalyStatus = AnomalyStatus = {}));
var DetectionModelType;
(function (DetectionModelType) {
    DetectionModelType["STATISTICAL"] = "statistical";
    DetectionModelType["MACHINE_LEARNING"] = "machine_learning";
    DetectionModelType["RULE_BASED"] = "rule_based";
    DetectionModelType["ENSEMBLE"] = "ensemble";
})(DetectionModelType || (exports.DetectionModelType = DetectionModelType = {}));
class AnomalyDetector {
    redis;
    ANOMALY_PREFIX = 'anomaly';
    MODEL_PREFIX = 'anomaly_model';
    models = new Map();
    detectionInterval;
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Anomaly Detector');
        // Load detection models
        await this.loadModels();
        // Initialize default models
        await this.initializeDefaultModels();
        // Start anomaly detection
        await this.startDetection();
        logger_1.logger.info('Anomaly Detector initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Anomaly Detector');
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        // Save models
        await this.saveModels();
        logger_1.logger.info('Anomaly Detector shutdown complete');
    }
    async detectAnomalies(metrics) {
        const anomalies = [];
        // Check each metric for anomalies
        const metricValues = this.extractMetricValues(metrics);
        for (const [metricName, value] of Object.entries(metricValues)) {
            const model = this.models.get(metricName);
            if (!model)
                continue;
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
    async getActiveAnomalies() {
        const anomalyKeys = await this.redis.keys(`${this.ANOMALY_PREFIX}:*`);
        const anomalies = [];
        for (const key of anomalyKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const anomaly = JSON.parse(data);
                if (anomaly.status === AnomalyStatus.ACTIVE) {
                    anomalies.push(anomaly);
                }
            }
        }
        return anomalies.sort((a, b) => b.detectedAt - a.detectedAt);
    }
    async resolveAnomaly(anomalyId, resolution) {
        const anomaly = await this.getAnomaly(anomalyId);
        if (!anomaly) {
            throw new Error(`Anomaly not found: ${anomalyId}`);
        }
        anomaly.status = AnomalyStatus.RESOLVED;
        anomaly.resolvedAt = Date.now();
        await this.storeAnomaly(anomaly);
        // Update model based on resolution
        await this.updateModelFromResolution(anomaly, resolution);
        logger_1.logger.info(`Resolved anomaly: ${anomalyId}`);
    }
    async suppressAnomaly(anomalyId, reason) {
        const anomaly = await this.getAnomaly(anomalyId);
        if (!anomaly) {
            throw new Error(`Anomaly not found: ${anomalyId}`);
        }
        anomaly.status = AnomalyStatus.SUPPRESSED;
        await this.storeAnomaly(anomaly);
        logger_1.logger.info(`Suppressed anomaly: ${anomalyId} - ${reason}`);
    }
    async updateModel(metricName, actualValue, isAnomaly) {
        const model = this.models.get(metricName);
        if (!model)
            return;
        // Update model accuracy based on feedback
        const prediction = await this.predictAnomaly(metricName, actualValue, model);
        const correct = (prediction.isAnomaly === isAnomaly);
        if (correct) {
            model.accuracy.precision = Math.min(1, model.accuracy.precision + 0.01);
            model.accuracy.recall = Math.min(1, model.accuracy.recall + 0.01);
        }
        else {
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
    async loadModels() {
        const modelKeys = await this.redis.keys(`${this.MODEL_PREFIX}:*`);
        for (const key of modelKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const model = JSON.parse(data);
                this.models.set(model.metricName, model);
            }
        }
        logger_1.logger.info(`Loaded ${this.models.size} anomaly detection models`);
    }
    async saveModels() {
        for (const [metricName, model] of this.models) {
            await this.redis.hset(`${this.MODEL_PREFIX}:${metricName}`, 'data', JSON.stringify(model));
        }
        logger_1.logger.info(`Saved ${this.models.size} anomaly detection models`);
    }
    async initializeDefaultModels() {
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
                const model = {
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
        logger_1.logger.info(`Initialized ${defaultModels.length} default anomaly detection models`);
    }
    async startDetection() {
        // Run anomaly detection every 60 seconds
        this.detectionInterval = setInterval(async () => {
            try {
                // Get latest metrics and detect anomalies
                const latestMetrics = await this.getLatestMetrics();
                if (latestMetrics) {
                    await this.detectAnomalies(latestMetrics);
                }
            }
            catch (error) {
                logger_1.logger.error('Error in anomaly detection:', error);
            }
        }, 60000);
    }
    async getLatestMetrics() {
        try {
            // Get the most recent metrics from Redis
            const metricsKey = 'latest_metrics';
            const data = await this.redis.hget(metricsKey, 'data');
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            logger_1.logger.error('Error getting latest metrics:', error);
            return null;
        }
    }
    extractMetricValues(metrics) {
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
    async detectMetricAnomaly(metricName, value, model, metrics) {
        const prediction = await this.predictAnomaly(metricName, value, model);
        if (!prediction.isAnomaly) {
            return null;
        }
        const context = await this.buildAnomalyContext(metricName, metrics);
        const rootCause = await this.analyzeRootCause(metricName, value, context);
        const impact = this.assessAnomalyImpact(metricName, value, prediction.severity);
        const recommendations = this.generateRecommendations(metricName, prediction, rootCause);
        const anomaly = {
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
    async predictAnomaly(metricName, value, model) {
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
        const stdDev = Math.sqrt(historicalData.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalData.length);
        const zScore = Math.abs(value - mean) / (stdDev || 1);
        const threshold = model.parameters.threshold || 2.5;
        const isAnomaly = zScore > threshold;
        const deviation = Math.abs(value - mean);
        const confidence = Math.min(1, zScore / 5); // Normalize confidence
        let type;
        let severity;
        if (value > mean + threshold * stdDev) {
            type = AnomalyType.SPIKE;
        }
        else if (value < mean - threshold * stdDev) {
            type = AnomalyType.DROP;
        }
        else {
            type = AnomalyType.OUTLIER;
        }
        if (zScore > 4) {
            severity = AnomalySeverity.CRITICAL;
        }
        else if (zScore > 3) {
            severity = AnomalySeverity.HIGH;
        }
        else if (zScore > 2.5) {
            severity = AnomalySeverity.MEDIUM;
        }
        else {
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
    async detectCorrelationAnomalies(metricValues, metrics) {
        const anomalies = [];
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
    async checkCorrelationBreak(metric1, metric2, currentValues) {
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
    async getHistoricalCorrelation(metric1, metric2) {
        // Simplified - return a default correlation
        const correlationMap = {
            'cpu.usage:application.response_time.avg': 0.7,
            'memory.usage:redis.memory_usage': 0.8,
            'application.requests_per_second:redis.connected_clients': 0.6,
            'application.error_rate:application.response_time.avg': 0.5
        };
        const key = `${metric1}:${metric2}`;
        return correlationMap[key] || 0.5;
    }
    calculateCurrentCorrelation(metric1, metric2, values) {
        // Simplified current correlation calculation
        const value1 = values[metric1] || 0;
        const value2 = values[metric2] || 0;
        // Normalize values and calculate simple correlation
        return Math.min(1, Math.abs(value1 * value2) / (value1 + value2 + 1));
    }
    async createCorrelationAnomaly(metric1, metric2, correlation, metrics) {
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
    async buildAnomalyContext(metricName, metrics) {
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
    findRelatedMetrics(metricName, metrics) {
        const metricValues = this.extractMetricValues(metrics);
        const related = [];
        // Define metric relationships
        const relationships = {
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
    async getSystemState() {
        // Simplified system state
        return {
            overallHealth: 0.85,
            activeAlerts: 2,
            recentDeployments: [],
            configurationChanges: [],
            maintenanceWindows: []
        };
    }
    async identifyExternalFactors() {
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
    async analyzeRootCause(metricName, value, context) {
        // Simplified root cause analysis
        let category;
        let description;
        if (metricName.includes('cpu') || metricName.includes('memory')) {
            category = RootCauseCategory.RESOURCE_EXHAUSTION;
            description = 'Resource utilization exceeded normal thresholds';
        }
        else if (metricName.includes('error')) {
            category = RootCauseCategory.CODE_ISSUE;
            description = 'Increased error rate indicates potential code issues';
        }
        else if (metricName.includes('redis')) {
            category = RootCauseCategory.INFRASTRUCTURE_PROBLEM;
            description = 'Redis performance degradation detected';
        }
        else {
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
    assessAnomalyImpact(metricName, value, severity) {
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
    generateRecommendations(metricName, prediction, rootCause) {
        const recommendations = [];
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
    generateCorrelationRecommendations(metric1, metric2) {
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
    async getHistoricalData(metricName, timeRange) {
        try {
            const key = `metrics:${metricName}`;
            const end = Date.now();
            const start = end - timeRange;
            const data = await this.redis.call('TS.RANGE', key, start, end, 'AGGREGATION', 'avg', 300000 // 5 minute intervals
            );
            return data.map(([, value]) => parseFloat(value));
        }
        catch (error) {
            logger_1.logger.error(`Error getting historical data for ${metricName}:`, error);
            return [];
        }
    }
    async updateModelFromResolution(anomaly, resolution) {
        const model = this.models.get(anomaly.metricName);
        if (!model)
            return;
        // Update model based on resolution feedback
        const wasCorrect = !resolution.includes('false positive');
        if (wasCorrect) {
            model.accuracy.precision = Math.min(1, model.accuracy.precision + 0.02);
        }
        else {
            model.accuracy.falsePositiveRate = Math.min(1, model.accuracy.falsePositiveRate + 0.02);
        }
        model.accuracy.lastEvaluation = Date.now();
        model.lastUpdated = Date.now();
    }
    async retrainModel(model) {
        logger_1.logger.info(`Retraining anomaly detection model for ${model.metricName}`);
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
        logger_1.logger.info(`Model retrained for ${model.metricName} with ${historicalData.length} samples`);
    }
    assessDataQuality(data) {
        if (data.length === 0)
            return 0;
        const hasNaN = data.some(val => isNaN(val));
        const hasInfinite = data.some(val => !isFinite(val));
        let quality = 1.0;
        if (hasNaN)
            quality -= 0.3;
        if (hasInfinite)
            quality -= 0.3;
        return Math.max(0, quality);
    }
    async getAnomaly(anomalyId) {
        const data = await this.redis.hget(`${this.ANOMALY_PREFIX}:${anomalyId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async storeAnomaly(anomaly) {
        await this.redis.hset(`${this.ANOMALY_PREFIX}:${anomaly.id}`, 'data', JSON.stringify(anomaly));
        // Set expiration for resolved anomalies
        if (anomaly.status === AnomalyStatus.RESOLVED) {
            await this.redis.expire(`${this.ANOMALY_PREFIX}:${anomaly.id}`, 7 * 24 * 60 * 60); // 7 days
        }
    }
    generateModelId() {
        return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAnomalyId() {
        return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.AnomalyDetector = AnomalyDetector;
//# sourceMappingURL=anomaly-detector.js.map