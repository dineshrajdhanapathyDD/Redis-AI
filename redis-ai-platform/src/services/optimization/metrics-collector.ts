import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

export interface SystemMetrics {
  timestamp: number;
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  redis: RedisMetrics;
  network: NetworkMetrics;
  application: ApplicationMetrics;
}

export interface CPUMetrics {
  usage: number; // 0-1
  loadAverage: number[];
  cores: number;
  processes: number;
}

export interface MemoryMetrics {
  used: number; // bytes
  total: number; // bytes
  available: number; // bytes
  usage: number; // 0-1
  swapUsed: number; // bytes
  swapTotal: number; // bytes
}

export interface RedisMetrics {
  memoryUsage: number; // bytes
  memoryPeak: number; // bytes
  memoryRss: number; // bytes
  connectedClients: number;
  blockedClients: number;
  totalConnections: number;
  commandsProcessed: number;
  keyspaceHits: number;
  keyspaceMisses: number;
  hitRate: number; // 0-1
  evictedKeys: number;
  expiredKeys: number;
  totalKeys: number;
  avgTtl: number;
  replicationBacklog: number;
  slowlogLength: number;
}

export interface NetworkMetrics {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  connectionsActive: number;
  connectionsTotal: number;
  latency: LatencyMetrics;
}

export interface LatencyMetrics {
  p50: number;
  p95: number;
  p99: number;
  avg: number;
  max: number;
  min: number;
}

export interface ApplicationMetrics {
  requestsPerSecond: number;
  responseTime: LatencyMetrics;
  errorRate: number;
  activeUsers: number;
  searchQueries: number;
  vectorOperations: number;
  cacheHitRate: number;
  queueLength: number;
  workerUtilization: number;
}

export interface MetricsSample {
  metricName: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

export interface MetricsAggregation {
  metricName: string;
  timeRange: TimeRange;
  aggregationType: AggregationType;
  values: number[];
  timestamps: number[];
  summary: MetricsSummary;
}

export interface TimeRange {
  start: number;
  end: number;
  interval: number; // seconds
}

export enum AggregationType {
  AVG = 'avg',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  COUNT = 'count',
  RATE = 'rate',
  PERCENTILE = 'percentile'
}

export interface MetricsSummary {
  avg: number;
  min: number;
  max: number;
  sum: number;
  count: number;
  stdDev: number;
  percentiles: Record<string, number>;
}

export interface MetricsAlert {
  id: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  message: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
}

export interface AlertCondition {
  operator: ComparisonOperator;
  duration: number; // seconds
  evaluationWindow: number; // seconds
}

export enum ComparisonOperator {
  GREATER_THAN = 'gt',
  LESS_THAN = 'lt',
  GREATER_EQUAL = 'gte',
  LESS_EQUAL = 'lte',
  EQUAL = 'eq',
  NOT_EQUAL = 'ne'
}

export enum AlertSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export class MetricsCollector {
  private redis: Redis;
  private readonly METRICS_PREFIX = 'metrics';
  private readonly ALERTS_PREFIX = 'alerts';
  private collectionInterval?: NodeJS.Timeout;
  private isCollecting = false;

  constructor(redis: Redis) {
    this.redis = redis;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Metrics Collector');
    
    // Set up Redis TimeSeries for metrics storage
    await this.setupTimeSeriesKeys();
    
    // Start metrics collection
    await this.startCollection();
    
    logger.info('Metrics Collector initialized');
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down Metrics Collector');
    
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    this.isCollecting = false;
    logger.info('Metrics Collector shutdown complete');
  }

  async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();
    
    // Collect various system metrics
    const [cpu, memory, redis, network, application] = await Promise.all([
      this.collectCPUMetrics(),
      this.collectMemoryMetrics(),
      this.collectRedisMetrics(),
      this.collectNetworkMetrics(),
      this.collectApplicationMetrics()
    ]);

