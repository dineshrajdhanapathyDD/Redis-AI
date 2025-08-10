import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';

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
  events: string[]; // Related audit event IDs
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
  topFailedActions: Array<{ action: string; count: number }>;
  topRiskyUsers: Array<{ userId: string; riskScore: number; eventCount: number }>;
  locationStats: Array<{ country: string; count: number }>;
}

export class AuditService {
  private readonly AUDIT_KEY_PREFIX = 'audit:';
  private readonly ALERT_KEY_PREFIX = 'security_alert:';
  private readonly USER_RISK_KEY_PREFIX = 'user_risk:';
  private readonly METRICS_KEY = 'security_metrics';
  private readonly RETENTION_DAYS = 90; // Keep audit logs for 90 days

  constructor(private redis: Redis) {}

  // Record audit event
  async recordEvent(event: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const auditEvent: AuditEvent = {
        id: this.generateEventId(),
        timestamp: Date.now(),
        ...event,
      };

      // Calculate risk score if not provided
      if (auditEvent.riskScore === undefined) {
        auditEvent.riskScore = this.calculateRiskScore(auditEvent);
      }

      // Store the event
      const eventKey = `${this.AUDIT_KEY_PREFIX}${auditEvent.id}`;
      await this.redis.setex(
        eventKey,
        this.RETENTION_DAYS * 24 * 60 * 60, // TTL in seconds
        JSON.stringify(auditEvent)
      );

      // Add to time-based index
      const timeIndex = `${this.AUDIT_KEY_PREFIX}time:${this.getTimeSlot(auditEvent.timestamp)}`;
      await this.redis.zadd(timeIndex, auditEvent.timestamp, auditEvent.id);
      await this.redis.expire(timeIndex, this.RETENTION_DAYS * 24 * 60 * 60);

      // Add to user index if userId is present
      if (auditEvent.userId) {
        const userIndex = `${this.AUDIT_KEY_PREFIX}user:${auditEvent.userId}`;
        await this.redis.zadd(userIndex, auditEvent.timestamp, auditEvent.id);
        await this.redis.expire(userIndex, this.RETENTION_DAYS * 24 * 60 * 60);

        // Update user risk score
        await this.updateUserRiskScore(auditEvent.userId, auditEvent);
      }

      // Add to action index
      const actionIndex = `${this.AUDIT_KEY_PREFIX}action:${auditEvent.action}`;
      await this.redis.zadd(actionIndex, auditEvent.timestamp, auditEvent.id);
      await this.redis.expire(actionIndex, this.RETENTION_DAYS * 24 * 60 * 60);

      // Update metrics
      await this.updateMetrics(auditEvent);

      // Check for security alerts
      await this.checkForSecurityAlerts(auditEvent);

      logger.debug(`Audit event recorded: ${auditEvent.id}`, {
        action: auditEvent.action,
        userId: auditEvent.userId,
        success: auditEvent.success,
        riskScore: auditEvent.riskScore,
      });

      return auditEvent.id;
    } catch (error) {
      logger.error('Failed to record audit event:', error);
      throw error;
    }
  }

  // Get audit events
  async getEvents(query: AuditQuery = {}): Promise<AuditEvent[]> {
    try {
      const {
        userId,
        action,
        resource,
        startTime = 0,
        endTime = Date.now(),
        success,
        minRiskScore,
        limit = 100,
        offset = 0,
      } = query;

      let eventIds: string[] = [];

      // Determine which index to use
      if (userId) {
        const userIndex = `${this.AUDIT_KEY_PREFIX}user:${userId}`;
        eventIds = await this.redis.zrangebyscore(userIndex, startTime, endTime);
      } else if (action) {
        const actionIndex = `${this.AUDIT_KEY_PREFIX}action:${action}`;
        eventIds = await this.redis.zrangebyscore(actionIndex, startTime, endTime);
      } else {
        // Use time-based index
        const timeSlots = this.getTimeSlots(startTime, endTime);
        const allIds: string[] = [];
        
        for (const slot of timeSlots) {
          const timeIndex = `${this.AUDIT_KEY_PREFIX}time:${slot}`;
          const slotIds = await this.redis.zrangebyscore(timeIndex, startTime, endTime);
          allIds.push(...slotIds);
        }
        
        // Remove duplicates and sort by timestamp
        eventIds = [...new Set(allIds)];
      }

      // Fetch events
      const events: AuditEvent[] = [];
      const pipeline = this.redis.pipeline();
      
      for (const eventId of eventIds) {
        pipeline.get(`${this.AUDIT_KEY_PREFIX}${eventId}`);
      }
      
      const results = await pipeline.exec();
      
      for (const result of results || []) {
        if (result && result[1]) {
          try {
            const event: AuditEvent = JSON.parse(result[1] as string);
            
            // Apply filters
            if (success !== undefined && event.success !== success) continue;
            if (minRiskScore !== undefined && (event.riskScore || 0) < minRiskScore) continue;
            if (resource && event.resource !== resource) continue;
            
            events.push(event);
          } catch (parseError) {
            logger.warn('Failed to parse audit event:', parseError);
          }
        }
      }

      // Sort by timestamp (newest first) and apply pagination
      events.sort((a, b) => b.timestamp - a.timestamp);
      return events.slice(offset, offset + limit);
    } catch (error) {
      logger.error('Failed to get audit events:', error);
      throw error;
    }
  }

  // Get specific audit event
  async getEvent(eventId: string): Promise<AuditEvent | null> {
    try {
      const eventData = await this.redis.get(`${this.AUDIT_KEY_PREFIX}${eventId}`);
      
      if (!eventData) {
        return null;
      }

      return JSON.parse(eventData);
    } catch (error) {
      logger.error('Failed to get audit event:', error);
      throw error;
    }
  }

  // Create security alert
  async createAlert(alert: Omit<SecurityAlert, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    try {
      const securityAlert: SecurityAlert = {
        id: this.generateAlertId(),
        timestamp: Date.now(),
        resolved: false,
        ...alert,
      };

      const alertKey = `${this.ALERT_KEY_PREFIX}${securityAlert.id}`;
      await this.redis.setex(
        alertKey,
        this.RETENTION_DAYS * 24 * 60 * 60,
        JSON.stringify(securityAlert)
      );

      // Add to active alerts index
      const activeAlertsKey = `${this.ALERT_KEY_PREFIX}active`;
      await this.redis.zadd(activeAlertsKey, securityAlert.timestamp, securityAlert.id);

      // Add to severity index
      const severityIndex = `${this.ALERT_KEY_PREFIX}severity:${securityAlert.severity}`;
      await this.redis.zadd(severityIndex, securityAlert.timestamp, securityAlert.id);

      logger.warn(`Security alert created: ${securityAlert.id}`, {
        type: securityAlert.type,
        severity: securityAlert.severity,
        userId: securityAlert.userId,
        description: securityAlert.description,
      });

      return securityAlert.id;
    } catch (error) {
      logger.error('Failed to create security alert:', error);
      throw error;
    }
  }

  // Get active security alerts
  async getActiveAlerts(severity?: string): Promise<SecurityAlert[]> {
    try {
      let alertIds: string[];

      if (severity) {
        const severityIndex = `${this.ALERT_KEY_PREFIX}severity:${severity}`;
        alertIds = await this.redis.zrevrange(severityIndex, 0, -1);
      } else {
        const activeAlertsKey = `${this.ALERT_KEY_PREFIX}active`;
        alertIds = await this.redis.zrevrange(activeAlertsKey, 0, -1);
      }

      const alerts: SecurityAlert[] = [];
      const pipeline = this.redis.pipeline();
      
      for (const alertId of alertIds) {
        pipeline.get(`${this.ALERT_KEY_PREFIX}${alertId}`);
      }
      
      const results = await pipeline.exec();
      
      for (const result of results || []) {
        if (result && result[1]) {
          try {
            const alert: SecurityAlert = JSON.parse(result[1] as string);
            if (!alert.resolved) {
              alerts.push(alert);
            }
          } catch (parseError) {
            logger.warn('Failed to parse security alert:', parseError);
          }
        }
      }

      return alerts;
    } catch (error) {
      logger.error('Failed to get active alerts:', error);
      throw error;
    }
  }

  // Resolve security alert
  async resolveAlert(alertId: string, resolvedBy: string): Promise<boolean> {
    try {
      const alertKey = `${this.ALERT_KEY_PREFIX}${alertId}`;
      const alertData = await this.redis.get(alertKey);
      
      if (!alertData) {
        return false;
      }

      const alert: SecurityAlert = JSON.parse(alertData);
      alert.resolved = true;
      alert.resolvedBy = resolvedBy;
      alert.resolvedAt = Date.now();

      await this.redis.setex(
        alertKey,
        this.RETENTION_DAYS * 24 * 60 * 60,
        JSON.stringify(alert)
      );

      // Remove from active alerts
      const activeAlertsKey = `${this.ALERT_KEY_PREFIX}active`;
      await this.redis.zrem(activeAlertsKey, alertId);

      logger.info(`Security alert resolved: ${alertId} by ${resolvedBy}`);
      return true;
    } catch (error) {
      logger.error('Failed to resolve security alert:', error);
      throw error;
    }
  }

  // Get user risk score
  async getUserRiskScore(userId: string): Promise<number> {
    try {
      const riskKey = `${this.USER_RISK_KEY_PREFIX}${userId}`;
      const riskData = await this.redis.get(riskKey);
      
      if (!riskData) {
        return 0;
      }

      const risk = JSON.parse(riskData);
      return risk.score || 0;
    } catch (error) {
      logger.error('Failed to get user risk score:', error);
      return 0;
    }
  }

  // Get security metrics
  async getSecurityMetrics(timeRange?: { start: number; end: number }): Promise<SecurityMetrics> {
    try {
      const now = Date.now();
      const start = timeRange?.start || (now - 24 * 60 * 60 * 1000); // Last 24 hours
      const end = timeRange?.end || now;

      // Get events in time range
      const events = await this.getEvents({ startTime: start, endTime: end, limit: 10000 });

      const metrics: SecurityMetrics = {
        totalEvents: events.length,
        failedLogins: 0,
        successfulLogins: 0,
        suspiciousActivities: 0,
        activeAlerts: 0,
        topFailedActions: [],
        topRiskyUsers: [],
        locationStats: [],
      };

      // Count active alerts
      const activeAlerts = await this.getActiveAlerts();
      metrics.activeAlerts = activeAlerts.length;

      // Analyze events
      const actionCounts: Record<string, number> = {};
      const userRiskScores: Record<string, { score: number; count: number }> = {};
      const locationCounts: Record<string, number> = {};

      for (const event of events) {
        // Count login attempts
        if (event.action === 'login') {
          if (event.success) {
            metrics.successfulLogins++;
          } else {
            metrics.failedLogins++;
          }
        }

        // Count suspicious activities (high risk score)
        if ((event.riskScore || 0) > 7) {
          metrics.suspiciousActivities++;
        }

        // Count failed actions
        if (!event.success) {
          actionCounts[event.action] = (actionCounts[event.action] || 0) + 1;
        }

        // Track user risk scores
        if (event.userId) {
          if (!userRiskScores[event.userId]) {
            userRiskScores[event.userId] = { score: 0, count: 0 };
          }
          userRiskScores[event.userId].score += event.riskScore || 0;
          userRiskScores[event.userId].count++;
        }

        // Count locations
        if (event.location?.country) {
          locationCounts[event.location.country] = (locationCounts[event.location.country] || 0) + 1;
        }
      }

      // Top failed actions
      metrics.topFailedActions = Object.entries(actionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      // Top risky users
      metrics.topRiskyUsers = Object.entries(userRiskScores)
        .map(([userId, data]) => ({
          userId,
          riskScore: data.score / data.count,
          eventCount: data.count,
        }))
        .sort((a, b) => b.riskScore - a.riskScore)
        .slice(0, 10);

      // Location stats
      metrics.locationStats = Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([country, count]) => ({ country, count }));

      return metrics;
    } catch (error) {
      logger.error('Failed to get security metrics:', error);
      throw error;
    }
  }

  // Private helper methods

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAlertId(): string {
    return `alt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getTimeSlot(timestamp: number): string {
    // Group events by hour
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
  }

  private getTimeSlots(startTime: number, endTime: number): string[] {
    const slots: string[] = [];
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    // Round down to hour
    start.setMinutes(0, 0, 0);
    
    while (start <= end) {
      slots.push(this.getTimeSlot(start.getTime()));
      start.setHours(start.getHours() + 1);
    }
    
    return slots;
  }

  private calculateRiskScore(event: AuditEvent): number {
    let score = 0;

    // Base score for failed actions
    if (!event.success) {
      score += 3;
    }

    // Higher score for sensitive actions
    const sensitiveActions = ['login', 'password_change', 'role_change', 'permission_change', 'data_export'];
    if (sensitiveActions.includes(event.action)) {
      score += 2;
    }

    // Higher score for admin actions
    if (event.action.includes('admin') || event.resource?.includes('admin')) {
      score += 3;
    }

    // Score based on time (higher for unusual hours)
    const hour = new Date(event.timestamp).getHours();
    if (hour < 6 || hour > 22) {
      score += 1;
    }

    // Additional scoring can be added based on:
    // - Geolocation (unusual locations)
    // - Device fingerprinting
    // - Behavioral patterns
    // - Threat intelligence

    return Math.min(score, 10); // Cap at 10
  }

  private async updateUserRiskScore(userId: string, event: AuditEvent): Promise<void> {
    try {
      const riskKey = `${this.USER_RISK_KEY_PREFIX}${userId}`;
      const existingData = await this.redis.get(riskKey);
      
      let riskData = {
        score: 0,
        eventCount: 0,
        lastUpdated: Date.now(),
        recentEvents: [] as number[],
      };

      if (existingData) {
        riskData = JSON.parse(existingData);
      }

      // Add current event risk
      riskData.score = (riskData.score * riskData.eventCount + (event.riskScore || 0)) / (riskData.eventCount + 1);
      riskData.eventCount++;
      riskData.lastUpdated = Date.now();
      riskData.recentEvents.push(event.riskScore || 0);

      // Keep only recent events (last 100)
      if (riskData.recentEvents.length > 100) {
        riskData.recentEvents = riskData.recentEvents.slice(-100);
      }

      await this.redis.setex(riskKey, 30 * 24 * 60 * 60, JSON.stringify(riskData)); // 30 days TTL
    } catch (error) {
      logger.error('Failed to update user risk score:', error);
    }
  }

  private async updateMetrics(event: AuditEvent): Promise<void> {
    try {
      // Update daily metrics
      const date = new Date(event.timestamp);
      const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      const metricsKey = `${this.METRICS_KEY}:${dateKey}`;
      
      await this.redis.hincrby(metricsKey, 'total_events', 1);
      
      if (event.success) {
        await this.redis.hincrby(metricsKey, 'successful_events', 1);
      } else {
        await this.redis.hincrby(metricsKey, 'failed_events', 1);
      }
      
      if ((event.riskScore || 0) > 7) {
        await this.redis.hincrby(metricsKey, 'suspicious_events', 1);
      }
      
      await this.redis.expire(metricsKey, this.RETENTION_DAYS * 24 * 60 * 60);
    } catch (error) {
      logger.error('Failed to update metrics:', error);
    }
  }

  private async checkForSecurityAlerts(event: AuditEvent): Promise<void> {
    try {
      // Check for multiple failed login attempts
      if (event.action === 'login' && !event.success && event.userId) {
        const recentFailures = await this.getEvents({
          userId: event.userId,
          action: 'login',
          success: false,
          startTime: Date.now() - 15 * 60 * 1000, // Last 15 minutes
          limit: 10,
        });

        if (recentFailures.length >= 5) {
          await this.createAlert({
            userId: event.userId,
            type: 'brute_force',
            severity: 'high',
            description: `Multiple failed login attempts detected for user ${event.userId}`,
            events: recentFailures.map(e => e.id),
            metadata: {
              attemptCount: recentFailures.length,
              timeWindow: '15 minutes',
            },
          });
        }
      }

      // Check for suspicious high-risk activities
      if ((event.riskScore || 0) >= 8) {
        await this.createAlert({
          userId: event.userId,
          type: 'suspicious_login',
          severity: event.riskScore >= 9 ? 'critical' : 'high',
          description: `High-risk activity detected: ${event.action}`,
          events: [event.id],
          metadata: {
            riskScore: event.riskScore,
            action: event.action,
            ip: event.ip,
          },
        });
      }

      // Check for privilege escalation
      if (event.action.includes('role_change') || event.action.includes('permission_change')) {
        await this.createAlert({
          userId: event.userId,
          type: 'privilege_escalation',
          severity: 'medium',
          description: `Privilege escalation detected: ${event.action}`,
          events: [event.id],
          metadata: {
            action: event.action,
            resource: event.resource,
            resourceId: event.resourceId,
          },
        });
      }
    } catch (error) {
      logger.error('Failed to check for security alerts:', error);
    }
  }
}