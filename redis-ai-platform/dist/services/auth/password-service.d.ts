import { Redis } from 'ioredis';
import { SecurityConfig } from './types';
export declare class PasswordService {
    private redis;
    private config;
    private readonly saltRounds;
    constructor(redis: Redis, config: SecurityConfig);
    /**
     * Hash a password using bcrypt
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Verify a password against its hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Validate password strength according to policy
     */
    validatePasswordStrength(password: string): void;
    /**
     * Generate a secure random password
     */
    generateSecurePassword(length?: number): string;
    /**
     * Generate password reset token
     */
    generatePasswordResetToken(userId: string, email: string): Promise<string>;
    /**
     * Verify password reset token
     */
    verifyPasswordResetToken(token: string): Promise<{
        userId: string;
        email: string;
    } | null>;
    /**
     * Use password reset token
     */
    usePasswordResetToken(token: string, newPassword: string): Promise<boolean>;
    /**
     * Check if password has expired
     */
    isPasswordExpired(userId: string, lastPasswordChange: Date): Promise<boolean>;
    /**
     * Store password history to prevent reuse
     */
    storePasswordHistory(userId: string, passwordHash: string): Promise<void>;
    /**
     * Check if password was used recently
     */
    isPasswordReused(userId: string, password: string): Promise<boolean>;
    /**
     * Generate backup codes for MFA
     */
    generateBackupCodes(count?: number): string[];
    /**
     * Hash backup codes
     */
    hashBackupCodes(codes: string[]): Promise<string[]>;
    /**
     * Verify backup code
     */
    verifyBackupCode(code: string, hashedCodes: string[]): Promise<number>;
    /**
     * Check if password is commonly used
     */
    private isCommonPassword;
    /**
     * Log security event
     */
    private logSecurityEvent;
}
//# sourceMappingURL=password-service.d.ts.map