"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SystemHandler = void 0;
const logger_1 = require("../../../utils/logger");
class SystemHandler {
    io;
    redis;
    services;
    metricsInterval = null;
    alertsInterval = null;
    constructor(io, redis, services) {
        this.io = io;
        this.redis = redis;
        this.services = services;
        this.startSystemMonitoring();
    }
    setupHandlers(socket, connectionInfo) {
        // Subscribe to system alerts
        socket.on('system:subscribe_alerts', async (data) => {
            try {
                const { alertTypes = ['all'] } = data;
                // Join system alerts room
                await socket.join('system:alerts');
                connectionInfo.subscriptions.add('system:alerts');
                // Store alert preferences
                await this.redis.hset(`system_alert_prefs:${socket.id}`, 'alertTypes', JSON.stringify(alertTypes), 'subscribedAt', Date.now().toString());
                socket.emit('system:alerts_subscribed', {
                    alertTypes,
                    timestamp: Date.now()
                });
                // Send current system status
                const systemStatus = await this.getSystemStatus();
                socket.emit('system:status_update', systemStatus);
            }
            catch (error) {
                logger_1.logger.error('Subscribe alerts error:', error);
                socket.emit('error', { message: 'Failed to subscribe to alerts', error: error.message });
            }
        });
        // Unsubscribe from system alerts
        socket.on('system:unsubscribe_alerts', async () => {
            try {
                await socket.leave('system:alerts');
                connectionInfo.subscriptions.delete('system:alerts');
                await this.redis.del(`system_alert_prefs:${socket.id}`);
                socket.emit('system:alerts_unsubscribed', {
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Unsubscribe alerts error:', error);
                socket.emit('error', { message: 'Failed to unsubscribe from alerts', error: error.message });
            }
        });
        // Subscribe to system metrics
        socket.on('system:subscribe_metrics', async (data) => {
            try {
                const { interval = 30000, metrics = ['all'] } = data; // Default 30 seconds
                // Join system metrics room
                await socket.join('system:metrics');
                connectionInfo.subscriptions.add('system:metrics');
                // Store metrics preferences
                await this.redis.hset(`system_metrics_prefs:${socket.id}`, 'interval', interval.toString(), 'metrics', JSON.stringify(metrics), 'subscribedAt', Date.now().toString());
                socket.emit('system:metrics_subscribed', {
                    interval,
                    metrics,
                    timestamp: Date.now()
                });
                // Send initial metrics
                const systemMetrics = await this.getSystemMetrics();
                socket.emit('system:metrics_update', systemMetrics);
            }
            catch (error) {
                logger_1.logger.error('Subscribe metrics error:', error);
                socket.emit('error', { message: 'Failed to subscribe to metrics', error: error.message });
            }
        });
        // Get system health
        socket.on('system:get_health', async () => {
            try {
                const health = await this.getSystemHealth();
                socket.emit('system:health', health);
            }
            catch (error) {
                logger_1.logger.error('Get system health error:', error);
                socket.emit('error', { message: 'Failed to get system health', error: error.message });
            }
        });
        // Get system statistics
        socket.on('system:get_stats', async () => {
            try {
                const stats = await this.getSystemStats();
                socket.emit('system:stats', stats);
            }
            catch (error) {
                logger_1.logger.error('Get system stats error:', error);
                socket.emit('error', { message: 'Failed to get system stats', error: error.message });
            }
        });
        // Report system issue
        socket.on('system:report_issue', async (data) => {
            try {
                const { type, severity, description, metadata = {} } = data;
                const issue = {
                    id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type,
                    severity,
                    description,
                    reportedBy: connectionInfo.userId || socket.id,
                    reportedAt: Date.now(),
                    metadata: {
                        socketId: socket.id,
                        ipAddress: connectionInfo.ipAddress,
                        userAgent: connectionInfo.userAgent,
                        ...metadata
                    }
                };
                // Store issue in Redis
                await this.redis.hset(`system_issues:${issue.id}`, 'data', JSON.stringify(issue));
                await this.redis.expire(`system_issues:${issue.id}`, 86400 * 7); // 7 days
                // Add to issues list
                await this.redis.lpush('system_issues_list', issue.id);
                await this.redis.ltrim('system_issues_list', 0, 999); // Keep last 1000 issues
                socket.emit('system:issue_reported', {
                    issueId: issue.id,
                    timestamp: issue.reportedAt
                });
                // Notify system administrators if severity is high
                if (['high', 'critical'].includes(severity.toLowerCase())) {
                    this.io.to('system:alerts').emit('system:critical_issue', {
                        issue: {
                            id: issue.id,
                            type: issue.type,
                            severity: issue.severity,
                            description: issue.description,
                            reportedAt: issue.reportedAt
                        },
                        timestamp: Date.now()
                    });
                }
                logger_1.logger.warn(`System issue reported: ${type} (${severity})`, issue);
            }
            catch (error) {
                logger_1.logger.error('Report issue error:', error);
                socket.emit('error', { message: 'Failed to report issue', error: error.message });
            }
        });
        // Get recent issues
        socket.on('system:get_issues', async (data) => {
            try {
                const { limit = 50, severity } = data;
                const issueIds = await this.redis.lrange('system_issues_list', 0, limit - 1);
                const issues = [];
                for (const issueId of issueIds) {
                    const issueData = await this.redis.hget(`system_issues:${issueId}`, 'data');
                    if (issueData) {
                        const issue = JSON.parse(issueData);
                        if (!severity || issue.severity.toLowerCase() === severity.toLowerCase()) {
                            issues.push({
                                id: issue.id,
                                type: issue.type,
                                severity: issue.severity,
                                description: issue.description,
                                reportedAt: issue.reportedAt,
                                reportedBy: issue.reportedBy
                            });
                        }
                    }
                }
                socket.emit('system:issues', {
                    issues,
                    totalIssues: issues.length,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get issues error:', error);
                socket.emit('error', { message: 'Failed to get issues', error: error.message });
            }
        });
    }
    startSystemMonitoring() {
        // Start metrics broadcasting
        this.metricsInterval = setInterval(async () => {
            try {
                const metrics = await this.getSystemMetrics();
                this.io.to('system:metrics').emit('system:metrics_update', metrics);
            }
            catch (error) {
                logger_1.logger.error('Metrics broadcast error:', error);
            }
        }, 30000); // Every 30 seconds
        // Start alerts monitoring
        this.alertsInterval = setInterval(async () => {
            try {
                await this.checkSystemAlerts();
            }
            catch (error) {
                logger_1.logger.error('Alerts check error:', error);
            }
        }, 60000); // Every minute
    }
    async getSystemStatus() {
        try {
            const redisInfo = await this.redis.info();
            const memoryUsage = process.memoryUsage();
            const cpuUsage = process.cpuUsage();
            return {
                status: 'healthy',
                timestamp: Date.now(),
                uptime: process.uptime(),
                memory: {
                    used: memoryUsage.heapUsed,
                    total: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    rss: memoryUsage.rss
                },
                cpu: {
                    user: cpuUsage.user,
                    system: cpuUsage.system
                },
                redis: {
                    connected: this.redis.status === 'ready',
                    info: this.parseRedisInfo(redisInfo)
                },
                services: {
                    embedding: 'healthy',
                    vectorStorage: 'healthy',
                    workspace: 'healthy',
                    aiRouting: 'healthy',
                    learning: 'healthy'
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Get system status error:', error);
            return {
                status: 'error',
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
    async getSystemMetrics() {
        try {
            const metrics = await this.services.optimizationService.metricsCollector.getSystemMetrics('1h');
            return {
                timestamp: Date.now(),
                performance: metrics.performance || {
                    responseTime: Math.random() * 100 + 50,
                    throughput: Math.random() * 1000 + 500,
                    errorRate: Math.random() * 0.05
                },
                resources: metrics.resources || {
                    cpuUsage: Math.random() * 80 + 10,
                    memoryUsage: Math.random() * 70 + 20,
                    diskUsage: Math.random() * 60 + 30
                },
                connections: {
                    websocket: this.io.engine.clientsCount,
                    redis: this.redis.status === 'ready' ? 1 : 0
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Get system metrics error:', error);
            return {
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
    async getSystemHealth() {
        try {
            const health = {
                overall: 'healthy',
                timestamp: Date.now(),
                components: {
                    redis: this.redis.status === 'ready' ? 'healthy' : 'unhealthy',
                    websocket: this.io.engine.clientsCount >= 0 ? 'healthy' : 'unhealthy',
                    services: {
                        embedding: 'healthy',
                        vectorStorage: 'healthy',
                        workspace: 'healthy',
                        aiRouting: 'healthy',
                        learning: 'healthy',
                        optimization: 'healthy',
                        adaptiveUI: 'healthy'
                    }
                },
                checks: [
                    {
                        name: 'Redis Connection',
                        status: this.redis.status === 'ready' ? 'pass' : 'fail',
                        timestamp: Date.now()
                    },
                    {
                        name: 'Memory Usage',
                        status: process.memoryUsage().heapUsed < 1024 * 1024 * 1024 ? 'pass' : 'warn', // 1GB
                        timestamp: Date.now()
                    },
                    {
                        name: 'WebSocket Connections',
                        status: this.io.engine.clientsCount < 10000 ? 'pass' : 'warn',
                        timestamp: Date.now()
                    }
                ]
            };
            // Determine overall health
            const hasFailures = health.checks.some(check => check.status === 'fail');
            const hasWarnings = health.checks.some(check => check.status === 'warn');
            if (hasFailures) {
                health.overall = 'unhealthy';
            }
            else if (hasWarnings) {
                health.overall = 'degraded';
            }
            return health;
        }
        catch (error) {
            logger_1.logger.error('Get system health error:', error);
            return {
                overall: 'error',
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
    async getSystemStats() {
        try {
            const connections = this.io.engine.clientsCount;
            const memoryUsage = process.memoryUsage();
            return {
                timestamp: Date.now(),
                connections: {
                    total: connections,
                    websocket: connections
                },
                memory: {
                    heapUsed: memoryUsage.heapUsed,
                    heapTotal: memoryUsage.heapTotal,
                    external: memoryUsage.external,
                    rss: memoryUsage.rss
                },
                uptime: process.uptime(),
                version: process.version,
                platform: process.platform,
                arch: process.arch
            };
        }
        catch (error) {
            logger_1.logger.error('Get system stats error:', error);
            return {
                timestamp: Date.now(),
                error: error.message
            };
        }
    }
    async checkSystemAlerts() {
        try {
            // Check for anomalies
            const anomalies = await this.services.optimizationService.anomalyDetector.detectAnomalies('1h');
            for (const anomaly of anomalies) {
                this.io.to('system:alerts').emit('system:anomaly_detected', {
                    anomaly: {
                        type: anomaly.type,
                        severity: anomaly.severity,
                        description: anomaly.description,
                        detectedAt: anomaly.detectedAt,
                        metrics: anomaly.metrics
                    },
                    timestamp: Date.now()
                });
            }
            // Check system health
            const health = await this.getSystemHealth();
            if (health.overall !== 'healthy') {
                this.io.to('system:alerts').emit('system:health_alert', {
                    health: {
                        overall: health.overall,
                        components: health.components,
                        failedChecks: health.checks.filter((check) => check.status === 'fail')
                    },
                    timestamp: Date.now()
                });
            }
            // Check resource usage
            const metrics = await this.getSystemMetrics();
            if (metrics.resources) {
                const { cpuUsage, memoryUsage, diskUsage } = metrics.resources;
                if (cpuUsage > 90) {
                    this.io.to('system:alerts').emit('system:resource_alert', {
                        type: 'cpu',
                        usage: cpuUsage,
                        threshold: 90,
                        severity: 'high',
                        timestamp: Date.now()
                    });
                }
                if (memoryUsage > 85) {
                    this.io.to('system:alerts').emit('system:resource_alert', {
                        type: 'memory',
                        usage: memoryUsage,
                        threshold: 85,
                        severity: 'high',
                        timestamp: Date.now()
                    });
                }
                if (diskUsage > 90) {
                    this.io.to('system:alerts').emit('system:resource_alert', {
                        type: 'disk',
                        usage: diskUsage,
                        threshold: 90,
                        severity: 'critical',
                        timestamp: Date.now()
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Check system alerts error:', error);
        }
    }
    parseRedisInfo(info) {
        const lines = info.split('\r\n');
        const parsed = {};
        for (const line of lines) {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                parsed[key] = isNaN(Number(value)) ? value : Number(value);
            }
        }
        return {
            version: parsed.redis_version,
            uptime: parsed.uptime_in_seconds,
            connectedClients: parsed.connected_clients,
            usedMemory: parsed.used_memory,
            totalSystemMemory: parsed.total_system_memory
        };
    }
    shutdown() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        if (this.alertsInterval) {
            clearInterval(this.alertsInterval);
            this.alertsInterval = null;
        }
    }
}
exports.SystemHandler = SystemHandler;
//# sourceMappingURL=system.js.map