import { getRedisManager } from '@/config/redis';
import { ModelPerformance } from '@/types';
import logger from '@/utils/logger';

export interface PerformanceMetric {
  modelId: string;
  timestamp: number;
  latency: number;
  success: boolean;
  errorType?: string;
  requestSize: number;
  responseSize: number;
  cost: number;
  accuracy?: number;
}

export interface AggregatedMetrics {
  modelId: string;
  timeWindow: string;
  totalRequests: number;
  successfulRequests: number;
  averageLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  throughput: number;
  totalCost: number;
  averageAccuracy: number;
  availability: number;
}

export class PerformanceMonitor {
  private redisManager = getRedisManager();
  private metricsBuffer = new Map<string, PerformanceMetric[]>();
  private bufferSize = 100;
  private flushInterval = 5000; // 5 seconds
  private flushTimer?: NodeJS.Timeout;

  constructor() {
    this.startPeriodicFlush();
  }

  async recordMetric(metric: PerformanceMetric): Promise<void> {
    try {
      // Add to buffer for batch processing
      const modelMetrics = this.metricsBuffer.get(metric.modelId) || [];
      modelMetrics.push(metric);
      this.metricsBuffer.set(metric.modelId, modelMetrics);

      // Flush if buffer is full
      if (modelMetrics.length >= this.bufferSize) {
        await this.flushMetrics(metric.modelId);
      }

      logger.debug('Performance metric recorded', {
        modelId: metric.modelId,
        latency: metric.latency,
        success: metric.success,
        cost: metric.cost,
      });

    } catch (error) {
      logger.error('Failed to record performance metric', {
        modelId: metric.modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getModelPerformance(
    modelId: string,
    timeWindow: '1m' | '5m' | '15m' | '1h' | '24h' = '15m'
  ): Promise<ModelPerformance> {
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
      const performance = this.calculatePerformanceMetrics(
        latencyData,
        successData,
        errorData,
        costData,
        accuracyData,
        windowMs
      );

      logger.debug('Model performance retrieved', {
        modelId,
        timeWindow,
        performance,
      });

      return performance;

    } catch (error) {
      logger.error('Failed to get model performance', {
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

  async getAggregatedMetrics(
    modelId: string,
    timeWindow: '1m' | '5m' | '15m' | '1h' | '24h' = '1h',
    granularity: '1m' | '5m' | '15m' = '5m'
  ): Promise<AggregatedMetrics[]> {
    try {
      const client = this.redisManager.getClient();
      const now = Date.now();
      const windowMs = this.parseTimeWindow(timeWindow);
      const granularityMs = this.parseTimeWindow(granularity);
      const fromTime = now - windowMs;

      const aggregatedMetrics: AggregatedMetrics[] = [];
      
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

    } catch (error) {
      logger.error('Failed to get aggregated metrics', {
        modelId,
        timeWindow,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getModelHealthStatus(modelId: string): Promise<{
    isHealthy: boolean;
    issues: string[];
    lastCheck: Date;
    uptime: number;
    responseTime: number;
  }> {
    try {
      const performance = await this.getModelPerformance(modelId, '5m');
      const issues: string[] = [];
      
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

    } catch (error) {
      logger.error('Failed to get model health status', {
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

  async getAllModelsHealth(): Promise<Record<string, {
    isHealthy: boolean;
    issues: string[];
    performance: ModelPerformance;
  }>> {
    try {
      const client = this.redisManager.getClient();
      
      // Get all model IDs from metrics keys
      const keys = await client.keys('metrics:*:latency');
      const modelIds = keys.map(key => key.split(':')[1]).filter(Boolean);
      
      const healthStatuses: Record<string, any> = {};
      
      await Promise.all(
        modelIds.map(async (modelId) => {
          const [health, performance] = await Promise.all([
            this.getModelHealthStatus(modelId),
            this.getModelPerformance(modelId, '15m'),
          ]);
          
          healthStatuses[modelId] = {
            isHealthy: health.isHealthy,
            issues: health.issues,
            performance,
          };
        })
      );

      return healthStatuses;

    } catch (error) {
      logger.error('Failed to get all models health', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return {};
    }
  }

  private async flushMetrics(modelId?: string): Promise<void> {
    try {
      const client = this.redisManager.getClient();
      const modelsToFlush = modelId ? [modelId] : Array.from(this.metricsBuffer.keys());

      for (const id of modelsToFlush) {
        const metrics = this.metricsBuffer.get(id);
        if (!metrics || metrics.length === 0) continue;

        // Group metrics by type for batch insertion
        const latencyMetrics: Array<[number, number]> = [];
        const successMetrics: Array<[number, number]> = [];
        const errorMetrics: Array<[number, number]> = [];
        const costMetrics: Array<[number, number]> = [];
        const accuracyMetrics: Array<[number, number]> = [];

        for (const metric of metrics) {
          const timestamp = metric.timestamp;
          
          latencyMetrics.push([timestamp, metric.latency]);
          
          if (metric.success) {
            successMetrics.push([timestamp, 1]);
          } else {
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

        logger.debug('Metrics flushed to Redis', {
          modelId: id,
          metricsCount: metrics.length,
        });
      }

    } catch (error) {
      logger.error('Failed to flush metrics', {
        modelId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(async () => {
      await this.flushMetrics();
    }, this.flushInterval);
  }

  private async getTimeSeriesData(
    key: string,
    fromTime: number,
    toTime: number
  ): Promise<Array<{ timestamp: number; value: number }>> {
    try {
      const client = this.redisManager.getClient();
      
      // Ensure the time series exists
      try {
        await client.ts.create(key, {
          RETENTION: 24 * 60 * 60 * 1000, // 24 hours
          DUPLICATE_POLICY: 'LAST',
        });
      } catch (error) {
        // Key might already exist, ignore error
      }

      const result = await client.ts.range(key, fromTime, toTime);
      
      return result.map(point => ({
        timestamp: point.timestamp,
        value: point.value,
      }));

    } catch (error) {
      logger.debug('Failed to get time series data', {
        key,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  private calculatePerformanceMetrics(
    latencyData: Array<{ timestamp: number; value: number }>,
    successData: Array<{ timestamp: number; value: number }>,
    errorData: Array<{ timestamp: number; value: number }>,
    costData: Array<{ timestamp: number; value: number }>,
    accuracyData: Array<{ timestamp: number; value: number }>,
    windowMs: number
  ): ModelPerformance {
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

  private parseTimeWindow(timeWindow: string): number {
    const windowMap: Record<string, number> = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    
    return windowMap[timeWindow] || windowMap['15m'];
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = values.sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * percentile) - 1;
    return sorted[Math.max(0, index)];
  }

  async cleanup(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    
    // Flush any remaining metrics
    await this.flushMetrics();
    
    logger.info('Performance monitor cleanup completed');
  }
}

// Singleton instance
let performanceMonitor: PerformanceMonitor | null = null;

export function getPerformanceMonitor(): PerformanceMonitor {
  if (!performanceMonitor) {
    performanceMonitor = new PerformanceMonitor();
  }
  return performanceMonitor;
}

export function createPerformanceMonitor(): PerformanceMonitor {
  performanceMonitor = new PerformanceMonitor();
  return performanceMonitor;
}