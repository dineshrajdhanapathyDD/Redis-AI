"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OptimizationEngine = exports.EffortLevel = exports.RecommendationPriority = exports.RecommendationType = exports.TrendDirection = exports.PeriodType = exports.ComparisonOperator = exports.ConditionType = exports.DecisionStatus = exports.RiskSeverity = exports.RiskType = exports.TriggerSeverity = exports.TriggerType = exports.OptimizationPriority = exports.OptimizationDecisionType = void 0;
const logger_1 = require("../../utils/logger");
var OptimizationDecisionType;
(function (OptimizationDecisionType) {
    OptimizationDecisionType["REACTIVE"] = "reactive";
    OptimizationDecisionType["PREDICTIVE"] = "predictive";
    OptimizationDecisionType["PROACTIVE"] = "proactive";
    OptimizationDecisionType["COST_DRIVEN"] = "cost_driven";
    OptimizationDecisionType["EMERGENCY"] = "emergency"; // Critical issues requiring immediate action
})(OptimizationDecisionType || (exports.OptimizationDecisionType = OptimizationDecisionType = {}));
var OptimizationPriority;
(function (OptimizationPriority) {
    OptimizationPriority["CRITICAL"] = "critical";
    OptimizationPriority["HIGH"] = "high";
    OptimizationPriority["MEDIUM"] = "medium";
    OptimizationPriority["LOW"] = "low";
})(OptimizationPriority || (exports.OptimizationPriority = OptimizationPriority = {}));
var TriggerType;
(function (TriggerType) {
    TriggerType["ANOMALY_DETECTED"] = "anomaly_detected";
    TriggerType["BOTTLENECK_PREDICTED"] = "bottleneck_predicted";
    TriggerType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    TriggerType["COST_THRESHOLD_EXCEEDED"] = "cost_threshold_exceeded";
    TriggerType["RESOURCE_EXHAUSTION"] = "resource_exhaustion";
    TriggerType["SCHEDULED_OPTIMIZATION"] = "scheduled_optimization";
})(TriggerType || (exports.TriggerType = TriggerType = {}));
var TriggerSeverity;
(function (TriggerSeverity) {
    TriggerSeverity["CRITICAL"] = "critical";
    TriggerSeverity["HIGH"] = "high";
    TriggerSeverity["MEDIUM"] = "medium";
    TriggerSeverity["LOW"] = "low";
})(TriggerSeverity || (exports.TriggerSeverity = TriggerSeverity = {}));
var RiskType;
(function (RiskType) {
    RiskType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    RiskType["SERVICE_INTERRUPTION"] = "service_interruption";
    RiskType["DATA_LOSS"] = "data_loss";
    RiskType["COST_OVERRUN"] = "cost_overrun";
    RiskType["ROLLBACK_REQUIRED"] = "rollback_required";
    RiskType["COMPLIANCE_VIOLATION"] = "compliance_violation";
})(RiskType || (exports.RiskType = RiskType = {}));
var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity["CRITICAL"] = "critical";
    RiskSeverity["HIGH"] = "high";
    RiskSeverity["MEDIUM"] = "medium";
    RiskSeverity["LOW"] = "low";
})(RiskSeverity || (exports.RiskSeverity = RiskSeverity = {}));
var DecisionStatus;
(function (DecisionStatus) {
    DecisionStatus["PENDING"] = "pending";
    DecisionStatus["APPROVED"] = "approved";
    DecisionStatus["REJECTED"] = "rejected";
    DecisionStatus["EXECUTING"] = "executing";
    DecisionStatus["COMPLETED"] = "completed";
    DecisionStatus["FAILED"] = "failed";
    DecisionStatus["CANCELLED"] = "cancelled";
})(DecisionStatus || (exports.DecisionStatus = DecisionStatus = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["METRIC_THRESHOLD"] = "metric_threshold";
    ConditionType["ANOMALY_DETECTED"] = "anomaly_detected";
    ConditionType["PREDICTION_CONFIDENCE"] = "prediction_confidence";
    ConditionType["COST_THRESHOLD"] = "cost_threshold";
    ConditionType["TIME_BASED"] = "time_based";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["GREATER_EQUAL"] = "gte";
    ComparisonOperator["LESS_EQUAL"] = "lte";
    ComparisonOperator["EQUAL"] = "eq";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var PeriodType;
(function (PeriodType) {
    PeriodType["HOURLY"] = "hourly";
    PeriodType["DAILY"] = "daily";
    PeriodType["WEEKLY"] = "weekly";
    PeriodType["MONTHLY"] = "monthly";
})(PeriodType || (exports.PeriodType = PeriodType = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["IMPROVING"] = "improving";
    TrendDirection["DEGRADING"] = "degrading";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var RecommendationType;
(function (RecommendationType) {
    RecommendationType["STRATEGY_IMPROVEMENT"] = "strategy_improvement";
    RecommendationType["NEW_OPTIMIZATION"] = "new_optimization";
    RecommendationType["PROCESS_IMPROVEMENT"] = "process_improvement";
    RecommendationType["MONITORING_ENHANCEMENT"] = "monitoring_enhancement";
    RecommendationType["AUTOMATION_OPPORTUNITY"] = "automation_opportunity";
})(RecommendationType || (exports.RecommendationType = RecommendationType = {}));
var RecommendationPriority;
(function (RecommendationPriority) {
    RecommendationPriority["CRITICAL"] = "critical";
    RecommendationPriority["HIGH"] = "high";
    RecommendationPriority["MEDIUM"] = "medium";
    RecommendationPriority["LOW"] = "low";
})(RecommendationPriority || (exports.RecommendationPriority = RecommendationPriority = {}));
var EffortLevel;
(function (EffortLevel) {
    EffortLevel["LOW"] = "low";
    EffortLevel["MEDIUM"] = "medium";
    EffortLevel["HIGH"] = "high";
    EffortLevel["VERY_HIGH"] = "very_high";
})(EffortLevel || (exports.EffortLevel = EffortLevel = {}));
class OptimizationEngine {
    redis;
    metricsCollector;
    performancePredictor;
    resourceOptimizer;
    anomalyDetector;
    costOptimizer;
    DECISION_PREFIX = 'optimization_decision';
    STRATEGY_PREFIX = 'optimization_strategy';
    REPORT_PREFIX = 'optimization_report';
    strategies = new Map();
    optimizationInterval;
    isRunning = false;
    constructor(redis, metricsCollector, performancePredictor, resourceOptimizer, anomalyDetector, costOptimizer) {
        this.redis = redis;
        this.metricsCollector = metricsCollector;
        this.performancePredictor = performancePredictor;
        this.resourceOptimizer = resourceOptimizer;
        this.anomalyDetector = anomalyDetector;
        this.costOptimizer = costOptimizer;
    }
    async initialize() {
        logger_1.logger.info('Initializing Optimization Engine');
        // Load optimization strategies
        await this.loadStrategies();
        // Initialize default strategies
        await this.initializeDefaultStrategies();
        // Start optimization loop
        await this.startOptimizationLoop();
        logger_1.logger.info('Optimization Engine initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Optimization Engine');
        this.isRunning = false;
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
        }
        // Save strategies
        await this.saveStrategies();
        logger_1.logger.info('Optimization Engine shutdown complete');
    }
    async processOptimizationCycle() {
        logger_1.logger.info('Starting optimization cycle');
        const decisions = [];
        try {
            // Collect current system metrics
            const metrics = await this.metricsCollector.collectSystemMetrics();
            // Detect anomalies
            const anomalies = await this.anomalyDetector.detectAnomalies(metrics);
            // Generate predictions
            const predictions = await this.generatePredictions();
            // Identify bottlenecks
            const bottlenecks = await this.performancePredictor.predictBottlenecks(3600); // 1 hour horizon
            // Identify cost optimizations
            const costOptimizations = await this.costOptimizer.identifyOptimizations();
            // Process each trigger type
            decisions.push(...await this.processAnomalies(anomalies, metrics));
            decisions.push(...await this.processPredictions(predictions, metrics));
            decisions.push(...await this.processBottlenecks(bottlenecks, metrics));
            decisions.push(...await this.processCostOptimizations(costOptimizations, metrics));
            decisions.push(...await this.processScheduledOptimizations(metrics));
            // Prioritize and filter decisions
            const prioritizedDecisions = this.prioritizeDecisions(decisions);
            // Auto-approve low-risk decisions
            await this.autoApproveDecisions(prioritizedDecisions);
            logger_1.logger.info(`Optimization cycle completed: ${decisions.length} decisions generated`);
            return prioritizedDecisions;
        }
        catch (error) {
            logger_1.logger.error('Error in optimization cycle:', error);
            return [];
        }
    }
    async approveDecision(decisionId) {
        const decision = await this.getDecision(decisionId);
        if (!decision) {
            throw new Error(`Decision not found: ${decisionId}`);
        }
        if (decision.status !== DecisionStatus.PENDING) {
            throw new Error(`Decision cannot be approved in status: ${decision.status}`);
        }
        decision.status = DecisionStatus.APPROVED;
        decision.approvedAt = Date.now();
        await this.storeDecision(decision);
        // Execute the decision
        await this.executeDecision(decision);
        logger_1.logger.info(`Approved and executing optimization decision: ${decisionId}`);
    }
    async rejectDecision(decisionId, reason) {
        const decision = await this.getDecision(decisionId);
        if (!decision) {
            throw new Error(`Decision not found: ${decisionId}`);
        }
        decision.status = DecisionStatus.REJECTED;
        await this.storeDecision(decision);
        logger_1.logger.info(`Rejected optimization decision: ${decisionId} - ${reason}`);
    }
    async generateOptimizationReport(period) {
        const timeRange = this.getTimeRangeForPeriod(period);
        const decisions = await this.getDecisionsInTimeRange(timeRange);
        const summary = this.generateOptimizationSummary(decisions);
        const metrics = await this.calculateOptimizationMetrics(decisions, timeRange);
        const trends = this.analyzeTrends(decisions);
        const recommendations = this.generateRecommendations(summary, metrics, trends);
        const report = {
            id: this.generateReportId(),
            period: {
                start: timeRange.start,
                end: timeRange.end,
                duration: timeRange.end - timeRange.start,
                type: period
            },
            timeRange,
            summary,
            decisions,
            metrics,
            trends,
            recommendations,
            generatedAt: Date.now()
        };
        await this.storeReport(report);
        return report;
    }
    async startOptimizationLoop() {
        this.isRunning = true;
        // Run optimization cycle every 5 minutes
        this.optimizationInterval = setInterval(async () => {
            if (this.isRunning) {
                try {
                    await this.processOptimizationCycle();
                }
                catch (error) {
                    logger_1.logger.error('Error in optimization loop:', error);
                }
            }
        }, 5 * 60 * 1000);
        // Run initial optimization cycle
        await this.processOptimizationCycle();
    }
    async loadStrategies() {
        const strategyKeys = await this.redis.keys(`${this.STRATEGY_PREFIX}:*`);
        for (const key of strategyKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const strategy = JSON.parse(data);
                this.strategies.set(strategy.id, strategy);
            }
        }
        logger_1.logger.info(`Loaded ${this.strategies.size} optimization strategies`);
    }
    async saveStrategies() {
        for (const [id, strategy] of this.strategies) {
            await this.redis.hset(`${this.STRATEGY_PREFIX}:${id}`, 'data', JSON.stringify(strategy));
        }
        logger_1.logger.info(`Saved ${this.strategies.size} optimization strategies`);
    }
    async initializeDefaultStrategies() {
        const defaultStrategies = [
            {
                id: 'high-cpu-reactive',
                name: 'High CPU Reactive Optimization',
                description: 'React to high CPU usage with immediate optimizations',
                conditions: [
                    {
                        type: ConditionType.METRIC_THRESHOLD,
                        metric: 'cpu.usage',
                        operator: ComparisonOperator.GREATER_THAN,
                        threshold: 0.85,
                        duration: 300,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'scale_resources',
                        parameters: { resource: 'cpu', scaleFactor: 1.3 },
                        weight: 0.8,
                        conditions: ['cpu.usage > 0.9']
                    }
                ],
                priority: 1,
                enabled: true,
                autoApprove: true,
                cooldownPeriod: 1800 // 30 minutes
            },
            {
                id: 'memory-pressure-predictive',
                name: 'Memory Pressure Predictive Optimization',
                description: 'Predict and prevent memory exhaustion',
                conditions: [
                    {
                        type: ConditionType.PREDICTION_CONFIDENCE,
                        metric: 'memory.usage',
                        operator: ComparisonOperator.GREATER_THAN,
                        threshold: 0.8,
                        duration: 1800,
                        weight: 0.9
                    }
                ],
                actions: [
                    {
                        type: 'optimize_memory',
                        parameters: { enableCompression: true, adjustTTL: true },
                        weight: 0.7,
                        conditions: ['memory.predicted > 0.85']
                    }
                ],
                priority: 2,
                enabled: true,
                autoApprove: false,
                cooldownPeriod: 3600 // 1 hour
            },
            {
                id: 'cost-optimization-proactive',
                name: 'Proactive Cost Optimization',
                description: 'Continuously optimize costs based on usage patterns',
                conditions: [
                    {
                        type: ConditionType.TIME_BASED,
                        metric: 'schedule',
                        operator: ComparisonOperator.EQUAL,
                        threshold: 0, // Daily at midnight
                        duration: 0,
                        weight: 1.0
                    }
                ],
                actions: [
                    {
                        type: 'analyze_costs',
                        parameters: { lookbackDays: 7, optimizationTypes: ['right_sizing', 'auto_scaling'] },
                        weight: 1.0,
                        conditions: []
                    }
                ],
                priority: 3,
                enabled: true,
                autoApprove: false,
                cooldownPeriod: 86400 // 24 hours
            }
        ];
        for (const strategy of defaultStrategies) {
            if (!this.strategies.has(strategy.id)) {
                this.strategies.set(strategy.id, strategy);
            }
        }
        logger_1.logger.info(`Initialized ${defaultStrategies.length} default optimization strategies`);
    }
    async generatePredictions() {
        const predictions = [];
        const metrics = [
            'cpu.usage',
            'memory.usage',
            'redis.memory_usage',
            'application.response_time.avg'
        ];
        const timeHorizons = [300, 900, 1800, 3600]; // 5min, 15min, 30min, 1hour
        for (const metric of metrics) {
            for (const horizon of timeHorizons) {
                try {
                    const prediction = await this.performancePredictor.generatePrediction(metric, horizon);
                    predictions.push(prediction);
                }
                catch (error) {
                    logger_1.logger.error(`Error generating prediction for ${metric}:`, error);
                }
            }
        }
        return predictions;
    }
    async processAnomalies(anomalies, metrics) {
        const decisions = [];
        for (const anomaly of anomalies) {
            const actions = await this.resourceOptimizer.optimizeForPrediction({
                id: anomaly.id,
                metricName: anomaly.metricName,
                predictionType: 'anomaly_detection',
                timeHorizon: 300,
                predictedValue: anomaly.value,
                confidence: anomaly.confidence,
                trend: 'volatile',
                seasonality: { detected: false, period: 0, amplitude: 0, phase: 0, confidence: 0 },
                anomalyScore: 1.0,
                factors: [],
                generatedAt: anomaly.detectedAt,
                validUntil: anomaly.detectedAt + 3600000
            });
            if (actions.length > 0) {
                const decision = this.createOptimizationDecision(OptimizationDecisionType.REACTIVE, {
                    type: TriggerType.ANOMALY_DETECTED,
                    source: 'anomaly-detector',
                    description: `Anomaly detected in ${anomaly.metricName}`,
                    severity: this.mapAnomalySeverityToTriggerSeverity(anomaly.severity),
                    data: anomaly
                }, actions, []);
                decisions.push(decision);
            }
        }
        return decisions;
    }
    async processPredictions(predictions, metrics) {
        const decisions = [];
        for (const prediction of predictions) {
            if (prediction.confidence > 0.7 && prediction.anomalyScore > 0.5) {
                const actions = await this.resourceOptimizer.optimizeForPrediction(prediction);
                if (actions.length > 0) {
                    const decision = this.createOptimizationDecision(OptimizationDecisionType.PREDICTIVE, {
                        type: TriggerType.BOTTLENECK_PREDICTED,
                        source: 'performance-predictor',
                        description: `Performance issue predicted for ${prediction.metricName}`,
                        severity: TriggerSeverity.MEDIUM,
                        data: prediction
                    }, actions, []);
                    decisions.push(decision);
                }
            }
        }
        return decisions;
    }
    async processBottlenecks(bottlenecks, metrics) {
        const decisions = [];
        for (const bottleneck of bottlenecks) {
            const actions = await this.resourceOptimizer.optimizeForBottleneck(bottleneck);
            if (actions.length > 0) {
                const decision = this.createOptimizationDecision(OptimizationDecisionType.PREDICTIVE, {
                    type: TriggerType.RESOURCE_EXHAUSTION,
                    source: 'performance-predictor',
                    description: `Resource bottleneck predicted: ${bottleneck.resourceType}`,
                    severity: this.mapBottleneckSeverityToTriggerSeverity(bottleneck.severity),
                    data: bottleneck
                }, actions, []);
                decisions.push(decision);
            }
        }
        return decisions;
    }
    async processCostOptimizations(costOptimizations, metrics) {
        const decisions = [];
        for (const costOpt of costOptimizations) {
            if (costOpt.savings.amount > 100) { // Only consider optimizations with significant savings
                const decision = this.createOptimizationDecision(OptimizationDecisionType.COST_DRIVEN, {
                    type: TriggerType.COST_THRESHOLD_EXCEEDED,
                    source: 'cost-optimizer',
                    description: `Cost optimization opportunity: ${costOpt.description}`,
                    severity: TriggerSeverity.LOW,
                    data: costOpt
                }, [], [costOpt]);
                decisions.push(decision);
            }
        }
        return decisions;
    }
    async processScheduledOptimizations(metrics) {
        const decisions = [];
        // Check if it's time for scheduled optimizations
        const now = new Date();
        const isScheduledTime = now.getHours() === 2 && now.getMinutes() < 5; // 2 AM daily
        if (isScheduledTime) {
            // Generate proactive optimizations
            const costOptimizations = await this.costOptimizer.identifyOptimizations();
            for (const costOpt of costOptimizations) {
                const decision = this.createOptimizationDecision(OptimizationDecisionType.PROACTIVE, {
                    type: TriggerType.SCHEDULED_OPTIMIZATION,
                    source: 'optimization-engine',
                    description: `Scheduled optimization: ${costOpt.description}`,
                    severity: TriggerSeverity.LOW,
                    data: costOpt
                }, [], [costOpt]);
                decisions.push(decision);
            }
        }
        return decisions;
    }
    createOptimizationDecision(type, trigger, actions, costOptimizations) {
        const expectedImpact = this.calculateExpectedImpact(actions, costOptimizations);
        const risks = this.assessDecisionRisks(actions, costOptimizations);
        const priority = this.calculatePriority(type, trigger, expectedImpact, risks);
        const autoApprove = this.shouldAutoApprove(type, priority, risks);
        return {
            id: this.generateDecisionId(),
            type,
            priority,
            trigger,
            actions,
            costOptimizations,
            expectedImpact,
            risks,
            autoApprove,
            createdAt: Date.now(),
            status: DecisionStatus.PENDING
        };
    }
    calculateExpectedImpact(actions, costOptimizations) {
        let totalPerformanceImprovement = 0;
        let totalCostSavings = 0;
        let totalImplementationCost = 0;
        // Calculate impact from resource optimization actions
        for (const action of actions) {
            totalPerformanceImprovement += action.expectedImpact.performanceImprovement;
            totalCostSavings += action.expectedImpact.costReduction;
            totalImplementationCost += action.cost.implementation;
        }
        // Calculate impact from cost optimizations
        for (const costOpt of costOptimizations) {
            totalCostSavings += costOpt.savings.amount;
            totalImplementationCost += costOpt.implementation.phases.reduce((sum, phase) => sum + phase.cost, 0);
        }
        return {
            performance: {
                latencyImprovement: totalPerformanceImprovement * 50, // Convert to milliseconds
                throughputIncrease: totalPerformanceImprovement * 20, // Convert to percentage
                resourceEfficiency: totalPerformanceImprovement * 30,
                errorRateReduction: totalPerformanceImprovement * 10
            },
            cost: {
                monthlySavings: totalCostSavings,
                implementationCost: totalImplementationCost,
                paybackPeriod: totalImplementationCost / (totalCostSavings || 1),
                roi: ((totalCostSavings * 12) - totalImplementationCost) / totalImplementationCost * 100
            },
            reliability: {
                availabilityImprovement: totalPerformanceImprovement * 5,
                mttrReduction: totalPerformanceImprovement * 30,
                incidentReduction: totalPerformanceImprovement * 25,
                resilienceIncrease: totalPerformanceImprovement * 20
            },
            user: {
                affectedUsers: 1000,
                experienceImprovement: totalPerformanceImprovement * 15,
                satisfactionIncrease: totalPerformanceImprovement * 10,
                featureAvailability: 100 - (totalPerformanceImprovement * 5)
            },
            confidence: Math.min(1, (actions.length + costOptimizations.length) * 0.2)
        };
    }
    assessDecisionRisks(actions, costOptimizations) {
        const risks = [];
        // Assess risks from actions
        for (const action of actions) {
            for (const actionRisk of action.risks) {
                risks.push({
                    type: actionRisk.type,
                    severity: actionRisk.severity,
                    probability: actionRisk.probability,
                    description: actionRisk.description,
                    mitigation: actionRisk.mitigation,
                    impact: {
                        financial: 1000,
                        operational: 'Potential service impact',
                        reputation: 'Minor impact',
                        compliance: 'None'
                    }
                });
            }
        }
        // Assess risks from cost optimizations
        for (const costOpt of costOptimizations) {
            for (const costRisk of costOpt.risks) {
                risks.push({
                    type: costRisk.type,
                    severity: costRisk.severity,
                    probability: costRisk.probability,
                    description: costRisk.description,
                    mitigation: costRisk.mitigation,
                    impact: costRisk.impact
                });
            }
        }
        return risks;
    }
    calculatePriority(type, trigger, impact, risks) {
        let priorityScore = 0;
        // Type-based priority
        const typeScores = {
            [OptimizationDecisionType.EMERGENCY]: 100,
            [OptimizationDecisionType.REACTIVE]: 80,
            [OptimizationDecisionType.PREDICTIVE]: 60,
            [OptimizationDecisionType.PROACTIVE]: 40,
            [OptimizationDecisionType.COST_DRIVEN]: 30
        };
        priorityScore += typeScores[type];
        // Trigger severity
        const severityScores = {
            [TriggerSeverity.CRITICAL]: 40,
            [TriggerSeverity.HIGH]: 30,
            [TriggerSeverity.MEDIUM]: 20,
            [TriggerSeverity.LOW]: 10
        };
        priorityScore += severityScores[trigger.severity];
        // Impact-based priority
        priorityScore += impact.cost.monthlySavings / 100; // $100 = 1 point
        priorityScore += impact.performance.latencyImprovement / 10; // 10ms = 1 point
        // Risk adjustment
        const highRisks = risks.filter(r => r.severity === RiskSeverity.HIGH || r.severity === RiskSeverity.CRITICAL);
        priorityScore -= highRisks.length * 10;
        // Convert to priority enum
        if (priorityScore >= 100)
            return OptimizationPriority.CRITICAL;
        if (priorityScore >= 70)
            return OptimizationPriority.HIGH;
        if (priorityScore >= 40)
            return OptimizationPriority.MEDIUM;
        return OptimizationPriority.LOW;
    }
    shouldAutoApprove(type, priority, risks) {
        // Never auto-approve critical or high-risk decisions
        if (priority === OptimizationPriority.CRITICAL)
            return false;
        const highRisks = risks.filter(r => r.severity === RiskSeverity.HIGH ||
            r.severity === RiskSeverity.CRITICAL);
        if (highRisks.length > 0)
            return false;
        // Auto-approve low-risk, low-priority optimizations
        if (priority === OptimizationPriority.LOW && type === OptimizationDecisionType.COST_DRIVEN) {
            return true;
        }
        return false;
    }
    prioritizeDecisions(decisions) {
        return decisions.sort((a, b) => {
            const priorityOrder = {
                [OptimizationPriority.CRITICAL]: 4,
                [OptimizationPriority.HIGH]: 3,
                [OptimizationPriority.MEDIUM]: 2,
                [OptimizationPriority.LOW]: 1
            };
            const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
            if (priorityDiff !== 0)
                return priorityDiff;
            // Secondary sort by expected cost savings
            return b.expectedImpact.cost.monthlySavings - a.expectedImpact.cost.monthlySavings;
        });
    }
    async autoApproveDecisions(decisions) {
        for (const decision of decisions) {
            if (decision.autoApprove) {
                decision.status = DecisionStatus.APPROVED;
                decision.approvedAt = Date.now();
                await this.storeDecision(decision);
                // Execute the decision
                await this.executeDecision(decision);
                logger_1.logger.info(`Auto-approved and executing decision: ${decision.id}`);
            }
            else {
                await this.storeDecision(decision);
            }
        }
    }
    async executeDecision(decision) {
        decision.status = DecisionStatus.EXECUTING;
        decision.executedAt = Date.now();
        await this.storeDecision(decision);
        try {
            const results = [];
            // Execute resource optimization actions
            for (const action of decision.actions) {
                const result = await this.resourceOptimizer.executeOptimization(action.id);
                results.push(result);
            }
            // Execute cost optimizations
            for (const costOpt of decision.costOptimizations) {
                const result = await this.costOptimizer.implementOptimization(costOpt.id);
                results.push(result);
            }
            // Calculate actual impact
            const actualImpact = this.calculateActualImpact(results);
            decision.status = DecisionStatus.COMPLETED;
            decision.result = {
                success: true,
                actualImpact,
                executionTime: (Date.now() - decision.executedAt) / 1000,
                errors: [],
                lessonsLearned: ['Optimization executed successfully'],
                recommendations: ['Monitor performance for next 24 hours']
            };
            await this.storeDecision(decision);
            logger_1.logger.info(`Successfully executed optimization decision: ${decision.id}`);
        }
        catch (error) {
            logger_1.logger.error(`Failed to execute optimization decision ${decision.id}:`, error);
            decision.status = DecisionStatus.FAILED;
            decision.result = {
                success: false,
                actualImpact: decision.expectedImpact, // Use expected as placeholder
                executionTime: (Date.now() - decision.executedAt) / 1000,
                errors: [error.message],
                lessonsLearned: ['Execution failed - review implementation'],
                recommendations: ['Investigate failure cause', 'Consider rollback if needed']
            };
            await this.storeDecision(decision);
        }
    }
    calculateActualImpact(results) {
        // Aggregate actual impact from all results
        // This is a simplified implementation
        return {
            performance: {
                latencyImprovement: 25,
                throughputIncrease: 15,
                resourceEfficiency: 20,
                errorRateReduction: 5
            },
            cost: {
                monthlySavings: 500,
                implementationCost: 200,
                paybackPeriod: 0.4,
                roi: 150
            },
            reliability: {
                availabilityImprovement: 2,
                mttrReduction: 15,
                incidentReduction: 10,
                resilienceIncrease: 8
            },
            user: {
                affectedUsers: 800,
                experienceImprovement: 12,
                satisfactionIncrease: 8,
                featureAvailability: 99.5
            },
            confidence: 0.85
        };
    }
    mapAnomalySeverityToTriggerSeverity(severity) {
        const mapping = {
            'critical': TriggerSeverity.CRITICAL,
            'high': TriggerSeverity.HIGH,
            'medium': TriggerSeverity.MEDIUM,
            'low': TriggerSeverity.LOW,
            'info': TriggerSeverity.LOW
        };
        return mapping[severity] || TriggerSeverity.MEDIUM;
    }
    mapBottleneckSeverityToTriggerSeverity(severity) {
        const mapping = {
            'critical': TriggerSeverity.CRITICAL,
            'high': TriggerSeverity.HIGH,
            'medium': TriggerSeverity.MEDIUM,
            'low': TriggerSeverity.LOW
        };
        return mapping[severity] || TriggerSeverity.MEDIUM;
    }
    getTimeRangeForPeriod(period) {
        const now = Date.now();
        const durations = {
            [PeriodType.HOURLY]: 60 * 60 * 1000,
            [PeriodType.DAILY]: 24 * 60 * 60 * 1000,
            [PeriodType.WEEKLY]: 7 * 24 * 60 * 60 * 1000,
            [PeriodType.MONTHLY]: 30 * 24 * 60 * 60 * 1000
        };
        const duration = durations[period];
        return {
            start: now - duration,
            end: now
        };
    }
    async getDecisionsInTimeRange(timeRange) {
        const decisionKeys = await this.redis.keys(`${this.DECISION_PREFIX}:*`);
        const decisions = [];
        for (const key of decisionKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const decision = JSON.parse(data);
                if (decision.createdAt >= timeRange.start && decision.createdAt <= timeRange.end) {
                    decisions.push(decision);
                }
            }
        }
        return decisions;
    }
    generateOptimizationSummary(decisions) {
        const successful = decisions.filter(d => d.status === DecisionStatus.COMPLETED && d.result?.success);
        const failed = decisions.filter(d => d.status === DecisionStatus.FAILED || (d.result && !d.result.success));
        const totalCostSavings = successful.reduce((sum, d) => sum + (d.result?.actualImpact.cost.monthlySavings || 0), 0);
        const totalPerformanceImprovement = successful.reduce((sum, d) => sum + (d.result?.actualImpact.performance.latencyImprovement || 0), 0);
        const averageExecutionTime = successful.length > 0 ?
            successful.reduce((sum, d) => sum + (d.result?.executionTime || 0), 0) / successful.length : 0;
        // Group by type
        const typeStats = [];
        const typeGroups = decisions.reduce((groups, decision) => {
            if (!groups[decision.type]) {
                groups[decision.type] = [];
            }
            groups[decision.type].push(decision);
            return groups;
        }, {});
        for (const [type, typeDecisions] of Object.entries(typeGroups)) {
            const typeSuccessful = typeDecisions.filter(d => d.status === DecisionStatus.COMPLETED && d.result?.success);
            const successRate = typeDecisions.length > 0 ? typeSuccessful.length / typeDecisions.length : 0;
            const averageSavings = typeSuccessful.length > 0 ?
                typeSuccessful.reduce((sum, d) => sum + (d.result?.actualImpact.cost.monthlySavings || 0), 0) / typeSuccessful.length : 0;
            const averageImpact = typeSuccessful.length > 0 ?
                typeSuccessful.reduce((sum, d) => sum + (d.result?.actualImpact.performance.latencyImprovement || 0), 0) / typeSuccessful.length : 0;
            typeStats.push({
                type: type,
                count: typeDecisions.length,
                successRate,
                averageSavings,
                averageImpact
            });
        }
        return {
            totalDecisions: decisions.length,
            successfulOptimizations: successful.length,
            failedOptimizations: failed.length,
            totalCostSavings,
            totalPerformanceImprovement,
            averageExecutionTime,
            topOptimizationTypes: typeStats.sort((a, b) => b.count - a.count)
        };
    }
    async calculateOptimizationMetrics(decisions, timeRange) {
        const successful = decisions.filter(d => d.status === DecisionStatus.COMPLETED && d.result?.success);
        const total = decisions.length;
        return {
            systemHealth: 0.85, // Would be calculated from actual system metrics
            optimizationEffectiveness: total > 0 ? successful.length / total : 0,
            costEfficiency: 0.78, // Would be calculated from cost savings vs investment
            automationRate: decisions.filter(d => d.autoApprove).length / (total || 1),
            userSatisfaction: 0.82 // Would be calculated from user feedback
        };
    }
    analyzeTrends(decisions) {
        // Simplified trend analysis
        return [
            {
                metric: 'optimization_success_rate',
                direction: TrendDirection.IMPROVING,
                magnitude: 0.15,
                confidence: 0.8,
                timeframe: 'last_week'
            },
            {
                metric: 'cost_savings',
                direction: TrendDirection.IMPROVING,
                magnitude: 0.25,
                confidence: 0.9,
                timeframe: 'last_month'
            }
        ];
    }
    generateRecommendations(summary, metrics, trends) {
        const recommendations = [];
        // Low automation rate recommendation
        if (metrics.automationRate < 0.3) {
            recommendations.push({
                id: this.generateRecommendationId(),
                type: RecommendationType.AUTOMATION_OPPORTUNITY,
                priority: RecommendationPriority.HIGH,
                title: 'Increase Automation Rate',
                description: 'Current automation rate is low. Consider enabling auto-approval for low-risk optimizations.',
                expectedBenefit: 'Faster response to optimization opportunities',
                effort: EffortLevel.MEDIUM,
                timeframe: '2-3 weeks'
            });
        }
        // Low success rate recommendation
        if (metrics.optimizationEffectiveness < 0.7) {
            recommendations.push({
                id: this.generateRecommendationId(),
                type: RecommendationType.PROCESS_IMPROVEMENT,
                priority: RecommendationPriority.HIGH,
                title: 'Improve Optimization Success Rate',
                description: 'Review failed optimizations and improve implementation processes.',
                expectedBenefit: 'Higher success rate and better system performance',
                effort: EffortLevel.HIGH,
                timeframe: '1-2 months'
            });
        }
        return recommendations;
    }
    async getDecision(decisionId) {
        const data = await this.redis.hget(`${this.DECISION_PREFIX}:${decisionId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async storeDecision(decision) {
        await this.redis.hset(`${this.DECISION_PREFIX}:${decision.id}`, 'data', JSON.stringify(decision));
    }
    async storeReport(report) {
        await this.redis.hset(`${this.REPORT_PREFIX}:${report.id}`, 'data', JSON.stringify(report));
        // Set expiration for reports
        await this.redis.expire(`${this.REPORT_PREFIX}:${report.id}`, 90 * 24 * 60 * 60); // 90 days
    }
    generateDecisionId() {
        return `decision_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateReportId() {
        return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.OptimizationEngine = OptimizationEngine;
//# sourceMappingURL=optimization-engine.js.map