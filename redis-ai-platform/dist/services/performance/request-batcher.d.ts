import { Redis } from 'ioredis';
import { BatchRequest, BatchResult } from './types';
interface BatchConfig {
    maxBatchSize: number;
    maxWaitTimeMs: number;
    maxConcurrentBatches: number;
    priorityLevels: number;
}
export declare class RequestBatcher {
    private pendingRequests;
    private batchTimer;
    private config;
    private activeBatches;
    private metrics;
    constructor(config: BatchConfig);
    execute(redis: Redis, request: BatchRequest): Promise<BatchResult>;
    private getTotalPendingRequests;
    private processBatches;
    private createBatch;
    private executeBatch;
    private groupByOperation;
    private executeOperationGroup;
    private executeBatchGet;
    private executeBatchSet;
    private executeBatchHGet;
    private executeBatchHSet;
    private executeBatchVectorSearch;
    private executeIndividually;
    getMetrics(): any;
    flush(redis: Redis): Promise<void>;
}
export {};
//# sourceMappingURL=request-batcher.d.ts.map