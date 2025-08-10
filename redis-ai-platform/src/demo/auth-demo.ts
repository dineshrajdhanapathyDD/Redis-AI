import { Redis } from 'ioredis';
import { AuthService } from '../services/auth/auth-service';
import { JWTService } from '../services/auth/jwt-service';
import { MFAService } from '../services/auth/mfa-service';
import { PasswordService } from '../services/auth/password-service';
import { RBACService } from '../services/auth/rbac-service';
import { ValidationService } from '../services/auth/validation-service';
import { RateLimitService } from '../services/auth/rate-limit-service';
import { AuditService } from '../services/auth/audit-service';
import { AuthMiddleware } from '../middleware/auth';
import { logger } from '../utils/logger';
import { RegisterData, LoginCredentials, User } from '../services/auth/types';

export class AuthDemo {
  private redis: Redis;
  private authService: AuthService;
  private jwtService: JWTService;
  private mfaService: MFAService;
  private passwordService: PasswordService;
  private rbacService: RBACService;
  private validationService: ValidationService;
  private rateLimitService: RateLimitService;
  private auditService: AuditService;
  private authMiddleware: AuthMiddleware;

  constructor() {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
    });

    // Initialize services
    this.jwtService = new JWTService({
      accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
      refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
      accessTokenExpiry: '15m',
      refreshTokenExpiry: '7d',
    });

    this.passwordService = new PasswordService();
    this.mfaService = new MFAService(this.redis);
    this.rbacService = new RBACService(this.redis);
    this.validationService = new ValidationService();
    this.rateLimitService = new RateLimitService(this.redis);
    this.auditService = new AuditService(this.redis);

    this.authService = new AuthService(
      this.redis,
      this.jwtService,
      this.passwordService,
      this.mfaService,
      this.rbacService
    );

    this.authMiddleware = new AuthMiddleware(
      this.jwtService,
      this.rbacService,
      this.rateLimitService,
      this.validationService
    );
  }

  async runDemo(): Promise<void> {
    try {
      logger.info('🔐 Starting Authentication & Security Demo');

      // Test user registration
      await this.demoUserRegistration();

      // Test user login
      await this.demoUserLogin();

      // Test password operations
      await this.demoPasswordOperations();

      // Test MFA operations
      await this.demoMFAOperations();

      // Test RBAC operations
      await this.demoRBACOperations();

      // Test rate limiting
      await this.demoRateLimiting();

      // Test input validation
      await this.demoInputValidation();

      // Test audit logging
      await this.demoAuditLogging();

      // Test security alerts
      await this.demoSecurityAlerts();

      // Test JWT operations
      await this.demoJWTOperations();

      logger.info('✅ Authentication & Security Demo completed successfully');
    } catch (error) {
      logger.error('❌ Authentication & Security Demo failed:', error);
      throw error;
    }
  }

  private async demoUserRegistration(): Promise<void> {
    logger.info('📝 Testing User Registration');

    const registerData: RegisterData = {
      email: 'demo@example.com',
      username: 'demouser',
      password: 'SecurePassword123!',
      firstName: 'Demo',
      lastName: 'User',
    };

    try {
      const result = await this.authService.register(registerData);
      
      if (result.success) {
        logger.info('✅ User registered successfully:', {
          userId: result.user?.id,
          email: result.user?.email,
          username: result.user?.username,
        });

        // Record audit event
        await this.auditService.recordEvent({
          userId: result.user?.id,
          ip: '127.0.0.1',
          action: 'user_registration',
          success: true,
          details: { email: registerData.email, username: registerData.username },
        });
      } else {
        logger.warn('⚠️ User registration failed:', result.error);
      }
    } catch (error) {
      logger.error('❌ User registration error:', error);
    }
  }

  private async demoUserLogin(): Promise<void> {
    logger.info('🔑 Testing User Login');

    const credentials: LoginCredentials = {
      email: 'demo@example.com',
      password: 'SecurePassword123!',
    };

    try {
      const result = await this.authService.login(credentials);
      
      if (result.success) {
        logger.info('✅ User login successful:', {
          userId: result.user?.id,
          accessToken: result.accessToken?.substring(0, 20) + '...',
          expiresIn: result.expiresIn,
          mfaRequired: result.mfaRequired,
        });

        // Record audit event
        await this.auditService.recordEvent({
          userId: result.user?.id,
          ip: '127.0.0.1',
          userAgent: 'Demo Client/1.0',
          action: 'login',
          success: true,
          details: { email: credentials.email },
        });

        // Test token refresh
        if (result.refreshToken) {
          const refreshResult = await this.authService.refreshToken(result.refreshToken);
          if (refreshResult.success) {
            logger.info('✅ Token refresh successful');
          }
        }
      } else {
        logger.warn('⚠️ User login failed:', result.error);
        
        // Record failed login audit event
        await this.auditService.recordEvent({
          ip: '127.0.0.1',
          userAgent: 'Demo Client/1.0',
          action: 'login',
          success: false,
          details: { email: credentials.email, error: result.error },
        });
      }
    } catch (error) {
      logger.error('❌ User login error:', error);
    }
  }

  private async demoPasswordOperations(): Promise<void> {
    logger.info('🔒 Testing Password Operations');

    try {
      // Test password hashing
      const password = 'TestPassword123!';
      const hashedPassword = await this.passwordService.hashPassword(password);
      logger.info('✅ Password hashed successfully');

      // Test password verification
      const isValid = await this.passwordService.verifyPassword(password, hashedPassword);
      logger.info(`✅ Password verification: ${isValid ? 'valid' : 'invalid'}`);

      // Test password strength
      const strength = this.passwordService.checkPasswordStrength(password);
      logger.info('✅ Password strength check:', strength);

      // Test password reset request
      const resetResult = await this.authService.requestPasswordReset('demo@example.com');
      if (resetResult.success) {
        logger.info('✅ Password reset request sent');
      }
    } catch (error) {
      logger.error('❌ Password operations error:', error);
    }
  }

  private async demoMFAOperations(): Promise<void> {
    logger.info('📱 Testing MFA Operations');

    const userId = 'demo-user-id';

    try {
      // Generate MFA secret
      const secret = await this.mfaService.generateSecret(userId);
      logger.info('✅ MFA secret generated:', {
        secret: secret.secret.substring(0, 10) + '...',
        qrCode: secret.qrCode ? 'Generated' : 'Not generated',
      });

      // Generate TOTP token (simulate)
      const token = this.mfaService.generateTOTP(secret.secret);
      logger.info('✅ TOTP token generated:', token);

      // Verify TOTP token
      const isValid = this.mfaService.verifyTOTP(token, secret.secret);
      logger.info(`✅ TOTP verification: ${isValid ? 'valid' : 'invalid'}`);

      // Generate backup codes
      const backupCodes = await this.mfaService.generateBackupCodes(userId);
      logger.info('✅ Backup codes generated:', backupCodes.length);

      // Test backup code verification
      if (backupCodes.length > 0) {
        const backupValid = await this.mfaService.verifyBackupCode(userId, backupCodes[0]);
        logger.info(`✅ Backup code verification: ${backupValid ? 'valid' : 'invalid'}`);
      }
    } catch (error) {
      logger.error('❌ MFA operations error:', error);
    }
  }

  private async demoRBACOperations(): Promise<void> {
    logger.info('👥 Testing RBAC Operations');

    const userId = 'demo-user-id';
    const adminUserId = 'admin-user-id';

    try {
      // Create roles
      await this.rbacService.createRole({
        id: 'user',
        name: 'User',
        description: 'Basic user role',
        permissions: ['read', 'write_own'],
      });

      await this.rbacService.createRole({
        id: 'admin',
        name: 'Administrator',
        description: 'Administrator role',
        permissions: ['read', 'write', 'delete', 'admin'],
      });

      logger.info('✅ Roles created successfully');

      // Assign roles to users
      await this.rbacService.assignRole(userId, 'user');
      await this.rbacService.assignRole(adminUserId, 'admin');
      logger.info('✅ Roles assigned to users');

      // Check permissions
      const hasReadPermission = await this.rbacService.hasPermission(userId, 'read');
      const hasAdminPermission = await this.rbacService.hasPermission(userId, 'admin');
      const adminHasAdminPermission = await this.rbacService.hasPermission(adminUserId, 'admin');

      logger.info('✅ Permission checks:', {
        userHasRead: hasReadPermission,
        userHasAdmin: hasAdminPermission,
        adminHasAdmin: adminHasAdminPermission,
      });

      // Get user roles and permissions
      const userRoles = await this.rbacService.getUserRoles(userId);
      const userPermissions = await this.rbacService.getUserPermissions(userId);

      logger.info('✅ User roles and permissions:', {
        roles: userRoles,
        permissions: userPermissions,
      });
    } catch (error) {
      logger.error('❌ RBAC operations error:', error);
    }
  }

  private async demoRateLimiting(): Promise<void> {
    logger.info('⏱️ Testing Rate Limiting');

    const key = 'demo-rate-limit';
    const maxRequests = 5;
    const windowSeconds = 60;

    try {
      // Test multiple requests
      for (let i = 1; i <= 7; i++) {
        const result = await this.rateLimitService.checkRateLimit(key, maxRequests, windowSeconds);
        
        logger.info(`Request ${i}:`, {
          allowed: result.allowed,
          remaining: result.remaining,
          resetTime: new Date(result.resetTime).toISOString(),
        });

        if (!result.allowed) {
          logger.warn('⚠️ Rate limit exceeded');
          break;
        }

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Test rate limit reset
      await this.rateLimitService.resetRateLimit(key);
      logger.info('✅ Rate limit reset');

      const afterReset = await this.rateLimitService.checkRateLimit(key, maxRequests, windowSeconds);
      logger.info('✅ After reset:', {
        allowed: afterReset.allowed,
        remaining: afterReset.remaining,
      });
    } catch (error) {
      logger.error('❌ Rate limiting error:', error);
    }
  }

  private async demoInputValidation(): Promise<void> {
    logger.info('✅ Testing Input Validation');

    try {
      // Test valid input
      const validInput = {
        email: 'test@example.com',
        username: 'testuser',
        age: 25,
      };

      const schema = {
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          username: { type: 'string', minLength: 3, maxLength: 50 },
          age: { type: 'number', minimum: 18, maximum: 120 },
        },
        required: ['email', 'username'],
        additionalProperties: false,
      };

      const validResult = await this.validationService.validateInput(validInput, schema);
      logger.info('✅ Valid input validation:', {
        isValid: validResult.isValid,
        errors: validResult.errors,
      });

      // Test invalid input
      const invalidInput = {
        email: 'invalid-email',
        username: 'ab', // Too short
        age: 150, // Too high
        extra: 'not allowed', // Additional property
      };

      const invalidResult = await this.validationService.validateInput(invalidInput, schema);
      logger.info('✅ Invalid input validation:', {
        isValid: invalidResult.isValid,
        errors: invalidResult.errors,
      });

      // Test input sanitization
      const unsafeInput = {
        name: '<script>alert("xss")</script>John Doe',
        description: 'This is a test & description with "quotes"',
      };

      const sanitized = this.validationService.sanitizeInput(unsafeInput);
      logger.info('✅ Input sanitization:', {
        original: unsafeInput,
        sanitized,
      });
    } catch (error) {
      logger.error('❌ Input validation error:', error);
    }
  }

  private async demoAuditLogging(): Promise<void> {
    logger.info('📋 Testing Audit Logging');

    try {
      // Record various audit events
      const events = [
        {
          userId: 'user1',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          action: 'login',
          success: true,
          details: { email: 'user1@example.com' },
        },
        {
          userId: 'user1',
          ip: '192.168.1.100',
          userAgent: 'Mozilla/5.0...',
          action: 'profile_update',
          resource: 'user_profile',
          resourceId: 'user1',
          success: true,
          details: { fields: ['firstName', 'lastName'] },
        },
        {
          userId: 'user2',
          ip: '10.0.0.50',
          userAgent: 'Suspicious Bot/1.0',
          action: 'login',
          success: false,
          details: { email: 'user2@example.com', error: 'Invalid password' },
        },
        {
          userId: 'admin1',
          ip: '192.168.1.10',
          userAgent: 'Admin Panel/1.0',
          action: 'user_role_change',
          resource: 'user',
          resourceId: 'user2',
          success: true,
          details: { oldRoles: ['user'], newRoles: ['user', 'moderator'] },
        },
      ];

      const eventIds: string[] = [];
      for (const event of events) {
        const eventId = await this.auditService.recordEvent(event);
        eventIds.push(eventId);
      }

      logger.info('✅ Audit events recorded:', eventIds.length);

      // Query audit events
      const allEvents = await this.auditService.getEvents({ limit: 10 });
      logger.info('✅ Retrieved audit events:', allEvents.length);

      const userEvents = await this.auditService.getEvents({ userId: 'user1' });
      logger.info('✅ User-specific events:', userEvents.length);

      const failedEvents = await this.auditService.getEvents({ success: false });
      logger.info('✅ Failed events:', failedEvents.length);

      // Get user risk score
      const riskScore = await this.auditService.getUserRiskScore('user2');
      logger.info('✅ User risk score:', riskScore);

      // Get security metrics
      const metrics = await this.auditService.getSecurityMetrics();
      logger.info('✅ Security metrics:', {
        totalEvents: metrics.totalEvents,
        failedLogins: metrics.failedLogins,
        successfulLogins: metrics.successfulLogins,
        suspiciousActivities: metrics.suspiciousActivities,
        activeAlerts: metrics.activeAlerts,
      });
    } catch (error) {
      logger.error('❌ Audit logging error:', error);
    }
  }

  private async demoSecurityAlerts(): Promise<void> {
    logger.info('🚨 Testing Security Alerts');

    try {
      // Create a security alert
      const alertId = await this.auditService.createAlert({
        userId: 'user2',
        type: 'suspicious_login',
        severity: 'high',
        description: 'Multiple failed login attempts from suspicious IP',
        events: ['evt_123', 'evt_124', 'evt_125'],
        metadata: {
          ip: '10.0.0.50',
          attemptCount: 5,
          timeWindow: '5 minutes',
        },
      });

      logger.info('✅ Security alert created:', alertId);

      // Get active alerts
      const activeAlerts = await this.auditService.getActiveAlerts();
      logger.info('✅ Active alerts:', activeAlerts.length);

      if (activeAlerts.length > 0) {
        logger.info('Alert details:', {
          id: activeAlerts[0].id,
          type: activeAlerts[0].type,
          severity: activeAlerts[0].severity,
          description: activeAlerts[0].description,
        });
      }

      // Resolve the alert
      const resolved = await this.auditService.resolveAlert(alertId, 'admin1');
      logger.info('✅ Alert resolved:', resolved);

      // Check active alerts after resolution
      const activeAlertsAfter = await this.auditService.getActiveAlerts();
      logger.info('✅ Active alerts after resolution:', activeAlertsAfter.length);
    } catch (error) {
      logger.error('❌ Security alerts error:', error);
    }
  }

  private async demoJWTOperations(): Promise<void> {
    logger.info('🎫 Testing JWT Operations');

    try {
      const payload = {
        userId: 'demo-user',
        email: 'demo@example.com',
        username: 'demouser',
        roles: ['user'],
        permissions: ['read', 'write_own'],
      };

      // Generate access token
      const accessToken = await this.jwtService.generateAccessToken(payload);
      logger.info('✅ Access token generated:', accessToken.substring(0, 50) + '...');

      // Generate refresh token
      const refreshToken = await this.jwtService.generateRefreshToken(payload);
      logger.info('✅ Refresh token generated:', refreshToken.substring(0, 50) + '...');

      // Verify access token
      const verifiedPayload = await this.jwtService.verifyToken(accessToken);
      logger.info('✅ Token verified:', {
        userId: verifiedPayload.userId,
        email: verifiedPayload.email,
        exp: new Date(verifiedPayload.exp * 1000).toISOString(),
      });

      // Test token expiration (simulate expired token)
      try {
        const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXVzZXIiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
        await this.jwtService.verifyToken(expiredToken);
      } catch (error) {
        logger.info('✅ Expired token correctly rejected:', error.message);
      }

      // Revoke refresh token
      await this.jwtService.revokeRefreshToken(refreshToken);
      logger.info('✅ Refresh token revoked');

      // Try to use revoked token
      try {
        await this.jwtService.verifyRefreshToken(refreshToken);
      } catch (error) {
        logger.info('✅ Revoked token correctly rejected:', error.message);
      }
    } catch (error) {
      logger.error('❌ JWT operations error:', error);
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up demo data
      const keys = await this.redis.keys('demo:*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      
      await this.redis.quit();
      logger.info('🧹 Demo cleanup completed');
    } catch (error) {
      logger.error('❌ Cleanup error:', error);
    }
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  const demo = new AuthDemo();
  
  demo.runDemo()
    .then(() => demo.cleanup())
    .catch((error) => {
      logger.error('Demo failed:', error);
      process.exit(1);
    });
}