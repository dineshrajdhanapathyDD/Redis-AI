import jwt from 'jsonwebtoken';
import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import {
  TokenPayload,
  AuthTokens,
  RefreshTokenData,
  User,
  SecurityConfig,
  SecurityEvent,
  SecurityEventType,
} from './types';

export class JWTService {
  private redis: Redis;
  private config: SecurityConfig;

  constructor(redis: Redis, config: SecurityConfig) {
    this.redis = redis;
    this.config = config;
  }

  /**
   * Generate access and refresh tokens for a user
   */
  async generateTokens(
    user: User,
    deviceFingerprint?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    try {
      const tokenId = uuidv4();
      const now = Math.floor(Date.now() / 1000);
      
      // Create access token payload
      const accessTokenPayload: TokenPayload = {
        sub: user.id,
        email: user.email,
        username: user.username,
        roles: user.roles.map(role => role.name),
        permissions: user.permissions.map(perm => `${perm.resource}:${perm.action}`),
        iat: now,
        exp: now + this.parseExpiry(this.config.jwt.accessTokenExpiry),
        aud: this.config.jwt.audience,
        iss: this.config.jwt.issuer,
        jti: tokenId,
      };

      // Generate access token
      const accessToken = jwt.sign(accessTokenPayload, this.config.jwt.secret, {
        algorithm: 'HS256',
      });

      // Generate refresh token
      const refreshTokenId = uuidv4();
      const refreshToken = jwt.sign(
        {
          sub: user.id,
          jti: refreshTokenId,
          type: 'refresh',
          iat: now,
          exp: now + this.parseExpiry(this.config.jwt.refreshTokenExpiry),
        },
        this.config.jwt.secret,
        { algorithm: 'HS256' }
      );

      // Store refresh token data in Redis
      const refreshTokenData: RefreshTokenData = {
        id: refreshTokenId,
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date((now + this.parseExpiry(this.config.jwt.refreshTokenExpiry)) * 1000),
        isRevoked: false,
        deviceFingerprint,
        ipAddress,
        userAgent,
        createdAt: new Date(),
      };

      await this.redis.setex(
        `refresh_token:${refreshTokenId}`,
        this.parseExpiry(this.config.jwt.refreshTokenExpiry),
        JSON.stringify(refreshTokenData)
      );

      // Store active token for user (for session management)
      await this.redis.sadd(`user_tokens:${user.id}`, tokenId);
      await this.redis.expire(`user_tokens:${user.id}`, this.parseExpiry(this.config.jwt.refreshTokenExpiry));

      // Log security event
      await this.logSecurityEvent({
        userId: user.id,
        type: SecurityEventType.LOGIN_SUCCESS,
        description: 'User successfully authenticated',
        metadata: { tokenId, deviceFingerprint },
        ipAddress,
        userAgent,
        severity: 'low',
      });

      return {
        accessToken,
        refreshToken,
        expiresIn: this.parseExpiry(this.config.jwt.accessTokenExpiry),
        tokenType: 'Bearer',
      };
    } catch (error) {
      logger.error('Error generating tokens:', error);
      throw new Error('Failed to generate authentication tokens');
    }
  }

