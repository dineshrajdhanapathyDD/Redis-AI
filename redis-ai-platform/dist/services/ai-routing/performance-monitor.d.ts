import { ModelPerformance } from '@/types';
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
export declare class PerformanceMonitor {
    private redisManager;
    private metricsBuffer;
    private bufferSize;
    private flushInterval;
    private flushTimer?;
    constructor();
    recordMetric(metric: PerformanceMetric): Promise<void>;
    getModelPerformance(modelId: string, timeWindow?: '1m' | '5m' | '15m' | '1h' | '24h'): Promise<ModelPerformance>;
    getAggregatedMetrics(modelId: string, timeWindow?: '1m' | '5m' | '15m' | '1h' | '24h', granularity?: '1m' | '5m' | '15m'): Promise<AggregatedMetrics[]>;
    getModelHealthStatus(modelId: string): Promise<{
        isHealthy: boolean;
        issues: string[];
        lastCheck: Date;
        uptime: number;
        responseTime: number;
    }>;
    getAllModelsHealth(): Promise<Record<string, {
        isHealthy: boolean;
        issues: string[];
        performance: ModelPerformance;
    }>>;
    private flushMetrics;
    private startPeriodicFlush;
    private getTimeSeriesData;
    private calculatePerformanceMetrics;
    private parseTimeWindow;
    private calculatePercentile;
    cleanup(): Promise<void>;
}
export declare function getPerformanceMonitor(): PerformanceMonitor;
export declare function createPerformanceMonitor(): PerformanceMonitor;
//# sourceMappingURL=performance-monitor.d.ts.map