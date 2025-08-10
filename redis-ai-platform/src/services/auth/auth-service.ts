import { Redis } from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../../utils/logger';
import { JWTService } from './jwt-service';
import { PasswordService } from './password-service';
import { MfaService } from './mfa-service';
import { RBACService } from './rbac-service';
import {
  User,
  AuthTokens,
  LoginRequest,
  RegisterRequest,
  PasswordResetRequest,
  PasswordResetConfirm,
  ChangePasswordRequest,
  MfaSetupRequest,
  MfaVerifyRequest,
  SecurityConfig,
  SecurityEvent,
  SecurityEventType,
  AuthContext,
  UserMetadata,
} from './types';

export class AuthService {
  private redis: Redis;
  private config: SecurityConfig;
  private jwtService: JWTService;
  private passwordService: PasswordService;
  private mfaService: MfaService;
  private rbacService: RBACService;

  constructor(redis: Redis, config: SecurityConfig) {
    this.redis = redis;
    this.config = config;
    this.jwtService = new JWTService(redis, config);
    this.passwordService = new PasswordService(redis, config);
    this.mfaService = new MfaService(redis, config);
    this.rbacService = new RBACService(redis);
  }

  /**
   * Initialize the authentication service
   */
  async initialize(): Promise<void> {
    try {
      await this.rbacService.initializeDefaultRoles();
      logger.info('Authentication service initialized');
    } catch (error) {
      logger.error('Error initializing authentication service:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  async register(
    request: RegisterRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; tokens?: AuthTokens }> {
    try {
      // Check if user already exists
      const existingUser = await this.getUserByEmail(request.email);
      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      const existingUsername = await this.getUserByUsername(request.username);
      if (existingUsername) {
        throw new Error('Username is already taken');
      }

      // Hash password
      const passwordHash = await this.passwordService.hashPassword(request.password);

      // Create user
      const userId = uuidv4();
      const now = new Date();
      
      const user: User = {
        id: userId,
        email: request.email,
        username: request.username,
        firstName: request.firstName,
        lastName: request.lastName,
        roles: [],
        permissions: [],
        isActive: true,
        isVerified: !this.config.security.requireEmailVerification,
        createdAt: now,
        updatedAt: now,
        metadata: {
          preferences: {},
          settings: {},
          profile: {},
          security: {
            mfaEnabled: false,
            lastPasswordChange: now,
            failedLoginAttempts: 0,
            trustedDevices: [],
          },
        },
      };

      // Store user data
      await this.redis.hset('users', userId, JSON.stringify(user));
      await this.redis.hset('users_by_email', request.email.toLowerCase(), userId);
      await this.redis.hset('users_by_username', request.username.toLowerCase(), userId);

      // Store password hash
      await this.redis.hset('user_passwords', userId, passwordHash);

      // Assign default user role
      const userRole = await this.rbacService.getRoleByName('user');
      if (userRole) {
        await this.rbacService.assignRoleToUser(userId, userRole.id);
        user.roles = [userRole];
        user.permissions = userRole.permissions;
      }

      // Log security event
      await this.logSecurityEvent({
        userId,
        type: SecurityEventType.LOGIN_SUCCESS,
        description: 'User registered successfully',
        metadata: { email: request.email, username: request.username },
        ipAddress,
        userAgent,
        severity: 'low',
      });

      // Generate tokens if email verification is not required
      let tokens: AuthTokens | undefined;
      if (!this.config.security.requireEmailVerification) {
        tokens = await this.jwtService.generateTokens(user, undefined, ipAddress, userAgent);
      }

      logger.info(`User registered: ${request.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Error registering user:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   */
  async login(
    request: LoginRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ user: User; tokens: AuthTokens; requiresMfa?: boolean }> {
    try {
      // Get user by email
      const user = await this.getUserByEmail(request.email);
      if (!user) {
        await this.logSecurityEvent({
          type: SecurityEventType.LOGIN_FAILED,
          description: 'Login failed - user not found',
          metadata: { email: request.email },
          ipAddress,
          userAgent,
          severity: 'medium',
        });
        throw new Error('Invalid credentials');
      }

      // Check if account is locked
      if (await this.isAccountLocked(user.id)) {
        await this.logSecurityEvent({
          userId: user.id,
          type: SecurityEventType.LOGIN_BLOCKED,
          description: 'Login blocked - account locked',
          metadata: { email: request.email },
          ipAddress,
          userAgent,
          severity: 'high',
        });
        throw new Error('Account is locked due to too many failed attempts');
      }

      // Check if account is active
      if (!user.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const passwordHash = await this.redis.hget('user_passwords', user.id);
      if (!passwordHash || !await this.passwordService.verifyPassword(request.password, passwordHash)) {
        await this.incrementFailedAttempts(user.id);
        
        await this.logSecurityEvent({
          userId: user.id,
          type: SecurityEventType.LOGIN_FAILED,
          description: 'Login failed - invalid password',
          metadata: { email: request.email },
          ipAddress,
          userAgent,
          severity: 'medium',
        });
        throw new Error('Invalid credentials');
      }

      // Check if MFA is enabled
      const mfaEnabled = await this.mfaService.isMfaEnabled(user.id);
      if (mfaEnabled && !request.mfaCode) {
        return { user, tokens: {} as AuthTokens, requiresMfa: true };
      }

      // Verify MFA if provided
      if (mfaEnabled && request.mfaCode) {
        const mfaResult = await this.mfaService.verifyMfaCode(user.id, request.mfaCode);
        if (!mfaResult.isValid) {
          await this.incrementFailedAttempts(user.id);
          throw new Error('Invalid MFA code');
        }
      }

      // Reset failed attempts on successful login
      await this.resetFailedAttempts(user.id);

      // Update last login
      user.lastLogin = new Date();
      await this.updateUser(user);

      // Generate tokens
      const tokens = await this.jwtService.generateTokens(
        user,
        request.deviceFingerprint,
        ipAddress,
        userAgent
      );

      logger.info(`User logged in: ${request.email}`);
      return { user, tokens };
    } catch (error) {
      logger.error('Error during login:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, tokenId?: string): Promise<void> {
    try {
      if (tokenId) {
        await this.jwtService.revokeToken(tokenId, userId);
      } else {
        await this.jwtService.revokeAllUserTokens(userId);
      }

      await this.logSecurityEvent({
        userId,
        type: SecurityEventType.LOGOUT,
        description: 'User logged out',
        metadata: { tokenId },
        severity: 'low',
      });

      logger.info(`User logged out: ${userId}`);
    } catch (error) {
      logger.error('Error during logout:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(
    refreshToken: string,
    deviceFingerprint?: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthTokens> {
    try {
      return await this.jwtService.refreshToken(refreshToken, deviceFingerprint, ipAddress, userAgent);
    } catch (error) {
      logger.error('Error refreshing tokens:', error);
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    try {
      const user = await this.getUserByEmail(request.email);
      if (!user) {
        // Don't reveal if user exists
        logger.info(`Password reset requested for non-existent email: ${request.email}`);
        return;
      }

      const token = await this.passwordService.generatePasswordResetToken(user.id, user.email);
      
      // In a real implementation, you would send an email here
      logger.info(`Password reset token generated for user ${user.id}: ${token}`);
    } catch (error) {
      logger.error('Error requesting password reset:', error);
      throw error;
    }
  }

  /**
   * Confirm password reset
   */
  async confirmPasswordReset(request: PasswordResetConfirm): Promise<void> {
    try {
      const tokenData = await this.passwordService.verifyPasswordResetToken(request.token);
      if (!tokenData) {
        throw new Error('Invalid or expired reset token');
      }

      // Check if password was used recently
      if (await this.passwordService.isPasswordReused(tokenData.userId, request.newPassword)) {
        throw new Error('Cannot reuse a recent password');
      }

      // Hash new password
      const passwordHash = await this.passwordService.hashPassword(request.newPassword);

      // Store password history
      await this.passwordService.storePasswordHistory(tokenData.userId, passwordHash);

      // Update password
      await this.redis.hset('user_passwords', tokenData.userId, passwordHash);

      // Use the reset token
      await this.passwordService.usePasswordResetToken(request.token, request.newPassword);

      // Update user metadata
      const user = await this.getUser(tokenData.userId);
      if (user) {
        user.metadata.security.lastPasswordChange = new Date();
        await this.updateUser(user);
      }

      // Revoke all existing tokens
      await this.jwtService.revokeAllUserTokens(tokenData.userId);

      logger.info(`Password reset completed for user ${tokenData.userId}`);
    } catch (error) {
      logger.error('Error confirming password reset:', error);
      throw error;
    }
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, request: ChangePasswordRequest): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const currentPasswordHash = await this.redis.hget('user_passwords', userId);
      if (!currentPasswordHash || !await this.passwordService.verifyPassword(request.currentPassword, currentPasswordHash)) {
        throw new Error('Current password is incorrect');
      }

      // Check if new password was used recently
      if (await this.passwordService.isPasswordReused(userId, request.newPassword)) {
        throw new Error('Cannot reuse a recent password');
      }

      // Hash new password
      const newPasswordHash = await this.passwordService.hashPassword(request.newPassword);

      // Store password history
      await this.passwordService.storePasswordHistory(userId, newPasswordHash);

      // Update password
      await this.redis.hset('user_passwords', userId, newPasswordHash);

      // Update user metadata
      user.metadata.security.lastPasswordChange = new Date();
      await this.updateUser(user);

      // Log security event
      await this.logSecurityEvent({
        userId,
        type: SecurityEventType.PASSWORD_CHANGED,
        description: 'Password changed successfully',
        metadata: {},
        severity: 'medium',
      });

      logger.info(`Password changed for user ${userId}`);
    } catch (error) {
      logger.error('Error changing password:', error);
      throw error;
    }
  }

  /**
   * Setup MFA for user
   */
  async setupMfa(userId: string, request: MfaSetupRequest): Promise<{ secret: string; qrCodeUrl: string; backupCodes: string[] }> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const passwordHash = await this.redis.hget('user_passwords', userId);
      if (!passwordHash || !await this.passwordService.verifyPassword(request.password, passwordHash)) {
        throw new Error('Password verification failed');
      }

      return await this.mfaService.setupMfa(user);
    } catch (error) {
      logger.error('Error setting up MFA:', error);
      throw error;
    }
  }

  /**
   * Verify MFA setup
   */
  async verifyMfaSetup(userId: string, request: MfaVerifyRequest): Promise<void> {
    try {
      const success = await this.mfaService.verifyMfaSetup(userId, request.code);
      if (!success) {
        throw new Error('Invalid MFA code');
      }

      // Update user metadata
      const user = await this.getUser(userId);
      if (user) {
        user.metadata.security.mfaEnabled = true;
        await this.updateUser(user);
      }
    } catch (error) {
      logger.error('Error verifying MFA setup:', error);
      throw error;
    }
  }

  /**
   * Disable MFA for user
   */
  async disableMfa(userId: string, password: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Verify password
      const passwordHash = await this.redis.hget('user_passwords', userId);
      if (!passwordHash || !await this.passwordService.verifyPassword(password, passwordHash)) {
        throw new Error('Password verification failed');
      }

      await this.mfaService.disableMfa(userId);

      // Update user metadata
      user.metadata.security.mfaEnabled = false;
      await this.updateUser(user);
    } catch (error) {
      logger.error('Error disabling MFA:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      const userData = await this.redis.hget('users', userId);
      if (!userData) return null;

      const user: User = JSON.parse(userData);
      
      // Get user roles and permissions
      user.roles = await this.rbacService.getUserRoles(userId);
      user.permissions = await this.rbacService.getUserPermissions(userId);

      return user;
    } catch (error) {
      logger.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const userId = await this.redis.hget('users_by_email', email.toLowerCase());
      if (!userId) return null;

      return await this.getUser(userId);
    } catch (error) {
      logger.error('Error getting user by email:', error);
      return null;
    }
  }

  /**
   * Get user by username
   */
  async getUserByUsername(username: string): Promise<User | null> {
    try {
      const userId = await this.redis.hget('users_by_username', username.toLowerCase());
      if (!userId) return null;

      return await this.getUser(userId);
    } catch (error) {
      logger.error('Error getting user by username:', error);
      return null;
    }
  }

  /**
   * Update user
   */
  async updateUser(user: User): Promise<void> {
    try {
      user.updatedAt = new Date();
      await this.redis.hset('users', user.id, JSON.stringify(user));
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Create auth context from token
   */
  async createAuthContext(token: string, ipAddress?: string, userAgent?: string): Promise<AuthContext | null> {
    try {
      const tokenPayload = await this.jwtService.verifyAccessToken(token);
      const user = await this.getUser(tokenPayload.sub);
      
      if (!user) {
        return null;
      }

      return {
        user,
        permissions: new Set(tokenPayload.permissions),
        roles: new Set(tokenPayload.roles),
        sessionId: tokenPayload.jti,
        ipAddress,
        userAgent,
      };
    } catch (error) {
      logger.error('Error creating auth context:', error);
      return null;
    }
  }

  /**
   * Check if account is locked
   */
  private async isAccountLocked(userId: string): Promise<boolean> {
    try {
      const user = await this.getUser(userId);
      if (!user) return false;

      const { security } = user.metadata;
      if (!security.lockedUntil) return false;

      if (security.lockedUntil.getTime() > Date.now()) {
        return true;
      }

      // Unlock account if lock period has expired
      security.lockedUntil = undefined;
      security.failedLoginAttempts = 0;
      await this.updateUser(user);

      return false;
    } catch (error) {
      logger.error('Error checking account lock status:', error);
      return false;
    }
  }

  /**
   * Increment failed login attempts
   */
  private async incrementFailedAttempts(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) return;

      const { security } = user.metadata;
      security.failedLoginAttempts = (security.failedLoginAttempts || 0) + 1;

      if (security.failedLoginAttempts >= this.config.security.maxFailedAttempts) {
        security.lockedUntil = new Date(Date.now() + this.config.security.lockoutDuration * 60 * 1000);
        
        await this.logSecurityEvent({
          userId,
          type: SecurityEventType.ACCOUNT_LOCKED,
          description: 'Account locked due to too many failed attempts',
          metadata: { failedAttempts: security.failedLoginAttempts },
          severity: 'high',
        });
      }

      await this.updateUser(user);
    } catch (error) {
      logger.error('Error incrementing failed attempts:', error);
    }
  }

  /**
   * Reset failed login attempts
   */
  private async resetFailedAttempts(userId: string): Promise<void> {
    try {
      const user = await this.getUser(userId);
      if (!user) return;

      const { security } = user.metadata;
      if (security.failedLoginAttempts > 0) {
        security.failedLoginAttempts = 0;
        security.lockedUntil = undefined;
        await this.updateUser(user);
      }
    } catch (error) {
      logger.error('Error resetting failed attempts:', error);
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

      if (event.userId) {
        await this.redis.lpush(`security_events:${event.userId}`, JSON.stringify(securityEvent));
        await this.redis.ltrim(`security_events:${event.userId}`, 0, 999);
      }

      await this.redis.lpush('security_events:global', JSON.stringify(securityEvent));
      await this.redis.ltrim('security_events:global', 0, 9999);
    } catch (error) {
      logger.error('Error logging security event:', error);
    }
  }
}