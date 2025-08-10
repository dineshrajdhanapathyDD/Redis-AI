import { Redis } from 'ioredis';
export interface AuditEvent {
    id: string;
    timestamp: number;
    userId?: string;
    sessionId?: string;
    ip: string;
    userAgent?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    success: boolean;
    details?: Record<string, any>;
    riskScore?: number;
    location?: {
        country?: string;
        region?: string;
        city?: string;
    };
}
export interface SecurityAlert {
    id: string;
    timestamp: number;
    userId?: string;
    type: 'suspicious_login' | 'multiple_failures' | 'unusual_location' | 'privilege_escalation' | 'data_breach' | 'brute_force';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    events: string[];
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: number;
    metadata?: Record<string, any>;
}
export interface AuditQuery {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: number;
    endTime?: number;
    success?: boolean;
    minRiskScore?: number;
    limit?: number;
    offset?: number;
}
export interface SecurityMetrics {
    totalEvents: number;
    failedLogins: number;
    successfulLogins: number;
    suspiciousActivities: number;
    activeAlerts: number;
    topFailedActions: Array<{
        action: string;
        count: number;
    }>;
    topRiskyUsers: Array<{
        userId: string;
        riskScore: number;
        eventCount: number;
    }>;
    locationStats: Array<{
        country: string;
        count: number;
    }>;
}
export declare class AuditService {
    private redis;
    private readonly AUDIT_KEY_PREFIX;
    private readonly ALERT_KEY_PREFIX;
    private readonly USER_RISK_KEY_PREFIX;
    private readonly METRICS_KEY;
    private readonly RETENTION_DAYS;
    constructor(redis: Redis);
    recordEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string>;
    getEvents(query?: AuditQuery): Promise<AuditEvent[]>;
    getEvent(eventId: string): Promise<AuditEvent | null>;
    createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<string>;
    getActiveAlerts(severity?: string): Promise<SecurityAlert[]>;
    resolveAlert(alertId: string, resolvedBy: string): Promise<boolean>;
    getUserRiskScore(userId: string): Promise<number>;
    getSecurityMetrics(timeRange?: {
        start: number;
        end: number;
    }): Promise<SecurityMetrics>;
    private generateEventId;
    private generateAlertId;
    private getTimeSlot;
    private getTimeSlots;
    private calculateRiskScore;
    private updateUserRiskScore;
    private updateMetrics;
    private checkForSecurityAlerts;
}
//# sourceMappingURL=audit-service.d.ts.map