import { Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { logger } from '../../../utils/logger';
import { MonitoringService } from '../../../services/monitoring';
import {
  SystemMetrics,
  PerformanceMetrics,
  Alert,
  HealthStatus,
} from '../../../services/monitoring/types';

export interface MonitoringHandlers {
  subscribeToMetrics: (socket: Socket, data: { types?: string[], interval?: number }) => void;
  subscribeToAlerts: (socket: Socket) => void;
  subscribeToHealth: (socket: Socket, data: { services?: string[] }) => void;
  subscribeToTraces: (socket: Socket, data: { filters?: any }) => void;
  unsubscribeFromMetrics: (socket: Socket) => void;
  unsubscribeFromAlerts: (socket: Socket) => void;
  unsubscribeFromHealth: (socket: Socket) => void;
  unsubscribeFromTraces: (socket: Socket) => void;
  getDashboardData: (socket: Socket, data: { section?: string }) => void;
  acknowledgeAlert: (socket: Socket, data: { alertId: string, userId: string }) => void;
  resolveAlert: (socket: Socket, data: { alertId: string, userId: string }) => void;
}

export function createMonitoringHandlers(
  redis: Redis,
  monitoring: MonitoringService
): MonitoringHandlers {
  // Store active subscriptions
  const metricSubscriptions = new Map<string, { types: string[], interval: number, timer?: NodeJS.Timeout }>();
  const alertSubscriptions = new Set<string>();
  const healthSubscriptions = new Map<string, { services: string[], timer?: NodeJS.Timeout }>();
  const traceSubscriptions = new Map<string, { filters: any, timer?: NodeJS.Timeout }>();

  // Real-time metrics streaming
  const subscribeToMetrics = (socket: Socket, data: { types?: string[], interval?: number }) => {
    const { types = ['system', 'performance', 'ai-model'], interval = 5000 } = data;
    
    logger.info(`Socket ${socket.id} subscribing to metrics:`, { types, interval });

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
        
        const metricsData: any = {};

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
      } catch (error) {
        logger.error('Error streaming metrics:', error);
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
  const subscribeToAlerts = (socket: Socket) => {
    logger.info(`Socket ${socket.id} subscribing to alerts`);

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
        logger.error('Error getting initial alerts:', error);
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
  const subscribeToHealth = (socket: Socket, data: { services?: string[] }) => {
    const { services = [] } = data;
    
    logger.info(`Socket ${socket.id} subscribing to health updates:`, { services });

    // Clean up existing subscription
    const existingSubscription = healthSubscriptions.get(socket.id);
    if (existingSubscription?.timer) {
      clearInterval(existingSubscription.timer);
    }

    // Set up new subscription
    const timer = setInterval(async () => {
      try {
        const healthData: any = {};

        if (services.length === 0) {
          // Get all health statuses
          const allHealth = await monitoring.getHealthStatus();
          healthData.all = allHealth;
        } else {
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
      } catch (error) {
        logger.error('Error streaming health data:', error);
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
  const subscribeToTraces = (socket: Socket, data: { filters?: any }) => {
    const { filters = {} } = data;
    
    logger.info(`Socket ${socket.id} subscribing to traces:`, { filters });

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
      } catch (error) {
        logger.error('Error streaming traces:', error);
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
  const unsubscribeFromMetrics = (socket: Socket) => {
    const subscription = metricSubscriptions.get(socket.id);
    if (subscription?.timer) {
      clearInterval(subscription.timer);
    }
    metricSubscriptions.delete(socket.id);
    
    socket.emit('metrics:unsubscribed', {
      message: 'Successfully unsubscribed from metrics updates',
    });
  };

  const unsubscribeFromAlerts = (socket: Socket) => {
    alertSubscriptions.delete(socket.id);
    
    socket.emit('alerts:unsubscribed', {
      message: 'Successfully unsubscribed from alert updates',
    });
  };

  const unsubscribeFromHealth = (socket: Socket) => {
    const subscription = healthSubscriptions.get(socket.id);
    if (subscription?.timer) {
      clearInterval(subscription.timer);
    }
    healthSubscriptions.delete(socket.id);
    
    socket.emit('health:unsubscribed', {
      message: 'Successfully unsubscribed from health updates',
    });
  };

  const unsubscribeFromTraces = (socket: Socket) => {
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
  const getDashboardData = async (socket: Socket, data: { section?: string }) => {
    try {
      const { section } = data;
      
      const dashboardData = await monitoring.getDashboardData(section);
      
      socket.emit('dashboard:data', {
        section,
        data: dashboardData,
        timestamp: Date.now(),
      });
    } catch (error) {
      logger.error('Error getting dashboard data:', error);
      socket.emit('dashboard:error', {
        error: 'Failed to fetch dashboard data',
        message: error.message,
      });
    }
  };

  // Alert management handlers
  const acknowledgeAlert = async (socket: Socket, data: { alertId: string, userId: string }) => {
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
      } else {
        socket.emit('alert:error', {
          error: 'Alert not found',
          alertId,
        });
      }
    } catch (error) {
      logger.error('Error acknowledging alert:', error);
      socket.emit('alert:error', {
        error: 'Failed to acknowledge alert',
        message: error.message,
      });
    }
  };

  const resolveAlert = async (socket: Socket, data: { alertId: string, userId: string }) => {
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
      } else {
        socket.emit('alert:error', {
          error: 'Alert not found',
          alertId,
        });
      }
    } catch (error) {
      logger.error('Error resolving alert:', error);
      socket.emit('alert:error', {
        error: 'Failed to resolve alert',
        message: error.message,
      });
    }
  };

  // Broadcast new alerts to all subscribers
  const broadcastNewAlert = (alert: Alert) => {
    alertSubscriptions.forEach(socketId => {
      // Note: In a real implementation, you'd need access to the Socket.IO server
      // to emit to specific socket IDs. This is a conceptual implementation.
      logger.info(`Broadcasting new alert to socket ${socketId}:`, alert);
    });
  };

  // Clean up subscriptions on disconnect
  const handleDisconnect = (socket: Socket) => {
    logger.info(`Cleaning up monitoring subscriptions for socket ${socket.id}`);
    
    unsubscribeFromMetrics(socket);
    unsubscribeFromAlerts(socket);
    unsubscribeFromHealth(socket);
    unsubscribeFromTraces(socket);
  };

  // Set up disconnect handler
  const setupSocket = (socket: Socket) => {
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