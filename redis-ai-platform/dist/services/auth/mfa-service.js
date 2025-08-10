"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MfaService = void 0;
const speakeasy_1 = __importDefault(require("speakeasy"));
const qrcode_1 = __importDefault(require("qrcode"));
const logger_1 = require("../../utils/logger");
const types_1 = require("./types");
class MfaService {
    redis;
    config;
    constructor(redis, config) {
        this.redis = redis;
        this.config = config;
    }
    /**
     * Generate MFA secret and QR code for user
     */
    async setupMfa(user) {
        try {
            if (!this.config.mfa.enabled) {
                throw new Error('MFA is not enabled on this system');
            }
            // Generate secret
            const secret = speakeasy_1.default.generateSecret({
                name: `${this.config.mfa.issuer}:${user.email}`,
                issuer: this.config.mfa.issuer,
                length: 32,
            });
            // Generate QR code
            const qrCodeUrl = await qrcode_1.default.toDataURL(secret.otpauth_url);
            // Generate backup codes
            const backupCodes = this.generateBackupCodes();
            const hashedBackupCodes = await this.hashBackupCodes(backupCodes);
            // Store MFA setup data temporarily (not activated until verified)
            const setupData = {
                userId: user.id,
                secret: secret.base32,
                backupCodes: hashedBackupCodes,
                createdAt: new Date().toISOString(),
                verified: false,
            };
            await this.redis.setex(`mfa_setup:${user.id}`, 1800, // 30 minutes
            JSON.stringify(setupData));
            // Log security event
            await this.logSecurityEvent({
                userId: user.id,
                type: types_1.SecurityEventType.MFA_ENABLED,
                description: 'MFA setup initiated',
                metadata: { email: user.email },
                severity: 'medium',
            });
            return {
                secret: secret.base32,
                qrCodeUrl,
                backupCodes,
            };
        }
        catch (error) {
            logger_1.logger.error('Error setting up MFA:', error);
            throw error;
        }
    }
    /**
     * Verify MFA setup with initial code
     */
    async verifyMfaSetup(userId, code) {
        try {
            const setupData = await this.redis.get(`mfa_setup:${userId}`);
            if (!setupData) {
                throw new Error('MFA setup not found or expired');
            }
            const data = JSON.parse(setupData);
            // Verify the code
            const isValid = speakeasy_1.default.totp.verify({
                secret: data.secret,
                encoding: 'base32',
                token: code,
                window: this.config.mfa.window,
            });
            if (!isValid) {
                return false;
            }
            // Mark as verified and move to permanent storage
            const mfaData = {
                userId,
                secret: data.secret,
                backupCodes: data.backupCodes,
                enabled: true,
                verifiedAt: new Date().toISOString(),
                createdAt: data.createdAt,
            };
            await this.redis.set(`mfa:${userId}`, JSON.stringify(mfaData));
            await this.redis.del(`mfa_setup:${userId}`);
            // Log security event
            await this.logSecurityEvent({
                userId,
                type: types_1.SecurityEventType.MFA_ENABLED,
                description: 'MFA setup completed and verified',
                metadata: {},
                severity: 'medium',
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error('Error verifying MFA setup:', error);
            throw error;
        }
    }
    /**
     * Verify MFA code during login
     */
    async verifyMfaCode(userId, code) {
        try {
            const mfaData = await this.redis.get(`mfa:${userId}`);
            if (!mfaData) {
                throw new Error('MFA not enabled for user');
            }
            const data = JSON.parse(mfaData);
            if (!data.enabled) {
                throw new Error('MFA is disabled for user');
            }
            // First try TOTP verification
            const isValidTotp = speakeasy_1.default.totp.verify({
                secret: data.secret,
                encoding: 'base32',
                token: code,
                window: this.config.mfa.window,
            });
            if (isValidTotp) {
                // Check for replay attack
                const lastUsedKey = `mfa_last_used:${userId}`;
                const lastUsedCode = await this.redis.get(lastUsedKey);
                if (lastUsedCode === code) {
                    throw new Error('Code has already been used');
                }
                // Store the code to prevent replay
                await this.redis.setex(lastUsedKey, 60, code); // 60 seconds window
                return { isValid: true };
            }
            // Try backup code verification
            const backupCodeIndex = await this.verifyBackupCode(code, data.backupCodes);
            if (backupCodeIndex >= 0) {
                // Mark backup code as used
                data.backupCodes[backupCodeIndex] = null;
                await this.redis.set(`mfa:${userId}`, JSON.stringify(data));
                // Log backup code usage
                await this.logSecurityEvent({
                    userId,
                    type: types_1.SecurityEventType.MFA_BACKUP_USED,
                    description: 'MFA backup code used',
                    metadata: { backupCodeIndex },
                    severity: 'high',
                });
                return {
                    isValid: true,
                    usedBackupCode: true,
                    backupCodeIndex
                };
            }
            return { isValid: false };
        }
        catch (error) {
            logger_1.logger.error('Error verifying MFA code:', error);
            throw error;
        }
    }
    /**
     * Disable MFA for user
     */
    async disableMfa(userId) {
        try {
            const mfaData = await this.redis.get(`mfa:${userId}`);
            if (!mfaData) {
                return; // Already disabled
            }
            // Remove MFA data
            await this.redis.del(`mfa:${userId}`);
            await this.redis.del(`mfa_setup:${userId}`);
            await this.redis.del(`mfa_last_used:${userId}`);
            // Log security event
            await this.logSecurityEvent({
                userId,
                type: types_1.SecurityEventType.MFA_DISABLED,
                description: 'MFA disabled for user',
                metadata: {},
                severity: 'high',
            });
            logger_1.logger.info(`MFA disabled for user ${userId}`);
        }
        catch (error) {
            logger_1.logger.error('Error disabling MFA:', error);
            throw error;
        }
    }
    /**
     * Check if MFA is enabled for user
     */
    async isMfaEnabled(userId) {
        try {
            const mfaData = await this.redis.get(`mfa:${userId}`);
            if (!mfaData) {
                return false;
            }
            const data = JSON.parse(mfaData);
            return data.enabled === true;
        }
        catch (error) {
            logger_1.logger.error('Error checking MFA status:', error);
            return false;
        }
    }
    /**
     * Get remaining backup codes count
     */
    async getRemainingBackupCodes(userId) {
        try {
            const mfaData = await this.redis.get(`mfa:${userId}`);
            if (!mfaData) {
                return 0;
            }
            const data = JSON.parse(mfaData);
            return data.backupCodes.filter((code) => code !== null).length;
        }
        catch (error) {
            logger_1.logger.error('Error getting backup codes count:', error);
            return 0;
        }
    }
    /**
     * Regenerate backup codes
     */
    async regenerateBackupCodes(userId) {
        try {
            const mfaData = await this.redis.get(`mfa:${userId}`);
            if (!mfaData) {
                throw new Error('MFA not enabled for user');
            }
            const data = JSON.parse(mfaData);
            // Generate new backup codes
            const newBackupCodes = this.generateBackupCodes();
            const hashedBackupCodes = await this.hashBackupCodes(newBackupCodes);
            // Update MFA data
            data.backupCodes = hashedBackupCodes;
            data.backupCodesRegeneratedAt = new Date().toISOString();
            await this.redis.set(`mfa:${userId}`, JSON.stringify(data));
            // Log security event
            await this.logSecurityEvent({
                userId,
                type: types_1.SecurityEventType.MFA_BACKUP_USED, // Reusing this type for regeneration
                description: 'MFA backup codes regenerated',
                metadata: { codesCount: newBackupCodes.length },
                severity: 'medium',
            });
            return newBackupCodes;
        }
        catch (error) {
            logger_1.logger.error('Error regenerating backup codes:', error);
            throw error;
        }
    }
    /**
     * Generate backup codes
     */
    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate 8-character code with format XXXX-XXXX
            const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
            const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
            codes.push(`${part1}-${part2}`);
        }
        return codes;
    }
    /**
     * Hash backup codes
     */
    async hashBackupCodes(codes) {
        const bcrypt = require('bcrypt');
        const hashedCodes = [];
        for (const code of codes) {
            const hash = await bcrypt.hash(code, 10);
            hashedCodes.push(hash);
        }
        return hashedCodes;
    }
    /**
     * Verify backup code
     */
    async verifyBackupCode(code, hashedCodes) {
        const bcrypt = require('bcrypt');
        for (let i = 0; i < hashedCodes.length; i++) {
            const hashedCode = hashedCodes[i];
            if (hashedCode && await bcrypt.compare(code, hashedCode)) {
                return i;
            }
        }
        return -1;
    }
    /**
     * Log security event
     */
    async logSecurityEvent(event) {
        try {
            const securityEvent = {
                id: require('crypto').randomUUID(),
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
exports.MfaService = MfaService;
//# sourceMappingURL=mfa-service.js.map