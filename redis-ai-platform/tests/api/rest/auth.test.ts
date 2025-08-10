import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Redis } from 'ioredis';
import { AuthService } from '../../../src/services/auth/auth-service';
import { JWTService } from '../../../src/services/auth/jwt-service';
import { MFAService } from '../../../src/services/auth/mfa-service';
import { PasswordService } from '../../../src/services/auth/password-service';
import { RBACService } from '../../../src/services/auth/rbac-service';
import { ValidationService } from '../../../src/services/auth/validation-service';
import { RateLimitService } from '../../../src/services/auth/rate-limit-service';
import { AuthMiddleware } from '../../../src/middleware/auth';
import { createAuthRoutes } from '../../../src/api/rest/routes/auth';
import { User, RegisterData, LoginCredentials } from '../../../src/services/auth/types';

// Mock all dependencies
jest.mock('ioredis');
jest.mock('../../../src/services/auth/auth-service');
jest.mock('../../../src/services/auth/jwt-service');
jest.mock('../../../src/services/auth/mfa-service');
jest.mock('../../../src/services/auth/password-service');
jest.mock('../../../src/services/auth/rbac-service');
jest.mock('../../../src/services/auth/validation-service');
jest.mock('../../../src/services/auth/rate-limit-service');

const MockedRedis = Redis as jest.MockedClass<typeof Redis>;
const MockedAuthService = AuthService as jest.MockedClass<typeof AuthService>;
const MockedJWTService = JWTService as jest.MockedClass<typeof JWTService>;
const MockedMFAService = MFAService as jest.MockedClass<typeof MFAService>;
const MockedPasswordService = PasswordService as jest.MockedClass<typeof PasswordService>;
const MockedRBACService = RBACService as jest.MockedClass<typeof RBACService>;
const MockedValidationService = ValidationService as jest.MockedClass<typeof ValidationService>;
const MockedRateLimitService = RateLimitService as jest.MockedClass<typeof RateLimitService>;

