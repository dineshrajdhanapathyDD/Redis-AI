import request from 'supertest';
import express from 'express';
import { Redis } from 'ioredis';
import { MonitoringService } from '../../../src/services/monitoring';
import { createMonitoringRoutes } from '../../../src/api/rest/routes/monitoring';
import {
  SystemMetrics,
  PerformanceMetrics,
  AIModelMetrics,
  Alert,
  AlertRule,
} from '../../../src/services/monitoring/types';

// Mock Redis and MonitoringService
jest.mock('ioredis');
jest.mock('../../../src/services/monitoring');

const MockedRedis = Redis as jest.MockedClass<typeof Redis>;
const MockedMonitoringService = MonitoringService as jest.MockedClass<typeof MonitoringService>;

describe('Monitoring REST API', () => {
  let app: express.Application;
  let redis: jest.Mocked<Redis>;
  let monitoring: jest.Mocked<MonitoringService>;

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    monitoring = new MockedMonitoringService(redis, {} as any) as jest.Mocked<MonitoringService>;

    app = express();
    app.use(express.json());
    app.use('/api/monitoring', createMonitoringRoutes(redis, monitoring));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Health Endpoints', () => {
    describe('GET /health', () => {
      it('should return health status', async () => {
        const mockHealthStatus = [
          {
            service: 'redis',
            status: 'healthy' as const,
            lastCheck: Date.now(),
            responseTime: 10,
            details: { checks: [], dependencies: [] },
            uptime: 3600,
            version: '6.2.0',
          },
        ];

        monitoring.getHealthStatus.mockResolvedValue(mockHealthStatus);

        const response = await request(app)
          .get('/api/monitoring/health')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockHealthStatus);
        expect(monitoring.getHealthStatus).toHaveBeenCalledWith(undefined);
      });

      it('should return health status for specific service', async () => {
        const mockHealthStatus = {
          service: 'redis',
          status: 'healthy' as const,
          lastCheck: Date.now(),
          responseTime: 10,
          details: { checks: [], dependencies: [] },
          uptime: 3600,
          version: '6.2.0',
        };

        monitoring.getHealthStatus.mockResolvedValue(mockHealthStatus);

        const response = await request(app)
          .get('/api/monitoring/health?service=redis')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockHealthStatus);
        expect(monitoring.getHealthStatus).toHaveBeenCalledWith('redis');
      });

      it('should handle errors', async () => {
        monitoring.getHealthStatus.mockRejectedValue(new Error('Health check failed'));

        const response = await request(app)
          .get('/api/monitoring/health')
          .expect(500);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Failed to get health status');
      });
    });

    describe('POST /health/check', () => {
      it('should perform health check for all services', async () => {
        monitoring.performHealthCheck.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/monitoring/health/check')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Health checks initiated');
        expect(monitoring.performHealthCheck).toHaveBeenCalledWith();
      });

      it('should perform health check for specific service', async () => {
        const mockHealthStatus = {
          service: 'redis',
          status: 'healthy' as const,
          lastCheck: Date.now(),
          responseTime: 10,
          details: { checks: [], dependencies: [] },
          uptime: 3600,
          version: '6.2.0',
        };

        monitoring.performHealthCheck.mockResolvedValue(mockHealthStatus);

        const response = await request(app)
          .post('/api/monitoring/health/check')
          .send({ service: 'redis' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockHealthStatus);
        expect(monitoring.performHealthCheck).toHaveBeenCalledWith('redis');
      });
    });
  });

  describe('System Overview', () => {
    describe('GET /overview', () => {
      it('should return system overview', async () => {
        const mockOverview = {
          timestamp: Date.now(),
          uptime: 3600,
          version: '1.0.0',
          environment: 'test',
          health: {
            overall: 'healthy' as const,
            services: 5,
            healthyServices: 5,
            unhealthyServices: 0,
          },
          alerts: {
            total: 2,
            critical: 0,
            high: 1,
            medium: 1,
            low: 0,
          },
          performance: {
            avgResponseTime: 150,
            requestsPerSecond: 100,
            errorRate: 1.5,
            cpuUsage: 45,
            memoryUsage: 60,
          },
        };

        monitoring.getSystemOverview.mockResolvedValue(mockOverview);

        const response = await request(app)
          .get('/api/monitoring/overview')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockOverview);
      });
    });
  });

  describe('Metrics Endpoints', () => {
    describe('GET /metrics/summary', () => {
      it('should return metrics summary', async () => {
        const mockSummary = {
          timeRange: { start: 1000, end: 2000 },
          metrics: {
            system: { cpu: 45, memory: 60, redis: { hitRate: 95 } },
            performance: { avgResponseTime: 150, requestsPerSecond: 100 },
            aiModel: { totalRequests: 50, avgLatency: 1200 },
          },
        };

        monitoring.getMetricsSummary.mockResolvedValue(mockSummary);

        const response = await request(app)
          .get('/api/monitoring/metrics/summary?start=1000&end=2000')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSummary);
        expect(monitoring.getMetricsSummary).toHaveBeenCalledWith({ start: 1000, end: 2000 });
      });

      it('should return 400 for missing parameters', async () => {
        const response = await request(app)
          .get('/api/monitoring/metrics/summary')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Missing required parameters');
      });
    });

    describe('POST /metrics/system', () => {
      it('should record system metrics', async () => {
        const systemMetrics = {
          cpu: { usage: 45, loadAverage: [1, 1, 1], cores: 4 },
          memory: { used: 1000000, total: 2000000, free: 1000000, percentage: 50 },
          redis: { connected: true, memory: 100000, operations: 100, connections: 10, hitRate: 95, keyCount: 1000 },
          network: { bytesIn: 1000, bytesOut: 1000, packetsIn: 10, packetsOut: 10 },
          application: { uptime: 3600, version: '1.0.0', environment: 'test', activeConnections: 5, requestsPerSecond: 100, errorRate: 1 },
        };

        monitoring.recordSystemMetrics.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/monitoring/metrics/system')
          .send(systemMetrics)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('System metrics recorded');
        expect(monitoring.recordSystemMetrics).toHaveBeenCalledWith({
          ...systemMetrics,
          timestamp: expect.any(Number),
        });
      });
    });

    describe('POST /metrics/performance', () => {
      it('should record performance metrics', async () => {
        const performanceMetric = {
          endpoint: '/api/test',
          method: 'GET',
          responseTime: 100,
          statusCode: 200,
          requestSize: 1024,
          responseSize: 2048,
          userId: 'user123',
        };

        monitoring.recordPerformanceMetric.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/monitoring/metrics/performance')
          .send(performanceMetric)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Performance metric recorded');
        expect(monitoring.recordPerformanceMetric).toHaveBeenCalledWith({
          ...performanceMetric,
          timestamp: expect.any(Number),
          ip: expect.any(String),
          userAgent: undefined,
        });
      });
    });

    describe('POST /metrics/ai-model', () => {
      it('should record AI model metrics', async () => {
        const aiModelMetric = {
          modelId: 'gpt-4',
          provider: 'openai',
          requestCount: 10,
          averageLatency: 1000,
          p95Latency: 1500,
          p99Latency: 2000,
          errorRate: 1,
          tokensProcessed: 5000,
          cost: 10.50,
          accuracy: 95,
          throughput: 50,
        };

        monitoring.recordAIModelMetric.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/monitoring/metrics/ai-model')
          .send(aiModelMetric)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('AI model metric recorded');
        expect(monitoring.recordAIModelMetric).toHaveBeenCalledWith({
          ...aiModelMetric,
          timestamp: expect.any(Number),
        });
      });
    });
  });

  describe('Alert Management', () => {
    describe('GET /alerts', () => {
      it('should return active alerts', async () => {
        const mockAlerts: Alert[] = [
          {
            id: 'alert1',
            type: 'metric',
            severity: 'high',
            title: 'High CPU Usage',
            description: 'CPU usage is above 80%',
            source: 'system',
            timestamp: Date.now(),
            resolved: false,
            metadata: {},
          },
        ];

        monitoring.getActiveAlerts.mockResolvedValue(mockAlerts);

        const response = await request(app)
          .get('/api/monitoring/alerts')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockAlerts);
        expect(response.body.count).toBe(1);
      });
    });

    describe('POST /alerts', () => {
      it('should create alert', async () => {
        const alertData = {
          type: 'metric' as const,
          severity: 'high' as const,
          title: 'Test Alert',
          description: 'This is a test alert',
          resolved: false,
          metadata: {},
        };

        const mockAlert: Alert = {
          ...alertData,
          id: 'alert1',
          source: 'api',
          timestamp: Date.now(),
        };

        monitoring.createAlert.mockResolvedValue(mockAlert);

        const response = await request(app)
          .post('/api/monitoring/alerts')
          .send(alertData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockAlert);
        expect(monitoring.createAlert).toHaveBeenCalledWith({
          ...alertData,
          source: 'api',
        });
      });
    });

    describe('POST /alerts/:alertId/acknowledge', () => {
      it('should acknowledge alert', async () => {
        monitoring.acknowledgeAlert.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/monitoring/alerts/alert1/acknowledge')
          .send({ userId: 'user123' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Alert acknowledged successfully');
        expect(monitoring.acknowledgeAlert).toHaveBeenCalledWith('alert1', 'user123');
      });

      it('should return 404 for non-existent alert', async () => {
        monitoring.acknowledgeAlert.mockResolvedValue(false);

        const response = await request(app)
          .post('/api/monitoring/alerts/nonexistent/acknowledge')
          .send({ userId: 'user123' })
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Alert not found');
      });
    });

    describe('POST /alerts/:alertId/resolve', () => {
      it('should resolve alert', async () => {
        monitoring.resolveAlert.mockResolvedValue(true);

        const response = await request(app)
          .post('/api/monitoring/alerts/alert1/resolve')
          .send({ userId: 'user123' })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Alert resolved successfully');
        expect(monitoring.resolveAlert).toHaveBeenCalledWith('alert1', 'user123');
      });
    });
  });

  describe('Alert Rules Management', () => {
    describe('GET /alert-rules', () => {
      it('should return alert rules', async () => {
        const mockRules: AlertRule[] = [
          {
            id: 'rule1',
            name: 'High CPU Rule',
            description: 'Alert when CPU usage is high',
            enabled: true,
            conditions: [{
              metric: 'system',
              operator: 'gt',
              threshold: 80,
              duration: 300,
              aggregation: 'avg',
            }],
            actions: [{
              type: 'webhook',
              config: { url: 'http://example.com/webhook' },
              enabled: true,
            }],
            cooldown: 1800,
            severity: 'high',
            tags: ['system'],
          },
        ];

        monitoring.getAlertRules.mockResolvedValue(mockRules);

        const response = await request(app)
          .get('/api/monitoring/alert-rules')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockRules);
        expect(response.body.count).toBe(1);
      });
    });

    describe('POST /alert-rules', () => {
      it('should create alert rule', async () => {
        const alertRule: AlertRule = {
          id: 'rule1',
          name: 'Test Rule',
          description: 'Test alert rule',
          enabled: true,
          conditions: [{
            metric: 'system',
            operator: 'gt',
            threshold: 80,
            duration: 300,
            aggregation: 'avg',
          }],
          actions: [{
            type: 'webhook',
            config: { url: 'http://example.com/webhook' },
            enabled: true,
          }],
          cooldown: 1800,
          severity: 'high',
          tags: ['system'],
        };

        monitoring.addAlertRule.mockResolvedValue(undefined);

        const response = await request(app)
          .post('/api/monitoring/alert-rules')
          .send(alertRule)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Alert rule created successfully');
        expect(monitoring.addAlertRule).toHaveBeenCalledWith(alertRule);
      });
    });
  });

  describe('Distributed Tracing', () => {
    describe('GET /traces', () => {
      it('should return traces', async () => {
        const mockTraces = [
          {
            traceId: 'trace1',
            spans: [],
            startTime: Date.now(),
            endTime: Date.now(),
            duration: 100,
            services: ['api'],
            operationName: 'test_operation',
            status: 'ok',
            tags: {},
          },
        ];

        monitoring.getTraces.mockResolvedValue(mockTraces);

        const response = await request(app)
          .get('/api/monitoring/traces?limit=10&offset=0')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockTraces);
        expect(monitoring.getTraces).toHaveBeenCalledWith({
          limit: 10,
          offset: 0,
          service: undefined,
          operation: undefined,
        });
      });
    });

    describe('GET /traces/:traceId', () => {
      it('should return specific trace', async () => {
        const mockTrace = {
          traceId: 'trace1',
          spans: [],
          startTime: Date.now(),
          endTime: Date.now(),
          duration: 100,
          services: ['api'],
          operationName: 'test_operation',
          status: 'ok',
          tags: {},
        };

        monitoring.getTrace.mockResolvedValue(mockTrace);

        const response = await request(app)
          .get('/api/monitoring/traces/trace1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockTrace);
        expect(monitoring.getTrace).toHaveBeenCalledWith('trace1');
      });

      it('should return 404 for non-existent trace', async () => {
        monitoring.getTrace.mockResolvedValue(null);

        const response = await request(app)
          .get('/api/monitoring/traces/nonexistent')
          .expect(404);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Trace not found');
      });
    });
  });

  describe('Dashboard Data', () => {
    describe('GET /dashboard', () => {
      it('should return dashboard data', async () => {
        const mockDashboardData = {
          overview: { uptime: 3600, version: '1.0.0' },
          metrics: { cpu: 45, memory: 60 },
          alerts: { total: 2, critical: 0 },
        };

        monitoring.getDashboardData.mockResolvedValue(mockDashboardData);

        const response = await request(app)
          .get('/api/monitoring/dashboard')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockDashboardData);
        expect(monitoring.getDashboardData).toHaveBeenCalledWith(undefined);
      });

      it('should return specific dashboard section', async () => {
        const mockSectionData = { cpu: 45, memory: 60 };

        monitoring.getDashboardData.mockResolvedValue(mockSectionData);

        const response = await request(app)
          .get('/api/monitoring/dashboard?section=metrics')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockSectionData);
        expect(monitoring.getDashboardData).toHaveBeenCalledWith('metrics');
      });
    });
  });

  describe('Configuration', () => {
    describe('GET /config', () => {
      it('should return monitoring configuration', async () => {
        const mockConfig = {
          metrics: { enabled: true, interval: 30 },
          health: { enabled: true, interval: 60 },
          alerts: { enabled: true, rules: [] },
          tracing: { enabled: true, sampleRate: 0.1 },
          dashboard: { enabled: true, refreshInterval: 30 },
        };

        monitoring.getConfig.mockReturnValue(mockConfig);

        const response = await request(app)
          .get('/api/monitoring/config')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toEqual(mockConfig);
      });
    });

    describe('PUT /config', () => {
      it('should update monitoring configuration', async () => {
        const configUpdates = {
          metrics: { enabled: false },
        };

        monitoring.updateConfig.mockResolvedValue(undefined);

        const response = await request(app)
          .put('/api/monitoring/config')
          .send(configUpdates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Configuration updated successfully');
        expect(monitoring.updateConfig).toHaveBeenCalledWith(configUpdates);
      });
    });
  });
});