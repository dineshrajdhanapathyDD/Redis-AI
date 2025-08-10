"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMonitoringHandlers = createMonitoringHandlers;
const logger_1 = require("../../../utils/logger");
function createMonitoringHandlers(redis, monitoring) {
    // Store active subscriptions
    const metricSubscriptions = new Map();
    const alertSubscriptions = new Set();
    const healthSubscriptions = new Map();
    const traceSubscriptions = new Map();
    // Real-time metrics streaming
    const subscribeToMetrics = (socket, data) => {
        const { types = ['system', 'performance', 'ai-model'], interval = 5000 } = data;
        logger_1.logger.info(`Socket ${socket.id} subscribing to metrics:`, { types, interval });
        // Clean up existing subscription
        const existingSubscription = metricSubscriptions.get(socket.id);
        if (existingSubscription?.timer) {
            clearInterval(existingSubscription.timer);
        }
        // Set up new subscription
        const timer = setInterval(async () => {
            try {
                const now = Date.now();
                const timeRange = { start: now - interval, end: now };
                const metricsData = {};
                if (types.includes('system')) {
                    // Get latest system metrics
                    const systemMetrics = await monitoring.getLatestSystemMetrics();
                    if (systemMetrics) {
                        metricsData.system = systemMetrics;
                    }
                }
                if (types.includes('performance')) {
                    // Get performance metrics summary
                    const performanceMetrics = await monitoring.getPerformanceMetricsSummary(timeRange);
                    if (performanceMetrics) {
                        metricsData.performance = performanceMetrics;
                    }
                }
                if (types.includes('ai-model')) {
                    // Get AI model metrics summary
                    const aiModelMetrics = await monitoring.getAIModelMetricsSummary(timeRange);
                    if (aiModelMetrics) {
                        metricsData.aiModel = aiModelMetrics;
                    }
                }
                if (types.includes('vector-search')) {
                    // Get vector search metrics summary
                    const vectorSearchMetrics = await monitoring.getVectorSearchMetricsSummary(timeRange);
                    if (vectorSearchMetrics) {
                        metricsData.vectorSearch = vectorSearchMetrics;
                    }
                }
                if (types.includes('workspace')) {
                    // Get workspace metrics summary
                    const workspaceMetrics = await monitoring.getWorkspaceMetricsSummary(timeRange);
                    if (workspaceMetrics) {
                        metricsData.workspace = workspaceMetrics;
                    }
                }
                socket.emit('metrics:update', {
                    timestamp: now,
                    data: metricsData,
                });
            }
            catch (error) {
                logger_1.logger.error('Error streaming metrics:', error);
                socket.emit('metrics:error', {
                    error: 'Failed to fetch metrics',
                    message: error.message,
                });
            }
        }, interval);
        metricSubscriptions.set(socket.id, { types, interval, timer });
        socket.emit('metrics:subscribed', {
            types,
            interval,
            message: 'Successfully subscribed to metrics updates',
        });
    };
    // Real-time alert streaming
    const subscribeToAlerts = (socket) => {
        logger_1.logger.info(`Socket ${socket.id} subscribing to alerts`);
        alertSubscriptions.add(socket.id);
        // Send current active alerts
        monitoring.getActiveAlerts()
            .then(alerts => {
            socket.emit('alerts:initial', {
                alerts,
                count: alerts.length,
                timestamp: Date.now(),
            });
        })
            .catch(error => {
            logger_1.logger.error('Error getting initial alerts:', error);
            socket.emit('alerts:error', {
                error: 'Failed to fetch initial alerts',
                message: error.message,
            });
        });
        socket.emit('alerts:subscribed', {
            message: 'Successfully subscribed to alert updates',
        });
    };
    // Real-time health monitoring
    const subscribeToHealth = (socket, data) => {
        const { services = [] } = data;
        logger_1.logger.info(`Socket ${socket.id} subscribing to health updates:`, { services });
        // Clean up existing subscription
        const existingSubscription = healthSubscriptions.get(socket.id);
        if (existingSubscription?.timer) {
            clearInterval(existingSubscription.timer);
        }
        // Set up new subscription
        const timer = setInterval(async () => {
            try {
                const healthData = {};
                if (services.length === 0) {
                    // Get all health statuses
                    const allHealth = await monitoring.getHealthStatus();
                    healthData.all = allHealth;
                }
                else {
                    // Get specific service health statuses
                    for (const service of services) {
                        const serviceHealth = await monitoring.getHealthStatus(service);
                        healthData[service] = serviceHealth;
                    }
                }
                socket.emit('health:update', {
                    timestamp: Date.now(),
                    data: healthData,
                });
            }
            catch (error) {
                logger_1.logger.error('Error streaming health data:', error);
                socket.emit('health:error', {
                    error: 'Failed to fetch health data',
                    message: error.message,
                });
            }
        }, 10000); // Health checks every 10 seconds
        healthSubscriptions.set(socket.id, { services, timer });
        socket.emit('health:subscribed', {
            services,
            message: 'Successfully subscribed to health updates',
        });
    };
    // Real-time trace streaming
    const subscribeToTraces = (socket, data) => {
        const { filters = {} } = data;
        logger_1.logger.info(`Socket ${socket.id} subscribing to traces:`, { filters });
        // Clean up existing subscription
        const existingSubscription = traceSubscriptions.get(socket.id);
        if (existingSubscription?.timer) {
            clearInterval(existingSubscription.timer);
        }
        // Set up new subscription
        const timer = setInterval(async () => {
            try {
                const traces = await monitoring.getRecentTraces({
                    limit: 20,
                    ...filters,
                });
                socket.emit('traces:update', {
                    timestamp: Date.now(),
                    data: traces,
                    count: traces.length,
                });
            }
            catch (error) {
                logger_1.logger.error('Error streaming traces:', error);
                socket.emit('traces:error', {
                    error: 'Failed to fetch traces',
                    message: error.message,
                });
            }
        }, 5000); // Traces every 5 seconds
        traceSubscriptions.set(socket.id, { filters, timer });
        socket.emit('traces:subscribed', {
            filters,
            message: 'Successfully subscribed to trace updates',
        });
    };
    // Unsubscribe handlers
    const unsubscribeFromMetrics = (socket) => {
        const subscription = metricSubscriptions.get(socket.id);
        if (subscription?.timer) {
            clearInterval(subscription.timer);
        }
        metricSubscriptions.delete(socket.id);
        socket.emit('metrics:unsubscribed', {
            message: 'Successfully unsubscribed from metrics updates',
        });
    };
    const unsubscribeFromAlerts = (socket) => {
        alertSubscriptions.delete(socket.id);
        socket.emit('alerts:unsubscribed', {
            message: 'Successfully unsubscribed from alert updates',
        });
    };
    const unsubscribeFromHealth = (socket) => {
        const subscription = healthSubscriptions.get(socket.id);
        if (subscription?.timer) {
            clearInterval(subscription.timer);
        }
        healthSubscriptions.delete(socket.id);
        socket.emit('health:unsubscribed', {
            message: 'Successfully unsubscribed from health updates',
        });
    };
    const unsubscribeFromTraces = (socket) => {
        const subscription = traceSubscriptions.get(socket.id);
        if (subscription?.timer) {
            clearInterval(subscription.timer);
        }
        traceSubscriptions.delete(socket.id);
        socket.emit('traces:unsubscribed', {
            message: 'Successfully unsubscribed from trace updates',
        });
    };
    // Dashboard data handler
    const getDashboardData = async (socket, data) => {
        try {
            const { section } = data;
            const dashboardData = await monitoring.getDashboardData(section);
            socket.emit('dashboard:data', {
                section,
                data: dashboardData,
                timestamp: Date.now(),
            });
        }
        catch (error) {
            logger_1.logger.error('Error getting dashboard data:', error);
            socket.emit('dashboard:error', {
                error: 'Failed to fetch dashboard data',
                message: error.message,
            });
        }
    };
    // Alert management handlers
    const acknowledgeAlert = async (socket, data) => {
        try {
            const { alertId, userId } = data;
            const result = await monitoring.acknowledgeAlert(alertId, userId);
            if (result) {
                socket.emit('alert:acknowledged', {
                    alertId,
                    userId,
                    timestamp: Date.now(),
                    message: 'Alert acknowledged successfully',
                });
                // Broadcast to all alert subscribers
                alertSubscriptions.forEach(socketId => {
                    if (socketId !== socket.id) {
                        socket.to(socketId).emit('alert:acknowledged', {
                            alertId,
                            userId,
                            timestamp: Date.now(),
                        });
                    }
                });
            }
            else {
                socket.emit('alert:error', {
                    error: 'Alert not found',
                    alertId,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error acknowledging alert:', error);
            socket.emit('alert:error', {
                error: 'Failed to acknowledge alert',
                message: error.message,
            });
        }
    };
    const resolveAlert = async (socket, data) => {
        try {
            const { alertId, userId } = data;
            const result = await monitoring.resolveAlert(alertId, userId);
            if (result) {
                socket.emit('alert:resolved', {
                    alertId,
                    userId,
                    timestamp: Date.now(),
                    message: 'Alert resolved successfully',
                });
                // Broadcast to all alert subscribers
                alertSubscriptions.forEach(socketId => {
                    if (socketId !== socket.id) {
                        socket.to(socketId).emit('alert:resolved', {
                            alertId,
                            userId,
                            timestamp: Date.now(),
                        });
                    }
                });
            }
            else {
                socket.emit('alert:error', {
                    error: 'Alert not found',
                    alertId,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Error resolving alert:', error);
            socket.emit('alert:error', {
                error: 'Failed to resolve alert',
                message: error.message,
            });
        }
    };
    // Broadcast new alerts to all subscribers
    const broadcastNewAlert = (alert) => {
        alertSubscriptions.forEach(socketId => {
            // Note: In a real implementation, you'd need access to the Socket.IO server
            // to emit to specific socket IDs. This is a conceptual implementation.
            logger_1.logger.info(`Broadcasting new alert to socket ${socketId}:`, alert);
        });
    };
    // Clean up subscriptions on disconnect
    const handleDisconnect = (socket) => {
        logger_1.logger.info(`Cleaning up monitoring subscriptions for socket ${socket.id}`);
        unsubscribeFromMetrics(socket);
        unsubscribeFromAlerts(socket);
        unsubscribeFromHealth(socket);
        unsubscribeFromTraces(socket);
    };
    // Set up disconnect handler
    const setupSocket = (socket) => {
        socket.on('disconnect', () => handleDisconnect(socket));
    };
    return {
        subscribeToMetrics,
        subscribeToAlerts,
        subscribeToHealth,
        subscribeToTraces,
        unsubscribeFromMetrics,
        unsubscribeFromAlerts,
        unsubscribeFromHealth,
        unsubscribeFromTraces,
        getDashboardData,
        acknowledgeAlert,
        resolveAlert,
    };
}
//# sourceMappingURL=monitoring.js.map