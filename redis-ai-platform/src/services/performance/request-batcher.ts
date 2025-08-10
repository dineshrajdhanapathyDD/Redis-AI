import { Redis } from 'ioredis';
import { BatchRequest, BatchResult } from './types';
import { logger } from '../../utils/logger';

interface BatchConfig {
  maxBatchSize: number;
  maxWaitTimeMs: number;
  maxConcurrentBatches: number;
  priorityLevels: number;
}

interface PendingRequest {
  request: BatchRequest;
  resolve: (result: BatchResult) => void;
  reject: (error: Error) => void;
}

export class RequestBatcher {
  private pendingRequests: Map<number, PendingRequest[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;
  private config: BatchConfig;
  private activeBatches = 0;
  private metrics = {
    totalRequests: 0,
    batchedRequests: 0,
    batchCount: 0,
    averageBatchSize: 0,
    batchingEfficiency: 0
  };

  constructor(config: BatchConfig) {
    this.config = config;
    
    // Initialize priority levels
    for (let i = 0; i < config.priorityLevels; i++) {
      this.pendingRequests.set(i, []);
    }
  }

  async execute(redis: Redis, request: BatchRequest): Promise<BatchResult> {
    this.metrics.totalRequests++;

    return new Promise((resolve, reject) => {
      const pendingRequest: PendingRequest = {
        request,
        resolve,
        reject
      };

      // Add to appropriate priority queue
      const priority = Math.min(request.priority, this.config.priorityLevels - 1);
      const queue = this.pendingRequests.get(priority) || [];
      queue.push(pendingRequest);
      this.pendingRequests.set(priority, queue);

      // Start batch timer if not already running
      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatches(redis);
        }, this.config.maxWaitTimeMs);
      }

      // Process immediately if batch is full
      const totalPending = this.getTotalPendingRequests();
      if (totalPending >= this.config.maxBatchSize) {
        if (this.batchTimer) {
          clearTimeout(this.batchTimer);
          this.batchTimer = null;
        }
        this.processBatches(redis);
      }
    });
  }

  private getTotalPendingRequests(): number {
    let total = 0;
    for (const queue of this.pendingRequests.values()) {
      total += queue.length;
    }
    return total;
  }

  private async processBatches(redis: Redis): Promise<void> {
    if (this.activeBatches >= this.config.maxConcurrentBatches) {
      // Reschedule if too many active batches
      this.batchTimer = setTimeout(() => {
        this.processBatches(redis);
      }, this.config.maxWaitTimeMs);
      return;
    }

    this.batchTimer = null;
    const batch = this.createBatch();
    
    if (batch.length === 0) {
      return;
    }

    this.activeBatches++;
    this.metrics.batchCount++;
    this.metrics.batchedRequests += batch.length;
    this.metrics.averageBatchSize = this.metrics.batchedRequests / this.metrics.batchCount;
    this.metrics.batchingEfficiency = this.metrics.batchedRequests / this.metrics.totalRequests;

    try {
      await this.executeBatch(redis, batch);
    } catch (error) {
      logger.error('Batch execution failed:', error);
      // Reject all requests in the batch
      batch.forEach(pending => {
        pending.reject(error as Error);
      });
    } finally {
      this.activeBatches--;
      
      // Schedule next batch if there are pending requests
      if (this.getTotalPendingRequests() > 0 && !this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatches(redis);
        }, this.config.maxWaitTimeMs);
      }
    }
  }

  private createBatch(): PendingRequest[] {
    const batch: PendingRequest[] = [];
    let remainingCapacity = this.config.maxBatchSize;

    // Process by priority (higher priority first)
    for (let priority = this.config.priorityLevels - 1; priority >= 0 && remainingCapacity > 0; priority--) {
      const queue = this.pendingRequests.get(priority) || [];
      const toTake = Math.min(queue.length, remainingCapacity);
      
      if (toTake > 0) {
        batch.push(...queue.splice(0, toTake));
        remainingCapacity -= toTake;
      }
    }

    return batch;
  }

  private async executeBatch(redis: Redis, batch: PendingRequest[]): Promise<void> {
    // Group requests by operation type for optimal batching
    const operationGroups = this.groupByOperation(batch);
    
    // Execute each operation group
    for (const [operation, requests] of operationGroups.entries()) {
      try {
        await this.executeOperationGroup(redis, operation, requests);
      } catch (error) {
        logger.error(`Failed to execute ${operation} batch:`, error);
        // Reject all requests in this operation group
        requests.forEach(pending => {
          pending.reject(error as Error);
        });
      }
    }
  }

  private groupByOperation(batch: PendingRequest[]): Map<string, PendingRequest[]> {
    const groups = new Map<string, PendingRequest[]>();
    
    for (const pending of batch) {
      const operation = pending.request.operation;
      if (!groups.has(operation)) {
        groups.set(operation, []);
      }
      groups.get(operation)!.push(pending);
    }
    
    return groups;
  }

  private async executeOperationGroup(redis: Redis, operation: string, requests: PendingRequest[]): Promise<void> {
    switch (operation) {
      case 'GET':
        await this.executeBatchGet(redis, requests);
        break;
      case 'SET':
        await this.executeBatchSet(redis, requests);
        break;
      case 'HGET':
        await this.executeBatchHGet(redis, requests);
        break;
      case 'HSET':
        await this.executeBatchHSet(redis, requests);
        break;
      case 'VECTOR_SEARCH':
        await this.executeBatchVectorSearch(redis, requests);
        break;
      default:
        // Execute individually for unsupported batch operations
        await this.executeIndividually(redis, requests);
    }
  }

  private async executeBatchGet(redis: Redis, requests: PendingRequest[]): Promise<void> {
    const keys = requests.map(req => req.request.key);
    const results = await redis.mget(...keys);
    
    requests.forEach((pending, index) => {
      pending.resolve({
        id: pending.request.id,
        success: true,
        data: results[index]
      });
    });
  }

  private async executeBatchSet(redis: Redis, requests: PendingRequest[]): Promise<void> {
    const pipeline = redis.pipeline();
    
    requests.forEach(pending => {
      pipeline.set(pending.request.key, pending.request.data);
    });
    
    const results = await pipeline.exec();
    
    requests.forEach((pending, index) => {
      const result = results?.[index];
      pending.resolve({
        id: pending.request.id,
        success: result?.[0] === null,
        data: result?.[1],
        error: result?.[0]?.message
      });
    });
  }

  private async executeBatchHGet(redis: Redis, requests: PendingRequest[]): Promise<void> {
    const pipeline = redis.pipeline();
    
    requests.forEach(pending => {
      const [hashKey, field] = pending.request.key.split(':');
      pipeline.hget(hashKey, field);
    });
    
    const results = await pipeline.exec();
    
    requests.forEach((pending, index) => {
      const result = results?.[index];
      pending.resolve({
        id: pending.request.id,
        success: result?.[0] === null,
        data: result?.[1],
        error: result?.[0]?.message
      });
    });
  }

  private async executeBatchHSet(redis: Redis, requests: PendingRequest[]): Promise<void> {
    const pipeline = redis.pipeline();
    
    requests.forEach(pending => {
      const [hashKey, field] = pending.request.key.split(':');
      pipeline.hset(hashKey, field, pending.request.data);
    });
    
    const results = await pipeline.exec();
    
    requests.forEach((pending, index) => {
      const result = results?.[index];
      pending.resolve({
        id: pending.request.id,
        success: result?.[0] === null,
        data: result?.[1],
        error: result?.[0]?.message
      });
    });
  }

  private async executeBatchVectorSearch(redis: Redis, requests: PendingRequest[]): Promise<void> {
    // Vector searches are typically not batchable, execute individually
    await this.executeIndividually(redis, requests);
  }

  private async executeIndividually(redis: Redis, requests: PendingRequest[]): Promise<void> {
    await Promise.all(requests.map(async (pending) => {
      try {
        let result: any;
        const { operation, key, data } = pending.request;
        
        switch (operation) {
          case 'GET':
            result = await redis.get(key);
            break;
          case 'SET':
            result = await redis.set(key, data);
            break;
          case 'HGET':
            const [hashKey, field] = key.split(':');
            result = await redis.hget(hashKey, field);
            break;
          case 'HSET':
            const [hKey, hField] = key.split(':');
            result = await redis.hset(hKey, hField, data);
            break;
          case 'VECTOR_SEARCH':
            result = await redis.call('FT.SEARCH', key, data.query, ...data.params);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }
        
        pending.resolve({
          id: pending.request.id,
          success: true,
          data: result
        });
      } catch (error) {
        pending.reject(error as Error);
      }
    }));
  }

  getMetrics(): any {
    return { ...this.metrics };
  }

  flush(redis: Redis): Promise<void> {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }
    return this.processBatches(redis);
  }
}