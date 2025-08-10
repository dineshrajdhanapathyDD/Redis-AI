export interface ConnectionPoolConfig {
  minConnections: number;
  maxConnections: number;
  acquireTimeoutMs: number;
  idleTimeoutMs: number;
  maxRetries: number;
}

export interface BatchRequest {
  id: string;
  operation: string;
  key: string;
  data?: any;
  priority: number;
  timestamp: number;
}

export interface BatchResult {
  id: string;
  success: boolean;
  data?: any;
  error?: string;
}

export interface PrefetchConfig {
  enabled: boolean;
  maxCacheSize: number;
  prefetchThreshold: number;
  backgroundRefreshInterval: number;
  popularityDecayFactor: number;
}

export interface QueryOptimizationConfig {
  enableIndexHints: boolean;
  enableQueryRewriting: boolean;
  enableResultCaching: boolean;
  maxComplexity: number;
  timeoutMs: number;
}

export interface PerformanceMetrics {
  connectionPoolUtilization: number;
  batchingEfficiency: number;
  cacheHitRate: number;
  queryLatency: {
    p50: number;
    p95: number;
    p99: number;
  };
  memoryUsage: {
    heap: number;
    external: number;
    rss: number;
  };
  gcMetrics: {
    frequency: number;
    duration: number;
    type: string;
  }[];
}

export interface OptimizationRecommendation {
  type: 'connection_pool' | 'batching' | 'caching' | 'query' | 'memory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  action: string;
  expectedImprovement: string;
}