  /**
   * Verify and decode an access token
   */
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, this.config.jwt.secret, {
        algorithms: ['HS256'],
        audience: this.config.jwt.audience,
        issuer: this.config.jwt.issuer,
      }) as TokenPayload;

      // Check if token is blacklisted
      const isBlacklisted = await this.redis.exists(`blacklist_token:${decoded.jti}`);
      if (isBlacklisted) {
        throw new Error('Token has been revoked');
      }

      // Check if user still has active tokens
      const hasActiveTokens = await this.redis.sismember(`user_tokens:${decoded.sub}`, decoded.jti);
      if (!hasActiveTokens) {
        throw new Error('Token is no longer active');
      }

      return decoded;
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token has expired');
      }
      throw error;
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(
    refreshToken: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.jwt.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid refresh token');
      }

      // Get refresh token data from Redis
      const refreshTokenData = await this.redis.get(`refresh_token:${decoded.jti}`);
      if (!refreshTokenData) {
        throw new Error('Refresh token not found or expired');
      }

      const tokenData: RefreshTokenData = JSON.parse(refreshTokenData);
      
      if (tokenData.isRevoked) {
        throw new Error('Refresh token has been revoked');
      }

      // Verify device fingerprint if provided
      if (deviceFingerprint && tokenData.deviceFingerprint && 
          deviceFingerprint !== tokenData.deviceFingerprint) {
        await this.logSecurityEvent({
          userId: tokenData.userId,
          type: SecurityEventType.SUSPICIOUS_ACTIVITY,
          description: 'Device fingerprint mismatch during token refresh',
          metadata: { 
            expectedFingerprint: tokenData.deviceFingerprint,
            actualFingerprint: deviceFingerprint 
          },
          ipAddress,
          userAgent,
          severity: 'high',
        });
        throw new Error('Device fingerprint mismatch');
      }

      // Update last used timestamp
      tokenData.lastUsed = new Date();
      await this.redis.setex(
        `refresh_token:${decoded.jti}`,
        this.parseExpiry(this.config.jwt.refreshTokenExpiry),
        JSON.stringify(tokenData)
      );

      // Get user data (this would typically come from a user service)
      // For now, we'll create a minimal user object
      const user: Partial<User> = {
        id: tokenData.userId,
        email: '', // Would be fetched from user service
        username: '', // Would be fetched from user service
        roles: [], // Would be fetched from user service
        permissions: [], // Would be fetched from user service
      };

      // Generate new access token
      const newTokens = await this.generateTokens(
        user as User,
        deviceFingerprint,
        ipAddress,
        userAgent
      );

      // Log security event
      await this.logSecurityEvent({
        userId: tokenData.userId,
        type: SecurityEventType.TOKEN_REFRESH,
        description: 'Access token refreshed successfully',
        metadata: { refreshTokenId: decoded.jti },
        ipAddress,
        userAgent,
        severity: 'low',
      });

      return newTokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw error;
    }
  }

  /**
   * Revoke a specific token
   */
  async revokeToken(tokenId: string, userId: string): Promise<void> {
    try {
      // Add token to blacklist
      await this.redis.setex(
        `blacklist_token:${tokenId}`,
        this.parseExpiry(this.config.jwt.accessTokenExpiry),
        'revoked'
      );

      // Remove from user's active tokens
      await this.redis.srem(`user_tokens:${userId}`, tokenId);

      // Log security event
      await this.logSecurityEvent({
        userId,
        type: SecurityEventType.TOKEN_REVOKED,
        description: 'Token revoked',
        metadata: { tokenId },
        severity: 'low',
      });

      logger.info(`Token ${tokenId} revoked for user ${userId}`);
    } catch (error) {
      logger.error('Error revoking token:', error);
      throw new Error('Failed to revoke token');
    }
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllUserTokens(userId: string): Promise<void> {
    try {
      // Get all active tokens for user
      const activeTokens = await this.redis.smembers(`user_tokens:${userId}`);

      // Blacklist all tokens
      const pipeline = this.redis.pipeline();
      for (const tokenId of activeTokens) {
        pipeline.setex(
          `blacklist_token:${tokenId}`,
          this.parseExpiry(this.config.jwt.accessTokenExpiry),
          'revoked'
        );
      }
      await pipeline.exec();

      // Clear user's active tokens
      await this.redis.del(`user_tokens:${userId}`);

      // Revoke all refresh tokens for user
      const refreshTokenKeys = await this.redis.keys(`refresh_token:*`);
      for (const key of refreshTokenKeys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const data: RefreshTokenData = JSON.parse(tokenData);
          if (data.userId === userId) {
            data.isRevoked = true;
            await this.redis.setex(key, 60, JSON.stringify(data)); // Keep for 1 minute for audit
          }
        }
      }

      // Log security event
      await this.logSecurityEvent({
        userId,
        type: SecurityEventType.TOKEN_REVOKED,
        description: 'All user tokens revoked',
        metadata: { tokenCount: activeTokens.length },
        severity: 'medium',
      });

      logger.info(`All tokens revoked for user ${userId}`);
    } catch (error) {
      logger.error('Error revoking all user tokens:', error);
      throw new Error('Failed to revoke user tokens');
    }
  }

  /**
   * Check if a token is blacklisted
   */
  async isTokenBlacklisted(tokenId: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(`blacklist_token:${tokenId}`);
      return exists === 1;
    } catch (error) {
      logger.error('Error checking token blacklist:', error);
      return false;
    }
  }

  /**
   * Get active sessions for a user
   */
  async getUserActiveSessions(userId: string): Promise<string[]> {
    try {
      return await this.redis.smembers(`user_tokens:${userId}`);
    } catch (error) {
      logger.error('Error getting user active sessions:', error);
      return [];
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      const now = Date.now();
      
      // Clean up expired refresh tokens
      const refreshTokenKeys = await this.redis.keys('refresh_token:*');
      for (const key of refreshTokenKeys) {
        const tokenData = await this.redis.get(key);
        if (tokenData) {
          const data: RefreshTokenData = JSON.parse(tokenData);
          if (data.expiresAt.getTime() < now) {
            await this.redis.del(key);
          }
        }
      }

      // Clean up expired blacklisted tokens (they expire automatically with TTL)
      
      logger.info('Token cleanup completed');
    } catch (error) {
      logger.error('Error during token cleanup:', error);
    }
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiry(expiry: string): number {
    const unit = expiry.slice(-1);
    const value = parseInt(expiry.slice(0, -1));
    
    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 60 * 60;
      case 'd': return value * 60 * 60 * 24;
      default: return parseInt(expiry);
    }
  }

  /**
   * Log security event
   */
  private async logSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const securityEvent: SecurityEvent = {
        id: uuidv4(),
        timestamp: new Date(),
        ...event,
      };

      await this.redis.lpush(
        `security_events:${event.userId}`,
        JSON.stringify(securityEvent)
      );

      // Keep only last 1000 events per user
      await this.redis.ltrim(`security_events:${event.userId}`, 0, 999);

      // Also store in global security log
      await this.redis.lpush('security_events:global', JSON.stringify(securityEvent));
      await this.redis.ltrim('security_events:global', 0, 9999);

      logger.info('Security event logged:', securityEvent);
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}