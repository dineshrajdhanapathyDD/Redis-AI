import { Redis } from 'ioredis';
export interface SystemMetrics {
    timestamp: number;
    cpu: CPUMetrics;
    memory: MemoryMetrics;
    redis: RedisMetrics;
    network: NetworkMetrics;
    application: ApplicationMetrics;
}
export interface CPUMetrics {
    usage: number;
    loadAverage: number[];
    cores: number;
    processes: number;
}
export interface MemoryMetrics {
    used: number;
    total: number;
    available: number;
    usage: number;
    swapUsed: number;
    swapTotal: number;
}
export interface RedisMetrics {
    memoryUsage: number;
    memoryPeak: number;
    memoryRss: number;
    connectedClients: number;
    blockedClients: number;
    totalConnections: number;
    commandsProcessed: number;
    keyspaceHits: number;
    keyspaceMisses: number;
    hitRate: number;
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
    interval: number;
}
export declare enum AggregationType {
    AVG = "avg",
    SUM = "sum",
    MIN = "min",
    MAX = "max",
    COUNT = "count",
    RATE = "rate",
    PERCENTILE = "percentile"
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
    duration: number;
    evaluationWindow: number;
}
export declare enum ComparisonOperator {
    GREATER_THAN = "gt",
    LESS_THAN = "lt",
    GREATER_EQUAL = "gte",
    LESS_EQUAL = "lte",
    EQUAL = "eq",
    NOT_EQUAL = "ne"
}
export declare enum AlertSeverity {
    CRITICAL = "critical",
    HIGH = "high",
    MEDIUM = "medium",
    LOW = "low",
    INFO = "info"
}
export declare class MetricsCollector {
    private redis;
    private readonly METRICS_PREFIX;
    private readonly ALERTS_PREFIX;
    private collectionInterval?;
    private isCollecting;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    collectSystemMetrics(): Promise<SystemMetrics>;
    getMetrics(metricName: string, timeRange: TimeRange, aggregationType?: AggregationType): Promise<MetricsAggregation>;
    addMetricsSample(sample: MetricsSample): Promise<void>;
    createAlert(alert: Omit<MetricsAlert, 'id' | 'timestamp' | 'resolved'>): Promise<MetricsAlert>;
    getActiveAlerts(): Promise<MetricsAlert[]>;
    resolveAlert(alertId: string): Promise<void>;
    private setupTimeSeriesKeys;
    private startCollection;
    private collectCPUMetrics;
    private collectMemoryMetrics;
    private collectRedisMetrics;
    private collectNetworkMetrics;
    private collectApplicationMetrics;
    private storeMetrics;
    private parseRedisInfo;
    private calculateHitRate;
    private getTotalKeys;
    private getAverageTTL;
    private getSlowlogLength;
    private getDefaultRedisMetrics;
    private calculateSummary;
    private getPercentile;
    private generateAlertId;
}
//# sourceMappingURL=metrics-collector.d.ts.map