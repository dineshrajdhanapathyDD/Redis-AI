"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = exports.AlertSeverity = exports.ComparisonOperator = exports.AggregationType = void 0;
const logger_1 = require("../../utils/logger");
var AggregationType;
(function (AggregationType) {
    AggregationType["AVG"] = "avg";
    AggregationType["SUM"] = "sum";
    AggregationType["MIN"] = "min";
    AggregationType["MAX"] = "max";
    AggregationType["COUNT"] = "count";
    AggregationType["RATE"] = "rate";
    AggregationType["PERCENTILE"] = "percentile";
})(AggregationType || (exports.AggregationType = AggregationType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["GREATER_EQUAL"] = "gte";
    ComparisonOperator["LESS_EQUAL"] = "lte";
    ComparisonOperator["EQUAL"] = "eq";
    ComparisonOperator["NOT_EQUAL"] = "ne";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var AlertSeverity;
(function (AlertSeverity) {
    AlertSeverity["CRITICAL"] = "critical";
    AlertSeverity["HIGH"] = "high";
    AlertSeverity["MEDIUM"] = "medium";
    AlertSeverity["LOW"] = "low";
    AlertSeverity["INFO"] = "info";
})(AlertSeverity || (exports.AlertSeverity = AlertSeverity = {}));
class MetricsCollector {
    redis;
    METRICS_PREFIX = 'metrics';
    ALERTS_PREFIX = 'alerts';
    collectionInterval;
    isCollecting = false;
    constructor(redis) {
        this.redis = redis;
    }
    async initialize() {
        logger_1.logger.info('Initializing Metrics Collector');
        // Set up Redis TimeSeries for metrics storage
        await this.setupTimeSeriesKeys();
        // Start metrics collection
        await this.startCollection();
        logger_1.logger.info('Metrics Collector initialized');
    }
    async shutdown() {
        logger_1.logger.info('Shutting down Metrics Collector');
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
        }
        this.isCollecting = false;
        logger_1.logger.info('Metrics Collector shutdown complete');
    }
    async collectSystemMetrics() {
        const timestamp = Date.now();
        // Collect various system metrics
        const [cpu, memory, redis, network, application] = await Promise.all([
            this.collectCPUMetrics(),
            this.collectMemoryMetrics(),
            this.collectRedisMetrics(),
            this.collectNetworkMetrics(),
            this.collectApplicationMetrics()
        ]);
        const metrics = {
            timestamp,
            cpu,
            memory,
            redis,
            network,
            application
        };
        // Store metrics in Redis TimeSeries
        await this.storeMetrics(metrics);
        return metrics;
    }
    async getMetrics(metricName, timeRange, aggregationType = AggregationType.AVG) {
        const key = `${this.METRICS_PREFIX}:${metricName}`;
        // Get time series data from Redis
        const data = await this.redis.call('TS.RANGE', key, timeRange.start, timeRange.end, 'AGGREGATION', aggregationType, timeRange.interval * 1000);
        const values = data.map(([, value]) => parseFloat(value));
        const timestamps = data.map(([timestamp]) => timestamp);
        const summary = this.calculateSummary(values);
        return {
            metricName,
            timeRange,
            aggregationType,
            values,
            timestamps,
            summary
        };
    }
    async addMetricsSample(sample) {
        const key = `${this.METRICS_PREFIX}:${sample.metricName}`;
        // Add sample to Redis TimeSeries
        await this.redis.call('TS.ADD', key, sample.timestamp, sample.value);
        // Add labels if provided
        if (sample.labels) {
            const labelArgs = Object.entries(sample.labels).flat();
            await this.redis.call('TS.ALTER', key, 'LABELS', ...labelArgs);
        }
    }
    async createAlert(alert) {
        const fullAlert = {
            ...alert,
            id: this.generateAlertId(),
            timestamp: Date.now(),
            resolved: false
        };
        await this.redis.hset(`${this.ALERTS_PREFIX}:${fullAlert.id}`, 'data', JSON.stringify(fullAlert));
        return fullAlert;
    }
    async getActiveAlerts() {
        const alertKeys = await this.redis.keys(`${this.ALERTS_PREFIX}:*`);
        const alerts = [];
        for (const key of alertKeys) {
            const data = await this.redis.hget(key, 'data');
            if (data) {
                const alert = JSON.parse(data);
                if (!alert.resolved) {
                    alerts.push(alert);
                }
            }
        }
        return alerts.sort((a, b) => b.timestamp - a.timestamp);
    }
    async resolveAlert(alertId) {
        const key = `${this.ALERTS_PREFIX}:${alertId}`;
        const data = await this.redis.hget(key, 'data');
        if (data) {
            const alert = JSON.parse(data);
            alert.resolved = true;
            alert.resolvedAt = Date.now();
            await this.redis.hset(key, 'data', JSON.stringify(alert));
        }
    }
    async setupTimeSeriesKeys() {
        const metricKeys = [
            'cpu.usage',
            'cpu.load_average',
            'memory.usage',
            'memory.available',
            'redis.memory_usage',
            'redis.connected_clients',
            'redis.hit_rate',
            'network.bytes_in',
            'network.bytes_out',
            'network.latency.p95',
            'application.requests_per_second',
            'application.response_time.avg',
            'application.error_rate',
            'application.active_users'
        ];
        for (const metricKey of metricKeys) {
            const key = `${this.METRICS_PREFIX}:${metricKey}`;
            try {
                // Create TimeSeries key if it doesn't exist
                await this.redis.call('TS.CREATE', key, 'RETENTION', 86400000, // 24 hours in milliseconds
                'LABELS', 'metric', metricKey);
            }
            catch (error) {
                // Key might already exist, which is fine
                if (!error.message.includes('TSDB: key already exists')) {
                    logger_1.logger.warn(`Failed to create TimeSeries key ${key}:`, error);
                }
            }
        }
    }
    async startCollection() {
        this.isCollecting = true;
        // Collect metrics every 30 seconds
        this.collectionInterval = setInterval(async () => {
            if (this.isCollecting) {
                try {
                    await this.collectSystemMetrics();
                }
                catch (error) {
                    logger_1.logger.error('Error collecting system metrics:', error);
                }
            }
        }, 30000);
        // Collect initial metrics
        await this.collectSystemMetrics();
    }
    async collectCPUMetrics() {
        // In a real implementation, this would collect actual CPU metrics
        // For demo purposes, we'll simulate realistic values
        return {
            usage: Math.random() * 0.8 + 0.1, // 10-90% usage
            loadAverage: [1.2, 1.5, 1.8],
            cores: 8,
            processes: 150 + Math.floor(Math.random() * 50)
        };
    }
    async collectMemoryMetrics() {
        // Simulate memory metrics
        const total = 16 * 1024 * 1024 * 1024; // 16GB
        const used = total * (0.3 + Math.random() * 0.4); // 30-70% usage
        const available = total - used;
        return {
            used,
            total,
            available,
            usage: used / total,
            swapUsed: 0,
            swapTotal: 2 * 1024 * 1024 * 1024 // 2GB swap
        };
    }
    async collectRedisMetrics() {
        try {
            const info = await this.redis.info();
            const stats = this.parseRedisInfo(info);
            return {
                memoryUsage: stats.used_memory || 0,
                memoryPeak: stats.used_memory_peak || 0,
                memoryRss: stats.used_memory_rss || 0,
                connectedClients: stats.connected_clients || 0,
                blockedClients: stats.blocked_clients || 0,
                totalConnections: stats.total_connections_received || 0,
                commandsProcessed: stats.total_commands_processed || 0,
                keyspaceHits: stats.keyspace_hits || 0,
                keyspaceMisses: stats.keyspace_misses || 0,
                hitRate: this.calculateHitRate(stats.keyspace_hits || 0, stats.keyspace_misses || 0),
                evictedKeys: stats.evicted_keys || 0,
                expiredKeys: stats.expired_keys || 0,
                totalKeys: await this.getTotalKeys(),
                avgTtl: await this.getAverageTTL(),
                replicationBacklog: stats.repl_backlog_size || 0,
                slowlogLength: await this.getSlowlogLength()
            };
        }
        catch (error) {
            logger_1.logger.error('Error collecting Redis metrics:', error);
            return this.getDefaultRedisMetrics();
        }
    }
    async collectNetworkMetrics() {
        // Simulate network metrics
        return {
            bytesIn: Math.floor(Math.random() * 1000000),
            bytesOut: Math.floor(Math.random() * 1000000),
            packetsIn: Math.floor(Math.random() * 10000),
            packetsOut: Math.floor(Math.random() * 10000),
            connectionsActive: Math.floor(Math.random() * 100),
            connectionsTotal: Math.floor(Math.random() * 1000),
            latency: {
                p50: 10 + Math.random() * 20,
                p95: 50 + Math.random() * 50,
                p99: 100 + Math.random() * 100,
                avg: 20 + Math.random() * 30,
                max: 200 + Math.random() * 300,
                min: 1 + Math.random() * 5
            }
        };
    }
    async collectApplicationMetrics() {
        // Simulate application metrics
        return {
            requestsPerSecond: 100 + Math.random() * 200,
            responseTime: {
                p50: 50 + Math.random() * 50,
                p95: 200 + Math.random() * 100,
                p99: 500 + Math.random() * 200,
                avg: 100 + Math.random() * 100,
                max: 1000 + Math.random() * 500,
                min: 10 + Math.random() * 20
            },
            errorRate: Math.random() * 0.05, // 0-5% error rate
            activeUsers: Math.floor(Math.random() * 1000),
            searchQueries: Math.floor(Math.random() * 500),
            vectorOperations: Math.floor(Math.random() * 200),
            cacheHitRate: 0.8 + Math.random() * 0.15, // 80-95% hit rate
            queueLength: Math.floor(Math.random() * 50),
            workerUtilization: 0.5 + Math.random() * 0.4 // 50-90% utilization
        };
    }
    async storeMetrics(metrics) {
        const samples = [
            { metricName: 'cpu.usage', value: metrics.cpu.usage, timestamp: metrics.timestamp },
            { metricName: 'cpu.load_average', value: metrics.cpu.loadAverage[0], timestamp: metrics.timestamp },
            { metricName: 'memory.usage', value: metrics.memory.usage, timestamp: metrics.timestamp },
            { metricName: 'memory.available', value: metrics.memory.available, timestamp: metrics.timestamp },
            { metricName: 'redis.memory_usage', value: metrics.redis.memoryUsage, timestamp: metrics.timestamp },
            { metricName: 'redis.connected_clients', value: metrics.redis.connectedClients, timestamp: metrics.timestamp },
            { metricName: 'redis.hit_rate', value: metrics.redis.hitRate, timestamp: metrics.timestamp },
            { metricName: 'network.bytes_in', value: metrics.network.bytesIn, timestamp: metrics.timestamp },
            { metricName: 'network.bytes_out', value: metrics.network.bytesOut, timestamp: metrics.timestamp },
            { metricName: 'network.latency.p95', value: metrics.network.latency.p95, timestamp: metrics.timestamp },
            { metricName: 'application.requests_per_second', value: metrics.application.requestsPerSecond, timestamp: metrics.timestamp },
            { metricName: 'application.response_time.avg', value: metrics.application.responseTime.avg, timestamp: metrics.timestamp },
            { metricName: 'application.error_rate', value: metrics.application.errorRate, timestamp: metrics.timestamp },
            { metricName: 'application.active_users', value: metrics.application.activeUsers, timestamp: metrics.timestamp }
        ];
        // Store all samples
        for (const sample of samples) {
            await this.addMetricsSample(sample);
        }
    }
    parseRedisInfo(info) {
        const stats = {};
        const lines = info.split('\r\n');
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                const numValue = parseFloat(value);
                if (!isNaN(numValue)) {
                    stats[key] = numValue;
                }
            }
        }
        return stats;
    }
    calculateHitRate(hits, misses) {
        const total = hits + misses;
        return total > 0 ? hits / total : 0;
    }
    async getTotalKeys() {
        try {
            const dbsize = await this.redis.dbsize();
            return dbsize;
        }
        catch (error) {
            return 0;
        }
    }
    async getAverageTTL() {
        // This is a simplified implementation
        // In practice, you'd sample keys and calculate average TTL
        return 3600; // 1 hour default
    }
    async getSlowlogLength() {
        try {
            const slowlog = await this.redis.slowlog('LEN');
            return slowlog;
        }
        catch (error) {
            return 0;
        }
    }
    getDefaultRedisMetrics() {
        return {
            memoryUsage: 0,
            memoryPeak: 0,
            memoryRss: 0,
            connectedClients: 0,
            blockedClients: 0,
            totalConnections: 0,
            commandsProcessed: 0,
            keyspaceHits: 0,
            keyspaceMisses: 0,
            hitRate: 0,
            evictedKeys: 0,
            expiredKeys: 0,
            totalKeys: 0,
            avgTtl: 0,
            replicationBacklog: 0,
            slowlogLength: 0
        };
    }
    calculateSummary(values) {
        if (values.length === 0) {
            return {
                avg: 0,
                min: 0,
                max: 0,
                sum: 0,
                count: 0,
                stdDev: 0,
                percentiles: {}
            };
        }
        const sum = values.reduce((a, b) => a + b, 0);
        const avg = sum / values.length;
        const min = Math.min(...values);
        const max = Math.max(...values);
        // Calculate standard deviation
        const variance = values.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);
        // Calculate percentiles
        const sorted = [...values].sort((a, b) => a - b);
        const percentiles = {
            p50: this.getPercentile(sorted, 0.5),
            p90: this.getPercentile(sorted, 0.9),
            p95: this.getPercentile(sorted, 0.95),
            p99: this.getPercentile(sorted, 0.99)
        };
        return {
            avg,
            min,
            max,
            sum,
            count: values.length,
            stdDev,
            percentiles
        };
    }
    getPercentile(sortedValues, percentile) {
        const index = Math.ceil(sortedValues.length * percentile) - 1;
        return sortedValues[Math.max(0, index)];
    }
    generateAlertId() {
        return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}
exports.MetricsCollector = MetricsCollector;
//# sourceMappingURL=metrics-collector.js.map