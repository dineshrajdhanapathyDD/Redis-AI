"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
nimport;
{
    logger;
}
from;
'../../utils/logger';
nimport;
{
    n;
    MonitoringConfig, ;
    n;
    SystemMetrics, ;
    n;
    PerformanceMetrics, ;
    n;
    AIModelMetrics, ;
    n;
    VectorSearchMetrics, ;
    n;
    WorkspaceMetrics, ;
    n;
    Alert, ;
    n;
    HealthStatus, ;
    n;
    Trace, ;
    n;
    AlertRule, ;
    n;
}
from;
'./types';
nimport;
{
    MetricsCollector;
}
from;
'./metrics-collector';
nimport;
{
    HealthChecker;
}
from;
'./health-checker';
nimport;
{
    AlertManager;
}
from;
'./alert-manager';
nimport;
{
    TracingService;
}
from;
'./tracing-service';
nimport;
{
    DashboardService;
}
from;
'./dashboard-service';
n;
nexport;
class MonitoringService {
    n;
    redis;
    n;
    config;
    n;
    metricsCollector;
    n;
    healthChecker;
    n;
    alertManager;
    n;
    tracingService;
    n;
    dashboardService;
    n;
    isInitialized = false;
    n;
    n;
    constructor(redis, config) { n; this.redis = redis; n; this.config = this.mergeConfig(config); n; n; }
} // Initialize components\n    this.metricsCollector = new MetricsCollector(redis, this.config);\n    this.healthChecker = new HealthChecker(redis, this.config);\n    this.alertManager = new AlertManager(redis, this.config);\n    this.tracingService = new TracingService(redis, this.config);\n    this.dashboardService = new DashboardService(\n      redis,\n      this.config,\n      this.metricsCollector,\n      this.healthChecker,\n      this.alertManager,\n      this.tracingService\n    );\n  }\n\n  public async initialize(): Promise<void> {\n    if (this.isInitialized) {\n      return;\n    }\n\n    try {\n      // Initialize Redis TimeSeries module if not already done\n      await this.initializeRedisTimeSeries();\n      \n      // Load existing alert rules from Redis\n      await this.loadAlertRules();\n      \n      // Set up default alert rules if none exist\n      await this.setupDefaultAlertRules();\n      \n      // Perform initial health check\n      await this.healthChecker.performHealthChecks();\n      \n      this.isInitialized = true;\n      logger.info('Monitoring service initialized successfully');\n      \n    } catch (error) {\n      logger.error('Failed to initialize monitoring service:', error);\n      throw error;\n    }\n  }\n\n  private async initializeRedisTimeSeries(): Promise<void> {\n    try {\n      // Check if TimeSeries module is available\n      const info = await this.redis.call('MODULE', 'LIST');\n      const hasTimeSeries = Array.isArray(info) && \n        info.some((module: any) => \n          Array.isArray(module) && module.includes('timeseries')\n        );\n      \n      if (!hasTimeSeries) {\n        logger.warn('Redis TimeSeries module not available. Some features may be limited.');\n      } else {\n        logger.info('Redis TimeSeries module detected');\n      }\n      \n    } catch (error) {\n      logger.warn('Could not check Redis modules:', error);\n    }\n  }\n\n  private async loadAlertRules(): Promise<void> {\n    try {\n      const rules = await this.redis.hgetall('alert_rules');\n      \n      for (const [ruleId, ruleData] of Object.entries(rules)) {\n        try {\n          const rule = JSON.parse(ruleData);\n          this.config.alerts.rules.push(rule);\n        } catch (error) {\n          logger.error(`Failed to parse alert rule ${ruleId}:`, error);\n        }\n      }\n      \n      logger.info(`Loaded ${this.config.alerts.rules.length} alert rules`);\n      \n    } catch (error) {\n      logger.error('Failed to load alert rules:', error);\n    }\n  }\n\n  private async setupDefaultAlertRules(): Promise<void> {\n    if (this.config.alerts.rules.length > 0) {\n      return; // Rules already exist\n    }\n\n    const defaultRules: AlertRule[] = [\n      {\n        id: 'high_cpu_usage',\n        name: 'High CPU Usage',\n        description: 'CPU usage is above 80% for more than 5 minutes',\n        enabled: true,\n        conditions: [\n          {\n            metric: 'system',\n            operator: 'gt',\n            threshold: 80,\n            duration: 300, // 5 minutes\n            aggregation: 'avg',\n          },\n        ],\n        actions: [\n          {\n            type: 'webhook',\n            config: { url: process.env.ALERT_WEBHOOK_URL || '' },\n            enabled: !!process.env.ALERT_WEBHOOK_URL,\n          },\n        ],\n        cooldown: 1800, // 30 minutes\n        severity: 'high',\n        tags: ['system', 'performance'],\n      },\n      {\n        id: 'high_memory_usage',\n        name: 'High Memory Usage',\n        description: 'Memory usage is above 85% for more than 3 minutes',\n        enabled: true,\n        conditions: [\n          {\n            metric: 'system',\n            operator: 'gt',\n            threshold: 85,\n            duration: 180, // 3 minutes\n            aggregation: 'avg',\n          },\n        ],\n        actions: [\n          {\n            type: 'webhook',\n            config: { url: process.env.ALERT_WEBHOOK_URL || '' },\n            enabled: !!process.env.ALERT_WEBHOOK_URL,\n          },\n        ],\n        cooldown: 1800, // 30 minutes\n        severity: 'high',\n        tags: ['system', 'memory'],\n      },\n      {\n        id: 'high_error_rate',\n        name: 'High Error Rate',\n        description: 'Error rate is above 5% for more than 2 minutes',\n        enabled: true,\n        conditions: [\n          {\n            metric: 'performance',\n            operator: 'gt',\n            threshold: 5,\n            duration: 120, // 2 minutes\n            aggregation: 'avg',\n          },\n        ],\n        actions: [\n          {\n            type: 'webhook',\n            config: { url: process.env.ALERT_WEBHOOK_URL || '' },\n            enabled: !!process.env.ALERT_WEBHOOK_URL,\n          },\n        ],\n        cooldown: 900, // 15 minutes\n        severity: 'critical',\n        tags: ['performance', 'errors'],\n      },\n      {\n        id: 'slow_ai_model_response',\n        name: 'Slow AI Model Response',\n        description: 'AI model average latency is above 5 seconds',\n        enabled: true,\n        conditions: [\n          {\n            metric: 'ai_model',\n            operator: 'gt',\n            threshold: 5000,\n            duration: 300, // 5 minutes\n            aggregation: 'avg',\n          },\n        ],\n        actions: [\n          {\n            type: 'webhook',\n            config: { url: process.env.ALERT_WEBHOOK_URL || '' },\n            enabled: !!process.env.ALERT_WEBHOOK_URL,\n          },\n        ],\n        cooldown: 1800, // 30 minutes\n        severity: 'medium',\n        tags: ['ai', 'performance'],\n      },\n      {\n        id: 'redis_connection_failure',\n        name: 'Redis Connection Failure',\n        description: 'Redis connection is unavailable',\n        enabled: true,\n        conditions: [\n          {\n            metric: 'redis_health',\n            operator: 'eq',\n            threshold: 0, // 0 = unhealthy, 1 = healthy\n            duration: 60, // 1 minute\n          },\n        ],\n        actions: [\n          {\n            type: 'webhook',\n            config: { url: process.env.ALERT_WEBHOOK_URL || '' },\n            enabled: !!process.env.ALERT_WEBHOOK_URL,\n          },\n        ],\n        cooldown: 300, // 5 minutes\n        severity: 'critical',\n        tags: ['redis', 'infrastructure'],\n      },\n    ];\n\n    for (const rule of defaultRules) {\n      await this.alertManager.addAlertRule(rule);\n    }\n\n    logger.info(`Set up ${defaultRules.length} default alert rules`);\n  }\n\n  // Metrics Collection Methods\n  public async recordSystemMetrics(metrics: SystemMetrics): Promise<void> {\n    await this.metricsCollector.collectSystemMetrics();\n  }\n\n  public async recordPerformanceMetric(metric: PerformanceMetrics): Promise<void> {\n    await this.metricsCollector.recordPerformanceMetric(metric);\n  }\n\n  public async recordAIModelMetric(metric: AIModelMetrics): Promise<void> {\n    await this.metricsCollector.recordAIModelMetric(metric);\n  }\n\n  public async recordVectorSearchMetric(metric: VectorSearchMetrics): Promise<void> {\n    await this.metricsCollector.recordVectorSearchMetric(metric);\n  }\n\n  public async recordWorkspaceMetric(metric: WorkspaceMetrics): Promise<void> {\n    await this.metricsCollector.recordWorkspaceMetric(metric);\n  }\n\n  // Health Monitoring Methods\n  public async getHealthStatus(service?: string): Promise<HealthStatus | HealthStatus[] | null> {\n    return await this.healthChecker.getHealthStatus(service);\n  }\n\n  public async performHealthCheck(service?: string): Promise<HealthStatus | void> {\n    if (service) {\n      return await this.healthChecker.checkServiceHealth(service);\n    } else {\n      await this.healthChecker.performHealthChecks();\n    }\n  }\n\n  // Alert Management Methods\n  public async createAlert(alertData: Omit<Alert, 'id' | 'timestamp'>): Promise<Alert> {\n    return await this.alertManager.createAlert(alertData);\n  }\n\n  public async getActiveAlerts(): Promise<Alert[]> {\n    return await this.alertManager.getActiveAlerts();\n  }\n\n  public async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {\n    return await this.alertManager.acknowledgeAlert(alertId, acknowledgedBy);\n  }\n\n  public async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {\n    return await this.alertManager.resolveAlert(alertId, resolvedBy);\n  }\n\n  public async addAlertRule(rule: AlertRule): Promise<void> {\n    await this.alertManager.addAlertRule(rule);\n  }\n\n  // Tracing Methods\n  public startTrace(operationName: string, tags?: Record<string, any>): string {\n    return this.tracingService.startTrace(operationName, tags);\n  }\n\n  public startSpan(\n    traceId: string,\n    operationName: string,\n    parentSpanId?: string,\n    tags?: Record<string, any>\n  ): string {\n    return this.tracingService.startSpan(traceId, operationName, parentSpanId, tags);\n  }\n\n  public finishSpan(spanId: string, status?: 'ok' | 'error' | 'timeout', tags?: Record<string, any>): void {\n    this.tracingService.finishSpan(spanId, status, tags);\n  }\n\n  public finishTrace(traceId: string, status?: 'ok' | 'error' | 'timeout'): void {\n    this.tracingService.finishTrace(traceId, status);\n  }\n\n  public async getTrace(traceId: string): Promise<Trace | null> {\n    return await this.tracingService.getTrace(traceId);\n  }\n\n  public getTracingMiddleware() {\n    return this.tracingService.createMiddleware();\n  }\n\n  // Dashboard Methods\n  public async getDashboardData(section?: string): Promise<any> {\n    return await this.dashboardService.getDashboardData(section);\n  }\n\n  // Utility Methods\n  public async getSystemOverview(): Promise<any> {\n    const [healthStatus, activeAlerts, dashboardData] = await Promise.all([\n      this.getHealthStatus(),\n      this.getActiveAlerts(),\n      this.getDashboardData('system_overview'),\n    ]);\n\n    return {\n      timestamp: Date.now(),\n      health: healthStatus,\n      alerts: {\n        active: activeAlerts.length,\n        critical: activeAlerts.filter(a => a.severity === 'critical').length,\n        high: activeAlerts.filter(a => a.severity === 'high').length,\n      },\n      system: dashboardData,\n      uptime: process.uptime(),\n      version: process.env.npm_package_version || '1.0.0',\n    };\n  }\n\n  public async getMetricsSummary(timeRange: { start: number; end: number }): Promise<any> {\n    const metrics = ['system', 'performance', 'ai_model', 'vector_search', 'workspace'];\n    const summaries = {};\n\n    for (const metric of metrics) {\n      summaries[metric] = await this.metricsCollector.getMetricSummary(metric, timeRange);\n    }\n\n    return {\n      timeRange,\n      metrics: summaries,\n      timestamp: Date.now(),\n    };\n  }\n\n  // Express middleware for automatic performance monitoring\n  public createPerformanceMiddleware() {\n    return (req: any, res: any, next: any) => {\n      const startTime = Date.now();\n      const originalSend = res.send;\n      \n      res.send = function(data: any) {\n        const endTime = Date.now();\n        const responseTime = endTime - startTime;\n        \n        // Record performance metric\n        const metric: PerformanceMetrics = {\n          timestamp: endTime,\n          endpoint: req.path,\n          method: req.method,\n          responseTime,\n          statusCode: res.statusCode,\n          requestSize: parseInt(req.get('content-length') || '0'),\n          responseSize: Buffer.byteLength(data || ''),\n          userId: req.user?.id,\n          userAgent: req.get('user-agent'),\n          ip: req.ip,\n        };\n        \n        // Don't await to avoid blocking response\n        this.recordPerformanceMetric(metric).catch(error => {\n          logger.error('Failed to record performance metric:', error);\n        });\n        \n        return originalSend.call(this, data);\n      }.bind(this);\n      \n      next();\n    };\n  }\n\n  private mergeConfig(config?: Partial<MonitoringConfig>): MonitoringConfig {\n    const defaultConfig: MonitoringConfig = {\n      metrics: {\n        enabled: true,\n        interval: 60, // 1 minute\n        retention: 86400 * 7, // 7 days\n        aggregation: {\n          enabled: true,\n          intervals: [300, 3600, 86400], // 5min, 1hour, 1day\n        },\n      },\n      health: {\n        enabled: true,\n        interval: 30, // 30 seconds\n        timeout: 5, // 5 seconds\n        endpoints: [],\n      },\n      alerts: {\n        enabled: true,\n        rules: [],\n        channels: [],\n      },\n      tracing: {\n        enabled: true,\n        sampleRate: 0.1, // 10% sampling\n        maxSpans: 1000,\n        retention: 86400 * 3, // 3 days\n      },\n      dashboard: {\n        enabled: true,\n        refreshInterval: 30, // 30 seconds\n        charts: [],\n      },\n    };\n\n    return {\n      ...defaultConfig,\n      ...config,\n      metrics: { ...defaultConfig.metrics, ...config?.metrics },\n      health: { ...defaultConfig.health, ...config?.health },\n      alerts: { ...defaultConfig.alerts, ...config?.alerts },\n      tracing: { ...defaultConfig.tracing, ...config?.tracing },\n      dashboard: { ...defaultConfig.dashboard, ...config?.dashboard },\n    };\n  }\n\n  public getConfig(): MonitoringConfig {\n    return { ...this.config };\n  }\n\n  public async updateConfig(updates: Partial<MonitoringConfig>): Promise<void> {\n    this.config = this.mergeConfig(updates);\n    \n    // Store updated config in Redis\n    await this.redis.set('monitoring:config', JSON.stringify(this.config));\n    \n    logger.info('Monitoring configuration updated');\n  }\n\n  public async stop(): Promise<void> {\n    logger.info('Stopping monitoring service...');\n    \n    await Promise.all([\n      this.metricsCollector.stop(),\n      this.healthChecker.stop(),\n      this.alertManager.stop(),\n      this.tracingService.stop(),\n      this.dashboardService.stop(),\n    ]);\n    \n    this.isInitialized = false;\n    logger.info('Monitoring service stopped');\n  }\n}\n"
//# sourceMappingURL=monitoring-service.js.map