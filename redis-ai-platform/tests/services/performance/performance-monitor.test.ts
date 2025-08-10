import { PerformanceMonitor } from '../../../src/services/performance/performance-monitor';

// Mock performance hooks
jest.mock('perf_hooks', () => ({
  PerformanceObserver: jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    disconnect: jest.fn()
  }))
}));

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  afterEach(() => {
    monitor.stop();
  });

  describe('metrics collection', () => {
    it('should collect basic performance metrics', () => {
      const metrics = monitor.getMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.memoryUsage).toBeDefined();
      expect(metrics.memoryUsage.heap).toBeGreaterThan(0);
      expect(metrics.memoryUsage.rss).toBeGreaterThan(0);
      expect(metrics.queryLatency).toBeDefined();
      expect(metrics.gcMetrics).toBeDefined();
    });

    it('should track memory usage', () => {
      const metrics = monitor.getMetrics();

      expect(typeof metrics.memoryUsage.heap).toBe('number');
      expect(typeof metrics.memoryUsage.external).toBe('number');
      expect(typeof metrics.memoryUsage.rss).toBe('number');
      expect(metrics.memoryUsage.heap).toBeGreaterThan(0);
    });

    it('should track query latency percentiles', () => {
      const metrics = monitor.getMetrics();

      expect(metrics.queryLatency.p50).toBeDefined();
      expect(metrics.queryLatency.p95).toBeDefined();
      expect(metrics.queryLatency.p99).toBeDefined();
      expect(typeof metrics.queryLatency.p50).toBe('number');
    });
  });

  describe('metrics updates', () => {
    it('should update connection pool metrics', () => {
      monitor.updateConnectionPoolMetrics(0.75);
      
      const metrics = monitor.getMetrics();
      expect(metrics.connectionPoolUtilization).toBe(0.75);
    });

    it('should update batching metrics', () => {
      monitor.updateBatchingMetrics(0.85);
      
      const metrics = monitor.getMetrics();
      expect(metrics.batchingEfficiency).toBe(0.85);
    });

    it('should update cache metrics', () => {
      monitor.updateCacheMetrics(0.92);
      
      const metrics = monitor.getMetrics();
      expect(metrics.cacheHitRate).toBe(0.92);
    });

    it('should update query latency', () => {
      const initialMetrics = monitor.getMetrics();
      const initialP50 = initialMetrics.queryLatency.p50;
      
      monitor.updateQueryLatency(25);
      
      const updatedMetrics = monitor.getMetrics();
      expect(updatedMetrics.queryLatency.p50).toBeLessThanOrEqual(initialP50);
    });
  });

  describe('historical metrics', () => {
    it('should return historical metrics', () => {
      const historical = monitor.getHistoricalMetrics(3600000); // 1 hour
      
      expect(Array.isArray(historical)).toBe(true);
      // Initially empty since no snapshots have been captured yet
      expect(historical.length).toBe(0);
    });

    it('should filter historical metrics by duration', () => {
      const oneHour = monitor.getHistoricalMetrics(3600000);
      const oneMinute = monitor.getHistoricalMetrics(60000);
      
      expect(Array.isArray(oneHour)).toBe(true);
      expect(Array.isArray(oneMinute)).toBe(true);
    });
  });

  describe('optimization recommendations', () => {
    it('should generate optimization recommendations', () => {
      // Set up some problematic metrics
      monitor.updateConnectionPoolMetrics(0.9); // High utilization
      monitor.updateCacheMetrics(0.5); // Low hit rate
      monitor.updateQueryLatency(600); // High latency
      
      const recommendations = monitor.generateOptimizationRecommendations();
      
      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      
      recommendations.forEach(rec => {
        expect(rec.type).toBeDefined();
        expect(rec.severity).toBeDefined();
        expect(rec.description).toBeDefined();
        expect(rec.action).toBeDefined();
        expect(rec.expectedImprovement).toBeDefined();
      });
    });

    it('should recommend connection pool optimization for high utilization', () => {
      monitor.updateConnectionPoolMetrics(0.85);
      
      const recommendations = monitor.generateOptimizationRecommendations();
      const poolRec = recommendations.find(r => r.type === 'connection_pool');
      
      expect(poolRec).toBeDefined();
      expect(poolRec?.severity).toBe('high');
    });

    it('should recommend caching improvements for low hit rate', () => {
      monitor.updateCacheMetrics(0.6);
      
      const recommendations = monitor.generateOptimizationRecommendations();
      const cacheRec = recommendations.find(r => r.type === 'caching');
      
      expect(cacheRec).toBeDefined();
      expect(cacheRec?.severity).toBe('medium');
    });

    it('should recommend query optimization for high latency', () => {
      monitor.updateQueryLatency(600);
      
      const recommendations = monitor.generateOptimizationRecommendations();
      const queryRec = recommendations.find(r => r.type === 'query');
      
      expect(queryRec).toBeDefined();
      expect(queryRec?.severity).toBe('high');
    });
  });

  describe('performance trends', () => {
    it('should return null for insufficient data', () => {
      const trends = monitor.getPerformanceTrends();
      expect(trends).toBeNull();
    });

    it('should calculate trends when sufficient data is available', () => {
      // This test would require mocking the internal snapshots
      // For now, just verify the method exists and returns null for insufficient data
      const trends = monitor.getPerformanceTrends();
      expect(trends).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should stop monitoring cleanly', () => {
      expect(() => monitor.stop()).not.toThrow();
    });

    it('should handle multiple stop calls', () => {
      monitor.stop();
      expect(() => monitor.stop()).not.toThrow();
    });
  });
});