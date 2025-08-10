"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMonitoringRoutes = createMonitoringRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
function createMonitoringRoutes(redis, monitoring) {
    const router = (0, express_1.Router)();
    // Health and Status Endpoints
    router.get('/health', async (req, res) => {
        try {
            const service = req.query.service;
            const healthStatus = await monitoring.getHealthStatus(service);
            res.json({
                success: true,
                data: healthStatus,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get health status error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get health status',
                message: error.message,
            });
        }
    });
    router.post('/health/check', async (req, res) => {
        try {
            const { service } = req.body;
            if (service) {
                const healthStatus = await monitoring.performHealthCheck(service);
                res.json({
                    success: true,
                    data: healthStatus,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                await monitoring.performHealthCheck();
                res.json({
                    success: true,
                    message: 'Health checks initiated',
                    timestamp: new Date().toISOString(),
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Perform health check error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to perform health check',
                message: error.message,
            });
        }
    });
    // System Overview
    router.get('/overview', async (req, res) => {
        try {
            const overview = await monitoring.getSystemOverview();
            res.json({
                success: true,
                data: overview,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get system overview error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get system overview',
                message: error.message,
            });
        }
    });
    // Metrics Endpoints
    router.get('/metrics/summary', async (req, res) => {
        try {
            const { start, end } = req.query;
            if (!start || !end) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required parameters',
                    message: 'start and end timestamps are required',
                });
            }
            const timeRange = {
                start: parseInt(start),
                end: parseInt(end),
            };
            const summary = await monitoring.getMetricsSummary(timeRange);
            res.json({
                success: true,
                data: summary,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get metrics summary error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get metrics summary',
                message: error.message,
            });
        }
    });
    router.post('/metrics/system', async (req, res) => {
        try {
            const systemMetrics = {
                ...req.body,
                timestamp: Date.now(),
            };
            await monitoring.recordSystemMetrics(systemMetrics);
            res.json({
                success: true,
                message: 'System metrics recorded',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Record system metrics error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record system metrics',
                message: error.message,
            });
        }
    });
    router.post('/metrics/performance', async (req, res) => {
        try {
            const performanceMetric = {
                ...req.body,
                timestamp: Date.now(),
                ip: req.ip,
                userAgent: req.get('user-agent'),
            };
            await monitoring.recordPerformanceMetric(performanceMetric);
            res.json({
                success: true,
                message: 'Performance metric recorded',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Record performance metric error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record performance metric',
                message: error.message,
            });
        }
    });
    router.post('/metrics/ai-model', async (req, res) => {
        try {
            const aiModelMetric = {
                ...req.body,
                timestamp: Date.now(),
            };
            await monitoring.recordAIModelMetric(aiModelMetric);
            res.json({
                success: true,
                message: 'AI model metric recorded',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Record AI model metric error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record AI model metric',
                message: error.message,
            });
        }
    });
    router.post('/metrics/vector-search', async (req, res) => {
        try {
            const vectorSearchMetric = {
                ...req.body,
                timestamp: Date.now(),
            };
            await monitoring.recordVectorSearchMetric(vectorSearchMetric);
            res.json({
                success: true,
                message: 'Vector search metric recorded',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Record vector search metric error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record vector search metric',
                message: error.message,
            });
        }
    });
    router.post('/metrics/workspace', async (req, res) => {
        try {
            const workspaceMetric = {
                ...req.body,
                timestamp: Date.now(),
            };
            await monitoring.recordWorkspaceMetric(workspaceMetric);
            res.json({
                success: true,
                message: 'Workspace metric recorded',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Record workspace metric error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to record workspace metric',
                message: error.message,
            });
        }
    });
    // Alert Management
    router.get('/alerts', async (req, res) => {
        try {
            const activeAlerts = await monitoring.getActiveAlerts();
            res.json({
                success: true,
                data: activeAlerts,
                count: activeAlerts.length,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get active alerts error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get active alerts',
                message: error.message,
            });
        }
    });
    router.post('/alerts', async (req, res) => {
        try {
            const alertData = {
                ...req.body,
                source: req.body.source || 'api',
            };
            const alert = await monitoring.createAlert(alertData);
            res.status(201).json({
                success: true,
                data: alert,
                message: 'Alert created successfully',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Create alert error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create alert',
                message: error.message,
            });
        }
    });
    router.post('/alerts/:alertId/acknowledge', async (req, res) => {
        try {
            const { alertId } = req.params;
            const { userId } = req.body;
            const result = await monitoring.acknowledgeAlert(alertId, userId || 'api-user');
            if (result) {
                res.json({
                    success: true,
                    message: 'Alert acknowledged successfully',
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found',
                    message: `Alert with ID ${alertId} not found`,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Acknowledge alert error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to acknowledge alert',
                message: error.message,
            });
        }
    });
    router.post('/alerts/:alertId/resolve', async (req, res) => {
        try {
            const { alertId } = req.params;
            const { userId } = req.body;
            const result = await monitoring.resolveAlert(alertId, userId || 'api-user');
            if (result) {
                res.json({
                    success: true,
                    message: 'Alert resolved successfully',
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Alert not found',
                    message: `Alert with ID ${alertId} not found`,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Resolve alert error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to resolve alert',
                message: error.message,
            });
        }
    });
    // Alert Rules Management
    router.get('/alert-rules', async (req, res) => {
        try {
            const rules = await monitoring.getAlertRules();
            res.json({
                success: true,
                data: rules,
                count: rules.length,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get alert rules error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get alert rules',
                message: error.message,
            });
        }
    });
    router.post('/alert-rules', async (req, res) => {
        try {
            const alertRule = req.body;
            await monitoring.addAlertRule(alertRule);
            res.status(201).json({
                success: true,
                message: 'Alert rule created successfully',
                data: alertRule,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Create alert rule error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to create alert rule',
                message: error.message,
            });
        }
    });
    router.put('/alert-rules/:ruleId', async (req, res) => {
        try {
            const { ruleId } = req.params;
            const alertRule = { ...req.body, id: ruleId };
            await monitoring.updateAlertRule(alertRule);
            res.json({
                success: true,
                message: 'Alert rule updated successfully',
                data: alertRule,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Update alert rule error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update alert rule',
                message: error.message,
            });
        }
    });
    router.delete('/alert-rules/:ruleId', async (req, res) => {
        try {
            const { ruleId } = req.params;
            const result = await monitoring.removeAlertRule(ruleId);
            if (result) {
                res.json({
                    success: true,
                    message: 'Alert rule deleted successfully',
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Alert rule not found',
                    message: `Alert rule with ID ${ruleId} not found`,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Delete alert rule error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to delete alert rule',
                message: error.message,
            });
        }
    });
    // Distributed Tracing
    router.get('/traces', async (req, res) => {
        try {
            const { limit = 50, offset = 0, service, operation } = req.query;
            const traces = await monitoring.getTraces({
                limit: parseInt(limit),
                offset: parseInt(offset),
                service: service,
                operation: operation,
            });
            res.json({
                success: true,
                data: traces,
                count: traces.length,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get traces error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get traces',
                message: error.message,
            });
        }
    });
    router.get('/traces/:traceId', async (req, res) => {
        try {
            const { traceId } = req.params;
            const trace = await monitoring.getTrace(traceId);
            if (trace) {
                res.json({
                    success: true,
                    data: trace,
                    timestamp: new Date().toISOString(),
                });
            }
            else {
                res.status(404).json({
                    success: false,
                    error: 'Trace not found',
                    message: `Trace with ID ${traceId} not found`,
                });
            }
        }
        catch (error) {
            logger_1.logger.error('Get trace error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get trace',
                message: error.message,
            });
        }
    });
    // Dashboard Data
    router.get('/dashboard', async (req, res) => {
        try {
            const { section } = req.query;
            const dashboardData = await monitoring.getDashboardData(section);
            res.json({
                success: true,
                data: dashboardData,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get dashboard data error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get dashboard data',
                message: error.message,
            });
        }
    });
    // Configuration
    router.get('/config', async (req, res) => {
        try {
            const config = monitoring.getConfig();
            res.json({
                success: true,
                data: config,
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Get monitoring config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to get monitoring configuration',
                message: error.message,
            });
        }
    });
    router.put('/config', async (req, res) => {
        try {
            const updates = req.body;
            await monitoring.updateConfig(updates);
            res.json({
                success: true,
                message: 'Configuration updated successfully',
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            logger_1.logger.error('Update monitoring config error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to update monitoring configuration',
                message: error.message,
            });
        }
    });
    return router;
}
//# sourceMappingURL=monitoring.js.map