import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/auth/jwt-service';
import { RBACService } from '../services/auth/rbac-service';
import { RateLimitService } from '../services/auth/rate-limit-service';
import { ValidationService } from '../services/auth/validation-service';
import { logger } from '../utils/logger';
import { User, Permission, Role } from '../services/auth/types';

export interface AuthenticatedRequest extends Request {
  user?: User;
  permissions?: Permission[];
  rateLimitInfo?: {
    remaining: number;
    resetTime: number;
    limit: number;
  };
}

export class AuthMiddleware {
  constructor(
    private jwtService: JWTService,
    private rbacService: RBACService,
    private rateLimitService: RateLimitService,
    private validationService: ValidationService
  ) {}

  // JWT Authentication middleware
  authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'Missing or invalid authorization header',
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      try {
        const payload = await this.jwtService.verifyToken(token);
        
        // Get user details (in a real implementation, this would fetch from database)
        const user: User = {
          id: payload.userId,
          email: payload.email,
          username: payload.username,
          roles: payload.roles || [],
          permissions: payload.permissions || [],
          isActive: true,
          emailVerified: true,
          createdAt: new Date(payload.iat * 1000),
          updatedAt: new Date(),
        };

        req.user = user;
        req.permissions = user.permissions;
        
        logger.debug(`User authenticated: ${user.id}`);
        next();
      } catch (tokenError) {
        logger.warn('Invalid JWT token:', tokenError.message);
        return res.status(401).json({
          success: false,
          error: 'Invalid token',
          message: 'Token verification failed',
        });
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      return res.status(500).json({
        success: false,
        error: 'Authentication failed',
        message: 'Internal server error during authentication',
      });
    }
  };

  // Optional authentication (doesn't fail if no token)
  optionalAuthenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without authentication
    }

    // Use the regular authenticate middleware but don't fail on error
    this.authenticate(req, res, (error) => {
      if (error) {
        logger.debug('Optional authentication failed, continuing without auth');
      }
      next(); // Always continue
    });
  };

  // Role-based authorization middleware
  requireRole = (requiredRoles: string | string[]) => {
    const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource',
        });
      }

      const hasRole = await this.rbacService.hasAnyRole(req.user.id, roles);
      
      if (!hasRole) {
        logger.warn(`Access denied for user ${req.user.id}: missing required roles ${roles.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Required roles: ${roles.join(', ')}`,
        });
      }

      next();
    };
  };

  // Permission-based authorization middleware
  requirePermission = (requiredPermissions: string | string[]) => {
    const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
    
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource',
        });
      }

      const hasPermission = await this.rbacService.hasAnyPermission(req.user.id, permissions);
      
      if (!hasPermission) {
        logger.warn(`Access denied for user ${req.user.id}: missing required permissions ${permissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          error: 'Insufficient permissions',
          message: `Required permissions: ${permissions.join(', ')}`,
        });
      }

      next();
    };
  };

  // Resource ownership authorization
  requireOwnership = (resourceIdParam: string = 'id', resourceType?: string) => {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required',
          message: 'User must be authenticated to access this resource',
        });
      }

      const resourceId = req.params[resourceIdParam];
      
      if (!resourceId) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request',
          message: `Missing resource ID parameter: ${resourceIdParam}`,
        });
      }

      // Check if user owns the resource or has admin permissions
      const isOwner = await this.rbacService.isResourceOwner(req.user.id, resourceId, resourceType);
      const isAdmin = await this.rbacService.hasRole(req.user.id, 'admin');
      
      if (!isOwner && !isAdmin) {
        logger.warn(`Access denied for user ${req.user.id}: not owner of resource ${resourceId}`);
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only access your own resources',
        });
      }

      next();
    };
  };

  // Rate limiting middleware
  rateLimit = (options: {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
  } = {}) => {
    const {
      windowMs = 15 * 60 * 1000, // 15 minutes
      maxRequests = 100,
      keyGenerator = (req) => req.ip,
      skipSuccessfulRequests = false,
      skipFailedRequests = false,
    } = options;

    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const key = keyGenerator(req);
        const rateLimitResult = await this.rateLimitService.checkRateLimit(
          key,
          maxRequests,
          Math.floor(windowMs / 1000)
        );

        req.rateLimitInfo = {
          remaining: rateLimitResult.remaining,
          resetTime: rateLimitResult.resetTime,
          limit: maxRequests,
        };

        // Set rate limit headers
        res.set({
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
        });

        if (!rateLimitResult.allowed) {
          logger.warn(`Rate limit exceeded for key: ${key}`);
          return res.status(429).json({
            success: false,
            error: 'Rate limit exceeded',
            message: 'Too many requests, please try again later',
            retryAfter: rateLimitResult.resetTime,
          });
        }

        // Handle response to update rate limit if needed
        const originalSend = res.send;
        res.send = function(body) {
          const statusCode = res.statusCode;
          
          // Skip updating rate limit based on options
          if (
            (skipSuccessfulRequests && statusCode >= 200 && statusCode < 300) ||
            (skipFailedRequests && statusCode >= 400)
          ) {
            return originalSend.call(this, body);
          }

          return originalSend.call(this, body);
        };

        next();
      } catch (error) {
        logger.error('Rate limiting error:', error);
        // Continue without rate limiting on error
        next();
      }
    };
  };

  // Input validation middleware
  validateInput = (schema: any, source: 'body' | 'query' | 'params' = 'body') => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const data = req[source];
        const validationResult = await this.validationService.validateInput(data, schema);

        if (!validationResult.isValid) {
          logger.warn('Input validation failed:', validationResult.errors);
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            message: 'Invalid input data',
            details: validationResult.errors,
          });
        }

        // Replace the original data with sanitized data
        req[source] = validationResult.sanitizedData;
        next();
      } catch (error) {
        logger.error('Input validation error:', error);
        return res.status(500).json({
          success: false,
          error: 'Validation error',
          message: 'Internal server error during validation',
        });
      }
    };
  };

  // CSRF protection middleware
  csrfProtection = (options: {
    headerName?: string;
    cookieName?: string;
    ignoreMethods?: string[];
  } = {}) => {
    const {
      headerName = 'X-CSRF-Token',
      cookieName = 'csrf-token',
      ignoreMethods = ['GET', 'HEAD', 'OPTIONS'],
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
      // Skip CSRF check for safe methods
      if (ignoreMethods.includes(req.method)) {
        return next();
      }

      const tokenFromHeader = req.headers[headerName.toLowerCase()] as string;
      const tokenFromCookie = req.cookies[cookieName];

      if (!tokenFromHeader || !tokenFromCookie || tokenFromHeader !== tokenFromCookie) {
        logger.warn('CSRF token validation failed');
        return res.status(403).json({
          success: false,
          error: 'CSRF token validation failed',
          message: 'Invalid or missing CSRF token',
        });
      }

      next();
    };
  };

  // Security headers middleware
  securityHeaders = (req: Request, res: Response, next: NextFunction) => {
    // Set security headers
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
    });

    next();
  };

  // Audit logging middleware
  auditLog = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const originalSend = res.send;

    res.send = function(body) {
      const duration = Date.now() - startTime;
      
      // Log the request
      logger.info('API Request', {
        userId: req.user?.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        statusCode: res.statusCode,
        duration,
        timestamp: new Date().toISOString(),
      });

      return originalSend.call(this, body);
    };

    next();
  };
}