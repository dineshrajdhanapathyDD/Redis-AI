"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceRoutes = workspaceRoutes;
const express_1 = require("express");
const logger_1 = require("../../../utils/logger");
const workspace_1 = require("../../../services/workspace");
function workspaceRoutes(services) {
    const router = (0, express_1.Router)();
    // Create workspace
    router.post('/', async (req, res) => {
        try {
            const { name, description, ownerId, isPublic = false, maxCollaborators = 10, settings } = req.body;
            if (!name || !description || !ownerId) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'name, description, and ownerId are required'
                });
            }
            const workspaceConfig = {
                name,
                description,
                ownerId,
                isPublic,
                maxCollaborators,
                settings: {
                    allowGuestAccess: false,
                    autoSaveInterval: 30,
                    knowledgeRetentionDays: 365,
                    syncMode: 'realtime',
                    ...settings
                }
            };
            const workspace = await services.workspaceService.manager.createWorkspace(workspaceConfig);
            res.status(201).json({
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    description: workspace.description,
                    ownerId: workspace.ownerId,
                    createdAt: workspace.createdAt,
                    isPublic: workspace.isPublic,
                    settings: workspace.settings,
                    collaboratorCount: workspace.collaborators.length
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Create workspace error:', error);
            res.status(500).json({
                error: 'Failed to create workspace',
                message: error.message
            });
        }
    });
    // Get workspace by ID
    router.get('/:workspaceId', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const workspace = await services.workspaceService.manager.getWorkspace(workspaceId);
            if (!workspace) {
                return res.status(404).json({
                    error: 'Workspace not found',
                    message: `Workspace with ID ${workspaceId} does not exist`
                });
            }
            res.json({
                workspace: {
                    id: workspace.id,
                    name: workspace.name,
                    description: workspace.description,
                    ownerId: workspace.ownerId,
                    createdAt: workspace.createdAt,
                    updatedAt: workspace.updatedAt,
                    isPublic: workspace.isPublic,
                    settings: workspace.settings,
                    collaborators: workspace.collaborators.map(c => ({
                        userId: c.userId,
                        role: c.role,
                        joinedAt: c.joinedAt,
                        lastActive: c.lastActive,
                        contributions: c.contributions
                    })),
                    knowledgeGraph: {
                        nodeCount: workspace.knowledgeGraph.nodes.length,
                        edgeCount: workspace.knowledgeGraph.edges.length,
                        lastUpdated: workspace.knowledgeGraph.lastUpdated
                    },
                    activeTopics: workspace.sharedContext.activeTopics.length,
                    recentInsights: workspace.sharedContext.recentInsights.length
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get workspace error:', error);
            res.status(500).json({
                error: 'Failed to get workspace',
                message: error.message
            });
        }
    });
    // Get workspaces for user
    router.get('/user/:userId', async (req, res) => {
        try {
            const { userId } = req.params;
            const workspaces = await services.workspaceService.manager.getWorkspacesByUser(userId);
            res.json({
                workspaces: workspaces.map(workspace => ({
                    id: workspace.id,
                    name: workspace.name,
                    description: workspace.description,
                    ownerId: workspace.ownerId,
                    createdAt: workspace.createdAt,
                    updatedAt: workspace.updatedAt,
                    isPublic: workspace.isPublic,
                    collaboratorCount: workspace.collaborators.length,
                    userRole: workspace.collaborators.find(c => c.userId === userId)?.role,
                    knowledgeNodeCount: workspace.knowledgeGraph.nodes.length,
                    lastActivity: workspace.updatedAt
                })),
                totalWorkspaces: workspaces.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get user workspaces error:', error);
            res.status(500).json({
                error: 'Failed to get user workspaces',
                message: error.message
            });
        }
    });
    // Join workspace
    router.post('/:workspaceId/join', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { userId, role = workspace_1.CollaboratorRole.VIEWER } = req.body;
            if (!userId) {
                return res.status(400).json({
                    error: 'User ID is required',
                    message: 'Please provide userId in request body'
                });
            }
            await services.workspaceService.manager.joinWorkspace(workspaceId, userId, role);
            res.json({
                message: 'Successfully joined workspace',
                workspaceId,
                userId,
                role
            });
        }
        catch (error) {
            logger_1.logger.error('Join workspace error:', error);
            res.status(500).json({
                error: 'Failed to join workspace',
                message: error.message
            });
        }
    });
    // Leave workspace
    router.post('/:workspaceId/leave', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { userId } = req.body;
            if (!userId) {
                return res.status(400).json({
                    error: 'User ID is required',
                    message: 'Please provide userId in request body'
                });
            }
            await services.workspaceService.manager.leaveWorkspace(workspaceId, userId);
            res.json({
                message: 'Successfully left workspace',
                workspaceId,
                userId
            });
        }
        catch (error) {
            logger_1.logger.error('Leave workspace error:', error);
            res.status(500).json({
                error: 'Failed to leave workspace',
                message: error.message
            });
        }
    });
    // Add knowledge to workspace
    router.post('/:workspaceId/knowledge', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { type, content, metadata, createdBy } = req.body;
            if (!type || !content || !createdBy) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'type, content, and createdBy are required'
                });
            }
            if (!Object.values(workspace_1.KnowledgeType).includes(type)) {
                return res.status(400).json({
                    error: 'Invalid knowledge type',
                    message: `Type must be one of: ${Object.values(workspace_1.KnowledgeType).join(', ')}`
                });
            }
            const knowledgeNode = await services.workspaceService.manager.addKnowledge(workspaceId, {
                type,
                content,
                metadata: {
                    tags: [],
                    confidence: 1.0,
                    source: 'api',
                    version: 1,
                    ...metadata
                },
                createdBy
            });
            res.status(201).json({
                knowledge: {
                    id: knowledgeNode.id,
                    type: knowledgeNode.type,
                    content: knowledgeNode.content,
                    metadata: knowledgeNode.metadata,
                    createdBy: knowledgeNode.createdBy,
                    createdAt: knowledgeNode.createdAt
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Add knowledge error:', error);
            res.status(500).json({
                error: 'Failed to add knowledge',
                message: error.message
            });
        }
    });
    // Query knowledge in workspace
    router.post('/:workspaceId/knowledge/search', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { query, limit = 10 } = req.body;
            if (!query) {
                return res.status(400).json({
                    error: 'Query is required',
                    message: 'Please provide a search query'
                });
            }
            const results = await services.workspaceService.manager.queryKnowledge(workspaceId, query, limit);
            res.json({
                query,
                workspaceId,
                results: results.map(result => ({
                    id: result.id,
                    type: result.type,
                    content: result.content,
                    metadata: result.metadata,
                    createdBy: result.createdBy,
                    createdAt: result.createdAt,
                    relevanceScore: result.metadata.relevanceScore
                })),
                totalResults: results.length
            });
        }
        catch (error) {
            logger_1.logger.error('Query knowledge error:', error);
            res.status(500).json({
                error: 'Failed to query knowledge',
                message: error.message
            });
        }
    });
    // Add knowledge relationship
    router.post('/:workspaceId/knowledge/relationships', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { sourceId, targetId, relationship, strength = 1.0 } = req.body;
            if (!sourceId || !targetId || !relationship) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'sourceId, targetId, and relationship are required'
                });
            }
            if (!Object.values(workspace_1.RelationshipType).includes(relationship)) {
                return res.status(400).json({
                    error: 'Invalid relationship type',
                    message: `Relationship must be one of: ${Object.values(workspace_1.RelationshipType).join(', ')}`
                });
            }
            await services.workspaceService.manager.addKnowledgeRelationship(workspaceId, sourceId, targetId, relationship, strength);
            res.status(201).json({
                message: 'Knowledge relationship created successfully',
                relationship: {
                    sourceId,
                    targetId,
                    relationship,
                    strength
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Add knowledge relationship error:', error);
            res.status(500).json({
                error: 'Failed to add knowledge relationship',
                message: error.message
            });
        }
    });
    // Get knowledge graph insights
    router.get('/:workspaceId/insights', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const insights = await services.workspaceService.manager.discoverKnowledgeInsights(workspaceId);
            res.json({
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
                totalInsights: insights.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get insights error:', error);
            res.status(500).json({
                error: 'Failed to get insights',
                message: error.message
            });
        }
    });
    // Get knowledge clusters
    router.get('/:workspaceId/clusters', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const { algorithm = 'community' } = req.query;
            const validAlgorithms = ['community', 'kmeans', 'hierarchical'];
            if (!validAlgorithms.includes(algorithm)) {
                return res.status(400).json({
                    error: 'Invalid clustering algorithm',
                    message: `Algorithm must be one of: ${validAlgorithms.join(', ')}`
                });
            }
            const clusters = await services.workspaceService.manager.clusterWorkspaceKnowledge(workspaceId, algorithm);
            res.json({
                workspaceId,
                algorithm,
                clusters: clusters.map(cluster => ({
                    id: cluster.id,
                    memberCount: cluster.members.length,
                    coherenceScore: cluster.coherenceScore,
                    topics: cluster.topics,
                    centroid: {
                        id: cluster.centroid.id,
                        content: cluster.centroid.content.substring(0, 100) + '...',
                        type: cluster.centroid.type
                    },
                    createdAt: cluster.createdAt
                })),
                totalClusters: clusters.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get clusters error:', error);
            res.status(500).json({
                error: 'Failed to get clusters',
                message: error.message
            });
        }
    });
    // Get knowledge graph metrics
    router.get('/:workspaceId/metrics', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const metrics = await services.workspaceService.manager.getKnowledgeGraphMetrics(workspaceId);
            res.json({
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
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Get metrics error:', error);
            res.status(500).json({
                error: 'Failed to get metrics',
                message: error.message
            });
        }
    });
    // Get active users in workspace
    router.get('/:workspaceId/active-users', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const activeUsers = await services.workspaceService.sync.getActiveUsers(workspaceId);
            res.json({
                workspaceId,
                activeUsers: activeUsers.map(user => ({
                    userId: user.userId,
                    status: user.status,
                    lastSeen: user.lastSeen,
                    currentActivity: user.currentActivity
                })),
                totalActiveUsers: activeUsers.length
            });
        }
        catch (error) {
            logger_1.logger.error('Get active users error:', error);
            res.status(500).json({
                error: 'Failed to get active users',
                message: error.message
            });
        }
    });
    // Update workspace settings
    router.patch('/:workspaceId/settings', async (req, res) => {
        try {
            const { workspaceId } = req.params;
            const settings = req.body;
            await services.workspaceService.manager.updateWorkspaceSettings(workspaceId, settings);
            res.json({
                message: 'Workspace settings updated successfully',
                workspaceId,
                updatedSettings: settings
            });
        }
        catch (error) {
            logger_1.logger.error('Update workspace settings error:', error);
            res.status(500).json({
                error: 'Failed to update workspace settings',
                message: error.message
            });
        }
    });
    return router;
}
//# sourceMappingURL=workspace.js.map