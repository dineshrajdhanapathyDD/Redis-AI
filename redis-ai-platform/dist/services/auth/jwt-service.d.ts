import { Redis } from 'ioredis';
import { TokenPayload, AuthTokens, User, SecurityConfig } from './types';
export declare class JWTService {
    private redis;
    private config;
    constructor(redis: Redis, config: SecurityConfig);
    /**
     * Generate access and refresh tokens for a user
     */
    generateTokens(user: User, deviceFingerprint?: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
    /**
     * Verify and decode an access token
     */
    verifyAccessToken(token: string): Promise<TokenPayload>;
    /**
     * Refresh an access token using a refresh token
     */
    refreshToken(refreshToken: string, deviceFingerprint?: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
    /**
     * Revoke a specific token
     */
    revokeToken(tokenId: string, userId: string): Promise<void>;
    /**
     * Revoke all tokens for a user
     */
    revokeAllUserTokens(userId: string): Promise<void>;
    /**
     * Check if a token is blacklisted
     */
    isTokenBlacklisted(tokenId: string): Promise<boolean>;
    /**
     * Get active sessions for a user
     */
    getUserActiveSessions(userId: string): Promise<string[]>;
    /**
     * Clean up expired tokens
     */
    cleanupExpiredTokens(): Promise<void>;
    /**
     * Parse expiry string to seconds
     */
    private parseExpiry;
    /**
     * Log security event
     */
    private logSecurityEvent;
}
//# sourceMappingURL=jwt-service.d.ts.map