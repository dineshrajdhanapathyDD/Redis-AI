"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultSecurityConfig = void 0;
exports.createAuthServices = createAuthServices;
__exportStar(require("./types"), exports);
__exportStar(require("./auth-service"), exports);
__exportStar(require("./jwt-service"), exports);
__exportStar(require("./password-service"), exports);
__exportStar(require("./mfa-service"), exports);
__exportStar(require("./rbac-service"), exports);
__exportStar(require("./validation-service"), exports);
__exportStar(require("./rate-limit-service"), exports);
const auth_service_1 = require("./auth-service");
const rate_limit_service_1 = require("./rate-limit-service");
const validation_service_1 = require("./validation-service");
/**
 * Create and configure authentication services
 */
function createAuthServices(redis, config) {
    const authService = new auth_service_1.AuthService(redis, config);
    const rateLimitService = new rate_limit_service_1.RateLimitService(redis);
    const validationService = new validation_service_1.ValidationService();
    return {
        authService,
        rateLimitService,
        validationService,
    };
}
/**
 * Default security configuration
 */
exports.defaultSecurityConfig = {
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
//# sourceMappingURL=index.js.map