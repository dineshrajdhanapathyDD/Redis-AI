import { Redis } from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import { RateLimitConfig } from './types';
export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetTime: number;
    totalRequests: number;
}
export interface RateLimitInfo {
    key: string;
    windowMs: number;
    maxRequests: number;
    currentRequests: number;
    resetTime: number;
}
export declare class RateLimitService {
    private redis;
    constructor(redis: Redis);
    /**
     * Check rate limit for a key
     */
    checkRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult>;
    /**
     * Create Express middleware for rate limiting
     */
    createMiddleware(config: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
    /**
     * Create sliding window rate limiter
     */
    checkSlidingWindowRateLimit(key: string, maxRequests: number, windowMs: number, subWindowCount?: number): Promise<RateLimitResult>;
    /**
     * Create distributed rate limiter using Redis Lua script
     */
    checkDistributedRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult>;
    /**
     * Get rate limit info for a key
     */
    getRateLimitInfo(key: string, windowMs: number): Promise<RateLimitInfo>;
    /**
     * Reset rate limit for a key
     */
    resetRateLimit(key: string): Promise<void>;
    /**
     * Get all rate limited keys
     */
    getRateLimitedKeys(pattern?: string): Promise<string[]>;
    /**
     * Clean up expired rate limit entries
     */
    cleanupExpiredEntries(): Promise<void>;
    /**
     * Create adaptive rate limiter that adjusts based on system load
     */
    checkAdaptiveRateLimit(key: string, baseMaxRequests: number, windowMs: number, systemLoadFactor?: number): Promise<RateLimitResult>;
    /**
     * Get default key for rate limiting
     */
    private getDefaultKey;
    /**
     * Log security event
     */
    private logSecurityEvent;
    /**
     * Common rate limit configurations
     */
    static configs: {
        login: {
            windowMs: number;
            maxRequests: number;
            skipSuccessfulRequests: boolean;
        };
        registration: {
            windowMs: number;
            maxRequests: number;
        };
        passwordReset: {
            windowMs: number;
            maxRequests: number;
        };
        api: {
            windowMs: number;
            maxRequests: number;
        };
        search: {
            windowMs: number;
            maxRequests: number;
        };
        upload: {
            windowMs: number;
            maxRequests: number;
        };
        mfa: {
            windowMs: number;
            maxRequests: number;
        };
    };
}
//# sourceMappingURL=rate-limit-service.d.ts.map