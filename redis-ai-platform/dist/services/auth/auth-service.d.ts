import { Redis } from 'ioredis';
import { User, AuthTokens, LoginRequest, RegisterRequest, PasswordResetRequest, PasswordResetConfirm, ChangePasswordRequest, MfaSetupRequest, MfaVerifyRequest, SecurityConfig, AuthContext } from './types';
export declare class AuthService {
    private redis;
    private config;
    private jwtService;
    private passwordService;
    private mfaService;
    private rbacService;
    constructor(redis: Redis, config: SecurityConfig);
    /**
     * Initialize the authentication service
     */
    initialize(): Promise<void>;
    /**
     * Register a new user
     */
    register(request: RegisterRequest, ipAddress?: string, userAgent?: string): Promise<{
        user: User;
        tokens?: AuthTokens;
    }>;
    /**
     * Authenticate user login
     */
    login(request: LoginRequest, ipAddress?: string, userAgent?: string): Promise<{
        user: User;
        tokens: AuthTokens;
        requiresMfa?: boolean;
    }>;
    /**
     * Logout user
     */
    logout(userId: string, tokenId?: string): Promise<void>;
    /**
     * Refresh authentication tokens
     */
    refreshTokens(refreshToken: string, deviceFingerprint?: string, ipAddress?: string, userAgent?: string): Promise<AuthTokens>;
    /**
     * Request password reset
     */
    requestPasswordReset(request: PasswordResetRequest): Promise<void>;
    /**
     * Confirm password reset
     */
    confirmPasswordReset(request: PasswordResetConfirm): Promise<void>;
    /**
     * Change user password
     */
    changePassword(userId: string, request: ChangePasswordRequest): Promise<void>;
    /**
     * Setup MFA for user
     */
    setupMfa(userId: string, request: MfaSetupRequest): Promise<{
        secret: string;
        qrCodeUrl: string;
        backupCodes: string[];
    }>;
    /**
     * Verify MFA setup
     */
    verifyMfaSetup(userId: string, request: MfaVerifyRequest): Promise<void>;
    /**
     * Disable MFA for user
     */
    disableMfa(userId: string, password: string): Promise<void>;
    /**
     * Get user by ID
     */
    getUser(userId: string): Promise<User | null>;
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<User | null>;
    /**
     * Get user by username
     */
    getUserByUsername(username: string): Promise<User | null>;
    /**
     * Update user
     */
    updateUser(user: User): Promise<void>;
    /**
     * Create auth context from token
     */
    createAuthContext(token: string, ipAddress?: string, userAgent?: string): Promise<AuthContext | null>;
    /**
     * Check if account is locked
     */
    private isAccountLocked;
    /**
     * Increment failed login attempts
     */
    private incrementFailedAttempts;
    /**
     * Reset failed login attempts
     */
    private resetFailedAttempts;
    /**
     * Log security event
     */
    private logSecurityEvent;
}
//# sourceMappingURL=auth-service.d.ts.map