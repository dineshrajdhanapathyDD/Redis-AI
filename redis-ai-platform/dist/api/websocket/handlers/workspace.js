"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceHandler = void 0;
const logger_1 = require("../../../utils/logger");
class WorkspaceHandler {
    io;
    redis;
    services;
    constructor(io, redis, services) {
        this.io = io;
        this.redis = redis;
        this.services = services;
    }
    setupHandlers(socket, connectionInfo) {
        // Join workspace room
        socket.on('workspace:join', async (data) => {
            try {
                const { workspaceId } = data;
                // Verify user has access to workspace
                if (connectionInfo.user) {
                    const workspace = await this.services.workspaceService.manager.getWorkspace(workspaceId);
                    if (!workspace) {
                        socket.emit('error', { message: 'Workspace not found' });
                        return;
                    }
                    const hasAccess = workspace.collaborators.some(c => c.userId === connectionInfo.user.id);
                    if (!hasAccess) {
                        socket.emit('error', { message: 'Access denied to workspace' });
                        return;
                    }
                }
                // Join workspace room
                await socket.join(`workspace:${workspaceId}`);
                connectionInfo.subscriptions.add(`workspace:${workspaceId}`);
                // Subscribe to workspace sync
                await this.services.workspaceService.sync.subscribeToWorkspace(workspaceId, connectionInfo.userId || socket.id, (event) => {
                    socket.emit('workspace:sync_event', event);
                });
                // Update user presence
                if (connectionInfo.userId) {
                    await this.services.workspaceService.sync.updateUserPresence(workspaceId, connectionInfo.userId, 'online', 'active');
                }
                // Get active users
                const activeUsers = await this.services.workspaceService.sync.getActiveUsers(workspaceId);
                socket.emit('workspace:joined', {
                    workspaceId,
                    activeUsers,
                    timestamp: Date.now()
                });
                // Notify other users
                socket.to(`workspace:${workspaceId}`).emit('workspace:user_joined', {
                    userId: connectionInfo.userId,
                    user: connectionInfo.user,
                    timestamp: Date.now()
                });
                logger_1.logger.info(`Socket ${socket.id} joined workspace ${workspaceId}`);
            }
            catch (error) {
                logger_1.logger.error('Workspace join error:', error);
                socket.emit('error', { message: 'Failed to join workspace', error: error.message });
            }
        });
        // Leave workspace room
        socket.on('workspace:leave', async (data) => {
            try {
                const { workspaceId } = data;
                // Leave workspace room
                await socket.leave(`workspace:${workspaceId}`);
                connectionInfo.subscriptions.delete(`workspace:${workspaceId}`);
                // Unsubscribe from workspace sync
                if (connectionInfo.userId) {
                    await this.services.workspaceService.sync.unsubscribeFromWorkspace(workspaceId, connectionInfo.userId);
                    // Update user presence to offline
                    await this.services.workspaceService.sync.updateUserPresence(workspaceId, connectionInfo.userId, 'offline');
                }
                socket.emit('workspace:left', {
                    workspaceId,
                    timestamp: Date.now()
                });
                // Notify other users
                socket.to(`workspace:${workspaceId}`).emit('workspace:user_left', {
                    userId: connectionInfo.userId,
                    timestamp: Date.now()
                });
                logger_1.logger.info(`Socket ${socket.id} left workspace ${workspaceId}`);
            }
            catch (error) {
                logger_1.logger.error('Workspace leave error:', error);
                socket.emit('error', { message: 'Failed to leave workspace', error: error.message });
            }
        });
        // Update cursor position
        socket.on('workspace:cursor_update', async (data) => {
            try {
                const { workspaceId, position } = data;
                if (!connectionInfo.userId) {
                    return;
                }
                // Update cursor position in sync engine
                await this.services.workspaceService.sync.updateCursorPosition(workspaceId, connectionInfo.userId, position);
                // Broadcast to other users in workspace (excluding sender)
                socket.to(`workspace:${workspaceId}`).emit('workspace:cursor_moved', {
                    userId: connectionInfo.userId,
                    position,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Cursor update error:', error);
            }
        });
        // Update user status
        socket.on('workspace:status_update', async (data) => {
            try {
                const { workspaceId, status, activity } = data;
                if (!connectionInfo.userId) {
                    return;
                }
                // Update user presence
                await this.services.workspaceService.sync.updateUserPresence(workspaceId, connectionInfo.userId, status, activity);
                // Broadcast to other users in workspace
                socket.to(`workspace:${workspaceId}`).emit('workspace:user_status_changed', {
                    userId: connectionInfo.userId,
                    status,
                    activity,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Status update error:', error);
            }
        });
        // Add knowledge to workspace
        socket.on('workspace:add_knowledge', async (data) => {
            try {
                const { workspaceId, knowledge } = data;
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }
                // Add knowledge to workspace
                const knowledgeNode = await this.services.workspaceService.manager.addKnowledge(workspaceId, {
                    ...knowledge,
                    metadata: {
                        tags: [],
                        confidence: 1.0,
                        source: 'websocket',
                        version: 1,
                        ...knowledge.metadata
                    },
                    createdBy: connectionInfo.userId
                });
                // Emit to all users in workspace
                this.io.to(`workspace:${workspaceId}`).emit('workspace:knowledge_added', {
                    knowledge: {
                        id: knowledgeNode.id,
                        type: knowledgeNode.type,
                        content: knowledgeNode.content,
                        metadata: knowledgeNode.metadata,
                        createdBy: knowledgeNode.createdBy,
                        createdAt: knowledgeNode.createdAt
                    },
                    addedBy: connectionInfo.user,
                    timestamp: Date.now()
                });
                socket.emit('workspace:knowledge_add_success', {
                    knowledgeId: knowledgeNode.id,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Add knowledge error:', error);
                socket.emit('error', { message: 'Failed to add knowledge', error: error.message });
            }
        });
        // Search knowledge in workspace
        socket.on('workspace:search_knowledge', async (data) => {
            try {
                const { workspaceId, query, limit = 10 } = data;
                const results = await this.services.workspaceService.manager.queryKnowledge(workspaceId, query, limit);
                socket.emit('workspace:knowledge_search_results', {
                    query,
                    results: results.map(result => ({
                        id: result.id,
                        type: result.type,
                        content: result.content,
                        metadata: result.metadata,
                        createdBy: result.createdBy,
                        createdAt: result.createdAt,
                        relevanceScore: result.metadata.relevanceScore
                    })),
                    totalResults: results.length,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Knowledge search error:', error);
                socket.emit('error', { message: 'Knowledge search failed', error: error.message });
            }
        });
        // Add knowledge relationship
        socket.on('workspace:add_relationship', async (data) => {
            try {
                const { workspaceId, sourceId, targetId, relationship, strength = 1.0 } = data;
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }
                await this.services.workspaceService.manager.addKnowledgeRelationship(workspaceId, sourceId, targetId, relationship, strength);
                // Emit to all users in workspace
                this.io.to(`workspace:${workspaceId}`).emit('workspace:relationship_added', {
                    sourceId,
                    targetId,
                    relationship,
                    strength,
                    addedBy: connectionInfo.user,
                    timestamp: Date.now()
                });
                socket.emit('workspace:relationship_add_success', {
                    sourceId,
                    targetId,
                    relationship,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Add relationship error:', error);
                socket.emit('error', { message: 'Failed to add relationship', error: error.message });
            }
        });
        // Get workspace insights
        socket.on('workspace:get_insights', async (data) => {
            try {
                const { workspaceId } = data;
                const insights = await this.services.workspaceService.manager.discoverKnowledgeInsights(workspaceId);
                socket.emit('workspace:insights', {
                    workspaceId,
                    insights: insights.map(insight => ({
                        id: insight.id,
                        type: insight.type,
                        title: insight.title,
                        description: insight.description,
                        confidence: insight.confidence,
                        impact: insight.impact,
                        evidenceCount: insight.evidence.length,
                        generatedAt: insight.generatedAt
                    })),
                    totalInsights: insights.length,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get insights error:', error);
                socket.emit('error', { message: 'Failed to get insights', error: error.message });
            }
        });
        // Get workspace metrics
        socket.on('workspace:get_metrics', async (data) => {
            try {
                const { workspaceId } = data;
                const metrics = await this.services.workspaceService.manager.getKnowledgeGraphMetrics(workspaceId);
                socket.emit('workspace:metrics', {
                    workspaceId,
                    metrics: {
                        nodeCount: metrics.nodeCount,
                        edgeCount: metrics.edgeCount,
                        density: metrics.density,
                        averageDegree: metrics.averageDegree,
                        clusteringCoefficient: metrics.clusteringCoefficient,
                        communityCount: metrics.communityStructure.length,
                        topCentralNodes: Array.from(metrics.centralityScores.entries())
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 5)
                            .map(([nodeId, score]) => ({ nodeId, centralityScore: score }))
                    },
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Get metrics error:', error);
                socket.emit('error', { message: 'Failed to get metrics', error: error.message });
            }
        });
        // Acquire lock on resource
        socket.on('workspace:acquire_lock', async (data) => {
            try {
                const { workspaceId, resourceId, lockType } = data;
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }
                const acquired = await this.services.workspaceService.sync.acquireLock(workspaceId, resourceId, connectionInfo.userId, lockType);
                socket.emit('workspace:lock_result', {
                    resourceId,
                    lockType,
                    acquired,
                    timestamp: Date.now()
                });
                if (acquired) {
                    // Notify other users about the lock
                    socket.to(`workspace:${workspaceId}`).emit('workspace:resource_locked', {
                        resourceId,
                        lockType,
                        lockedBy: connectionInfo.user,
                        timestamp: Date.now()
                    });
                }
            }
            catch (error) {
                logger_1.logger.error('Acquire lock error:', error);
                socket.emit('error', { message: 'Failed to acquire lock', error: error.message });
            }
        });
        // Release lock on resource
        socket.on('workspace:release_lock', async (data) => {
            try {
                const { workspaceId, resourceId } = data;
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }
                await this.services.workspaceService.sync.releaseLock(workspaceId, resourceId, connectionInfo.userId);
                socket.emit('workspace:lock_released', {
                    resourceId,
                    timestamp: Date.now()
                });
                // Notify other users about the lock release
                socket.to(`workspace:${workspaceId}`).emit('workspace:resource_unlocked', {
                    resourceId,
                    unlockedBy: connectionInfo.user,
                    timestamp: Date.now()
                });
            }
            catch (error) {
                logger_1.logger.error('Release lock error:', error);
                socket.emit('error', { message: 'Failed to release lock', error: error.message });
            }
        });
        // Send message to workspace
        socket.on('workspace:send_message', async (data) => {
            try {
                const { workspaceId, content, type = 'text', metadata = {} } = data;
                if (!connectionInfo.userId) {
                    socket.emit('error', { message: 'Authentication required' });
                    return;
                }
                const message = {
                    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    userId: connectionInfo.userId,
                    user: connectionInfo.user,
                    content,
                    type,
                    metadata,
                    timestamp: Date.now()
                };
                // Broadcast message to all users in workspace
                this.io.to(`workspace:${workspaceId}`).emit('workspace:message', message);
                // Store message in workspace context (simplified)
                // In a real implementation, this would be stored in the workspace's shared context
            }
            catch (error) {
                logger_1.logger.error('Send message error:', error);
                socket.emit('error', { message: 'Failed to send message', error: error.message });
            }
        });
    }
}
exports.WorkspaceHandler = WorkspaceHandler;
//# sourceMappingURL=workspace.js.map