describe('Auth REST API', () => {
  let app: express.Application;
  let redis: jest.Mocked<Redis>;
  let authService: jest.Mocked<AuthService>;
  let jwtService: jest.Mocked<JWTService>;
  let mfaService: jest.Mocked<MFAService>;
  let passwordService: jest.Mocked<PasswordService>;
  let rbacService: jest.Mocked<RBACService>;
  let validationService: jest.Mocked<ValidationService>;
  let rateLimitService: jest.Mocked<RateLimitService>;
  let authMiddleware: AuthMiddleware;

  const mockUser: User = {
    id: 'user123',
    email: 'test@example.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    roles: ['user'],
    permissions: ['read'],
    isActive: true,
    emailVerified: true,
    mfaEnabled: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    redis = new MockedRedis() as jest.Mocked<Redis>;
    authService = new MockedAuthService(redis, {} as any, {} as any, {} as any, {} as any) as jest.Mocked<AuthService>;
    jwtService = new MockedJWTService({} as any) as jest.Mocked<JWTService>;
    mfaService = new MockedMFAService(redis) as jest.Mocked<MFAService>;
    passwordService = new MockedPasswordService() as jest.Mocked<PasswordService>;
    rbacService = new MockedRBACService(redis) as jest.Mocked<RBACService>;
    validationService = new MockedValidationService() as jest.Mocked<ValidationService>;
    rateLimitService = new MockedRateLimitService(redis) as jest.Mocked<RateLimitService>;

    authMiddleware = new AuthMiddleware(jwtService, rbacService, rateLimitService, validationService);

    // Mock validation service to always pass
    validationService.validateInput.mockResolvedValue({
      isValid: true,
      sanitizedData: {},
      errors: [],
    });

    // Mock rate limit service to always allow
    rateLimitService.checkRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 10,
      resetTime: Date.now() + 60000,
    });

    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use('/api/auth', createAuthRoutes(redis, authService, authMiddleware));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    it('should register a new user successfully', async () => {
      const registerData: RegisterData = {
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      authService.register.mockResolvedValue({
        success: true,
        user: { ...mockUser, ...registerData },
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('User registered successfully');
      expect(response.body.data.email).toBe(registerData.email);
      expect(authService.register).toHaveBeenCalledWith(registerData);
    });

    it('should return error for duplicate email', async () => {
      const registerData: RegisterData = {
        email: 'existing@example.com',
        username: 'newuser',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      authService.register.mockResolvedValue({
        success: false,
        error: 'Email already exists',
        message: 'A user with this email already exists',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Email already exists');
    });

    it('should validate input data', async () => {
      validationService.validateInput.mockResolvedValue({
        isValid: false,
        sanitizedData: {},
        errors: [{ field: 'email', message: 'Invalid email format' }],
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /login', () => {
    it('should login user successfully', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        mfaRequired: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.accessToken).toBe('access-token');
      expect(response.body.data.user.email).toBe(mockUser.email);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should return error for invalid credentials', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      authService.login.mockResolvedValue({
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should handle MFA required', async () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        mfaRequired: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(200);

      expect(response.body.data.mfaRequired).toBe(true);
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token successfully', async () => {
      authService.refreshToken.mockResolvedValue({
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=old-refresh-token'])
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBe('new-access-token');
      expect(authService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
    });

    it('should return error for invalid refresh token', async () => {
      authService.refreshToken.mockResolvedValue({
        success: false,
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired',
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=invalid-token'])
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid refresh token');
    });

    it('should return error when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing refresh token');
    });
  });

  describe('POST /forgot-password', () => {
    it('should handle password reset request', async () => {
      authService.requestPasswordReset.mockResolvedValue({
        success: true,
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });

    it('should return same response for non-existent email', async () => {
      authService.requestPasswordReset.mockResolvedValue({
        success: false,
        error: 'User not found',
        message: 'No user found with this email',
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200);

      // Should return success to prevent email enumeration
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('password reset link has been sent');
    });
  });

  describe('POST /reset-password', () => {
    it('should reset password successfully', async () => {
      authService.resetPassword.mockResolvedValue({
        success: true,
        userId: 'user123',
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'reset-token',
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password reset successfully');
    });

    it('should return error for invalid reset token', async () => {
      authService.resetPassword.mockResolvedValue({
        success: false,
        error: 'Invalid token',
        message: 'Reset token is invalid or expired',
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid token');
    });
  });

  describe('Protected Routes', () => {
    beforeEach(() => {
      // Mock JWT verification for protected routes
      jwtService.verifyToken.mockResolvedValue({
        userId: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
        roles: mockUser.roles,
        permissions: mockUser.permissions,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      });
    });

    describe('POST /logout', () => {
      it('should logout user successfully', async () => {
        authService.logout.mockResolvedValue({ success: true });

        const response = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', 'Bearer valid-token')
          .set('Cookie', ['refreshToken=refresh-token'])
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Logged out successfully');
        expect(authService.logout).toHaveBeenCalledWith('refresh-token');
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .post('/api/auth/logout')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });
    });

    describe('GET /profile', () => {
      it('should return user profile', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .set('Authorization', 'Bearer valid-token')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.email).toBe(mockUser.email);
        expect(response.body.data.username).toBe(mockUser.username);
      });

      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/auth/profile')
          .expect(401);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Authentication required');
      });
    });

    describe('PUT /profile', () => {
      it('should update user profile', async () => {
        const updates = {
          firstName: 'Updated',
          lastName: 'Name',
        };

        authService.updateProfile.mockResolvedValue({
          success: true,
          user: { ...mockUser, ...updates },
        });

        const response = await request(app)
          .put('/api/auth/profile')
          .set('Authorization', 'Bearer valid-token')
          .send(updates)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Profile updated successfully');
        expect(authService.updateProfile).toHaveBeenCalledWith(mockUser.id, updates);
      });
    });

    describe('POST /change-password', () => {
      it('should change password successfully', async () => {
        authService.changePassword.mockResolvedValue({
          success: true,
        });

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', 'Bearer valid-token')
          .send({
            currentPassword: 'oldpassword',
            newPassword: 'newpassword123',
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('Password changed successfully');
      });

      it('should return error for incorrect current password', async () => {
        authService.changePassword.mockResolvedValue({
          success: false,
          error: 'Invalid current password',
          message: 'Current password is incorrect',
        });

        const response = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', 'Bearer valid-token')
          .send({
            currentPassword: 'wrongpassword',
            newPassword: 'newpassword123',
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error).toBe('Invalid current password');
      });
    });

    describe('MFA Routes', () => {
      describe('POST /mfa/enable', () => {
        it('should enable MFA successfully', async () => {
          authService.enableMFA.mockResolvedValue({
            success: true,
            qrCode: 'qr-code-data',
            backupCodes: ['code1', 'code2'],
          });

          const response = await request(app)
            .post('/api/auth/mfa/enable')
            .set('Authorization', 'Bearer valid-token')
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.qrCode).toBe('qr-code-data');
          expect(response.body.data.backupCodes).toEqual(['code1', 'code2']);
        });
      });

      describe('POST /mfa/verify-setup', () => {
        it('should verify MFA setup successfully', async () => {
          authService.verifyMFASetup.mockResolvedValue({
            success: true,
          });

          const response = await request(app)
            .post('/api/auth/mfa/verify-setup')
            .set('Authorization', 'Bearer valid-token')
            .send({ token: '123456' })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('MFA setup verified successfully');
        });

        it('should return error for invalid MFA token', async () => {
          authService.verifyMFASetup.mockResolvedValue({
            success: false,
            error: 'Invalid MFA token',
            message: 'The provided MFA token is invalid',
          });

          const response = await request(app)
            .post('/api/auth/mfa/verify-setup')
            .set('Authorization', 'Bearer valid-token')
            .send({ token: '000000' })
            .expect(400);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBe('Invalid MFA token');
        });
      });

      describe('POST /mfa/disable', () => {
        it('should disable MFA successfully', async () => {
          authService.disableMFA.mockResolvedValue({
            success: true,
          });

          const response = await request(app)
            .post('/api/auth/mfa/disable')
            .set('Authorization', 'Bearer valid-token')
            .send({ password: 'password123' })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('MFA disabled successfully');
        });
      });
    });

    describe('Admin Routes', () => {
      beforeEach(() => {
        // Mock admin role check
        rbacService.hasAnyRole.mockResolvedValue(true);
      });

      describe('GET /admin/users', () => {
        it('should return users list for admin', async () => {
          authService.getUsers.mockResolvedValue({
            users: [mockUser],
            page: 1,
            limit: 20,
            total: 1,
          });

          const response = await request(app)
            .get('/api/auth/admin/users')
            .set('Authorization', 'Bearer valid-token')
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data).toEqual([mockUser]);
          expect(response.body.pagination.total).toBe(1);
        });

        it('should require admin role', async () => {
          rbacService.hasAnyRole.mockResolvedValue(false);

          const response = await request(app)
            .get('/api/auth/admin/users')
            .set('Authorization', 'Bearer valid-token')
            .expect(403);

          expect(response.body.success).toBe(false);
          expect(response.body.error).toBe('Insufficient permissions');
        });
      });

      describe('PUT /admin/users/:userId/roles', () => {
        it('should update user roles', async () => {
          authService.updateUserRoles.mockResolvedValue({
            success: true,
          });

          const response = await request(app)
            .put('/api/auth/admin/users/user123/roles')
            .set('Authorization', 'Bearer valid-token')
            .send({ roles: ['user', 'moderator'] })
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('User roles updated successfully');
          expect(authService.updateUserRoles).toHaveBeenCalledWith('user123', ['user', 'moderator']);
        });
      });

      describe('POST /admin/users/:userId/deactivate', () => {
        it('should deactivate user', async () => {
          authService.deactivateUser.mockResolvedValue({
            success: true,
          });

          const response = await request(app)
            .post('/api/auth/admin/users/user123/deactivate')
            .set('Authorization', 'Bearer valid-token')
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.message).toBe('User deactivated successfully');
          expect(authService.deactivateUser).toHaveBeenCalledWith('user123');
        });
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      rateLimitService.checkRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
        resetTime: Date.now() + 60000,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Rate limit exceeded');
    });

    it('should set rate limit headers', async () => {
      rateLimitService.checkRateLimit.mockResolvedValue({
        allowed: true,
        remaining: 5,
        resetTime: Date.now() + 60000,
      });

      authService.login.mockResolvedValue({
        success: true,
        user: mockUser,
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresIn: 3600,
        mfaRequired: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
      expect(response.headers['x-ratelimit-reset']).toBeDefined();
    });
  });
});