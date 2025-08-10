"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestBatcher = void 0;
const logger_1 = require("../../utils/logger");
class RequestBatcher {
    pendingRequests = new Map();
    batchTimer = null;
    config;
    activeBatches = 0;
    metrics = {
        totalRequests: 0,
        batchedRequests: 0,
        batchCount: 0,
        averageBatchSize: 0,
        batchingEfficiency: 0
    };
    constructor(config) {
        this.config = config;
        // Initialize priority levels
        for (let i = 0; i < config.priorityLevels; i++) {
            this.pendingRequests.set(i, []);
        }
    }
    async execute(redis, request) {
        this.metrics.totalRequests++;
        return new Promise((resolve, reject) => {
            const pendingRequest = {
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
    getTotalPendingRequests() {
        let total = 0;
        for (const queue of this.pendingRequests.values()) {
            total += queue.length;
        }
        return total;
    }
    async processBatches(redis) {
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
        }
        catch (error) {
            logger_1.logger.error('Batch execution failed:', error);
            // Reject all requests in the batch
            batch.forEach(pending => {
                pending.reject(error);
            });
        }
        finally {
            this.activeBatches--;
            // Schedule next batch if there are pending requests
            if (this.getTotalPendingRequests() > 0 && !this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    this.processBatches(redis);
                }, this.config.maxWaitTimeMs);
            }
        }
    }
    createBatch() {
        const batch = [];
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
    async executeBatch(redis, batch) {
        // Group requests by operation type for optimal batching
        const operationGroups = this.groupByOperation(batch);
        // Execute each operation group
        for (const [operation, requests] of operationGroups.entries()) {
            try {
                await this.executeOperationGroup(redis, operation, requests);
            }
            catch (error) {
                logger_1.logger.error(`Failed to execute ${operation} batch:`, error);
                // Reject all requests in this operation group
                requests.forEach(pending => {
                    pending.reject(error);
                });
            }
        }
    }
    groupByOperation(batch) {
        const groups = new Map();
        for (const pending of batch) {
            const operation = pending.request.operation;
            if (!groups.has(operation)) {
                groups.set(operation, []);
            }
            groups.get(operation).push(pending);
        }
        return groups;
    }
    async executeOperationGroup(redis, operation, requests) {
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
    async executeBatchGet(redis, requests) {
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
    async executeBatchSet(redis, requests) {
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
    async executeBatchHGet(redis, requests) {
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
    async executeBatchHSet(redis, requests) {
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
    async executeBatchVectorSearch(redis, requests) {
        // Vector searches are typically not batchable, execute individually
        await this.executeIndividually(redis, requests);
    }
    async executeIndividually(redis, requests) {
        await Promise.all(requests.map(async (pending) => {
            try {
                let result;
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
            }
            catch (error) {
                pending.reject(error);
            }
        }));
    }
    getMetrics() {
        return { ...this.metrics };
    }
    flush(redis) {
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
        return this.processBatches(redis);
    }
}
exports.RequestBatcher = RequestBatcher;
//# sourceMappingURL=request-batcher.js.map