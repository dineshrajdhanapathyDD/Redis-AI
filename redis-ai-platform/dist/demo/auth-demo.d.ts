export declare class AuthDemo {
    private redis;
    private authService;
    private jwtService;
    private mfaService;
    private passwordService;
    private rbacService;
    private validationService;
    private rateLimitService;
    private auditService;
    private authMiddleware;
    constructor();
    runDemo(): Promise<void>;
    private demoUserRegistration;
    private demoUserLogin;
    private demoPasswordOperations;
    private demoMFAOperations;
    private demoRBACOperations;
    private demoRateLimiting;
    private demoInputValidation;
    private demoAuditLogging;
    private demoSecurityAlerts;
    private demoJWTOperations;
    cleanup(): Promise<void>;
}
//# sourceMappingURL=auth-demo.d.ts.map