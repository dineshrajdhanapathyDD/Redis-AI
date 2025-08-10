import { PerformanceMetrics, OptimizationRecommendation } from './types';
interface PerformanceSnapshot {
    timestamp: number;
    metrics: PerformanceMetrics;
}
export declare class PerformanceMonitor {
    private snapshots;
    private gcStats;
    private monitoringInterval;
    private gcObserver;
    constructor();
    private initializeGCMonitoring;
    private startMonitoring;
    private captureSnapshot;
    private collectMetrics;
    private calculateLatencyPercentiles;
    private checkPerformanceThresholds;
    updateConnectionPoolMetrics(utilization: number): void;
    updateBatchingMetrics(efficiency: number): void;
    updateCacheMetrics(hitRate: number): void;
    updateQueryLatency(latency: number): void;
    getMetrics(): PerformanceMetrics;
    getHistoricalMetrics(durationMs?: number): PerformanceSnapshot[];
    generateOptimizationRecommendations(): OptimizationRecommendation[];
    getPerformanceTrends(): any;
    private calculateAverageMetrics;
    private calculateTrend;
    stop(): void;
}
export {};
//# sourceMappingURL=performance-monitor.d.ts.map