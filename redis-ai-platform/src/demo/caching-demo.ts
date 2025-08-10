import { createCachingService, createCacheableRequest } from '../services/caching';
import { createEmbeddingManager } from '../services/embedding-manager';
import { createRedisManager } from '../config/redis';
import { AIRequestType } from '../types';
import config from '../config/environment';
import logger from '../utils/logger';

async function runCachingDemo() {
  try {
    logger.info('Starting Redis AI Platform Semantic Caching Demo');

    // Initialize Redis connection
    const redisManager = createRedisManager(config.redis);
    await redisManager.connect();
    await redisManager.createVectorIndex(config.vectorIndex);

    // Initialize embedding manager (required for semantic caching)
    const embeddingManager = createEmbeddingManager({
      primaryProvider: 'local',
      enableCrossModal: false,
      batchSize: 10,
    });

    // Initialize caching service
    const cachingService = createCachingService({
      enableSemanticCaching: true,
      enableResponseCaching: true,
      enableQueryNormalization: true,
      enableWarmup: true,
      similarityThreshold: 0.85,
      maxCacheSize: 1000,
      defaultTTL: 30 * 60 * 1000, // 30 minutes
      minResponseQuality: 0.7,
    });

    logger.info('Caching system initialized successfully');

    // Demo 1: Basic caching and retrieval
    logger.info('Demo 1: Basic caching and retrieval');
    
    const basicRequest = createCacheableRequest(
      'What is Redis and how is it used in AI applications?',
      AIRequestType.QUESTION_ANSWERING
    );

    // Simulate an AI response
    const aiResponse = {
      content: 'Redis is an in-memory data structure store that serves as a database, cache, and message broker. In AI applications, Redis is particularly valuable for vector storage and similarity search, enabling fast retrieval of embeddings for machine learning models. It supports real-time data processing and can handle high-throughput AI workloads efficiently.',
      model: 'gpt-4',
      usage: {
        promptTokens: 15,
        completionTokens: 65,
        totalTokens: 80,
      },
    };

    const responseMetadata = {
      model: 'gpt-4',
      responseTime: 2500,
      tokenUsage: aiResponse.usage,
      cost: 0.008,
      quality: 0.92,
    };

    // First request - cache miss
    logger.info('First request (cache miss):');
    const startTime1 = Date.now();
    let cacheResult = await cachingService.getCachedResponse(basicRequest);
    const queryTime1 = Date.now() - startTime1;

    logger.info('Cache result:', {
      hit: cacheResult.hit,
      source: cacheResult.source,
      queryTime: `${queryTime1}ms`,
    });

    // Cache the response
    await cachingService.cacheResponse(basicRequest, aiResponse, responseMetadata);
    logger.info('Response cached successfully');

    // Second request - cache hit
    logger.info('Second request (cache hit):');
    const startTime2 = Date.now();
    cacheResult = await cachingService.getCachedResponse(basicRequest);
    const queryTime2 = Date.now() - startTime2;

    logger.info('Cache result:', {
      hit: cacheResult.hit,
      source: cacheResult.source,
      similarity: cacheResult.similarity?.toFixed(3),
      timeSaved: `${cacheResult.timeSaved}ms`,
      costSaved: `$${cacheResult.costSaved?.toFixed(4)}`,
      queryTime: `${queryTime2}ms`,
      speedup: `${Math.round(queryTime1 / Math.max(queryTime2, 1))}x faster`,
    });

    // Demo 2: Semantic similarity matching
    logger.info('Demo 2: Semantic similarity matching');
    
    const similarQueries = [
      'How does Redis work with artificial intelligence?',
      'Explain Redis usage in machine learning applications',
      'What are the benefits of using Redis for AI systems?',
      'Can you describe Redis in the context of AI development?',
    ];

    for (const [index, query] of similarQueries.entries()) {
      const similarRequest = createCacheableRequest(query, AIRequestType.QUESTION_ANSWERING);
      
      const startTime = Date.now();
      const result = await cachingService.getCachedResponse(similarRequest);
      const queryTime = Date.now() - startTime;

      logger.info(`Similar query ${index + 1}:`, {
        query: query.substring(0, 50) + '...',
        hit: result.hit,
        similarity: result.similarity?.toFixed(3),
        source: result.source,
        queryTime: `${queryTime}ms`,
        timeSaved: result.timeSaved ? `${result.timeSaved}ms` : 'N/A',
      });
    }

    // Demo 3: Different request types and caching
    logger.info('Demo 3: Different request types and caching');
    
    const requestTypes = [
      {
        type: AIRequestType.TEXT_GENERATION,
        query: 'Write a brief explanation of vector databases',
        response: {
          content: 'Vector databases are specialized database systems designed to store, index, and query high-dimensional vector data efficiently. They are essential for AI applications that work with embeddings, such as similarity search, recommendation systems, and retrieval-augmented generation (RAG). These databases use advanced indexing techniques like HNSW or IVF to enable fast approximate nearest neighbor searches.',
          model: 'gpt-3.5-turbo',
          usage: { promptTokens: 12, completionTokens: 58, totalTokens: 70 },
        },
        metadata: {
          model: 'gpt-3.5-turbo',
          responseTime: 1800,
          tokenUsage: { promptTokens: 12, completionTokens: 58, totalTokens: 70 },
          cost: 0.0035,
          quality: 0.88,
        },
      },
      {
        type: AIRequestType.CODE_GENERATION,
        query: 'Generate Python code to connect to Redis and store a vector',
        response: {
          content: `import redis
import numpy as np

# Connect to Redis
r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Store a vector
def store_vector(key, vector):
    vector_json = {
        'vector': vector.tolist(),
        'timestamp': time.time()
    }
    r.json().set(key, '$', vector_json)
    return True

# Example usage
vector = np.random.rand(128)
store_vector('my_vector', vector)`,
          model: 'gpt-4',
          usage: { promptTokens: 18, completionTokens: 95, totalTokens: 113 },
        },
        metadata: {
          model: 'gpt-4',
          responseTime: 3200,
          tokenUsage: { promptTokens: 18, completionTokens: 95, totalTokens: 113 },
          cost: 0.0113,
          quality: 0.94,
        },
      },
      {
        type: AIRequestType.SUMMARIZATION,
        query: 'Summarize the key benefits of using semantic caching in AI systems',
        response: {
          content: 'Semantic caching in AI systems provides significant benefits: 1) Reduced latency by serving similar queries from cache instead of recomputing, 2) Cost savings by avoiding redundant API calls to expensive AI models, 3) Improved user experience through faster response times, 4) Better resource utilization by reducing computational load, and 5) Enhanced scalability by handling more concurrent users with the same infrastructure.',
          model: 'claude-2',
          usage: { promptTokens: 16, completionTokens: 72, totalTokens: 88 },
        },
        metadata: {
          model: 'claude-2',
          responseTime: 2100,
          tokenUsage: { promptTokens: 16, completionTokens: 72, totalTokens: 88 },
          cost: 0.0088,
          quality: 0.91,
        },
      },
    ];

    for (const requestData of requestTypes) {
      const request = createCacheableRequest(requestData.query, requestData.type);
      
      // Cache the response
      await cachingService.cacheResponse(request, requestData.response, requestData.metadata);
      
      // Verify it's cached
      const cacheResult = await cachingService.getCachedResponse(request);
      
      logger.info(`${requestData.type} request:`, {
        cached: cacheResult.hit,
        model: requestData.metadata.model,
        cost: `$${requestData.metadata.cost.toFixed(4)}`,
        quality: requestData.metadata.quality.toFixed(2),
      });
    }

    // Demo 4: Cache warmup
    logger.info('Demo 4: Cache warmup with common queries');
    
    const warmupQueries = [
      {
        query: 'What is machine learning?',
        type: AIRequestType.QUESTION_ANSWERING,
        model: 'gpt-3.5-turbo',
      },
      {
        query: 'Explain neural networks',
        type: AIRequestType.TEXT_GENERATION,
        model: 'gpt-4',
      },
      {
        query: 'How do transformers work in NLP?',
        type: AIRequestType.QUESTION_ANSWERING,
        model: 'claude-2',
      },
      {
        query: 'Write code for a simple neural network',
        type: AIRequestType.CODE_GENERATION,
        model: 'gpt-4',
      },
    ];

    await cachingService.warmupCache(warmupQueries);
    logger.info(`Cache warmed up with ${warmupQueries.length} queries`);

    // Verify warmup worked
    for (const warmupQuery of warmupQueries.slice(0, 2)) {
      const request = createCacheableRequest(warmupQuery.query, warmupQuery.type);
      const result = await cachingService.getCachedResponse(request, warmupQuery.model);
      
      logger.info(`Warmup verification:`, {
        query: warmupQuery.query.substring(0, 30) + '...',
        hit: result.hit,
        source: result.source,
      });
    }

    // Demo 5: Cache statistics and performance
    logger.info('Demo 5: Cache statistics and performance analysis');
    
    const stats = await cachingService.getCacheStats();
    logger.info('Cache statistics:', {
      totalEntries: stats.semantic.totalEntries,
      hitRate: `${(stats.performance.hitRate * 100).toFixed(1)}%`,
      averageTimeSaved: `${stats.performance.averageTimeSaved.toFixed(0)}ms`,
      totalCostSaved: `$${stats.performance.totalCostSaved.toFixed(4)}`,
      cacheEfficiency: `${(stats.performance.cacheEfficiency * 100).toFixed(1)}%`,
      storageUsed: `${Math.round(stats.semantic.storageUsed / 1024)}KB`,
    });

    // Demo 6: Cache optimization
    logger.info('Demo 6: Cache optimization');
    
    const optimizationResult = await cachingService.optimizeCache();
    logger.info('Cache optimization results:', {
      entriesEvicted: optimizationResult.entriesEvicted,
      storageReclaimed: `${Math.round(optimizationResult.storageReclaimed / 1024)}KB`,
      optimizationTime: `${optimizationResult.optimizationTime}ms`,
    });

    // Demo 7: Query normalization effects
    logger.info('Demo 7: Query normalization effects');
    
    const normalizedQueries = [
      'What is Redis?',
      'what is redis?',
      'What is Redis???',
      'WHAT IS REDIS',
      'What    is    Redis   ?',
    ];

    // Cache the first query
    const firstNormalizedRequest = createCacheableRequest(
      normalizedQueries[0]!,
      AIRequestType.QUESTION_ANSWERING
    );
    
    const normalizedResponse = {
      content: 'Redis is an open-source, in-memory data structure store.',
      model: 'gpt-3.5-turbo',
      usage: { promptTokens: 5, completionTokens: 12, totalTokens: 17 },
    };

    await cachingService.cacheResponse(firstNormalizedRequest, normalizedResponse, {
      model: 'gpt-3.5-turbo',
      responseTime: 1200,
      tokenUsage: normalizedResponse.usage,
      cost: 0.0017,
      quality: 0.85,
    });

    // Test all variations
    for (const [index, query] of normalizedQueries.entries()) {
      const request = createCacheableRequest(query, AIRequestType.QUESTION_ANSWERING);
      const result = await cachingService.getCachedResponse(request);
      
      logger.info(`Normalized query ${index + 1}:`, {
        query: `"${query}"`,
        hit: result.hit,
        similarity: result.similarity?.toFixed(3),
        source: result.source,
      });
    }

    // Demo 8: Cache invalidation
    logger.info('Demo 8: Cache invalidation');
    
    // Add some entries to invalidate
    const invalidationQueries = [
      'Redis tutorial for beginners',
      'Redis advanced features',
      'MongoDB tutorial for beginners',
      'PostgreSQL advanced features',
    ];

    for (const query of invalidationQueries) {
      const request = createCacheableRequest(query, AIRequestType.TEXT_GENERATION);
      const response = {
        content: `Tutorial content for: ${query}`,
        model: 'gpt-3.5-turbo',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      };

      await cachingService.cacheResponse(request, response, {
        model: 'gpt-3.5-turbo',
        responseTime: 1500,
        tokenUsage: response.usage,
        cost: 0.003,
        quality: 0.8,
      });
    }

    // Invalidate Redis-related entries
    const invalidatedCount = await cachingService.invalidateCache('Redis');
    logger.info(`Invalidated ${invalidatedCount} Redis-related cache entries`);

    // Verify invalidation
    for (const query of invalidationQueries) {
      const request = createCacheableRequest(query, AIRequestType.TEXT_GENERATION);
      const result = await cachingService.getCachedResponse(request);
      
      logger.info(`Post-invalidation check:`, {
        query: query.substring(0, 25) + '...',
        hit: result.hit,
        expectedHit: !query.includes('Redis'),
      });
    }

    // Demo 9: Performance comparison
    logger.info('Demo 9: Performance comparison (cached vs uncached)');
    
    const performanceTestQuery = 'Explain the architecture of modern AI systems';
    const performanceRequest = createCacheableRequest(
      performanceTestQuery,
      AIRequestType.TEXT_GENERATION
    );

    // Simulate uncached response time
    const uncachedStartTime = Date.now();
    await new Promise<void>(resolve => setTimeout(resolve, 2500)); // Simulate AI model latency
    const uncachedTime = Date.now() - uncachedStartTime;

    // Cache a response
    const performanceResponse = {
      content: 'Modern AI systems typically follow a layered architecture with data ingestion, preprocessing, model training/inference, and application layers. They leverage distributed computing, vector databases for embeddings, and real-time processing capabilities.',
      model: 'gpt-4',
      usage: { promptTokens: 12, completionTokens: 45, totalTokens: 57 },
    };

    await cachingService.cacheResponse(performanceRequest, performanceResponse, {
      model: 'gpt-4',
      responseTime: uncachedTime,
      tokenUsage: performanceResponse.usage,
      cost: 0.0057,
      quality: 0.93,
    });

    // Test cached response time
    const cachedStartTime = Date.now();
    const cachedResult = await cachingService.getCachedResponse(performanceRequest);
    const cachedTime = Date.now() - cachedStartTime;

    logger.info('Performance comparison:', {
      uncachedTime: `${uncachedTime}ms`,
      cachedTime: `${cachedTime}ms`,
      speedup: `${Math.round(uncachedTime / Math.max(cachedTime, 1))}x faster`,
      timeSaved: `${cachedResult.timeSaved}ms`,
      costSaved: `$${cachedResult.costSaved?.toFixed(4)}`,
      cacheHit: cachedResult.hit,
    });

    // Demo 10: Final statistics
    logger.info('Demo 10: Final cache statistics');
    
    const finalStats = await cachingService.getCacheStats();
    logger.info('Final cache performance:', {
      totalEntries: finalStats.semantic.totalEntries,
      hitRate: `${(finalStats.performance.hitRate * 100).toFixed(1)}%`,
      totalTimeSaved: `${finalStats.performance.averageTimeSaved.toFixed(0)}ms avg`,
      totalCostSaved: `$${finalStats.performance.totalCostSaved.toFixed(4)}`,
      cacheEfficiency: `${(finalStats.performance.cacheEfficiency * 100).toFixed(1)}%`,
      evictionCount: finalStats.semantic.evictionCount,
      storageUsed: `${Math.round(finalStats.semantic.storageUsed / 1024)}KB`,
    });

    logger.info('Redis AI Platform Semantic Caching Demo completed successfully!');
    
    // Cleanup
    await cachingService.cleanup();
    await redisManager.disconnect();

  } catch (error) {
    logger.error('Caching demo failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runCachingDemo().catch((error) => {
    console.error('Failed to run caching demo:', error);
    process.exit(1);
  });
}

export { runCachingDemo };