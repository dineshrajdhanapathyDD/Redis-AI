"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const logger_1 = require("../../utils/logger");
class PerformanceMonitor {
    snapshots = [];
    gcStats = [];
    monitoringInterval = null;
    gcObserver = null;
    constructor() {
        this.initializeGCMonitoring();
        this.startMonitoring();
    }
    initializeGCMonitoring() {
        try {
            // Monitor garbage collection if available
            if (global.gc && typeof global.gc === 'function') {
                const originalGC = global.gc;
                global.gc = (...args) => {
                    const start = Date.now();
                    const result = originalGC.apply(global, args);
                    const duration = Date.now() - start;
                    this.gcStats.push({
                        type: 'manual',
                        duration,
                        timestamp: start
                    });
                    // Keep only recent GC stats
                    this.gcStats = this.gcStats.filter(stat => Date.now() - stat.timestamp < 3600000 // 1 hour
                    );
                    return result;
                };
            }
            // Use performance hooks if available
            try {
                const { PerformanceObserver } = require('perf_hooks');
                this.gcObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach((entry) => {
                        if (entry.entryType === 'gc') {
                            this.gcStats.push({
                                type: entry.kind || 'unknown',
                                duration: entry.duration,
                                timestamp: entry.startTime + Date.now() - performance.now()
                            });
                        }
                    });
                });
                this.gcObserver.observe({ entryTypes: ['gc'] });
            }
            catch (error) {
                logger_1.logger.warn('Performance hooks not available:', error);
            }
        }
        catch (error) {
            logger_1.logger.warn('GC monitoring initialization failed:', error);
        }
    }
    startMonitoring() {
        this.monitoringInterval = setInterval(() => {
            this.captureSnapshot();
        }, 30000); // Capture every 30 seconds
    }
    captureSnapshot() {
        const metrics = this.collectMetrics();
        const snapshot = {
            timestamp: Date.now(),
            metrics
        };
        this.snapshots.push(snapshot);
        // Keep only recent snapshots (last 24 hours)
        const cutoff = Date.now() - 86400000;
        this.snapshots = this.snapshots.filter(s => s.timestamp > cutoff);
        // Log performance issues
        this.checkPerformanceThresholds(metrics);
    }
    collectMetrics() {
        const memUsage = process.memoryUsage();
        // Calculate GC metrics
        const recentGC = this.gcStats.filter(stat => Date.now() - stat.timestamp < 300000 // Last 5 minutes
        );
        const gcFrequency = recentGC.length / 5; // Per minute
        const avgGCDuration = recentGC.length > 0
            ? recentGC.reduce((sum, stat) => sum + stat.duration, 0) / recentGC.length
            : 0;
        // Calculate query latency percentiles from recent snapshots
        const latencyData = this.calculateLatencyPercentiles();
        return {
            connectionPoolUtilization: 0, // Will be updated by connection pool
            batchingEfficiency: 0, // Will be updated by request batcher
            cacheHitRate: 0, // Will be updated by prefetch service
            queryLatency: latencyData,
            memoryUsage: {
                heap: memUsage.heapUsed,
                external: memUsage.external,
                rss: memUsage.rss
            },
            gcMetrics: recentGC.map(stat => ({
                frequency: gcFrequency,
                duration: stat.duration,
                type: stat.type
            }))
        };
    }
    calculateLatencyPercentiles() {
        // This would typically be populated by actual query measurements
        // For now, return default values
        return {
            p50: 50,
            p95: 200,
            p99: 500
        };
    }
    checkPerformanceThresholds(metrics) {
        const issues = [];
        // Check memory usage
        const heapUsageMB = metrics.memoryUsage.heap / 1024 / 1024;
        if (heapUsageMB > 1000) {
            issues.push(`High heap usage: ${heapUsageMB.toFixed(2)}MB`);
        }
        // Check query latency
        if (metrics.queryLatency.p95 > 1000) {
            issues.push(`High query latency P95: ${metrics.queryLatency.p95}ms`);
        }
        // Check GC frequency
        const avgGCFrequency = metrics.gcMetrics.length > 0
            ? metrics.gcMetrics.reduce((sum, gc) => sum + gc.frequency, 0) / metrics.gcMetrics.length
            : 0;
        if (avgGCFrequency > 10) {
            issues.push(`High GC frequency: ${avgGCFrequency.toFixed(2)} per minute`);
        }
        if (issues.length > 0) {
            logger_1.logger.warn('Performance issues detected:', issues);
        }
    }
    updateConnectionPoolMetrics(utilization) {
        if (this.snapshots.length > 0) {
            const latest = this.snapshots[this.snapshots.length - 1];
            latest.metrics.connectionPoolUtilization = utilization;
        }
    }
    updateBatchingMetrics(efficiency) {
        if (this.snapshots.length > 0) {
            const latest = this.snapshots[this.snapshots.length - 1];
            latest.metrics.batchingEfficiency = efficiency;
        }
    }
    updateCacheMetrics(hitRate) {
        if (this.snapshots.length > 0) {
            const latest = this.snapshots[this.snapshots.length - 1];
            latest.metrics.cacheHitRate = hitRate;
        }
    }
    updateQueryLatency(latency) {
        // Update query latency statistics
        // This would typically maintain a sliding window of latency measurements
        if (this.snapshots.length > 0) {
            const latest = this.snapshots[this.snapshots.length - 1];
            // Simple update - in practice, this would maintain percentile calculations
            latest.metrics.queryLatency.p50 = Math.min(latest.metrics.queryLatency.p50, latency);
        }
    }
    getMetrics() {
        if (this.snapshots.length === 0) {
            return this.collectMetrics();
        }
        return this.snapshots[this.snapshots.length - 1].metrics;
    }
    getHistoricalMetrics(durationMs = 3600000) {
        const cutoff = Date.now() - durationMs;
        return this.snapshots.filter(snapshot => snapshot.timestamp > cutoff);
    }
    generateOptimizationRecommendations() {
        const recommendations = [];
        const currentMetrics = this.getMetrics();
        // Connection pool recommendations
        if (currentMetrics.connectionPoolUtilization > 0.8) {
            recommendations.push({
                type: 'connection_pool',
                severity: 'high',
                description: 'Connection pool utilization is high',
                action: 'Increase maximum connection pool size',
                expectedImprovement: 'Reduced connection wait times'
            });
        }
        // Batching recommendations
        if (currentMetrics.batchingEfficiency < 0.5) {
            recommendations.push({
                type: 'batching',
                severity: 'medium',
                description: 'Request batching efficiency is low',
                action: 'Increase batch size or reduce wait time',
                expectedImprovement: 'Better throughput and reduced Redis load'
            });
        }
        // Caching recommendations
        if (currentMetrics.cacheHitRate < 0.7) {
            recommendations.push({
                type: 'caching',
                severity: 'medium',
                description: 'Cache hit rate is below optimal',
                action: 'Increase cache size or improve prefetching',
                expectedImprovement: 'Reduced Redis queries and better response times'
            });
        }
        // Query performance recommendations
        if (currentMetrics.queryLatency.p95 > 500) {
            recommendations.push({
                type: 'query',
                severity: 'high',
                description: 'Query latency P95 is high',
                action: 'Enable query optimization and result caching',
                expectedImprovement: 'Faster query response times'
            });
        }
        // Memory recommendations
        const heapUsageMB = currentMetrics.memoryUsage.heap / 1024 / 1024;
        if (heapUsageMB > 800) {
            recommendations.push({
                type: 'memory',
                severity: 'high',
                description: 'High memory usage detected',
                action: 'Reduce cache sizes or increase heap limit',
                expectedImprovement: 'Reduced GC pressure and better stability'
            });
        }
        return recommendations;
    }
    getPerformanceTrends() {
        if (this.snapshots.length < 2) {
            return null;
        }
        const recent = this.snapshots.slice(-10); // Last 10 snapshots
        const older = this.snapshots.slice(-20, -10); // Previous 10 snapshots
        if (older.length === 0) {
            return null;
        }
        const recentAvg = this.calculateAverageMetrics(recent);
        const olderAvg = this.calculateAverageMetrics(older);
        return {
            memoryTrend: this.calculateTrend(olderAvg.memoryUsage.heap, recentAvg.memoryUsage.heap),
            latencyTrend: this.calculateTrend(olderAvg.queryLatency.p95, recentAvg.queryLatency.p95),
            cacheHitTrend: this.calculateTrend(olderAvg.cacheHitRate, recentAvg.cacheHitRate),
            connectionUtilizationTrend: this.calculateTrend(olderAvg.connectionPoolUtilization, recentAvg.connectionPoolUtilization)
        };
    }
    calculateAverageMetrics(snapshots) {
        if (snapshots.length === 0) {
            return this.collectMetrics();
        }
        const sum = snapshots.reduce((acc, snapshot) => {
            const m = snapshot.metrics;
            return {
                connectionPoolUtilization: acc.connectionPoolUtilization + m.connectionPoolUtilization,
                batchingEfficiency: acc.batchingEfficiency + m.batchingEfficiency,
                cacheHitRate: acc.cacheHitRate + m.cacheHitRate,
                queryLatency: {
                    p50: acc.queryLatency.p50 + m.queryLatency.p50,
                    p95: acc.queryLatency.p95 + m.queryLatency.p95,
                    p99: acc.queryLatency.p99 + m.queryLatency.p99
                },
                memoryUsage: {
                    heap: acc.memoryUsage.heap + m.memoryUsage.heap,
                    external: acc.memoryUsage.external + m.memoryUsage.external,
                    rss: acc.memoryUsage.rss + m.memoryUsage.rss
                },
                gcMetrics: [] // Not averaged
            };
        }, {
            connectionPoolUtilization: 0,
            batchingEfficiency: 0,
            cacheHitRate: 0,
            queryLatency: { p50: 0, p95: 0, p99: 0 },
            memoryUsage: { heap: 0, external: 0, rss: 0 },
            gcMetrics: []
        });
        const count = snapshots.length;
        return {
            connectionPoolUtilization: sum.connectionPoolUtilization / count,
            batchingEfficiency: sum.batchingEfficiency / count,
            cacheHitRate: sum.cacheHitRate / count,
            queryLatency: {
                p50: sum.queryLatency.p50 / count,
                p95: sum.queryLatency.p95 / count,
                p99: sum.queryLatency.p99 / count
            },
            memoryUsage: {
                heap: sum.memoryUsage.heap / count,
                external: sum.memoryUsage.external / count,
                rss: sum.memoryUsage.rss / count
            },
            gcMetrics: []
        };
    }
    calculateTrend(oldValue, newValue) {
        const change = (newValue - oldValue) / oldValue;
        if (Math.abs(change) < 0.05) {
            return 'stable';
        }
        return change < 0 ? 'improving' : 'degrading';
    }
    stop() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        if (this.gcObserver) {
            try {
                this.gcObserver.disconnect();
            }
            catch (error) {
                logger_1.logger.warn('Error disconnecting GC observer:', error);
            }
            this.gcObserver = null;
        }
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
//# sourceMappingURL=performance-monitor.js.map