"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstratePerformanceOptimization = demonstratePerformanceOptimization;
const connection_pool_1 = require("../services/performance/connection-pool");
const request_batcher_1 = require("../services/performance/request-batcher");
const prefetch_service_1 = require("../services/performance/prefetch-service");
const query_optimizer_1 = require("../services/performance/query-optimizer");
const performance_monitor_1 = require("../services/performance/performance-monitor");
const logger_1 = require("../utils/logger");
async function demonstratePerformanceOptimization() {
    logger_1.logger.info('🚀 Starting Performance Optimization Demo');
    // Initialize performance components
    const poolConfig = {
        minConnections: 3,
        maxConnections: 15,
        acquireTimeoutMs: 5000,
        idleTimeoutMs: 30000,
        maxRetries: 3
    };
    const prefetchConfig = {
        enabled: true,
        maxCacheSize: 10000000, // 10MB
        prefetchThreshold: 0.8,
        backgroundRefreshInterval: 30000,
        popularityDecayFactor: 0.95
    };
    const queryConfig = {
        enableIndexHints: true,
        enableQueryRewriting: true,
        enableResultCaching: true,
        maxComplexity: 1000,
        timeoutMs: 10000
    };
    const connectionPool = new connection_pool_1.ConnectionPool(poolConfig);
    const requestBatcher = new request_batcher_1.RequestBatcher({
        maxBatchSize: 20,
        maxWaitTimeMs: 50,
        maxConcurrentBatches: 5,
        priorityLevels: 3
    });
    const prefetchService = new prefetch_service_1.PrefetchService(prefetchConfig);
    const queryOptimizer = new query_optimizer_1.QueryOptimizer(queryConfig);
    const performanceMonitor = new performance_monitor_1.PerformanceMonitor();
    try {
        // Wait for initialization
        await new Promise(resolve => setTimeout(resolve, 1000));
        logger_1.logger.info('✅ All performance components initialized');
        // Demonstrate connection pooling
        logger_1.logger.info('\n📊 Demonstrating Connection Pooling');
        await demonstrateConnectionPooling(connectionPool);
        // Demonstrate request batching
        logger_1.logger.info('\n📦 Demonstrating Request Batching');
        await demonstrateRequestBatching(connectionPool, requestBatcher);
        // Demonstrate intelligent prefetching
        logger_1.logger.info('\n🧠 Demonstrating Intelligent Prefetching');
        await demonstratePrefetching(connectionPool, prefetchService);
        // Demonstrate query optimization
        logger_1.logger.info('\n⚡ Demonstrating Query Optimization');
        await demonstrateQueryOptimization(connectionPool, queryOptimizer);
        // Demonstrate performance monitoring
        logger_1.logger.info('\n📈 Demonstrating Performance Monitoring');
        await demonstratePerformanceMonitoring(connectionPool, requestBatcher, prefetchService, queryOptimizer, performanceMonitor);
        // Demonstrate load testing
        logger_1.logger.info('\n🔥 Demonstrating High Load Performance');
        await demonstrateHighLoadPerformance(connectionPool, requestBatcher, prefetchService, performanceMonitor);
    }
    catch (error) {
        logger_1.logger.error('Demo failed:', error);
    }
    finally {
        // Cleanup
        logger_1.logger.info('\n🧹 Cleaning up resources');
        await connectionPool.close();
        prefetchService.stop();
        performanceMonitor.stop();
        logger_1.logger.info('✅ Demo completed successfully');
    }
}
async function demonstrateConnectionPooling(pool) {
    const startTime = Date.now();
    const connections = [];
    // Acquire multiple connections
    for (let i = 0; i < 8; i++) {
        const redis = await pool.acquire();
        connections.push(redis);
        logger_1.logger.info(`Acquired connection ${i + 1}`);
    }
    const metrics = pool.getMetrics();
    logger_1.logger.info(`Pool metrics: ${metrics.activeConnections} active, ${metrics.totalConnections} total`);
    logger_1.logger.info(`Pool utilization: ${(metrics.poolUtilization * 100).toFixed(1)}%`);
    // Release connections
    connections.forEach((redis, index) => {
        pool.release(redis);
        logger_1.logger.info(`Released connection ${index + 1}`);
    });
    const finalMetrics = pool.getMetrics();
    logger_1.logger.info(`Final pool utilization: ${(finalMetrics.poolUtilization * 100).toFixed(1)}%`);
    logger_1.logger.info(`Connection pooling demo completed in ${Date.now() - startTime}ms`);
}
async function demonstrateRequestBatching(pool, batcher) {
    const startTime = Date.now();
    const redis = await pool.acquire();
    // Create multiple batch requests
    const requests = [];
    for (let i = 0; i < 15; i++) {
        const request = {
            id: `batch-${i}`,
            operation: 'GET',
            key: `demo:key:${i}`,
            priority: Math.floor(Math.random() * 3),
            timestamp: Date.now()
        };
        requests.push(batcher.execute(redis, request));
    }
    // Execute all requests
    const results = await Promise.all(requests);
    logger_1.logger.info(`Processed ${results.length} requests in batches`);
    const metrics = batcher.getMetrics();
    logger_1.logger.info(`Batching efficiency: ${(metrics.batchingEfficiency * 100).toFixed(1)}%`);
    logger_1.logger.info(`Average batch size: ${metrics.averageBatchSize.toFixed(1)}`);
    logger_1.logger.info(`Total batches: ${metrics.batchCount}`);
    pool.release(redis);
    logger_1.logger.info(`Request batching demo completed in ${Date.now() - startTime}ms`);
}
async function demonstratePrefetching(pool, prefetch) {
    const startTime = Date.now();
    const redis = await pool.acquire();
    // Simulate access patterns
    const keys = ['user:123', 'profile:123', 'settings:123', 'preferences:123'];
    logger_1.logger.info('First access (cache misses expected):');
    for (const key of keys) {
        const value = await prefetch.get(redis, key);
        logger_1.logger.info(`${key}: ${value ? 'found' : 'not found'}`);
    }
    let metrics = prefetch.getMetrics();
    logger_1.logger.info(`Cache hit rate after first access: ${(metrics.hitRate * 100).toFixed(1)}%`);
    // Access same keys again (cache hits expected)
    logger_1.logger.info('\nSecond access (cache hits expected):');
    for (const key of keys) {
        const value = await prefetch.get(redis, key);
        logger_1.logger.info(`${key}: ${value ? 'found' : 'not found'} (cached)`);
    }
    metrics = prefetch.getMetrics();
    logger_1.logger.info(`Cache hit rate after second access: ${(metrics.hitRate * 100).toFixed(1)}%`);
    logger_1.logger.info(`Cache size: ${metrics.cacheSize} entries, ${(metrics.cacheSizeBytes / 1024).toFixed(1)}KB`);
    logger_1.logger.info(`Access patterns tracked: ${metrics.accessPatterns}`);
    // Demonstrate batch prefetching
    const batchKeys = keys.slice(0, 3);
    const batchResults = await prefetch.mget(redis, batchKeys);
    logger_1.logger.info(`Batch prefetch results: ${batchResults.length} items retrieved`);
    pool.release(redis);
    logger_1.logger.info(`Prefetching demo completed in ${Date.now() - startTime}ms`);
}
async function demonstrateQueryOptimization(pool, optimizer) {
    const startTime = Date.now();
    const redis = await pool.acquire();
    // Create sample queries with different complexities
    const queries = [
        {
            name: 'Simple vector search',
            query: {
                vector: new Array(128).fill(0.1),
                limit: 10
            }
        },
        {
            name: 'Complex vector search with high ef',
            query: {
                vector: new Array(512).fill(0.2),
                limit: 50,
                ef: 1000 // Will be optimized down
            }
        },
        {
            name: 'Multi-modal search',
            query: {
                vector: new Array(256).fill(0.3),
                limit: 20,
                modalities: ['text', 'image', 'audio']
            }
        }
    ];
    for (const { name, query } of queries) {
        logger_1.logger.info(`\nOptimizing: ${name}`);
        const plan = await optimizer.optimizeVectorSearch(redis, query);
        logger_1.logger.info(`Original complexity: ${plan.estimatedCost.toFixed(2)}`);
        logger_1.logger.info(`Execution strategy: ${plan.executionStrategy}`);
        logger_1.logger.info(`Cache strategy: ${plan.cacheStrategy}`);
        logger_1.logger.info(`Index hints: ${plan.indexHints.length}`);
        // Show optimization effects
        if (query.ef && plan.optimizedQuery.ef !== query.ef) {
            logger_1.logger.info(`EF parameter optimized: ${query.ef} → ${plan.optimizedQuery.ef}`);
        }
        // Execute the optimized query
        try {
            const result = await optimizer.executeOptimizedQuery(redis, plan);
            logger_1.logger.info(`Query executed successfully, found ${result.total} results`);
        }
        catch (error) {
            logger_1.logger.warn(`Query execution failed (expected in demo): ${error.message}`);
        }
    }
    const metrics = optimizer.getMetrics();
    logger_1.logger.info(`\nOptimization metrics:`);
    logger_1.logger.info(`Total queries: ${metrics.totalQueries}`);
    logger_1.logger.info(`Optimized queries: ${metrics.optimizedQueries}`);
    logger_1.logger.info(`Optimization rate: ${(metrics.optimizationRate * 100).toFixed(1)}%`);
    logger_1.logger.info(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
    pool.release(redis);
    logger_1.logger.info(`Query optimization demo completed in ${Date.now() - startTime}ms`);
}
async function demonstratePerformanceMonitoring(pool, batcher, prefetch, optimizer, monitor) {
    const startTime = Date.now();
    // Update monitor with current metrics
    const poolMetrics = pool.getMetrics();
    const batchMetrics = batcher.getMetrics();
    const prefetchMetrics = prefetch.getMetrics();
    const queryMetrics = optimizer.getMetrics();
    monitor.updateConnectionPoolMetrics(poolMetrics.poolUtilization);
    monitor.updateBatchingMetrics(batchMetrics.batchingEfficiency);
    monitor.updateCacheMetrics(prefetchMetrics.hitRate);
    // Simulate some performance issues for demonstration
    monitor.updateQueryLatency(150); // Reasonable latency
    const currentMetrics = monitor.getMetrics();
    logger_1.logger.info('Current performance metrics:');
    logger_1.logger.info(`Memory usage: ${(currentMetrics.memoryUsage.heap / 1024 / 1024).toFixed(1)}MB heap`);
    logger_1.logger.info(`Connection pool utilization: ${(currentMetrics.connectionPoolUtilization * 100).toFixed(1)}%`);
    logger_1.logger.info(`Batching efficiency: ${(currentMetrics.batchingEfficiency * 100).toFixed(1)}%`);
    logger_1.logger.info(`Cache hit rate: ${(currentMetrics.cacheHitRate * 100).toFixed(1)}%`);
    logger_1.logger.info(`Query latency P95: ${currentMetrics.queryLatency.p95}ms`);
    // Generate optimization recommendations
    const recommendations = monitor.generateOptimizationRecommendations();
    logger_1.logger.info(`\nOptimization recommendations (${recommendations.length}):`);
    recommendations.forEach((rec, index) => {
        logger_1.logger.info(`${index + 1}. [${rec.severity.toUpperCase()}] ${rec.type}: ${rec.description}`);
        logger_1.logger.info(`   Action: ${rec.action}`);
        logger_1.logger.info(`   Expected improvement: ${rec.expectedImprovement}`);
    });
    // Simulate performance improvement
    monitor.updateQueryLatency(50); // Better latency
    monitor.updateCacheMetrics(0.95); // Better cache hit rate
    const improvedRecommendations = monitor.generateOptimizationRecommendations();
    logger_1.logger.info(`\nRecommendations after improvements: ${improvedRecommendations.length}`);
    logger_1.logger.info(`Performance monitoring demo completed in ${Date.now() - startTime}ms`);
}
async function demonstrateHighLoadPerformance(pool, batcher, prefetch, monitor) {
    const startTime = Date.now();
    logger_1.logger.info('Starting high load simulation with 100 concurrent operations...');
    const operations = [];
    // Create 100 concurrent operations
    for (let i = 0; i < 100; i++) {
        operations.push((async () => {
            const redis = await pool.acquire();
            try {
                // Mix of different operations
                if (i % 3 === 0) {
                    // Prefetch operation
                    await prefetch.get(redis, `load-test:${i}`);
                }
                else if (i % 3 === 1) {
                    // Batch operation
                    const request = {
                        id: `load-${i}`,
                        operation: 'GET',
                        key: `load-test:batch:${i}`,
                        priority: Math.floor(Math.random() * 3),
                        timestamp: Date.now()
                    };
                    await batcher.execute(redis, request);
                }
                else {
                    // Direct Redis operation
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
                }
            }
            finally {
                pool.release(redis);
            }
        })());
    }
    // Execute all operations concurrently
    await Promise.all(operations);
    const endTime = Date.now();
    const duration = endTime - startTime;
    // Collect final metrics
    const poolMetrics = pool.getMetrics();
    const batchMetrics = batcher.getMetrics();
    const prefetchMetrics = prefetch.getMetrics();
    logger_1.logger.info(`\nHigh load test completed in ${duration}ms`);
    logger_1.logger.info(`Throughput: ${(100 / (duration / 1000)).toFixed(1)} operations/second`);
    logger_1.logger.info(`\nFinal metrics:`);
    logger_1.logger.info(`Pool - Acquisitions: ${poolMetrics.totalAcquisitions}, Releases: ${poolMetrics.totalReleases}`);
    logger_1.logger.info(`Pool - Max utilization: ${(poolMetrics.poolUtilization * 100).toFixed(1)}%`);
    logger_1.logger.info(`Batch - Total requests: ${batchMetrics.totalRequests}, Efficiency: ${(batchMetrics.batchingEfficiency * 100).toFixed(1)}%`);
    logger_1.logger.info(`Cache - Hit rate: ${(prefetchMetrics.hitRate * 100).toFixed(1)}%, Size: ${prefetchMetrics.cacheSize} entries`);
    // Update monitor and get recommendations
    monitor.updateConnectionPoolMetrics(poolMetrics.poolUtilization);
    monitor.updateBatchingMetrics(batchMetrics.batchingEfficiency);
    monitor.updateCacheMetrics(prefetchMetrics.hitRate);
    const recommendations = monitor.generateOptimizationRecommendations();
    if (recommendations.length > 0) {
        logger_1.logger.info(`\nPost-load recommendations:`);
        recommendations.forEach(rec => {
            logger_1.logger.info(`- ${rec.type}: ${rec.description}`);
        });
    }
    else {
        logger_1.logger.info('\n✅ No performance issues detected after high load test');
    }
}
// Run the demo if this file is executed directly
if (require.main === module) {
    demonstratePerformanceOptimization().catch(error => {
        logger_1.logger.error('Demo failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=performance-demo.js.map