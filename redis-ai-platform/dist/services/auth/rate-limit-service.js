"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimitService = void 0;
const logger_1 = require("../../utils/logger");
const types_1 = require("./types");
class RateLimitService {
    redis;
    constructor(redis) {
        this.redis = redis;
    }
    /**
     * Check rate limit for a key
     */
    async checkRateLimit(key, config) {
        try {
            const now = Date.now();
            const windowStart = now - config.windowMs;
            const rateLimitKey = `rate_limit:${key}`;
            // Use Redis pipeline for atomic operations
            const pipeline = this.redis.pipeline();
            // Remove expired entries
            pipeline.zremrangebyscore(rateLimitKey, 0, windowStart);
            // Count current requests in window
            pipeline.zcard(rateLimitKey);
            // Add current request
            pipeline.zadd(rateLimitKey, now, `${now}-${Math.random()}`);
            // Set expiry for the key
            pipeline.expire(rateLimitKey, Math.ceil(config.windowMs / 1000));
            const results = await pipeline.exec();
            if (!results) {
                throw new Error('Redis pipeline execution failed');
            }
            const currentRequests = results[1][1] || 0;
            const allowed = currentRequests < config.maxRequests;
            if (!allowed) {
                // Remove the request we just added since it's not allowed
                await this.redis.zrem(rateLimitKey, `${now}-${Math.random()}`);
                // Log rate limit exceeded
                await this.logSecurityEvent({
                    type: types_1.SecurityEventType.SUSPICIOUS_ACTIVITY,
                    description: 'Rate limit exceeded',
                    metadata: {
                        key,
                        currentRequests: currentRequests + 1,
                        maxRequests: config.maxRequests,
                        windowMs: config.windowMs,
                    },
                    severity: 'medium',
                });
            }
            return {
                allowed,
                remaining: Math.max(0, config.maxRequests - currentRequests - (allowed ? 1 : 0)),
                resetTime: now + config.windowMs,
                totalRequests: currentRequests + (allowed ? 1 : 0),
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking rate limit:', error);
            // Fail open - allow request if rate limiting fails
            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: Date.now() + config.windowMs,
                totalRequests: 1,
            };
        }
    }
    /**
     * Create Express middleware for rate limiting
     */
    createMiddleware(config) {
        return async (req, res, next) => {
            try {
                // Generate key for rate limiting
                const key = config.keyGenerator ? config.keyGenerator(req) : this.getDefaultKey(req);
                // Skip if configured to skip successful/failed requests
                if (config.skipSuccessfulRequests && res.statusCode < 400) {
                    return next();
                }
                if (config.skipFailedRequests && res.statusCode >= 400) {
                    return next();
                }
                const result = await this.checkRateLimit(key, config);
                // Set rate limit headers
                res.set({
                    'X-RateLimit-Limit': config.maxRequests.toString(),
                    'X-RateLimit-Remaining': result.remaining.toString(),
                    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
                    'X-RateLimit-Window': config.windowMs.toString(),
                });
                if (!result.allowed) {
                    // Call custom handler if provided
                    if (config.onLimitReached) {
                        config.onLimitReached(req, res);
                    }
                    res.status(429).json({
                        error: 'Too Many Requests',
                        message: 'Rate limit exceeded. Please try again later.',
                        retryAfter: Math.ceil(config.windowMs / 1000),
                        limit: config.maxRequests,
                        remaining: result.remaining,
                        resetTime: result.resetTime,
                    });
                    return;
                }
                next();
            }
            catch (error) {
                logger_1.logger.error('Rate limiting middleware error:', error);
                // Fail open - continue with request
                next();
            }
        };
    }
    /**
     * Create sliding window rate limiter
     */
    async checkSlidingWindowRateLimit(key, maxRequests, windowMs, subWindowCount = 10) {
        try {
            const now = Date.now();
            const subWindowMs = Math.floor(windowMs / subWindowCount);
            const currentWindow = Math.floor(now / subWindowMs);
            const pipeline = this.redis.pipeline();
            // Get counts for all sub-windows in the current window
            for (let i = 0; i < subWindowCount; i++) {
                const windowKey = `sliding_rate_limit:${key}:${currentWindow - i}`;
                pipeline.get(windowKey);
            }
            const results = await pipeline.exec();
            if (!results) {
                throw new Error('Redis pipeline execution failed');
            }
            // Calculate total requests in the sliding window
            let totalRequests = 0;
            for (const result of results) {
                const count = parseInt(result[1]) || 0;
                totalRequests += count;
            }
            const allowed = totalRequests < maxRequests;
            if (allowed) {
                // Increment current sub-window counter
                const currentWindowKey = `sliding_rate_limit:${key}:${currentWindow}`;
                await this.redis.incr(currentWindowKey);
                await this.redis.expire(currentWindowKey, Math.ceil(windowMs / 1000));
                totalRequests++;
            }
            return {
                allowed,
                remaining: Math.max(0, maxRequests - totalRequests),
                resetTime: now + subWindowMs,
                totalRequests,
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking sliding window rate limit:', error);
            return {
                allowed: true,
                remaining: maxRequests - 1,
                resetTime: Date.now() + windowMs,
                totalRequests: 1,
            };
        }
    }
    /**
     * Create distributed rate limiter using Redis Lua script
     */
    async checkDistributedRateLimit(key, maxRequests, windowMs) {
        try {
            const now = Date.now();
            const windowStart = now - windowMs;
            // Lua script for atomic rate limiting
            const luaScript = `
        local key = KEYS[1]
        local window_start = tonumber(ARGV[1])
        local max_requests = tonumber(ARGV[2])
        local now = tonumber(ARGV[3])
        local window_ms = tonumber(ARGV[4])
        
        -- Remove expired entries
        redis.call('ZREMRANGEBYSCORE', key, 0, window_start)
        
        -- Get current count
        local current_count = redis.call('ZCARD', key)
        
        if current_count < max_requests then
          -- Add current request
          redis.call('ZADD', key, now, now .. '-' .. math.random())
          redis.call('EXPIRE', key, math.ceil(window_ms / 1000))
          return {1, max_requests - current_count - 1, now + window_ms, current_count + 1}
        else
          return {0, 0, now + window_ms, current_count}
        end
      `;
            const result = await this.redis.eval(luaScript, 1, `rate_limit:${key}`, windowStart.toString(), maxRequests.toString(), now.toString(), windowMs.toString());
            return {
                allowed: result[0] === 1,
                remaining: result[1],
                resetTime: result[2],
                totalRequests: result[3],
            };
        }
        catch (error) {
            logger_1.logger.error('Error checking distributed rate limit:', error);
            return {
                allowed: true,
                remaining: maxRequests - 1,
                resetTime: Date.now() + windowMs,
                totalRequests: 1,
            };
        }
    }
    /**
     * Get rate limit info for a key
     */
    async getRateLimitInfo(key, windowMs) {
        try {
            const now = Date.now();
            const windowStart = now - windowMs;
            const rateLimitKey = `rate_limit:${key}`;
            // Count current requests in window
            await this.redis.zremrangebyscore(rateLimitKey, 0, windowStart);
            const currentRequests = await this.redis.zcard(rateLimitKey);
            return {
                key,
                windowMs,
                maxRequests: 0, // This would need to be passed in or stored
                currentRequests,
                resetTime: now + windowMs,
            };
        }
        catch (error) {
            logger_1.logger.error('Error getting rate limit info:', error);
            return {
                key,
                windowMs,
                maxRequests: 0,
                currentRequests: 0,
                resetTime: Date.now() + windowMs,
            };
        }
    }
    /**
     * Reset rate limit for a key
     */
    async resetRateLimit(key) {
        try {
            const rateLimitKey = `rate_limit:${key}`;
            await this.redis.del(rateLimitKey);
            // Also clean up sliding window counters
            const slidingKeys = await this.redis.keys(`sliding_rate_limit:${key}:*`);
            if (slidingKeys.length > 0) {
                await this.redis.del(...slidingKeys);
            }
            logger_1.logger.info(`Rate limit reset for key: ${key}`);
        }
        catch (error) {
            logger_1.logger.error('Error resetting rate limit:', error);
            throw error;
        }
    }
    /**
     * Get all rate limited keys
     */
    async getRateLimitedKeys(pattern = '*') {
        try {
            const keys = await this.redis.keys(`rate_limit:${pattern}`);
            return keys.map(key => key.replace('rate_limit:', ''));
        }
        catch (error) {
            logger_1.logger.error('Error getting rate limited keys:', error);
            return [];
        }
    }
    /**
     * Clean up expired rate limit entries
     */
    async cleanupExpiredEntries() {
        try {
            const now = Date.now();
            const keys = await this.redis.keys('rate_limit:*');
            for (const key of keys) {
                // Remove entries older than 24 hours
                const expiredBefore = now - (24 * 60 * 60 * 1000);
                await this.redis.zremrangebyscore(key, 0, expiredBefore);
                // Remove empty keys
                const count = await this.redis.zcard(key);
                if (count === 0) {
                    await this.redis.del(key);
                }
            }
            logger_1.logger.info('Rate limit cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('Error during rate limit cleanup:', error);
        }
    }
    /**
     * Create adaptive rate limiter that adjusts based on system load
     */
    async checkAdaptiveRateLimit(key, baseMaxRequests, windowMs, systemLoadFactor = 1.0) {
        try {
            // Adjust max requests based on system load
            const adjustedMaxRequests = Math.floor(baseMaxRequests * systemLoadFactor);
            return await this.checkRateLimit(key, {
                windowMs,
                maxRequests: adjustedMaxRequests,
            });
        }
        catch (error) {
            logger_1.logger.error('Error checking adaptive rate limit:', error);
            return {
                allowed: true,
                remaining: baseMaxRequests - 1,
                resetTime: Date.now() + windowMs,
                totalRequests: 1,
            };
        }
    }
    /**
     * Get default key for rate limiting
     */
    getDefaultKey(req) {
        // Use IP address as default key
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        return `ip:${ip}`;
    }
    /**
     * Log security event
     */
    async logSecurityEvent(event) {
        try {
            const securityEvent = {
                id: require('crypto').randomUUID(),
                timestamp: new Date(),
                ...event,
            };
            await this.redis.lpush('security_events:global', JSON.stringify(securityEvent));
            await this.redis.ltrim('security_events:global', 0, 9999);
        }
        catch (error) {
            logger_1.logger.error('Error logging security event:', error);
        }
    }
    /**
     * Common rate limit configurations
     */
    static configs = {
        login: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxRequests: 5, // 5 attempts per 15 minutes
            skipSuccessfulRequests: true,
        },
        registration: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 3, // 3 registrations per hour
        },
        passwordReset: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 3, // 3 password reset requests per hour
        },
        api: {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 100, // 100 requests per minute
        },
        search: {
            windowMs: 60 * 1000, // 1 minute
            maxRequests: 50, // 50 searches per minute
        },
        upload: {
            windowMs: 60 * 60 * 1000, // 1 hour
            maxRequests: 10, // 10 uploads per hour
        },
        mfa: {
            windowMs: 5 * 60 * 1000, // 5 minutes
            maxRequests: 5, // 5 MFA attempts per 5 minutes
        },
    };
}
exports.RateLimitService = RateLimitService;
//# sourceMappingURL=rate-limit-service.js.map