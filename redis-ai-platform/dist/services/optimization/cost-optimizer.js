"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostOptimizer = exports.ComparisonOperator = exports.ThresholdType = exports.AlertSeverity = exports.CostAlertType = exports.EffortLevel = exports.TrendDirection = exports.OptimizationStatus = exports.RiskSeverity = exports.CostRiskType = exports.RiskLevel = exports.ResourceRequirementType = exports.CostPeriod = exports.CostOptimizationType = void 0;
const logger_1 = require("../../utils/logger");
const performance_predictor_1 = require("./performance-predictor");
var CostOptimizationType;
(function (CostOptimizationType) {
    CostOptimizationType["RIGHT_SIZING"] = "right_sizing";
    CostOptimizationType["RESERVED_INSTANCES"] = "reserved_instances";
    CostOptimizationType["SPOT_INSTANCES"] = "spot_instances";
    CostOptimizationType["AUTO_SCALING"] = "auto_scaling";
    CostOptimizationType["RESOURCE_SCHEDULING"] = "resource_scheduling";
    CostOptimizationType["DATA_LIFECYCLE"] = "data_lifecycle";
    CostOptimizationType["COMPRESSION"] = "compression";
    CostOptimizationType["CACHING_OPTIMIZATION"] = "caching_optimization";
    CostOptimizationType["NETWORK_OPTIMIZATION"] = "network_optimization";
})(CostOptimizationType || (exports.CostOptimizationType = CostOptimizationType = {}));
var CostPeriod;
(function (CostPeriod) {
    CostPeriod["HOURLY"] = "hourly";
    CostPeriod["DAILY"] = "daily";
    CostPeriod["MONTHLY"] = "monthly";
    CostPeriod["YEARLY"] = "yearly";
})(CostPeriod || (exports.CostPeriod = CostPeriod = {}));
var ResourceRequirementType;
(function (ResourceRequirementType) {
    ResourceRequirementType["ENGINEER_TIME"] = "engineer_time";
    ResourceRequirementType["ADMIN_TIME"] = "admin_time";
    ResourceRequirementType["CONSULTANT"] = "consultant";
    ResourceRequirementType["TOOLS"] = "tools";
    ResourceRequirementType["INFRASTRUCTURE"] = "infrastructure";
})(ResourceRequirementType || (exports.ResourceRequirementType = ResourceRequirementType = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var CostRiskType;
(function (CostRiskType) {
    CostRiskType["PERFORMANCE_DEGRADATION"] = "performance_degradation";
    CostRiskType["SERVICE_INTERRUPTION"] = "service_interruption";
    CostRiskType["DATA_LOSS"] = "data_loss";
    CostRiskType["VENDOR_LOCK_IN"] = "vendor_lock_in";
    CostRiskType["COMPLIANCE_VIOLATION"] = "compliance_violation";
    CostRiskType["HIDDEN_COSTS"] = "hidden_costs";
})(CostRiskType || (exports.CostRiskType = CostRiskType = {}));
var RiskSeverity;
(function (RiskSeverity) {
    RiskSeverity["LOW"] = "low";
    RiskSeverity["MEDIUM"] = "medium";
    RiskSeverity["HIGH"] = "high";
    RiskSeverity["CRITICAL"] = "critical";
})(RiskSeverity || (exports.RiskSeverity = RiskSeverity = {}));
var OptimizationStatus;
(function (OptimizationStatus) {
    OptimizationStatus["IDENTIFIED"] = "identified";
    OptimizationStatus["ANALYZED"] = "analyzed";
    OptimizationStatus["APPROVED"] = "approved";
    OptimizationStatus["IN_PROGRESS"] = "in_progress";
    OptimizationStatus["COMPLETED"] = "completed";
    OptimizationStatus["FAILED"] = "failed";
    OptimizationStatus["CANCELLED"] = "cancelled";
})(OptimizationStatus || (exports.OptimizationStatus = OptimizationStatus = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["INCREASING"] = "increasing";
    TrendDirection["DECREASING"] = "decreasing";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["VOLATILE"] = "volatile";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var EffortLevel;
(function (EffortLevel) {
    EffortLevel["LOW"] = "low";
    EffortLevel["MEDIUM"] = "medium";
    EffortLevel["HIGH"] = "high";
    EffortLevel["VERY_HIGH"] = "very_high";
})(EffortLevel || (exports.EffortLevel = EffortLevel = {}));
var CostAlertType;
(function (CostAlertType) {
    CostAlertType["BUDGET_EXCEEDED"] = "budget_exceeded";
    CostAlertType["BUDGET_FORECAST_EXCEEDED"] = "budget_forecast_exceeded";
    CostAlertType["UNUSUAL_SPENDING"] = "unusual_spending";
    CostAlertType["COST_SPIKE"] = "cost_spike";
    CostAlertType["INEFFICIENT_RESOURCE_USAGE"] = "inefficient_resource_usage";
})(CostAlertType || (exports.CostAlertType = CostAlertType = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["INFO"] = "info";
    AlertSeverity["WARNING"] = "warning";
    AlertSeverity["CRITICAL"] = "critical";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
var ThresholdType;
(function (ThresholdType) {
    ThresholdType["ABSOLUTE"] = "absolute";
    ThresholdType["PERCENTAGE"] = "percentage";
    ThresholdType["RATE_OF_CHANGE"] = "rate_of_change";
})(ThresholdType || (exports.ThresholdType = ThresholdType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["EQUAL"] = "eq";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
class CostOptimizer {
    redis;
    OPTIMIZATION_PREFIX = 'cost_optimization';
    FORECAST_PREFIX = 'cost_forecast';
    ALERT_PREFIX = 'cost_alert';
    optimizationInterval;
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Cost Optimizer');
        // Start cost optimization analysis
        await this.startOptimizationAnalysis();
        logger_1.logger.info('Cost Optimizer initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Cost Optimizer');
        if (this.optimizationInterval) {
            clearInterval(this.optimizationInterval);
        }
        logger_1.logger.info('Cost Optimizer shutdown complete');
    }
    async identifyOptimizations(resourceType) {
        const optimizations = [];
        // Get current resource usage and costs
        const resourceUsage = await this.getCurrentResourceUsage();
        const currentCosts = await this.getCurrentCosts();
        // Identify optimization opportunities for each resource type
        const resourceTypes = resourceType ? [resourceType] : Object.values(performance_predictor_1.ResourceType);
        for (const type of resourceTypes) {
            const resourceOptimizations = await this.identifyResourceOptimizations(type, resourceUsage[type], currentCosts[type]);
            optimizations.push(...resourceOptimizations);
        }
        // Sort by potential savings
        optimizations.sort((a, b) => b.savings.amount - a.savings.amount);
        // Store optimizations
        for (const optimization of optimizations) {
            await this.storeOptimization(optimization);
        }
        return optimizations;
    }
    async generateCostForecast(resourceType, timeHorizon) {
        // Get historical cost data
        const historicalCosts = await this.getHistoricalCosts(resourceType, 90); // 90 days
        // Analyze cost trends
        const trend = this.analyzeCostTrend(historicalCosts);
        // Generate projections
        const projection = this.generateCostProjection(historicalCosts, trend, timeHorizon);
        // Identify optimization opportunities
        const opportunities = await this.identifyOptimizationOpportunities(resourceType, projection);
        const forecast = {
            id: this.generateForecastId(),
            resourceType,
            timeHorizon,
            currentTrend: trend,
            projectedCost: projection,
            optimizationOpportunities: opportunities,
            confidence: this.calculateForecastConfidence(historicalCosts, trend),
            generatedAt: Date.now()
        };
        await this.storeForecast(forecast);
        return forecast;
    }
    async implementOptimization(optimizationId) {
        const optimization = await this.getOptimization(optimizationId);
        if (!optimization) {
            throw new Error(`Optimization not found: ${optimizationId}`);
        }
        if (optimization.status !== OptimizationStatus.APPROVED) {
            throw new Error(`Optimization not approved: ${optimizationId}`);
        }
        logger_1.logger.info(`Implementing cost optimization: ${optimization.description}`);
        // Update status
        optimization.status = OptimizationStatus.IN_PROGRESS;
        optimization.implementedAt = Date.now();
        await this.storeOptimization(optimization);
        try {
            const result = await this.executeOptimization(optimization);
            optimization.status = result.success ? OptimizationStatus.COMPLETED : OptimizationStatus.FAILED;
            optimization.result = result;
            await this.storeOptimization(optimization);
            return result;
        }
        catch (error) {
            logger_1.logger.error(`Cost optimization implementation failed for ${optimizationId}:`, error);
            optimization.status = OptimizationStatus.FAILED;
            optimization.result = {
                success: false,
                actualSavings: {
                    amount: 0,
                    percentage: 0,
                    currency: 'USD',
                    period: CostPeriod.MONTHLY,
                    paybackPeriod: 0,
                    roi: 0,
                    netPresentValue: 0
                },
                performanceImpact: {
                    latencyChange: 0,
                    throughputChange: 0,
                    availabilityChange: 0,
                    errorRateChange: 0
                },
                implementationCost: optimization.implementation.phases.reduce((sum, phase) => sum + phase.cost, 0),
                lessonsLearned: ['Implementation failed'],
                recommendations: ['Review implementation plan']
            };
            await this.storeOptimization(optimization);
            throw error;
        }
    }
    async createCostAlert(type, threshold, currentValue, projectedValue) {
        const severity = this.calculateAlertSeverity(type, threshold, currentValue, projectedValue);
        const recommendations = this.generateAlertRecommendations(type, currentValue, projectedValue);
        const alert = {
            id: this.generateAlertId(),
            type,
            severity,
            threshold,
            currentValue,
            projectedValue,
            timeframe: this.getAlertTimeframe(threshold.period),
            recommendations,
            createdAt: Date.now(),
            acknowledged: false
        };
        await this.storeAlert(alert);
        return alert;
    }
    async getActiveAlerts() {
        const alertKeys = await this.redis.keys(`${this.ALERT_PREFIX}:*`);
        const alerts = [];
        for (const key of alertKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const alert = JSON.parse(data);
                if (!alert.acknowledged) {
                    alerts.push(alert);
                }
            }
        }
        return alerts.sort((a, b) => b.createdAt - a.createdAt);
    }
    async acknowledgeAlert(alertId) {
        const alert = await this.getAlert(alertId);
        if (!alert) {
            throw new Error(`Alert not found: ${alertId}`);
        }
        alert.acknowledged = true;
        await this.storeAlert(alert);
        logger_1.logger.info(`Acknowledged cost alert: ${alertId}`);
    }
    async startOptimizationAnalysis() {
        // Run cost optimization analysis every 6 hours
        this.optimizationInterval = setInterval(async () => {
            try {
                await this.performRoutineAnalysis();
            }
            catch (error) {
                logger_1.logger.error('Error in routine cost optimization analysis:', error);
            }
        }, 6 * 60 * 60 * 1000);
        // Perform initial analysis
        await this.performRoutineAnalysis();
    }
    async performRoutineAnalysis() {
        logger_1.logger.info('Performing routine cost optimization analysis');
        // Identify new optimizations
        const optimizations = await this.identifyOptimizations();
        logger_1.logger.info(`Identified ${optimizations.length} cost optimization opportunities`);
        // Generate forecasts for all resource types
        for (const resourceType of Object.values(performance_predictor_1.ResourceType)) {
            try {
                await this.generateCostForecast(resourceType, 30); // 30-day forecast
            }
            catch (error) {
                logger_1.logger.error(`Error generating forecast for ${resourceType}:`, error);
            }
        }
        // Check for cost alerts
        await this.checkCostAlerts();
    }
    async getCurrentResourceUsage() {
        // Simulate current resource usage data
        return {
            [performance_predictor_1.ResourceType.CPU]: { utilization: 0.65, instances: 4, instanceType: 'm5.large' },
            [performance_predictor_1.ResourceType.MEMORY]: { utilization: 0.72, allocated: 32, used: 23 },
            [performance_predictor_1.ResourceType.REDIS_MEMORY]: { utilization: 0.68, allocated: 16, used: 11 },
            [performance_predictor_1.ResourceType.NETWORK_BANDWIDTH]: { utilization: 0.45, allocated: 1000, used: 450 },
            [performance_predictor_1.ResourceType.DISK_IO]: { utilization: 0.35, iops: 1000, used: 350 },
            [performance_predictor_1.ResourceType.CONNECTION_POOL]: { utilization: 0.55, maxConnections: 1000, active: 550 },
            [performance_predictor_1.ResourceType.QUEUE_CAPACITY]: { utilization: 0.25, capacity: 10000, used: 2500 }
        };
    }
    async getCurrentCosts() {
        // Simulate current cost data
        const baseCost = {
            compute: 0,
            storage: 0,
            network: 0,
            memory: 0,
            licensing: 0,
            support: 0,
            total: 0,
            currency: 'USD',
            period: CostPeriod.MONTHLY
        };
        return {
            [performance_predictor_1.ResourceType.CPU]: { ...baseCost, compute: 800, total: 800 },
            [performance_predictor_1.ResourceType.MEMORY]: { ...baseCost, memory: 400, total: 400 },
            [performance_predictor_1.ResourceType.REDIS_MEMORY]: { ...baseCost, memory: 300, storage: 100, total: 400 },
            [performance_predictor_1.ResourceType.NETWORK_BANDWIDTH]: { ...baseCost, network: 200, total: 200 },
            [performance_predictor_1.ResourceType.DISK_IO]: { ...baseCost, storage: 150, total: 150 },
            [performance_predictor_1.ResourceType.CONNECTION_POOL]: { ...baseCost, compute: 100, total: 100 },
            [performance_predictor_1.ResourceType.QUEUE_CAPACITY]: { ...baseCost, compute: 50, total: 50 }
        };
    }
    async identifyResourceOptimizations(resourceType, usage, currentCost) {
        const optimizations = [];
        // Right-sizing optimization
        if (usage.utilization < 0.5) {
            const rightSizingOptimization = this.createRightSizingOptimization(resourceType, usage, currentCost);
            optimizations.push(rightSizingOptimization);
        }
        // Auto-scaling optimization
        if (usage.utilization > 0.8 || usage.utilization < 0.3) {
            const autoScalingOptimization = this.createAutoScalingOptimization(resourceType, usage, currentCost);
            optimizations.push(autoScalingOptimization);
        }
        // Resource-specific optimizations
        switch (resourceType) {
            case performance_predictor_1.ResourceType.REDIS_MEMORY:
                if (usage.utilization < 0.7) {
                    optimizations.push(this.createCompressionOptimization(resourceType, usage, currentCost));
                }
                break;
            case performance_predictor_1.ResourceType.NETWORK_BANDWIDTH:
                if (usage.utilization > 0.6) {
                    optimizations.push(this.createNetworkOptimization(resourceType, usage, currentCost));
                }
                break;
        }
        return optimizations;
    }
    createRightSizingOptimization(resourceType, usage, currentCost) {
        const savingsPercentage = Math.min(0.4, (0.5 - usage.utilization) * 2); // Up to 40% savings
        const savingsAmount = currentCost.total * savingsPercentage;
        return {
            id: this.generateOptimizationId(),
            type: CostOptimizationType.RIGHT_SIZING,
            resourceType,
            description: `Right-size ${resourceType} resources based on current utilization (${(usage.utilization * 100).toFixed(1)}%)`,
            currentCost,
            optimizedCost: {
                ...currentCost,
                total: currentCost.total - savingsAmount,
                compute: currentCost.compute * (1 - savingsPercentage),
                memory: currentCost.memory * (1 - savingsPercentage)
            },
            savings: {
                amount: savingsAmount,
                percentage: savingsPercentage * 100,
                currency: 'USD',
                period: CostPeriod.MONTHLY,
                paybackPeriod: 1, // Immediate savings
                roi: savingsPercentage * 100,
                netPresentValue: savingsAmount * 12 // Annual savings
            },
            implementation: this.createImplementationPlan(CostOptimizationType.RIGHT_SIZING, resourceType),
            risks: this.assessOptimizationRisks(CostOptimizationType.RIGHT_SIZING),
            status: OptimizationStatus.IDENTIFIED,
            createdAt: Date.now()
        };
    }
    createAutoScalingOptimization(resourceType, usage, currentCost) {
        const savingsPercentage = 0.25; // 25% average savings from auto-scaling
        const savingsAmount = currentCost.total * savingsPercentage;
        return {
            id: this.generateOptimizationId(),
            type: CostOptimizationType.AUTO_SCALING,
            resourceType,
            description: `Implement auto-scaling for ${resourceType} to optimize resource allocation`,
            currentCost,
            optimizedCost: {
                ...currentCost,
                total: currentCost.total - savingsAmount,
                compute: currentCost.compute * (1 - savingsPercentage)
            },
            savings: {
                amount: savingsAmount,
                percentage: savingsPercentage * 100,
                currency: 'USD',
                period: CostPeriod.MONTHLY,
                paybackPeriod: 2, // 2 months to implement and see benefits
                roi: (savingsPercentage * 100) - 10, // Minus implementation costs
                netPresentValue: (savingsAmount * 12) - 1000 // Annual savings minus implementation
            },
            implementation: this.createImplementationPlan(CostOptimizationType.AUTO_SCALING, resourceType),
            risks: this.assessOptimizationRisks(CostOptimizationType.AUTO_SCALING),
            status: OptimizationStatus.IDENTIFIED,
            createdAt: Date.now()
        };
    }
    createCompressionOptimization(resourceType, usage, currentCost) {
        const savingsPercentage = 0.3; // 30% savings from compression
        const savingsAmount = currentCost.total * savingsPercentage;
        return {
            id: this.generateOptimizationId(),
            type: CostOptimizationType.COMPRESSION,
            resourceType,
            description: 'Enable data compression to reduce Redis memory usage',
            currentCost,
            optimizedCost: {
                ...currentCost,
                total: currentCost.total - savingsAmount,
                memory: currentCost.memory * (1 - savingsPercentage),
                storage: currentCost.storage * (1 - savingsPercentage)
            },
            savings: {
                amount: savingsAmount,
                percentage: savingsPercentage * 100,
                currency: 'USD',
                period: CostPeriod.MONTHLY,
                paybackPeriod: 0.5, // Quick implementation
                roi: savingsPercentage * 100,
                netPresentValue: savingsAmount * 12
            },
            implementation: this.createImplementationPlan(CostOptimizationType.COMPRESSION, resourceType),
            risks: this.assessOptimizationRisks(CostOptimizationType.COMPRESSION),
            status: OptimizationStatus.IDENTIFIED,
            createdAt: Date.now()
        };
    }
    createNetworkOptimization(resourceType, usage, currentCost) {
        const savingsPercentage = 0.2; // 20% savings from network optimization
        const savingsAmount = currentCost.total * savingsPercentage;
        return {
            id: this.generateOptimizationId(),
            type: CostOptimizationType.NETWORK_OPTIMIZATION,
            resourceType,
            description: 'Optimize network usage through caching and compression',
            currentCost,
            optimizedCost: {
                ...currentCost,
                total: currentCost.total - savingsAmount,
                network: currentCost.network * (1 - savingsPercentage)
            },
            savings: {
                amount: savingsAmount,
                percentage: savingsPercentage * 100,
                currency: 'USD',
                period: CostPeriod.MONTHLY,
                paybackPeriod: 1,
                roi: (savingsPercentage * 100) - 5,
                netPresentValue: (savingsAmount * 12) - 500
            },
            implementation: this.createImplementationPlan(CostOptimizationType.NETWORK_OPTIMIZATION, resourceType),
            risks: this.assessOptimizationRisks(CostOptimizationType.NETWORK_OPTIMIZATION),
            status: OptimizationStatus.IDENTIFIED,
            createdAt: Date.now()
        };
    }
    createImplementationPlan(optimizationType, resourceType) {
        const planTemplates = {
            [CostOptimizationType.RIGHT_SIZING]: {
                phases: [
                    {
                        id: 'analysis',
                        name: 'Resource Analysis',
                        description: 'Analyze current resource usage patterns',
                        duration: 2,
                        cost: 500,
                        risks: ['incomplete_analysis'],
                        deliverables: ['usage_report'],
                        prerequisites: ['monitoring_access']
                    },
                    {
                        id: 'implementation',
                        name: 'Resource Adjustment',
                        description: 'Adjust resource allocations',
                        duration: 1,
                        cost: 200,
                        risks: ['service_interruption'],
                        deliverables: ['updated_configuration'],
                        prerequisites: ['admin_access']
                    }
                ],
                totalDuration: 3,
                requiredResources: [
                    { type: ResourceRequirementType.ENGINEER_TIME, quantity: 16, duration: 3, cost: 1600 }
                ]
            },
            [CostOptimizationType.AUTO_SCALING]: {
                phases: [
                    {
                        id: 'design',
                        name: 'Auto-scaling Design',
                        description: 'Design auto-scaling policies',
                        duration: 3,
                        cost: 800,
                        risks: ['incorrect_scaling_policies'],
                        deliverables: ['scaling_policies'],
                        prerequisites: ['performance_data']
                    },
                    {
                        id: 'implementation',
                        name: 'Auto-scaling Implementation',
                        description: 'Implement and test auto-scaling',
                        duration: 5,
                        cost: 1200,
                        risks: ['scaling_issues'],
                        deliverables: ['auto_scaling_system'],
                        prerequisites: ['scaling_policies']
                    }
                ],
                totalDuration: 8,
                requiredResources: [
                    { type: ResourceRequirementType.ENGINEER_TIME, quantity: 40, duration: 8, cost: 4000 }
                ]
            }
        };
        const template = planTemplates[optimizationType] || planTemplates[CostOptimizationType.RIGHT_SIZING];
        return {
            phases: template.phases,
            totalDuration: template.totalDuration,
            requiredResources: template.requiredResources,
            dependencies: ['monitoring_system', 'admin_access'],
            rollbackPlan: {
                steps: [
                    {
                        id: 'revert_config',
                        description: 'Revert to previous configuration',
                        estimatedTime: 30,
                        prerequisites: ['backup_configuration']
                    }
                ],
                estimatedTime: 1,
                dataBackupRequired: true,
                riskLevel: RiskLevel.LOW
            }
        };
    }
    assessOptimizationRisks(optimizationType) {
        const riskProfiles = {
            [CostOptimizationType.RIGHT_SIZING]: [
                {
                    type: CostRiskType.PERFORMANCE_DEGRADATION,
                    severity: RiskSeverity.MEDIUM,
                    probability: 0.3,
                    description: 'Resource reduction may impact performance during peak loads',
                    impact: {
                        financial: 1000,
                        operational: 'Potential service slowdown',
                        reputation: 'Minor user experience impact',
                        compliance: 'None'
                    },
                    mitigation: 'Monitor performance closely and have rollback plan ready'
                }
            ],
            [CostOptimizationType.AUTO_SCALING]: [
                {
                    type: CostRiskType.SERVICE_INTERRUPTION,
                    severity: RiskSeverity.LOW,
                    probability: 0.2,
                    description: 'Auto-scaling configuration errors may cause service issues',
                    impact: {
                        financial: 500,
                        operational: 'Brief service interruption possible',
                        reputation: 'Minimal impact',
                        compliance: 'None'
                    },
                    mitigation: 'Thorough testing in staging environment'
                }
            ]
        };
        return riskProfiles[optimizationType] || [];
    }
    async getHistoricalCosts(resourceType, days) {
        // Simulate historical cost data
        const costs = [];
        const baseDaily = 50; // Base daily cost
        const now = Date.now();
        for (let i = days; i >= 0; i--) {
            const date = now - (i * 24 * 60 * 60 * 1000);
            const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
            const trend = (days - i) * 0.01; // Slight upward trend
            const cost = baseDaily * (1 + variation + trend);
            costs.push({
                date,
                cost,
                confidence: 0.9
            });
        }
        return costs;
    }
    analyzeCostTrend(historicalCosts) {
        if (historicalCosts.length < 2) {
            return {
                direction: TrendDirection.STABLE,
                rate: 0,
                factors: []
            };
        }
        // Simple linear regression to determine trend
        const n = historicalCosts.length;
        const sumX = historicalCosts.reduce((sum, _, i) => sum + i, 0);
        const sumY = historicalCosts.reduce((sum, point) => sum + point.cost, 0);
        const sumXY = historicalCosts.reduce((sum, point, i) => sum + i * point.cost, 0);
        const sumXX = historicalCosts.reduce((sum, _, i) => sum + i * i, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const avgCost = sumY / n;
        const monthlyRate = (slope * 30) / avgCost; // Convert to monthly percentage
        let direction;
        if (Math.abs(monthlyRate) < 0.05) {
            direction = TrendDirection.STABLE;
        }
        else if (monthlyRate > 0) {
            direction = TrendDirection.INCREASING;
        }
        else {
            direction = TrendDirection.DECREASING;
        }
        return {
            direction,
            rate: Math.abs(monthlyRate) * 100,
            factors: [
                {
                    name: 'usage_growth',
                    impact: monthlyRate > 0 ? 0.6 : -0.6,
                    confidence: 0.8,
                    description: 'Resource usage trend'
                }
            ]
        };
    }
    generateCostProjection(historicalCosts, trend, timeHorizon) {
        const timeline = [];
        const lastCost = historicalCosts[historicalCosts.length - 1]?.cost || 100;
        const dailyRate = trend.rate / 100 / 30; // Convert monthly rate to daily
        for (let i = 0; i <= timeHorizon; i++) {
            const date = Date.now() + (i * 24 * 60 * 60 * 1000);
            let cost = lastCost;
            if (trend.direction === TrendDirection.INCREASING) {
                cost = lastCost * Math.pow(1 + dailyRate, i);
            }
            else if (trend.direction === TrendDirection.DECREASING) {
                cost = lastCost * Math.pow(1 - dailyRate, i);
            }
            timeline.push({
                date,
                cost,
                confidence: Math.max(0.5, 0.9 - (i / timeHorizon) * 0.4)
            });
        }
        const scenarios = [
            {
                name: 'Conservative',
                description: 'Lower growth scenario',
                probability: 0.3,
                costImpact: -0.2,
                timeline: timeline.map(point => ({
                    ...point,
                    cost: point.cost * 0.8
                }))
            },
            {
                name: 'Aggressive',
                description: 'Higher growth scenario',
                probability: 0.2,
                costImpact: 0.3,
                timeline: timeline.map(point => ({
                    ...point,
                    cost: point.cost * 1.3
                }))
            }
        ];
        return {
            timeline,
            scenarios,
            assumptions: [
                'Current usage patterns continue',
                'No major architectural changes',
                'Pricing remains stable'
            ]
        };
    }
    async identifyOptimizationOpportunities(resourceType, projection) {
        const opportunities = [];
        const totalProjectedCost = projection.timeline[projection.timeline.length - 1].cost;
        // Right-sizing opportunity
        opportunities.push({
            type: CostOptimizationType.RIGHT_SIZING,
            potentialSavings: totalProjectedCost * 0.2,
            confidence: 0.8,
            effort: EffortLevel.LOW,
            timeframe: '1-2 weeks'
        });
        // Auto-scaling opportunity
        opportunities.push({
            type: CostOptimizationType.AUTO_SCALING,
            potentialSavings: totalProjectedCost * 0.25,
            confidence: 0.7,
            effort: EffortLevel.MEDIUM,
            timeframe: '1-2 months'
        });
        return opportunities;
    }
    calculateForecastConfidence(historicalCosts, trend) {
        // Simple confidence calculation based on data quality and trend stability
        const dataQuality = historicalCosts.length >= 30 ? 0.9 : historicalCosts.length / 30 * 0.9;
        const trendStability = trend.direction === TrendDirection.STABLE ? 0.9 : 0.7;
        return Math.min(1, dataQuality * trendStability);
    }
    async executeOptimization(optimization) {
        // Simulate optimization execution
        const implementationCost = optimization.implementation.phases.reduce((sum, phase) => sum + phase.cost, 0);
        // Simulate execution time based on complexity
        const executionTime = optimization.implementation.totalDuration * 1000; // Convert days to milliseconds
        await new Promise(resolve => setTimeout(resolve, Math.min(executionTime, 5000))); // Cap at 5 seconds for demo
        // Simulate success/failure
        const successRate = 0.85; // 85% success rate
        const success = Math.random() < successRate;
        if (success) {
            // Calculate actual savings (with some variance)
            const savingsVariance = 0.8 + (Math.random() * 0.4); // 80-120% of expected
            const actualSavings = {
                ...optimization.savings,
                amount: optimization.savings.amount * savingsVariance,
                percentage: optimization.savings.percentage * savingsVariance
            };
            return {
                success: true,
                actualSavings,
                performanceImpact: {
                    latencyChange: Math.random() * 10 - 5, // ±5ms
                    throughputChange: Math.random() * 10 - 5, // ±5%
                    availabilityChange: Math.random() * 2 - 1, // ±1%
                    errorRateChange: Math.random() * 1 - 0.5 // ±0.5%
                },
                implementationCost,
                lessonsLearned: [
                    'Monitoring is crucial during optimization',
                    'Gradual rollout reduces risk'
                ],
                recommendations: [
                    'Continue monitoring performance',
                    'Consider additional optimizations'
                ]
            };
        }
        else {
            throw new Error('Optimization implementation failed');
        }
    }
    async checkCostAlerts() {
        // Check for various cost alert conditions
        const currentCosts = await this.getCurrentCosts();
        for (const [resourceType, cost] of Object.entries(currentCosts)) {
            // Budget exceeded alert
            const monthlyBudget = 1000; // Example budget
            if (cost.total > monthlyBudget) {
                await this.createCostAlert(CostAlertType.BUDGET_EXCEEDED, {
                    type: ThresholdType.ABSOLUTE,
                    value: monthlyBudget,
                    period: CostPeriod.MONTHLY,
                    comparison: ComparisonOperator.GREATER_THAN
                }, cost.total, cost.total * 1.1 // Projected 10% increase
                );
            }
        }
    }
    calculateAlertSeverity(type, threshold, currentValue, projectedValue) {
        const exceedanceRatio = currentValue / threshold.value;
        if (exceedanceRatio > 1.5)
            return AlertSeverity.CRITICAL;
        if (exceedanceRatio > 1.2)
            return AlertSeverity.WARNING;
        return AlertSeverity.INFO;
    }
    generateAlertRecommendations(type, currentValue, projectedValue) {
        const recommendations = {
            [CostAlertType.BUDGET_EXCEEDED]: [
                'Review resource utilization',
                'Consider right-sizing resources',
                'Implement auto-scaling'
            ],
            [CostAlertType.COST_SPIKE]: [
                'Investigate unusual usage patterns',
                'Check for resource leaks',
                'Review recent deployments'
            ],
            [CostAlertType.INEFFICIENT_RESOURCE_USAGE]: [
                'Optimize resource allocation',
                'Enable compression',
                'Review caching strategies'
            ]
        };
        return recommendations[type] || ['Review cost optimization opportunities'];
    }
    getAlertTimeframe(period) {
        const timeframes = {
            [CostPeriod.HOURLY]: 'Next hour',
            [CostPeriod.DAILY]: 'Next 24 hours',
            [CostPeriod.MONTHLY]: 'This month',
            [CostPeriod.YEARLY]: 'This year'
        };
        return timeframes[period];
    }
    async getOptimization(optimizationId) {
        const data = await this.redis.hget(`${this.OPTIMIZATION_PREFIX}:${optimizationId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async storeOptimization(optimization) {
        await this.redis.hset(`${this.OPTIMIZATION_PREFIX}:${optimization.id}`, 'data', JSON.stringify(optimization));
    }
    async storeForecast(forecast) {
        await this.redis.hset(`${this.FORECAST_PREFIX}:${forecast.id}`, 'data', JSON.stringify(forecast));
        // Set expiration for forecasts
        await this.redis.expire(`${this.FORECAST_PREFIX}:${forecast.id}`, 30 * 24 * 60 * 60); // 30 days
    }
    async getAlert(alertId) {
        const data = await this.redis.hget(`${this.ALERT_PREFIX}:${alertId}`, 'data');
        return data ? JSON.parse(data) : null;
    }
    async storeAlert(alert) {
        await this.redis.hset(`${this.ALERT_PREFIX}:${alert.id}`, 'data', JSON.stringify(alert));
    }
    generateOptimizationId() {
        return `cost_opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateForecastId() {
        return `forecast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.CostOptimizer = CostOptimizer;
//# sourceMappingURL=cost-optimizer.js.map