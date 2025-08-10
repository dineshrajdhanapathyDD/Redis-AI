import { Redis } from 'ioredis';
import { SecurityConfig, User } from './types';
export interface MfaSetupResult {
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
}
export interface MfaVerificationResult {
    isValid: boolean;
    usedBackupCode?: boolean;
    backupCodeIndex?: number;
}
export declare class MfaService {
    private redis;
    private config;
    constructor(redis: Redis, config: SecurityConfig);
    /**
     * Generate MFA secret and QR code for user
     */
    setupMfa(user: User): Promise<MfaSetupResult>;
    /**
     * Verify MFA setup with initial code
     */
    verifyMfaSetup(userId: string, code: string): Promise<boolean>;
    /**
     * Verify MFA code during login
     */
    verifyMfaCode(userId: string, code: string): Promise<MfaVerificationResult>;
    /**
     * Disable MFA for user
     */
    disableMfa(userId: string): Promise<void>;
    /**
     * Check if MFA is enabled for user
     */
    isMfaEnabled(userId: string): Promise<boolean>;
    /**
     * Get remaining backup codes count
     */
    getRemainingBackupCodes(userId: string): Promise<number>;
    /**
     * Regenerate backup codes
     */
    regenerateBackupCodes(userId: string): Promise<string[]>;
    /**
     * Generate backup codes
     */
    private generateBackupCodes;
    /**
     * Hash backup codes
     */
    private hashBackupCodes;
    /**
     * Verify backup code
     */
    private verifyBackupCode;
    /**
     * Log security event
     */
    private logSecurityEvent;
}
//# sourceMappingURL=mfa-service.d.ts.map