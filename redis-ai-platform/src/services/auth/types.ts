export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  roles: Role[];
  permissions: Permission[];
  isActive: boolean;
  isVerified: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: UserMetadata;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  description: string;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'in' | 'nin' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface UserMetadata {
  preferences: Record<string, any>;
  settings: Record<string, any>;
  profile: Record<string, any>;
  security: {
    mfaEnabled: boolean;
    mfaSecret?: string;
    lastPasswordChange: Date;
    failedLoginAttempts: number;
    lockedUntil?: Date;
    trustedDevices: TrustedDevice[];
  };
}

export interface TrustedDevice {
  id: string;
  name: string;
  fingerprint: string;
  lastUsed: Date;
  createdAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TokenPayload {
  sub: string; // user id
  email: string;
  username: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  aud: string;
  iss: string;
  jti: string; // token id
}

export interface RefreshTokenData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  isRevoked: boolean;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  lastUsed?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
  rememberMe?: boolean;
  mfaCode?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface MfaSetupRequest {
  password: string;
}

export interface MfaVerifyRequest {
  code: string;
  backupCode?: string;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  type: SecurityEventType;
  description: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export enum SecurityEventType {
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILED = 'login_failed',
  LOGIN_BLOCKED = 'login_blocked',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PASSWORD_RESET_REQUESTED = 'password_reset_requested',
  PASSWORD_RESET_COMPLETED = 'password_reset_completed',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_BACKUP_USED = 'mfa_backup_used',
  ACCOUNT_LOCKED = 'account_locked',
  ACCOUNT_UNLOCKED = 'account_unlocked',
  PERMISSION_DENIED = 'permission_denied',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  TOKEN_REFRESH = 'token_refresh',
  TOKEN_REVOKED = 'token_revoked',
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
  onLimitReached?: (req: any, res: any) => void;
}

export interface SecurityConfig {
  jwt: {
    secret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
  };
  password: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number; // days
  };
  mfa: {
    enabled: boolean;
    issuer: string;
    window: number;
  };
  rateLimit: {
    login: RateLimitConfig;
    api: RateLimitConfig;
    registration: RateLimitConfig;
    passwordReset: RateLimitConfig;
  };
  security: {
    maxFailedAttempts: number;
    lockoutDuration: number; // minutes
    sessionTimeout: number; // minutes
    requireEmailVerification: boolean;
    allowMultipleSessions: boolean;
  };
}

export interface AuthContext {
  user: User;
  permissions: Set<string>;
  roles: Set<string>;
  sessionId: string;
  deviceFingerprint?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface WorkspacePermissions {
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
  grantedBy: string;
  grantedAt: Date;
  expiresAt?: Date;
}

export enum WorkspaceRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
  GUEST = 'guest',
}

export enum WorkspacePermission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  INVITE = 'invite',
  MANAGE_MEMBERS = 'manage_members',
  MANAGE_SETTINGS = 'manage_settings',
  EXPORT_DATA = 'export_data',
  VIEW_ANALYTICS = 'view_analytics',
}

export interface AccessControlList {
  resourceType: string;
  resourceId: string;
  permissions: {
    userId?: string;
    roleId?: string;
    permissions: string[];
    conditions?: PermissionCondition[];
    grantedBy: string;
    grantedAt: Date;
    expiresAt?: Date;
  }[];
}

export interface SecurityAuditLog {
  id: string;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  result: 'success' | 'failure' | 'denied';
  reason?: string;
  metadata: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'error' | 'critical';
}