    const metrics: SystemMetrics = {
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

  async getMetrics(
    metricName: string, 
    timeRange: TimeRange, 
    aggregationType: AggregationType = AggregationType.AVG
  ): Promise<MetricsAggregation> {
    const key = `${this.METRICS_PREFIX}:${metricName}`;
    
    // Get time series data from Redis
    const data = await this.redis.call(
      'TS.RANGE',
      key,
      timeRange.start,
      timeRange.end,
      'AGGREGATION',
      aggregationType,
      timeRange.interval * 1000
    ) as [number, string][];

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

  async addMetricsSample(sample: MetricsSample): Promise<void> {
    const key = `${this.METRICS_PREFIX}:${sample.metricName}`;
    
    // Add sample to Redis TimeSeries
    await this.redis.call(
      'TS.ADD',
      key,
      sample.timestamp,
      sample.value
    );

    // Add labels if provided
    if (sample.labels) {
      const labelArgs = Object.entries(sample.labels).flat();
      await this.redis.call(
        'TS.ALTER',
        key,
        'LABELS',
        ...labelArgs
      );
    }
  }

  async createAlert(alert: Omit<MetricsAlert, 'id' | 'timestamp' | 'resolved'>): Promise<MetricsAlert> {
    const fullAlert: MetricsAlert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: Date.now(),
      resolved: false
    };

    await this.redis.hset(
      `${this.ALERTS_PREFIX}:${fullAlert.id}`,
      'data',
      JSON.stringify(fullAlert)
    );

    return fullAlert;
  }

  async getActiveAlerts(): Promise<MetricsAlert[]> {
    const alertKeys = await this.redis.keys(`${this.ALERTS_PREFIX}:*`);
    const alerts: MetricsAlert[] = [];

    for (const key of alertKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const alert = JSON.parse(data) as MetricsAlert;
        if (!alert.resolved) {
          alerts.push(alert);
        }
      }
    }

    return alerts.sort((a, b) => b.timestamp - a.timestamp);
  }

  async resolveAlert(alertId: string): Promise<void> {
    const key = `${this.ALERTS_PREFIX}:${alertId}`;
    const data = await this.redis.hget(key, 'data');
    
    if (data) {
      const alert = JSON.parse(data) as MetricsAlert;
      alert.resolved = true;
      alert.resolvedAt = Date.now();
      
      await this.redis.hset(key, 'data', JSON.stringify(alert));
    }
  }

  private async setupTimeSeriesKeys(): Promise<void> {
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
        await this.redis.call(
          'TS.CREATE',
          key,
          'RETENTION',
          86400000, // 24 hours in milliseconds
          'LABELS',
          'metric',
          metricKey
        );
      } catch (error) {
        // Key might already exist, which is fine
        if (!error.message.includes('TSDB: key already exists')) {
          logger.warn(`Failed to create TimeSeries key ${key}:`, error);
        }
      }
    }
  }

  private async startCollection(): Promise<void> {
    this.isCollecting = true;
    
    // Collect metrics every 30 seconds
    this.collectionInterval = setInterval(async () => {
      if (this.isCollecting) {
        try {
          await this.collectSystemMetrics();
        } catch (error) {
          logger.error('Error collecting system metrics:', error);
        }
      }
    }, 30000);

    // Collect initial metrics
    await this.collectSystemMetrics();
  }

  private async collectCPUMetrics(): Promise<CPUMetrics> {
    // In a real implementation, this would collect actual CPU metrics
    // For demo purposes, we'll simulate realistic values
    return {
      usage: Math.random() * 0.8 + 0.1, // 10-90% usage
      loadAverage: [1.2, 1.5, 1.8],
      cores: 8,
      processes: 150 + Math.floor(Math.random() * 50)
    };
  }

  private async collectMemoryMetrics(): Promise<MemoryMetrics> {
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

  private async collectRedisMetrics(): Promise<RedisMetrics> {
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
    } catch (error) {
      logger.error('Error collecting Redis metrics:', error);
      return this.getDefaultRedisMetrics();
    }
  }

  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
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

  private async collectApplicationMetrics(): Promise<ApplicationMetrics> {
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

  private async storeMetrics(metrics: SystemMetrics): Promise<void> {
    const samples: MetricsSample[] = [
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

  private parseRedisInfo(info: string): Record<string, number> {
    const stats: Record<string, number> = {};
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

  private calculateHitRate(hits: number, misses: number): number {
    const total = hits + misses;
    return total > 0 ? hits / total : 0;
  }

  private async getTotalKeys(): Promise<number> {
    try {
      const dbsize = await this.redis.dbsize();
      return dbsize;
    } catch (error) {
      return 0;
    }
  }

  private async getAverageTTL(): Promise<number> {
    // This is a simplified implementation
    // In practice, you'd sample keys and calculate average TTL
    return 3600; // 1 hour default
  }

  private async getSlowlogLength(): Promise<number> {
    try {
      const slowlog = await this.redis.slowlog('LEN');
      return slowlog;
    } catch (error) {
      return 0;
    }
  }

  private getDefaultRedisMetrics(): RedisMetrics {
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

  private calculateSummary(values: number[]): MetricsSummary {
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

  private getPercentile(sortedValues: number[], percentile: number): number {
    const index = Math.ceil(sortedValues.length * percentile) - 1;
    return sortedValues[Math.max(0, index)];
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}