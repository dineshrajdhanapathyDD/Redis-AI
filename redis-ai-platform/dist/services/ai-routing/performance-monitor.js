"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
exports.getPerformanceMonitor = getPerformanceMonitor;
exports.createPerformanceMonitor = createPerformanceMonitor;
const redis_1 = require("@/config/redis");
const logger_1 = __importDefault(require("@/utils/logger"));
class PerformanceMonitor {
    redisManager = (0, redis_1.getRedisManager)();
    metricsBuffer = new Map();
    bufferSize = 100;
    flushInterval = 5000; // 5 seconds
    flushTimer;
    constructor() {
        this.startPeriodicFlush();
    }
    async recordMetric(metric) {
        try {
            // Add to buffer for batch processing
            const modelMetrics = this.metricsBuffer.get(metric.modelId) || [];
            modelMetrics.push(metric);
            this.metricsBuffer.set(metric.modelId, modelMetrics);
            // Flush if buffer is full
            if (modelMetrics.length >= this.bufferSize) {
                await this.flushMetrics(metric.modelId);
            }
            logger_1.default.debug('Performance metric recorded', {
                modelId: metric.modelId,
                latency: metric.latency,
                success: metric.success,
                cost: metric.cost,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to record performance metric', {
                modelId: metric.modelId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async getModelPerformance(modelId, timeWindow = '15m') {
        try {
            const client = this.redisManager.getClient();
            const now = Date.now();
            const windowMs = this.parseTimeWindow(timeWindow);
            const fromTime = now - windowMs;
            // Get metrics from Redis TimeSeries
            const latencyKey = `metrics:${modelId}:latency`;
            const successKey = `metrics:${modelId}:success`;
            const errorKey = `metrics:${modelId}:errors`;
            const costKey = `metrics:${modelId}:cost`;
            const accuracyKey = `metrics:${modelId}:accuracy`;
            const [latencyData, successData, errorData, costData, accuracyData] = await Promise.all([
                this.getTimeSeriesData(latencyKey, fromTime, now),
                this.getTimeSeriesData(successKey, fromTime, now),
                this.getTimeSeriesData(errorKey, fromTime, now),
                this.getTimeSeriesData(costKey, fromTime, now),
                this.getTimeSeriesData(accuracyKey, fromTime, now),
            ]);
            // Calculate aggregated metrics
            const performance = this.calculatePerformanceMetrics(latencyData, successData, errorData, costData, accuracyData, windowMs);
            logger_1.default.debug('Model performance retrieved', {
                modelId,
                timeWindow,
                performance,
            });
            return performance;
        }
        catch (error) {
            logger_1.default.error('Failed to get model performance', {
                modelId,
                timeWindow,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            // Return default performance metrics
            return {
                averageLatency: 0,
                throughput: 0,
                accuracy: 0,
                availability: 0,
                errorRate: 1,
            };
        }
    }
    async getAggregatedMetrics(modelId, timeWindow = '1h', granularity = '5m') {
        try {
            const client = this.redisManager.getClient();
            const now = Date.now();
            const windowMs = this.parseTimeWindow(timeWindow);
            const granularityMs = this.parseTimeWindow(granularity);
            const fromTime = now - windowMs;
            const aggregatedMetrics = [];
            // Create time buckets
            for (let time = fromTime; time < now; time += granularityMs) {
                const bucketEnd = Math.min(time + granularityMs, now);
                const [latencyData, successData, errorData] = await Promise.all([
                    this.getTimeSeriesData(`metrics:${modelId}:latency`, time, bucketEnd),
                    this.getTimeSeriesData(`metrics:${modelId}:success`, time, bucketEnd),
                    this.getTimeSeriesData(`metrics:${modelId}:errors`, time, bucketEnd),
                ]);
                const totalRequests = successData.length + errorData.length;
                const successfulRequests = successData.length;
                const errorRate = totalRequests > 0 ? errorData.length / totalRequests : 0;
                const averageLatency = latencyData.length > 0
                    ? latencyData.reduce((sum, point) => sum + point.value, 0) / latencyData.length
                    : 0;
                aggregatedMetrics.push({
                    modelId,
                    timeWindow: new Date(time).toISOString(),
                    totalRequests,
                    successfulRequests,
                    averageLatency,
                    p95Latency: this.calculatePercentile(latencyData.map(p => p.value), 0.95),
                    p99Latency: this.calculatePercentile(latencyData.map(p => p.value), 0.99),
                    errorRate,
                    throughput: totalRequests / (granularityMs / 1000), // requests per second
                    totalCost: 0, // Would be calculated from cost data
                    averageAccuracy: 0, // Would be calculated from accuracy data
                    availability: 1 - errorRate,
                });
            }
            return aggregatedMetrics;
        }
        catch (error) {
            logger_1.default.error('Failed to get aggregated metrics', {
                modelId,
                timeWindow,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    async getModelHealthStatus(modelId) {
        try {
            const performance = await this.getModelPerformance(modelId, '5m');
            const issues = [];
            // Check various health indicators
            if (performance.errorRate > 0.1) {
                issues.push(`High error rate: ${(performance.errorRate * 100).toFixed(1)}%`);
            }
            if (performance.averageLatency > 5000) {
                issues.push(`High latency: ${performance.averageLatency.toFixed(0)}ms`);
            }
            if (performance.availability < 0.95) {
                issues.push(`Low availability: ${(performance.availability * 100).toFixed(1)}%`);
            }
            if (performance.throughput < 0.1) {
                issues.push('Low throughput: No recent requests');
            }
            const isHealthy = issues.length === 0;
            return {
                isHealthy,
                issues,
                lastCheck: new Date(),
                uptime: performance.availability,
                responseTime: performance.averageLatency,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get model health status', {
                modelId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {
                isHealthy: false,
                issues: ['Health check failed'],
                lastCheck: new Date(),
                uptime: 0,
                responseTime: 0,
            };
        }
    }
    async getAllModelsHealth() {
        try {
            const client = this.redisManager.getClient();
            // Get all model IDs from metrics keys
            const keys = await client.keys('metrics:*:latency');
            const modelIds = keys.map(key => key.split(':')[1]).filter(Boolean);
            const healthStatuses = {};
            await Promise.all(modelIds.map(async (modelId) => {
                const [health, performance] = await Promise.all([
                    this.getModelHealthStatus(modelId),
                    this.getModelPerformance(modelId, '15m'),
                ]);
                healthStatuses[modelId] = {
                    isHealthy: health.isHealthy,
                    issues: health.issues,
                    performance,
                };
            }));
            return healthStatuses;
        }
        catch (error) {
            logger_1.default.error('Failed to get all models health', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return {};
        }
    }
    async flushMetrics(modelId) {
        try {
            const client = this.redisManager.getClient();
            const modelsToFlush = modelId ? [modelId] : Array.from(this.metricsBuffer.keys());
            for (const id of modelsToFlush) {
                const metrics = this.metricsBuffer.get(id);
                if (!metrics || metrics.length === 0)
                    continue;
                // Group metrics by type for batch insertion
                const latencyMetrics = [];
                const successMetrics = [];
                const errorMetrics = [];
                const costMetrics = [];
                const accuracyMetrics = [];
                for (const metric of metrics) {
                    const timestamp = metric.timestamp;
                    latencyMetrics.push([timestamp, metric.latency]);
                    if (metric.success) {
                        successMetrics.push([timestamp, 1]);
                    }
                    else {
                        errorMetrics.push([timestamp, 1]);
                    }
                    costMetrics.push([timestamp, metric.cost]);
                    if (metric.accuracy !== undefined) {
                        accuracyMetrics.push([timestamp, metric.accuracy]);
                    }
                }
                // Insert into Redis TimeSeries
                const pipeline = client.multi();
                if (latencyMetrics.length > 0) {
                    for (const [timestamp, value] of latencyMetrics) {
                        pipeline.ts.add(`metrics:${id}:latency`, timestamp, value);
                    }
                }
                if (successMetrics.length > 0) {
                    for (const [timestamp, value] of successMetrics) {
                        pipeline.ts.add(`metrics:${id}:success`, timestamp, value);
                    }
                }
                if (errorMetrics.length > 0) {
                    for (const [timestamp, value] of errorMetrics) {
                        pipeline.ts.add(`metrics:${id}:errors`, timestamp, value);
                    }
                }
                if (costMetrics.length > 0) {
                    for (const [timestamp, value] of costMetrics) {
                        pipeline.ts.add(`metrics:${id}:cost`, timestamp, value);
                    }
                }
                if (accuracyMetrics.length > 0) {
                    for (const [timestamp, value] of accuracyMetrics) {
                        pipeline.ts.add(`metrics:${id}:accuracy`, timestamp, value);
                    }
                }
                await pipeline.exec();
                // Clear buffer for this model
                this.metricsBuffer.delete(id);
                logger_1.default.debug('Metrics flushed to Redis', {
                    modelId: id,
                    metricsCount: metrics.length,
                });
            }
        }
        catch (error) {
            logger_1.default.error('Failed to flush metrics', {
                modelId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    startPeriodicFlush() {
        this.flushTimer = setInterval(async () => {
            await this.flushMetrics();
        }, this.flushInterval);
    }
    async getTimeSeriesData(key, fromTime, toTime) {
        try {
            const client = this.redisManager.getClient();
            // Ensure the time series exists
            try {
                await client.ts.create(key, {
                    RETENTION: 24 * 60 * 60 * 1000, // 24 hours
                    DUPLICATE_POLICY: 'LAST',
                });
            }
            catch (error) {
                // Key might already exist, ignore error
            }
            const result = await client.ts.range(key, fromTime, toTime);
            return result.map(point => ({
                timestamp: point.timestamp,
                value: point.value,
            }));
        }
        catch (error) {
            logger_1.default.debug('Failed to get time series data', {
                key,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    calculatePerformanceMetrics(latencyData, successData, errorData, costData, accuracyData, windowMs) {
        const totalRequests = successData.length + errorData.length;
        const successfulRequests = successData.length;
        const averageLatency = latencyData.length > 0
            ? latencyData.reduce((sum, point) => sum + point.value, 0) / latencyData.length
            : 0;
        const throughput = totalRequests / (windowMs / 1000); // requests per second
        const accuracy = accuracyData.length > 0
            ? accuracyData.reduce((sum, point) => sum + point.value, 0) / accuracyData.length
            : 0;
        const availability = totalRequests > 0 ? successfulRequests / totalRequests : 1;
        const errorRate = totalRequests > 0 ? errorData.length / totalRequests : 0;
        return {
            averageLatency,
            throughput,
            accuracy,
            availability,
            errorRate,
        };
    }
    parseTimeWindow(timeWindow) {
        const windowMap = {
            '1m': 60 * 1000,
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
        };
        return windowMap[timeWindow] || windowMap['15m'];
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[Math.max(0, index)];
    }
    async cleanup() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        // Flush any remaining metrics
        await this.flushMetrics();
        logger_1.default.info('Performance monitor cleanup completed');
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
// Singleton instance
let performanceMonitor = null;
function getPerformanceMonitor() {
    if (!performanceMonitor) {
        performanceMonitor = new PerformanceMonitor();
    }
    return performanceMonitor;
}
function createPerformanceMonitor() {
    performanceMonitor = new PerformanceMonitor();
    return performanceMonitor;
}
//# sourceMappingURL=performance-monitor.js.map