"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthDemo = void 0;
const ioredis_1 = require("ioredis");
const auth_service_1 = require("../services/auth/auth-service");
const jwt_service_1 = require("../services/auth/jwt-service");
const mfa_service_1 = require("../services/auth/mfa-service");
const password_service_1 = require("../services/auth/password-service");
const rbac_service_1 = require("../services/auth/rbac-service");
const validation_service_1 = require("../services/auth/validation-service");
const rate_limit_service_1 = require("../services/auth/rate-limit-service");
const audit_service_1 = require("../services/auth/audit-service");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../utils/logger");
class AuthDemo {
    redis;
    authService;
    jwtService;
    mfaService;
    passwordService;
    rbacService;
    validationService;
    rateLimitService;
    auditService;
    authMiddleware;
    constructor() {
        this.redis = new ioredis_1.Redis({
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
        });
        // Initialize services
        this.jwtService = new jwt_service_1.JWTService({
            accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'access-secret',
            refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'refresh-secret',
            accessTokenExpiry: '15m',
            refreshTokenExpiry: '7d',
        });
        this.passwordService = new password_service_1.PasswordService();
        this.mfaService = new mfa_service_1.MFAService(this.redis);
        this.rbacService = new rbac_service_1.RBACService(this.redis);
        this.validationService = new validation_service_1.ValidationService();
        this.rateLimitService = new rate_limit_service_1.RateLimitService(this.redis);
        this.auditService = new audit_service_1.AuditService(this.redis);
        this.authService = new auth_service_1.AuthService(this.redis, this.jwtService, this.passwordService, this.mfaService, this.rbacService);
        this.authMiddleware = new auth_1.AuthMiddleware(this.jwtService, this.rbacService, this.rateLimitService, this.validationService);
    }
    async runDemo() {
        try {
            logger_1.logger.info('🔐 Starting Authentication & Security Demo');
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
            logger_1.logger.info('✅ Authentication & Security Demo completed successfully');
        }
        catch (error) {
            logger_1.logger.error('❌ Authentication & Security Demo failed:', error);
            throw error;
        }
    }
    async demoUserRegistration() {
        logger_1.logger.info('📝 Testing User Registration');
        const registerData = {
            email: 'demo@example.com',
            username: 'demouser',
            password: 'SecurePassword123!',
            firstName: 'Demo',
            lastName: 'User',
        };
        try {
            const result = await this.authService.register(registerData);
            if (result.success) {
                logger_1.logger.info('✅ User registered successfully:', {
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
            }
            else {
                logger_1.logger.warn('⚠️ User registration failed:', result.error);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ User registration error:', error);
        }
    }
    async demoUserLogin() {
        logger_1.logger.info('🔑 Testing User Login');
        const credentials = {
            email: 'demo@example.com',
            password: 'SecurePassword123!',
        };
        try {
            const result = await this.authService.login(credentials);
            if (result.success) {
                logger_1.logger.info('✅ User login successful:', {
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
                        logger_1.logger.info('✅ Token refresh successful');
                    }
                }
            }
            else {
                logger_1.logger.warn('⚠️ User login failed:', result.error);
                // Record failed login audit event
                await this.auditService.recordEvent({
                    ip: '127.0.0.1',
                    userAgent: 'Demo Client/1.0',
                    action: 'login',
                    success: false,
                    details: { email: credentials.email, error: result.error },
                });
            }
        }
        catch (error) {
            logger_1.logger.error('❌ User login error:', error);
        }
    }
    async demoPasswordOperations() {
        logger_1.logger.info('🔒 Testing Password Operations');
        try {
            // Test password hashing
            const password = 'TestPassword123!';
            const hashedPassword = await this.passwordService.hashPassword(password);
            logger_1.logger.info('✅ Password hashed successfully');
            // Test password verification
            const isValid = await this.passwordService.verifyPassword(password, hashedPassword);
            logger_1.logger.info(`✅ Password verification: ${isValid ? 'valid' : 'invalid'}`);
            // Test password strength
            const strength = this.passwordService.checkPasswordStrength(password);
            logger_1.logger.info('✅ Password strength check:', strength);
            // Test password reset request
            const resetResult = await this.authService.requestPasswordReset('demo@example.com');
            if (resetResult.success) {
                logger_1.logger.info('✅ Password reset request sent');
            }
        }
        catch (error) {
            logger_1.logger.error('❌ Password operations error:', error);
        }
    }
    async demoMFAOperations() {
        logger_1.logger.info('📱 Testing MFA Operations');
        const userId = 'demo-user-id';
        try {
            // Generate MFA secret
            const secret = await this.mfaService.generateSecret(userId);
            logger_1.logger.info('✅ MFA secret generated:', {
                secret: secret.secret.substring(0, 10) + '...',
                qrCode: secret.qrCode ? 'Generated' : 'Not generated',
            });
            // Generate TOTP token (simulate)
            const token = this.mfaService.generateTOTP(secret.secret);
            logger_1.logger.info('✅ TOTP token generated:', token);
            // Verify TOTP token
            const isValid = this.mfaService.verifyTOTP(token, secret.secret);
            logger_1.logger.info(`✅ TOTP verification: ${isValid ? 'valid' : 'invalid'}`);
            // Generate backup codes
            const backupCodes = await this.mfaService.generateBackupCodes(userId);
            logger_1.logger.info('✅ Backup codes generated:', backupCodes.length);
            // Test backup code verification
            if (backupCodes.length > 0) {
                const backupValid = await this.mfaService.verifyBackupCode(userId, backupCodes[0]);
                logger_1.logger.info(`✅ Backup code verification: ${backupValid ? 'valid' : 'invalid'}`);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ MFA operations error:', error);
        }
    }
    async demoRBACOperations() {
        logger_1.logger.info('👥 Testing RBAC Operations');
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
            logger_1.logger.info('✅ Roles created successfully');
            // Assign roles to users
            await this.rbacService.assignRole(userId, 'user');
            await this.rbacService.assignRole(adminUserId, 'admin');
            logger_1.logger.info('✅ Roles assigned to users');
            // Check permissions
            const hasReadPermission = await this.rbacService.hasPermission(userId, 'read');
            const hasAdminPermission = await this.rbacService.hasPermission(userId, 'admin');
            const adminHasAdminPermission = await this.rbacService.hasPermission(adminUserId, 'admin');
            logger_1.logger.info('✅ Permission checks:', {
                userHasRead: hasReadPermission,
                userHasAdmin: hasAdminPermission,
                adminHasAdmin: adminHasAdminPermission,
            });
            // Get user roles and permissions
            const userRoles = await this.rbacService.getUserRoles(userId);
            const userPermissions = await this.rbacService.getUserPermissions(userId);
            logger_1.logger.info('✅ User roles and permissions:', {
                roles: userRoles,
                permissions: userPermissions,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ RBAC operations error:', error);
        }
    }
    async demoRateLimiting() {
        logger_1.logger.info('⏱️ Testing Rate Limiting');
        const key = 'demo-rate-limit';
        const maxRequests = 5;
        const windowSeconds = 60;
        try {
            // Test multiple requests
            for (let i = 1; i <= 7; i++) {
                const result = await this.rateLimitService.checkRateLimit(key, maxRequests, windowSeconds);
                logger_1.logger.info(`Request ${i}:`, {
                    allowed: result.allowed,
                    remaining: result.remaining,
                    resetTime: new Date(result.resetTime).toISOString(),
                });
                if (!result.allowed) {
                    logger_1.logger.warn('⚠️ Rate limit exceeded');
                    break;
                }
                // Small delay between requests
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            // Test rate limit reset
            await this.rateLimitService.resetRateLimit(key);
            logger_1.logger.info('✅ Rate limit reset');
            const afterReset = await this.rateLimitService.checkRateLimit(key, maxRequests, windowSeconds);
            logger_1.logger.info('✅ After reset:', {
                allowed: afterReset.allowed,
                remaining: afterReset.remaining,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Rate limiting error:', error);
        }
    }
    async demoInputValidation() {
        logger_1.logger.info('✅ Testing Input Validation');
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
            logger_1.logger.info('✅ Valid input validation:', {
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
            logger_1.logger.info('✅ Invalid input validation:', {
                isValid: invalidResult.isValid,
                errors: invalidResult.errors,
            });
            // Test input sanitization
            const unsafeInput = {
                name: '<script>alert("xss")</script>John Doe',
                description: 'This is a test & description with "quotes"',
            };
            const sanitized = this.validationService.sanitizeInput(unsafeInput);
            logger_1.logger.info('✅ Input sanitization:', {
                original: unsafeInput,
                sanitized,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Input validation error:', error);
        }
    }
    async demoAuditLogging() {
        logger_1.logger.info('📋 Testing Audit Logging');
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
            const eventIds = [];
            for (const event of events) {
                const eventId = await this.auditService.recordEvent(event);
                eventIds.push(eventId);
            }
            logger_1.logger.info('✅ Audit events recorded:', eventIds.length);
            // Query audit events
            const allEvents = await this.auditService.getEvents({ limit: 10 });
            logger_1.logger.info('✅ Retrieved audit events:', allEvents.length);
            const userEvents = await this.auditService.getEvents({ userId: 'user1' });
            logger_1.logger.info('✅ User-specific events:', userEvents.length);
            const failedEvents = await this.auditService.getEvents({ success: false });
            logger_1.logger.info('✅ Failed events:', failedEvents.length);
            // Get user risk score
            const riskScore = await this.auditService.getUserRiskScore('user2');
            logger_1.logger.info('✅ User risk score:', riskScore);
            // Get security metrics
            const metrics = await this.auditService.getSecurityMetrics();
            logger_1.logger.info('✅ Security metrics:', {
                totalEvents: metrics.totalEvents,
                failedLogins: metrics.failedLogins,
                successfulLogins: metrics.successfulLogins,
                suspiciousActivities: metrics.suspiciousActivities,
                activeAlerts: metrics.activeAlerts,
            });
        }
        catch (error) {
            logger_1.logger.error('❌ Audit logging error:', error);
        }
    }
    async demoSecurityAlerts() {
        logger_1.logger.info('🚨 Testing Security Alerts');
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
            logger_1.logger.info('✅ Security alert created:', alertId);
            // Get active alerts
            const activeAlerts = await this.auditService.getActiveAlerts();
            logger_1.logger.info('✅ Active alerts:', activeAlerts.length);
            if (activeAlerts.length > 0) {
                logger_1.logger.info('Alert details:', {
                    id: activeAlerts[0].id,
                    type: activeAlerts[0].type,
                    severity: activeAlerts[0].severity,
                    description: activeAlerts[0].description,
                });
            }
            // Resolve the alert
            const resolved = await this.auditService.resolveAlert(alertId, 'admin1');
            logger_1.logger.info('✅ Alert resolved:', resolved);
            // Check active alerts after resolution
            const activeAlertsAfter = await this.auditService.getActiveAlerts();
            logger_1.logger.info('✅ Active alerts after resolution:', activeAlertsAfter.length);
        }
        catch (error) {
            logger_1.logger.error('❌ Security alerts error:', error);
        }
    }
    async demoJWTOperations() {
        logger_1.logger.info('🎫 Testing JWT Operations');
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
            logger_1.logger.info('✅ Access token generated:', accessToken.substring(0, 50) + '...');
            // Generate refresh token
            const refreshToken = await this.jwtService.generateRefreshToken(payload);
            logger_1.logger.info('✅ Refresh token generated:', refreshToken.substring(0, 50) + '...');
            // Verify access token
            const verifiedPayload = await this.jwtService.verifyToken(accessToken);
            logger_1.logger.info('✅ Token verified:', {
                userId: verifiedPayload.userId,
                email: verifiedPayload.email,
                exp: new Date(verifiedPayload.exp * 1000).toISOString(),
            });
            // Test token expiration (simulate expired token)
            try {
                const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkZW1vLXVzZXIiLCJlbWFpbCI6ImRlbW9AZXhhbXBsZS5jb20iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTYwMDAwMDAwMX0.invalid';
                await this.jwtService.verifyToken(expiredToken);
            }
            catch (error) {
                logger_1.logger.info('✅ Expired token correctly rejected:', error.message);
            }
            // Revoke refresh token
            await this.jwtService.revokeRefreshToken(refreshToken);
            logger_1.logger.info('✅ Refresh token revoked');
            // Try to use revoked token
            try {
                await this.jwtService.verifyRefreshToken(refreshToken);
            }
            catch (error) {
                logger_1.logger.info('✅ Revoked token correctly rejected:', error.message);
            }
        }
        catch (error) {
            logger_1.logger.error('❌ JWT operations error:', error);
        }
    }
    async cleanup() {
        try {
            // Clean up demo data
            const keys = await this.redis.keys('demo:*');
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            await this.redis.quit();
            logger_1.logger.info('🧹 Demo cleanup completed');
        }
        catch (error) {
            logger_1.logger.error('❌ Cleanup error:', error);
        }
    }
}
exports.AuthDemo = AuthDemo;
// Run the demo if this file is executed directly
if (require.main === module) {
    const demo = new AuthDemo();
    demo.runDemo()
        .then(() => demo.cleanup())
        .catch((error) => {
        logger_1.logger.error('Demo failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=auth-demo.js.map