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
export declare function createAuthServices(redis: Redis, config: SecurityConfig): {
    authService: AuthService;
    rateLimitService: RateLimitService;
    validationService: ValidationService;
};
/**
 * Default security configuration
 */
export declare const defaultSecurityConfig: SecurityConfig;
//# sourceMappingURL=index.d.ts.map