"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const logger_1 = require("../../utils/logger");
const types_1 = require("./types");
class PasswordService {
    redis;
    config;
    saltRounds = 12;
    constructor(redis, config) {
        this.redis = redis;
        this.config = config;
    }
    /**
     * Hash a password using bcrypt
     */
    async hashPassword(password) {
        try {
            // Validate password strength
            this.validatePasswordStrength(password);
            const hash = await bcrypt_1.default.hash(password, this.saltRounds);
            return hash;
        }
        catch (error) {
            logger_1.logger.error('Error hashing password:', error);
            throw error;
        }
    }
    /**
     * Verify a password against its hash
     */
    async verifyPassword(password, hash) {
        try {
            return await bcrypt_1.default.compare(password, hash);
        }
        catch (error) {
            logger_1.logger.error('Error verifying password:', error);
            return false;
        }
    }
    /**
     * Validate password strength according to policy
     */
    validatePasswordStrength(password) {
        const { password: policy } = this.config;
        const errors = [];
        if (password.length < policy.minLength) {
            errors.push(`Password must be at least ${policy.minLength} characters long`);
        }
        if (policy.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
        if (policy.requireLowercase && !/[a-z]/.test(password)) {
            errors.push('Password must contain at least one lowercase letter');
        }
        if (policy.requireNumbers && !/\d/.test(password)) {
            errors.push('Password must contain at least one number');
        }
        if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
        // Check for common weak passwords
        if (this.isCommonPassword(password)) {
            errors.push('Password is too common and easily guessable');
        }
        if (errors.length > 0) {
            throw new Error(`Password validation failed: ${errors.join(', ')}`);
        }
    }
    /**
     * Generate a secure random password
     */
    generateSecurePassword(length = 16) {
        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = uppercase + lowercase + numbers + symbols;
        let password = '';
        // Ensure at least one character from each required category
        if (this.config.password.requireUppercase) {
            password += uppercase[crypto_1.default.randomInt(0, uppercase.length)];
        }
        if (this.config.password.requireLowercase) {
            password += lowercase[crypto_1.default.randomInt(0, lowercase.length)];
        }
        if (this.config.password.requireNumbers) {
            password += numbers[crypto_1.default.randomInt(0, numbers.length)];
        }
        if (this.config.password.requireSpecialChars) {
            password += symbols[crypto_1.default.randomInt(0, symbols.length)];
        }
        // Fill the rest with random characters
        for (let i = password.length; i < length; i++) {
            password += allChars[crypto_1.default.randomInt(0, allChars.length)];
        }
        // Shuffle the password
        return password.split('').sort(() => Math.random() - 0.5).join('');
    }
    /**
     * Generate password reset token
     */
    async generatePasswordResetToken(userId, email) {
        try {
            const token = crypto_1.default.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
            const resetData = {
                userId,
                email,
                token,
                expiresAt: expiresAt.toISOString(),
                used: false,
                createdAt: new Date().toISOString(),
            };
            // Store reset token in Redis with 1 hour expiry
            await this.redis.setex(`password_reset:${token}`, 3600, JSON.stringify(resetData));
            // Also store by user ID to prevent multiple active tokens
            await this.redis.setex(`password_reset_user:${userId}`, 3600, token);
            // Log security event
            await this.logSecurityEvent({
                userId,
                type: types_1.SecurityEventType.PASSWORD_RESET_REQUESTED,
                description: 'Password reset token generated',
                metadata: { email },
                severity: 'medium',
            });
            return token;
        }
        catch (error) {
            logger_1.logger.error('Error generating password reset token:', error);
            throw new Error('Failed to generate password reset token');
        }
    }
    /**
     * Verify password reset token
     */
    async verifyPasswordResetToken(token) {
        try {
            const resetData = await this.redis.get(`password_reset:${token}`);
            if (!resetData) {
                return null;
            }
            const data = JSON.parse(resetData);
            if (data.used) {
                return null;
            }
            if (new Date(data.expiresAt) < new Date()) {
                await this.redis.del(`password_reset:${token}`);
                return null;
            }
            return {
                userId: data.userId,
                email: data.email,
            };
        }
        catch (error) {
            logger_1.logger.error('Error verifying password reset token:', error);
            return null;
        }
    }
    /**
     * Use password reset token
     */
    async usePasswordResetToken(token, newPassword) {
        try {
            const resetData = await this.redis.get(`password_reset:${token}`);
            if (!resetData) {
                return false;
            }
            const data = JSON.parse(resetData);
            if (data.used || new Date(data.expiresAt) < new Date()) {
                return false;
            }
            // Validate new password
            this.validatePasswordStrength(newPassword);
            // Mark token as used
            data.used = true;
            data.usedAt = new Date().toISOString();
            await this.redis.setex(`password_reset:${token}`, 3600, // Keep for audit purposes
            JSON.stringify(data));
            // Remove user's reset token
            await this.redis.del(`password_reset_user:${data.userId}`);
            // Log security event
            await this.logSecurityEvent({
                userId: data.userId,
                type: types_1.SecurityEventType.PASSWORD_RESET_COMPLETED,
                description: 'Password reset completed successfully',
                metadata: { email: data.email },
                severity: 'medium',
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error using password reset token:', error);
            return false;
        }
    }
    /**
     * Check if password has expired
     */
    async isPasswordExpired(userId, lastPasswordChange) {
        const maxAge = this.config.password.maxAge;
        if (maxAge <= 0) {
            return false; // Password expiry disabled
        }
        const daysSinceChange = Math.floor((Date.now() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceChange > maxAge;
    }
    /**
     * Store password history to prevent reuse
     */
    async storePasswordHistory(userId, passwordHash) {
        try {
            const historyKey = `password_history:${userId}`;
            // Add new password hash to history
            await this.redis.lpush(historyKey, passwordHash);
            // Keep only last 12 passwords
            await this.redis.ltrim(historyKey, 0, 11);
            // Set expiry for the history (2 years)
            await this.redis.expire(historyKey, 2 * 365 * 24 * 60 * 60);
        }
        catch (error) {
            logger_1.logger.error('Error storing password history:', error);
        }
    }
    /**
     * Check if password was used recently
     */
    async isPasswordReused(userId, password) {
        try {
            const historyKey = `password_history:${userId}`;
            const passwordHistory = await this.redis.lrange(historyKey, 0, -1);
            for (const oldHash of passwordHistory) {
                if (await this.verifyPassword(password, oldHash)) {
                    return true;
                }
            }
            return false;
        }
        catch (error) {
            logger_1.logger.error('Error checking password reuse:', error);
            return false;
        }
    }
    /**
     * Generate backup codes for MFA
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character alphanumeric code
            const code = crypto_1.default.randomBytes(4).toString('hex').toUpperCase();
            codes.push(code);
        }
        return codes;
    }
    /**
     * Hash backup codes
     */
    async hashBackupCodes(codes) {
        const hashedCodes = [];
        for (const code of codes) {
            const hash = await bcrypt_1.default.hash(code, this.saltRounds);
            hashedCodes.push(hash);
        }
        return hashedCodes;
    }
    /**
     * Verify backup code
     */
    async verifyBackupCode(code, hashedCodes) {
        for (let i = 0; i < hashedCodes.length; i++) {
            if (await bcrypt_1.default.compare(code, hashedCodes[i])) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Check if password is commonly used
     */
    isCommonPassword(password) {
        const commonPasswords = [
            'password', '123456', '123456789', 'qwerty', 'abc123',
            'password123', 'admin', 'letmein', 'welcome', 'monkey',
            'dragon', 'master', 'shadow', 'qwertyuiop', 'asdfghjkl',
            '1234567890', 'password1', '123123', 'welcome123'
        ];
        return commonPasswords.includes(password.toLowerCase());
    }
    /**
     * Log security event
     */
    async logSecurityEvent(event) {
        try {
            const securityEvent = {
                id: crypto_1.default.randomUUID(),
                timestamp: new Date(),
                ...event,
            };
            await this.redis.lpush(`security_events:${event.userId}`, JSON.stringify(securityEvent));
            await this.redis.ltrim(`security_events:${event.userId}`, 0, 999);
        }
        catch (error) {
            logger_1.logger.error('Error logging security event:', error);
        }
    }
}
exports.PasswordService = PasswordService;
//# sourceMappingURL=password-service.js.map