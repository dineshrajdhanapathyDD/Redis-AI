import { Redis } from 'ioredis';
import { MonitoringService } from '../../src/services/monitoring';
import {
  SystemMetrics,
  PerformanceMetrics,
  AIModelMetrics,
  Alert,
} from '../../src/services/monitoring/types';
import { logger } from '../../src/utils/logger';

// Integration test with real Redis (if available)
describe('Monitoring System Integration', () => {
  let redis: Redis;
  let monitoring: MonitoringService;
  let isRedisAvailable = false;

  beforeAll(async () => {
    try {
      redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      await redis.connect();
      await redis.ping();
      isRedisAvailable = true;
      logger.info('Redis connection established for integration tests');
    } catch (error) {
      logger.warn('Redis not available for integration tests, skipping');
      isRedisAvailable = false;
    }
  });

  afterAll(async () => {
    if (isRedisAvailable && redis) {
      await redis.quit();
    }
  });

  beforeEach(async () => {
    if (!isRedisAvailable) {
      return;
    }

    // Clean up test data
    const keys = await redis.keys('test:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }

    monitoring = new MonitoringService(redis, {
      metrics: {
        enabled: true,
        interval: 1, // 1 second for testing
        retention: 60, // 1 minute for testing
        aggregation: {
          enabled: true,
          intervals: [10, 30], // 10s, 30s for testing
        },
      },
      health: {
        enabled: true,
        interval: 5, // 5 seconds for testing
        timeout: 2, // 2 seconds timeout
        endpoints: [],
      },
      alerts: {
        enabled: true,
        rules: [],
        channels: [],
      },
      tracing: {
        enabled: true,
        sampleRate: 1.0, // 100% sampling for testing
        maxSpans: 50,
        retention: 300, // 5 minutes for testing
      },
      dashboard: {
        enabled: true,
        refreshInterval: 5, // 5 seconds for testing
        charts: [],
      },
    });

    await monitoring.initialize();
  });

  afterEach(async () => {
    if (isRedisAvailable && monitoring) {
      await monitoring.stop();
    }
  });

  describe('End-to-End Monitoring Flow', () => {
    it('should collect, store, and retrieve metrics', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Record system metrics
      const systemMetrics: SystemMetrics = {
        timestamp: Date.now(),
        cpu: { usage: 45.5, loadAverage: [1.2, 1.1, 1.0], cores: 4 },
        memory: { used: 4000000000, total: 8000000000, free: 4000000000, percentage: 50 },
        redis: { connected: true, memory: 100000000, operations: 150, connections: 25, hitRate: 92.5, keyCount: 5000 },
        network: { bytesIn: 1500000, bytesOut: 1200000, packetsIn: 15000, packetsOut: 12000 },
        application: { uptime: 7200, version: '1.0.0', environment: 'test', activeConnections: 15, requestsPerSecond: 250, errorRate: 1.5 },
      };

      await monitoring.recordSystemMetrics(systemMetrics);

      // Record performance metrics
      const performanceMetrics: PerformanceMetrics[] = [
        {
          timestamp: Date.now(),
          endpoint: '/api/search',
          method: 'POST',
          responseTime: 125,
          statusCode: 200,
          requestSize: 2048,
          responseSize: 8192,
          userId: 'user123',
          userAgent: 'test-client/1.0',
          ip: '192.168.1.100',
        },
        {
          timestamp: Date.now() + 1000,
          endpoint: '/api/workspace',
          method: 'GET',
          responseTime: 75,
          statusCode: 200,
          requestSize: 1024,
          responseSize: 4096,
          userId: 'user456',
          userAgent: 'test-client/1.0',
          ip: '192.168.1.101',
        },
      ];

      for (const metric of performanceMetrics) {
        await monitoring.recordPerformanceMetric(metric);
      }

      // Record AI model metrics
      const aiModelMetrics: AIModelMetrics[] = [
        {
          timestamp: Date.now(),
          modelId: 'gpt-4',
          provider: 'openai',
          requestCount: 25,
          averageLatency: 1250,
          p95Latency: 2000,
          p99Latency: 3500,
          errorRate: 2.0,
          tokensProcessed: 12500,
          cost: 25.75,
          accuracy: 94.5,
          throughput: 45,
        },
        {
          timestamp: Date.now(),
          modelId: 'claude-3',
          provider: 'anthropic',
          requestCount: 18,
          averageLatency: 950,
          p95Latency: 1500,
          p99Latency: 2200,
          errorRate: 1.5,
          tokensProcessed: 9000,
          cost: 18.50,
          accuracy: 96.2,
          throughput: 52,
        },
      ];

      for (const metric of aiModelMetrics) {
        await monitoring.recordAIModelMetric(metric);
      }

      // Wait a moment for data to be processed
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify data was stored
      const now = Date.now();
      const timeRange = { start: now - 60000, end: now };
      const metricsSummary = await monitoring.getMetricsSummary(timeRange);

      expect(metricsSummary).toBeDefined();
      expect(metricsSummary.metrics).toBeDefined();
    }, 10000);

    it('should perform health checks and detect issues', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Perform health checks
      await monitoring.performHealthCheck();

      // Get health status
      const healthStatus = await monitoring.getHealthStatus();
      expect(healthStatus).toBeDefined();

      if (Array.isArray(healthStatus)) {
        expect(healthStatus.length).toBeGreaterThan(0);
        
        // Check that Redis health is reported
        const redisHealth = healthStatus.find(h => h.service === 'redis');
        expect(redisHealth).toBeDefined();
        expect(redisHealth?.status).toBe('healthy');
      }
    }, 10000);

    it('should create and manage alerts', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Create a test alert
      const alertData = {
        type: 'metric' as const,
        severity: 'high' as const,
        title: 'Integration Test Alert',
        description: 'This is a test alert for integration testing',
        source: 'integration-test',
        resolved: false,
        metadata: {
          testId: 'integration-test-001',
          timestamp: Date.now(),
        },
      };

      const alert = await monitoring.createAlert(alertData);
      expect(alert).toBeDefined();
      expect(alert.id).toBeDefined();
      expect(alert.title).toBe(alertData.title);

      // Verify alert is in active alerts
      const activeAlerts = await monitoring.getActiveAlerts();
      expect(activeAlerts).toContain(alert);

      // Acknowledge the alert
      const acknowledged = await monitoring.acknowledgeAlert(alert.id, 'integration-test');
      expect(acknowledged).toBe(true);

      // Resolve the alert
      const resolved = await monitoring.resolveAlert(alert.id, 'integration-test');
      expect(resolved).toBe(true);

      // Verify alert is no longer active
      const activeAlertsAfterResolve = await monitoring.getActiveAlerts();
      expect(activeAlertsAfterResolve.find(a => a.id === alert.id)).toBeUndefined();
    }, 10000);

    it('should trace distributed operations', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Start a trace
      const traceId = monitoring.startTrace('integration_test_operation', {
        'test.type': 'integration',
        'test.id': 'trace-test-001',
      });

      expect(traceId).toBeDefined();
      expect(typeof traceId).toBe('string');

      // Create multiple spans
      const dbSpanId = monitoring.startSpan(traceId, 'database_operation', undefined, {
        'db.type': 'redis',
        'db.operation': 'get',
        'service': 'database',
      });

      // Simulate database operation
      await new Promise(resolve => setTimeout(resolve, 50));
      monitoring.finishSpan(dbSpanId, 'ok', { 'db.rows_affected': 1 });

      const aiSpanId = monitoring.startSpan(traceId, 'ai_model_call', undefined, {
        'ai.model': 'gpt-4',
        'ai.provider': 'openai',
        'service': 'ai-routing',
      });

      // Simulate AI model call
      await new Promise(resolve => setTimeout(resolve, 200));
      monitoring.finishSpan(aiSpanId, 'ok', { 'ai.tokens_used': 150 });

      const searchSpanId = monitoring.startSpan(traceId, 'vector_search', undefined, {
        'search.index': 'test_embeddings',
        'search.type': 'similarity',
        'service': 'search',
      });

      // Simulate vector search
      await new Promise(resolve => setTimeout(resolve, 30));
      monitoring.finishSpan(searchSpanId, 'ok', { 'search.results_count': 10 });

      // Finish the trace
      monitoring.finishTrace(traceId, 'ok');

      // Wait for trace to be stored
      await new Promise(resolve => setTimeout(resolve, 500));

      // Retrieve the trace
      const retrievedTrace = await monitoring.getTrace(traceId);
      expect(retrievedTrace).toBeDefined();
      expect(retrievedTrace?.traceId).toBe(traceId);
      expect(retrievedTrace?.spans).toHaveLength(3);
      expect(retrievedTrace?.status).toBe('ok');
      expect(retrievedTrace?.services).toContain('database');
      expect(retrievedTrace?.services).toContain('ai-routing');
      expect(retrievedTrace?.services).toContain('search');
    }, 10000);

    it('should generate comprehensive dashboard data', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Generate some sample data
      await monitoring.recordSystemMetrics({
        timestamp: Date.now(),
        cpu: { usage: 65, loadAverage: [1.5, 1.3, 1.2], cores: 8 },
        memory: { used: 6000000000, total: 16000000000, free: 10000000000, percentage: 37.5 },
        redis: { connected: true, memory: 200000000, operations: 300, connections: 50, hitRate: 88.5, keyCount: 15000 },
        network: { bytesIn: 2500000, bytesOut: 2000000, packetsIn: 25000, packetsOut: 20000 },
        application: { uptime: 14400, version: '1.0.0', environment: 'test', activeConnections: 35, requestsPerSecond: 450, errorRate: 2.1 },
      });

      // Wait for dashboard to refresh
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get system overview
      const systemOverview = await monitoring.getSystemOverview();
      expect(systemOverview).toBeDefined();
      expect(systemOverview.timestamp).toBeDefined();
      expect(systemOverview.uptime).toBeGreaterThan(0);
      expect(systemOverview.version).toBeDefined();
      expect(systemOverview.health).toBeDefined();
      expect(systemOverview.alerts).toBeDefined();

      // Get dashboard data
      const dashboardData = await monitoring.getDashboardData();
      expect(dashboardData).toBeDefined();
      expect(typeof dashboardData).toBe('object');

      // Get specific dashboard sections
      const systemData = await monitoring.getDashboardData('system_overview');
      expect(systemData).toBeDefined();
    }, 15000);

    it('should handle high-volume metrics collection', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      const startTime = Date.now();
      const metricsCount = 100;
      const promises: Promise<void>[] = [];

      // Generate high volume of performance metrics
      for (let i = 0; i < metricsCount; i++) {
        const metric: PerformanceMetrics = {
          timestamp: startTime + (i * 100), // Spread over 10 seconds
          endpoint: `/api/test/${i % 10}`,
          method: ['GET', 'POST', 'PUT', 'DELETE'][i % 4],
          responseTime: Math.random() * 500 + 50,
          statusCode: Math.random() > 0.1 ? 200 : (Math.random() > 0.5 ? 404 : 500),
          requestSize: Math.random() * 5000 + 1000,
          responseSize: Math.random() * 20000 + 2000,
          userId: `user${i % 50}`,
          userAgent: 'load-test-client/1.0',
          ip: `192.168.1.${(i % 254) + 1}`,
        };

        promises.push(monitoring.recordPerformanceMetric(metric));
      }

      // Wait for all metrics to be recorded
      await Promise.all(promises);

      // Verify system can handle the load
      const endTime = Date.now();
      const duration = endTime - startTime;
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds

      logger.info(`Recorded ${metricsCount} metrics in ${duration}ms`);
    }, 20000);
  });

  describe('Error Handling and Recovery', () => {
    it('should handle Redis connection failures gracefully', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Create monitoring service with invalid Redis config
      const invalidRedis = new Redis({
        host: 'invalid-host',
        port: 9999,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });

      const invalidMonitoring = new MonitoringService(invalidRedis, {
        metrics: { enabled: true, interval: 1, retention: 60, aggregation: { enabled: true, intervals: [60] } },
        health: { enabled: true, interval: 1, timeout: 1, endpoints: [] },
        alerts: { enabled: true, rules: [], channels: [] },
        tracing: { enabled: true, sampleRate: 1.0, maxSpans: 100, retention: 60 },
        dashboard: { enabled: true, refreshInterval: 1, charts: [] },
      });

      // Should not throw during initialization
      await expect(invalidMonitoring.initialize()).resolves.not.toThrow();

      // Should handle metric recording failures gracefully
      const metric: PerformanceMetrics = {
        timestamp: Date.now(),
        endpoint: '/api/test',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
      };

      await expect(invalidMonitoring.recordPerformanceMetric(metric)).resolves.not.toThrow();

      await invalidMonitoring.stop();
      await invalidRedis.quit().catch(() => {}); // Ignore connection errors
    }, 10000);

    it('should recover from temporary Redis outages', async () => {
      if (!isRedisAvailable) {
        pending('Redis not available');
        return;
      }

      // Record a metric before "outage"
      const beforeMetric: PerformanceMetrics = {
        timestamp: Date.now(),
        endpoint: '/api/before',
        method: 'GET',
        responseTime: 100,
        statusCode: 200,
        requestSize: 1024,
        responseSize: 2048,
      };

      await monitoring.recordPerformanceMetric(beforeMetric);

      // Simulate temporary Redis disconnection
      await redis.disconnect();

      // Try to record metric during "outage" - should not throw
      const duringMetric: PerformanceMetrics = {
        timestamp: Date.now(),
        endpoint: '/api/during',
        method: 'POST',
        responseTime: 150,
        statusCode: 200,
        requestSize: 2048,
        responseSize: 4096,
      };

      await expect(monitoring.recordPerformanceMetric(duringMetric)).resolves.not.toThrow();

      // Reconnect Redis
      await redis.connect();

      // Record metric after "recovery"
      const afterMetric: PerformanceMetrics = {
        timestamp: Date.now(),
        endpoint: '/api/after',
        method: 'PUT',
        responseTime: 75,
        statusCode: 200,
        requestSize: 1536,
        responseSize: 3072,
      };

      await monitoring.recordPerformanceMetric(afterMetric);

      // Verify system is working after recovery
      const healthStatus = await monitoring.getHealthStatus();
      expect(healthStatus).toBeDefined();
    }, 15000);
  });
});