import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/auth/jwt-service';
import { RBACService } from '../services/auth/rbac-service';
import { RateLimitService } from '../services/auth/rate-limit-service';
import { ValidationService } from '../services/auth/validation-service';
import { User, Permission } from '../services/auth/types';
export interface AuthenticatedRequest extends Request {
    user?: User;
    permissions?: Permission[];
    rateLimitInfo?: {
        remaining: number;
        resetTime: number;
        limit: number;
    };
}
export declare class AuthMiddleware {
    private jwtService;
    private rbacService;
    private rateLimitService;
    private validationService;
    constructor(jwtService: JWTService, rbacService: RBACService, rateLimitService: RateLimitService, validationService: ValidationService);
    authenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    optionalAuthenticate: (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (requiredRoles: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requirePermission: (requiredPermissions: string | string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    requireOwnership: (resourceIdParam?: string, resourceType?: string) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    rateLimit: (options?: {
        windowMs?: number;
        maxRequests?: number;
        keyGenerator?: (req: Request) => string;
        skipSuccessfulRequests?: boolean;
        skipFailedRequests?: boolean;
    }) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    validateInput: (schema: any, source?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
    csrfProtection: (options?: {
        headerName?: string;
        cookieName?: string;
        ignoreMethods?: string[];
    }) => (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
    securityHeaders: (req: Request, res: Response, next: NextFunction) => void;
    auditLog: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
}
//# sourceMappingURL=auth.d.ts.map