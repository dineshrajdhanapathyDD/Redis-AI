export * from './types';
export * from './auth-service';
export * from './jwt-service';
export * from './password-service';
export * from './mfa-service';
export * from './rbac-service';
export * from './validation-service';
export * from './rate-limit-service';

import { Redis } from 'ioredis';
import { AuthService } from './auth-service';
import { RateLimitService } from './rate-limit-service';
import { ValidationService } from './validation-service';
import { SecurityConfig } from './types';

/**
 * Create and configure authentication services
 */
export function createAuthServices(redis: Redis, config: SecurityConfig) {
  const authService = new AuthService(redis, config);
  const rateLimitService = new RateLimitService(redis);
  const validationService = new ValidationService();

  return {
    authService,
    rateLimitService,
    validationService,
  };
}

/**
 * Default security configuration
 */
export const defaultSecurityConfig: SecurityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    accessTokenExpiry: '15m',
    refreshTokenExpiry: '7d',
    issuer: 'redis-ai-platform',
    audience: 'redis-ai-platform-users',
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90, // 90 days
  },
  mfa: {
    enabled: true,
    issuer: 'Redis AI Platform',
    window: 2, // Allow 2 time steps before/after current
  },
  rateLimit: {
    login: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      skipSuccessfulRequests: true,
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
    },
    registration: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
    passwordReset: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
    },
  },
  security: {
    maxFailedAttempts: 5,
    lockoutDuration: 30, // 30 minutes
    sessionTimeout: 60, // 60 minutes
    requireEmailVerification: false,
    allowMultipleSessions: true,
  },
};