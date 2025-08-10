import { Router } from 'express';
import { Redis } from 'ioredis';
import { AuthService } from '../../../services/auth/auth-service';
import { AuthMiddleware } from '../../../middleware/auth';
export declare function createAuthRoutes(redis: Redis, authService: AuthService, authMiddleware: AuthMiddleware): Router;
//# sourceMappingURL=auth.d.ts.map