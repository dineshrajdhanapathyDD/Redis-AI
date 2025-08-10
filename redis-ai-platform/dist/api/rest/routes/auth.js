"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthRoutes = createAuthRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function createAuthRoutes(redis, authService, authMiddleware) {
    const router = (0, express_1.Router)();
    // Public routes (no authentication required)
    // User registration
    router.post('/register', authMiddleware.validateInput({
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 3, maxLength: 50 },
            password: { type: 'string', minLength: 8 },
            firstName: { type: 'string', minLength: 1, maxLength: 50 },
            lastName: { type: 'string', minLength: 1, maxLength: 50 },
        },
        required: ['email', 'username', 'password', 'firstName', 'lastName'],
        additionalProperties: false,
    }), authMiddleware.rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 }), // 5 registrations per 15 minutes
    async (req, res) => {
        try {
            const registerData = req.body;
            const result = await authService.register(registerData);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`User registered successfully: ${registerData.email}`);
            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                data: {
                    userId: result.user.id,
                    email: result.user.email,
                    username: result.user.username,
                    emailVerificationRequired: !result.user.emailVerified,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Registration error:', error);
            res.status(500).json({
                success: false,
                error: 'Registration failed',
                message: 'Internal server error during registration',
            });
        }
    });
    // User login
    router.post('/login', authMiddleware.validateInput({
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 1 },
            rememberMe: { type: 'boolean' },
        },
        required: ['email', 'password'],
        additionalProperties: false,
    }), authMiddleware.rateLimit({ maxRequests: 10, windowMs: 15 * 60 * 1000 }), // 10 login attempts per 15 minutes
    async (req, res) => {
        try {
            const credentials = req.body;
            const result = await authService.login(credentials);
            if (!result.success) {
                logger_1.logger.warn(`Login failed for email: ${credentials.email} - ${result.error}`);
                return res.status(401).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`User logged in successfully: ${credentials.email}`);
            // Set secure HTTP-only cookie for refresh token
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.json({
                success: true,
                message: 'Login successful',
                data: {
                    accessToken: result.accessToken,
                    user: {
                        id: result.user.id,
                        email: result.user.email,
                        username: result.user.username,
                        roles: result.user.roles,
                        permissions: result.user.permissions,
                    },
                    expiresIn: result.expiresIn,
                    mfaRequired: result.mfaRequired,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Login error:', error);
            res.status(500).json({
                success: false,
                error: 'Login failed',
                message: 'Internal server error during login',
            });
        }
    });
    // Token refresh
    router.post('/refresh', authMiddleware.rateLimit({ maxRequests: 20, windowMs: 15 * 60 * 1000 }), async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                return res.status(401).json({
                    success: false,
                    error: 'Missing refresh token',
                    message: 'Refresh token is required',
                });
            }
            const result = await authService.refreshToken(refreshToken);
            if (!result.success) {
                return res.status(401).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            // Update refresh token cookie
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.json({
                success: true,
                message: 'Token refreshed successfully',
                data: {
                    accessToken: result.accessToken,
                    expiresIn: result.expiresIn,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: 'Token refresh failed',
                message: 'Internal server error during token refresh',
            });
        }
    });
    // Password reset request
    router.post('/forgot-password', authMiddleware.validateInput({
        type: 'object',
        properties: {
            email: { type: 'string', format: 'email' },
        },
        required: ['email'],
        additionalProperties: false,
    }), authMiddleware.rateLimit({ maxRequests: 3, windowMs: 15 * 60 * 1000 }), // 3 requests per 15 minutes
    async (req, res) => {
        try {
            const { email } = req.body;
            const result = await authService.requestPasswordReset(email);
            // Always return success to prevent email enumeration
            res.json({
                success: true,
                message: 'If the email exists, a password reset link has been sent',
            });
            if (result.success) {
                logger_1.logger.info(`Password reset requested for email: ${email}`);
            }
            else {
                logger_1.logger.warn(`Password reset requested for non-existent email: ${email}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Password reset request error:', error);
            res.status(500).json({
                success: false,
                error: 'Password reset request failed',
                message: 'Internal server error',
            });
        }
    });
    // Password reset confirmation
    router.post('/reset-password', authMiddleware.validateInput({
        type: 'object',
        properties: {
            token: { type: 'string', minLength: 1 },
            newPassword: { type: 'string', minLength: 8 },
        },
        required: ['token', 'newPassword'],
        additionalProperties: false,
    }), authMiddleware.rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 }), async (req, res) => {
        try {
            const { token, newPassword } = req.body;
            const result = await authService.resetPassword(token, newPassword);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`Password reset completed for user: ${result.userId}`);
            res.json({
                success: true,
                message: 'Password reset successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Password reset error:', error);
            res.status(500).json({
                success: false,
                error: 'Password reset failed',
                message: 'Internal server error during password reset',
            });
        }
    });
    // Email verification
    router.post('/verify-email', authMiddleware.validateInput({
        type: 'object',
        properties: {
            token: { type: 'string', minLength: 1 },
        },
        required: ['token'],
        additionalProperties: false,
    }), async (req, res) => {
        try {
            const { token } = req.body;
            const result = await authService.verifyEmail(token);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`Email verified for user: ${result.userId}`);
            res.json({
                success: true,
                message: 'Email verified successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Email verification error:', error);
            res.status(500).json({
                success: false,
                error: 'Email verification failed',
                message: 'Internal server error during email verification',
            });
        }
    });
    // Protected routes (authentication required)
    // Logout
    router.post('/logout', authMiddleware.authenticate, async (req, res) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (refreshToken) {
                await authService.logout(refreshToken);
            }
            // Clear refresh token cookie
            res.clearCookie('refreshToken');
            logger_1.logger.info(`User logged out: ${req.user.id}`);
            res.json({
                success: true,
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Logout error:', error);
            res.status(500).json({
                success: false,
                error: 'Logout failed',
                message: 'Internal server error during logout',
            });
        }
    });
    // Get current user profile
    router.get('/profile', authMiddleware.authenticate, async (req, res) => {
        try {
            const user = req.user;
            res.json({
                success: true,
                data: {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles: user.roles,
                    permissions: user.permissions,
                    emailVerified: user.emailVerified,
                    mfaEnabled: user.mfaEnabled,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get profile',
                message: 'Internal server error',
            });
        }
    });
    // Update user profile
    router.put('/profile', authMiddleware.authenticate, authMiddleware.validateInput({
        type: 'object',
        properties: {
            firstName: { type: 'string', minLength: 1, maxLength: 50 },
            lastName: { type: 'string', minLength: 1, maxLength: 50 },
            username: { type: 'string', minLength: 3, maxLength: 50 },
        },
        additionalProperties: false,
    }), async (req, res) => {
        try {
            const userId = req.user.id;
            const updates = req.body;
            const result = await authService.updateProfile(userId, updates);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`Profile updated for user: ${userId}`);
            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: result.user,
            });
        }
        catch (error) {
            logger_1.logger.error('Update profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Profile update failed',
                message: 'Internal server error during profile update',
            });
        }
    });
    // Change password
    router.post('/change-password', authMiddleware.authenticate, authMiddleware.validateInput({
        type: 'object',
        properties: {
            currentPassword: { type: 'string', minLength: 1 },
            newPassword: { type: 'string', minLength: 8 },
        },
        required: ['currentPassword', 'newPassword'],
        additionalProperties: false,
    }), authMiddleware.rateLimit({ maxRequests: 5, windowMs: 15 * 60 * 1000 }), async (req, res) => {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            const result = await authService.changePassword(userId, currentPassword, newPassword);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`Password changed for user: ${userId}`);
            res.json({
                success: true,
                message: 'Password changed successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Change password error:', error);
            res.status(500).json({
                success: false,
                error: 'Password change failed',
                message: 'Internal server error during password change',
            });
        }
    });
    // MFA routes
    // Enable MFA
    router.post('/mfa/enable', authMiddleware.authenticate, async (req, res) => {
        try {
            const userId = req.user.id;
            const result = await authService.enableMFA(userId);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`MFA enabled for user: ${userId}`);
            res.json({
                success: true,
                message: 'MFA enabled successfully',
                data: {
                    qrCode: result.qrCode,
                    backupCodes: result.backupCodes,
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Enable MFA error:', error);
            res.status(500).json({
                success: false,
                error: 'MFA enable failed',
                message: 'Internal server error during MFA setup',
            });
        }
    });
    // Verify MFA setup
    router.post('/mfa/verify-setup', authMiddleware.authenticate, authMiddleware.validateInput({
        type: 'object',
        properties: {
            token: { type: 'string', pattern: '^[0-9]{6}$' },
        },
        required: ['token'],
        additionalProperties: false,
    }), async (req, res) => {
        try {
            const userId = req.user.id;
            const { token } = req.body;
            const result = await authService.verifyMFASetup(userId, token);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`MFA setup verified for user: ${userId}`);
            res.json({
                success: true,
                message: 'MFA setup verified successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Verify MFA setup error:', error);
            res.status(500).json({
                success: false,
                error: 'MFA verification failed',
                message: 'Internal server error during MFA verification',
            });
        }
    });
    // Disable MFA
    router.post('/mfa/disable', authMiddleware.authenticate, authMiddleware.validateInput({
        type: 'object',
        properties: {
            password: { type: 'string', minLength: 1 },
        },
        required: ['password'],
        additionalProperties: false,
    }), async (req, res) => {
        try {
            const userId = req.user.id;
            const { password } = req.body;
            const result = await authService.disableMFA(userId, password);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`MFA disabled for user: ${userId}`);
            res.json({
                success: true,
                message: 'MFA disabled successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Disable MFA error:', error);
            res.status(500).json({
                success: false,
                error: 'MFA disable failed',
                message: 'Internal server error during MFA disable',
            });
        }
    });
    // Admin routes (require admin role)
    // Get all users (admin only)
    router.get('/admin/users', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {
        try {
            const { page = 1, limit = 20, search, role } = req.query;
            const result = await authService.getUsers({
                page: parseInt(page),
                limit: parseInt(limit),
                search: search,
                role: role,
            });
            res.json({
                success: true,
                data: result.users,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    total: result.total,
                    pages: Math.ceil(result.total / result.limit),
                },
            });
        }
        catch (error) {
            logger_1.logger.error('Get users error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get users',
                message: 'Internal server error',
            });
        }
    });
    // Update user roles (admin only)
    router.put('/admin/users/:userId/roles', authMiddleware.authenticate, authMiddleware.requireRole('admin'), authMiddleware.validateInput({
        type: 'object',
        properties: {
            roles: {
                type: 'array',
                items: { type: 'string' },
                minItems: 0,
            },
        },
        required: ['roles'],
        additionalProperties: false,
    }), async (req, res) => {
        try {
            const { userId } = req.params;
            const { roles } = req.body;
            const result = await authService.updateUserRoles(userId, roles);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`User roles updated: ${userId} - roles: ${roles.join(', ')}`);
            res.json({
                success: true,
                message: 'User roles updated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Update user roles error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update user roles',
                message: 'Internal server error',
            });
        }
    });
    // Deactivate user (admin only)
    router.post('/admin/users/:userId/deactivate', authMiddleware.authenticate, authMiddleware.requireRole('admin'), async (req, res) => {
        try {
            const { userId } = req.params;
            const result = await authService.deactivateUser(userId);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    error: result.error,
                    message: result.message,
                });
            }
            logger_1.logger.info(`User deactivated: ${userId}`);
            res.json({
                success: true,
                message: 'User deactivated successfully',
            });
        }
        catch (error) {
            logger_1.logger.error('Deactivate user error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to deactivate user',
                message: 'Internal server error',
            });
        }
    });
    return router;
}
//# sourceMappingURL=auth.js.map