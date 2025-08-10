"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceManager = exports.UserStatus = exports.InsightType = exports.MessageType = exports.RelationshipType = exports.KnowledgeType = exports.Permission = exports.CollaboratorRole = void 0;
const logger_1 = require("../../utils/logger");
const knowledge_graph_1 = require("./knowledge-graph");
var CollaboratorRole;
(function (CollaboratorRole) {
    CollaboratorRole["OWNER"] = "owner";
    CollaboratorRole["ADMIN"] = "admin";
    CollaboratorRole["EDITOR"] = "editor";
    CollaboratorRole["VIEWER"] = "viewer";
})(CollaboratorRole || (exports.CollaboratorRole = CollaboratorRole = {}));
var Permission;
(function (Permission) {
    Permission["READ"] = "read";
    Permission["WRITE"] = "write";
    Permission["DELETE"] = "delete";
    Permission["INVITE"] = "invite";
    Permission["MANAGE_SETTINGS"] = "manage_settings";
})(Permission || (exports.Permission = Permission = {}));
var KnowledgeType;
(function (KnowledgeType) {
    KnowledgeType["INSIGHT"] = "insight";
    KnowledgeType["DECISION"] = "decision";
    KnowledgeType["QUESTION"] = "question";
    KnowledgeType["ANSWER"] = "answer";
    KnowledgeType["DOCUMENT"] = "document";
    KnowledgeType["CODE"] = "code";
    KnowledgeType["DISCUSSION"] = "discussion";
})(KnowledgeType || (exports.KnowledgeType = KnowledgeType = {}));
var RelationshipType;
(function (RelationshipType) {
    RelationshipType["RELATES_TO"] = "relates_to";
    RelationshipType["DEPENDS_ON"] = "depends_on";
    RelationshipType["CONTRADICTS"] = "contradicts";
    RelationshipType["SUPPORTS"] = "supports";
    RelationshipType["DERIVED_FROM"] = "derived_from";
    RelationshipType["REFERENCES"] = "references";
})(RelationshipType || (exports.RelationshipType = RelationshipType = {}));
var MessageType;
(function (MessageType) {
    MessageType["TEXT"] = "text";
    MessageType["AI_RESPONSE"] = "ai_response";
    MessageType["SYSTEM"] = "system";
    MessageType["FILE_UPLOAD"] = "file_upload";
    MessageType["CODE_SNIPPET"] = "code_snippet";
})(MessageType || (exports.MessageType = MessageType = {}));
var InsightType;
(function (InsightType) {
    InsightType["PATTERN"] = "pattern";
    InsightType["RECOMMENDATION"] = "recommendation";
    InsightType["PREDICTION"] = "prediction";
    InsightType["SUMMARY"] = "summary";
    InsightType["CORRELATION"] = "correlation";
})(InsightType || (exports.InsightType = InsightType = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ONLINE"] = "online";
    UserStatus["AWAY"] = "away";
    UserStatus["BUSY"] = "busy";
    UserStatus["OFFLINE"] = "offline";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
class WorkspaceManager {
    redis;
    embeddingManager;
    knowledgeGraph;
    WORKSPACE_PREFIX = 'workspace';
    KNOWLEDGE_PREFIX = 'knowledge';
    SYNC_CHANNEL_PREFIX = 'sync';
    constructor(redis, embeddingManager) {
        this.redis = redis;
        this.embeddingManager = embeddingManager;
        this.knowledgeGraph = new knowledge_graph_1.KnowledgeGraph(redis, embeddingManager);
    }
    async createWorkspace(config) {
        const workspaceId = this.generateWorkspaceId();
        const now = new Date();
        const workspace = {
            id: workspaceId,
            name: config.name,
            description: config.description,
            ownerId: config.ownerId,
            createdAt: now,
            updatedAt: now,
            isPublic: config.isPublic,
            settings: config.settings,
            collaborators: [{
                    userId: config.ownerId,
                    role: CollaboratorRole.OWNER,
                    joinedAt: now,
                    lastActive: now,
                    permissions: Object.values(Permission),
                    contributions: 0
                }],
            knowledgeGraph: {
                nodes: [],
                edges: [],
                lastUpdated: now
            },
            sharedContext: {
                conversationHistory: [],
                activeTopics: [],
                recentInsights: [],
                collaborativeState: {
                    activeUsers: [],
                    currentFocus: '',
                    sharedCursor: [],
                    lockState: []
                }
            }
        };
        // Store workspace in Redis
        await this.redis.hset(`${this.WORKSPACE_PREFIX}:${workspaceId}`, 'data', JSON.stringify(workspace));
        // Create workspace indices
        await this.createWorkspaceIndices(workspaceId);
        logger_1.logger.info(`Created workspace ${workspaceId} for user ${config.ownerId}`);
        return workspace;
    }
    generateWorkspaceId() {
        return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async createWorkspaceIndices(workspaceId) {
        // Create vector index for knowledge embeddings
        const indexName = `${this.KNOWLEDGE_PREFIX}:${workspaceId}:index`;
        try {
            await this.redis.call('FT.CREATE', indexName, 'ON', 'HASH', 'PREFIX', '1', `${this.KNOWLEDGE_PREFIX}:${workspaceId}:`, 'SCHEMA', 'content', 'TEXT', 'type', 'TAG', 'embeddings', 'VECTOR', 'HNSW', '6', 'TYPE', 'FLOAT32', 'DIM', '1536', 'DISTANCE_METRIC', 'COSINE');
            logger_1.logger.info(`Created knowledge index for workspace ${workspaceId}`);
        }
        catch (error) {
            if (!error.message.includes('Index already exists')) {
                logger_1.logger.error(`Failed to create knowledge index: ${error.message}`);
                throw error;
            }
        }
    }
}
exports.WorkspaceManager = WorkspaceManager;
asy;
nc;
getWorkspace(workspaceId, string);
Promise < Workspace | null > {
    const: data = await this.redis.hget(`${this.WORKSPACE_PREFIX}:${workspaceId}`, 'data'),
    if(, data) {
        return null;
    },
    return: JSON.parse(data)
};
async;
joinWorkspace(workspaceId, string, userId, string, role, exports.CollaboratorRole = CollaboratorRole = CollaboratorRole.VIEWER);
Promise < void  > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    }
    // Check if user is already a collaborator
    ,
    // Check if user is already a collaborator
    const: existingCollaborator = workspace.collaborators.find(c => c.userId === userId),
    if(existingCollaborator) {
        // Update last active time
        existingCollaborator.lastActive = new Date();
    }, else: {
        // Add new collaborator
        const: permissions = this.getPermissionsForRole(role),
        workspace, : .collaborators.push({
            userId,
            role,
            joinedAt: new Date(),
            lastActive: new Date(),
            permissions,
            contributions: 0
        })
    },
    workspace, : .updatedAt = new Date(),
    await, this: .saveWorkspace(workspace),
    // Notify other collaborators
    await, this: .publishWorkspaceEvent(workspaceId, {
        type: 'user_joined',
        userId,
        timestamp: new Date()
    }),
    logger: logger_1.logger, : .info(`User ${userId} joined workspace ${workspaceId}`)
};
async;
leaveWorkspace(workspaceId, string, userId, string);
Promise < void  > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    }
    // Remove collaborator
    ,
    // Remove collaborator
    workspace, : .collaborators = workspace.collaborators.filter(c => c.userId !== userId),
    workspace, : .updatedAt = new Date(),
    await, this: .saveWorkspace(workspace),
    // Notify other collaborators
    await, this: .publishWorkspaceEvent(workspaceId, {
        type: 'user_left',
        userId,
        timestamp: new Date()
    }),
    logger: logger_1.logger, : .info(`User ${userId} left workspace ${workspaceId}`)
};
async;
addKnowledge(workspaceId, string, knowledge, (Omit));
Promise < KnowledgeNode > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    }
    // Use the knowledge graph to add the node
    ,
    // Use the knowledge graph to add the node
    const: knowledgeNode = await this.knowledgeGraph.addNode(workspaceId, knowledge),
    // Add to workspace knowledge graph reference
    workspace, : .knowledgeGraph.nodes.push(knowledgeNode),
    workspace, : .knowledgeGraph.lastUpdated = new Date(),
    workspace, : .updatedAt = new Date(),
    await, this: .saveWorkspace(workspace),
    // Update collaborator contributions
    await, this: .updateCollaboratorContributions(workspaceId, knowledge.createdBy),
    // Notify collaborators
    await, this: .publishWorkspaceEvent(workspaceId, {
        type: 'knowledge_added',
        knowledgeId: knowledgeNode.id,
        userId: knowledge.createdBy,
        timestamp: new Date()
    }),
    logger: logger_1.logger, : .info(`Added knowledge ${knowledgeNode.id} to workspace ${workspaceId}`),
    return: knowledgeNode
};
async;
queryKnowledge(workspaceId, string, query, string, limit, number = 10);
Promise < KnowledgeNode[] > {
    // Use the knowledge graph for querying
    const: result = await this.knowledgeGraph.queryGraph(workspaceId, {
        query,
        limit,
        includeMetadata: true
    }),
    return: result.nodes
};
async;
addKnowledgeRelationship(workspaceId, string, sourceId, string, targetId, string, relationship, RelationshipType, strength, number = 1.0);
Promise < void  > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    }
    // Use the knowledge graph to add the edge
    ,
    // Use the knowledge graph to add the edge
    const: edge = await this.knowledgeGraph.addEdge(workspaceId, {
        sourceId,
        targetId,
        relationship,
        strength
    }),
    // Add to workspace knowledge graph reference
    workspace, : .knowledgeGraph.edges.push(edge),
    workspace, : .knowledgeGraph.lastUpdated = new Date(),
    workspace, : .updatedAt = new Date(),
    await, this: .saveWorkspace(workspace),
    logger: logger_1.logger, : .info(`Added knowledge relationship ${edge.id} in workspace ${workspaceId}`)
};
async;
updateWorkspaceSettings(workspaceId, string, settings, (Partial));
Promise < void  > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
    },
    workspace, : .settings = { ...workspace.settings, ...settings },
    workspace, : .updatedAt = new Date(),
    await, this: .saveWorkspace(workspace),
    // Notify collaborators
    await, this: .publishWorkspaceEvent(workspaceId, {
        type: 'settings_updated',
        settings,
        timestamp: new Date()
    }),
    logger: logger_1.logger, : .info(`Updated settings for workspace ${workspaceId}`)
};
async;
getWorkspacesByUser(userId, string);
Promise < Workspace[] > {
    // Get all workspace keys
    const: workspaceKeys = await this.redis.keys(`${this.WORKSPACE_PREFIX}:*`),
    const: workspaces, Workspace, []:  = [],
    for(, key, of, workspaceKeys) {
        const data = await this.redis.hget(key, 'data');
        if (data) {
            const workspace = JSON.parse(data);
            // Check if user is a collaborator
            if (workspace.collaborators.some(c => c.userId === userId)) {
                workspaces.push(workspace);
            }
        }
    },
    return: workspaces.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
};
async;
saveWorkspace(workspace, Workspace);
Promise < void  > {
    await, this: .redis.hset(`${this.WORKSPACE_PREFIX}:${workspace.id}`, 'data', JSON.stringify(workspace))
};
async;
updateCollaboratorContributions(workspaceId, string, userId, string);
Promise < void  > {
    const: workspace = await this.getWorkspace(workspaceId),
    if(, workspace) { }, return: ,
    const: collaborator = workspace.collaborators.find(c => c.userId === userId),
    if(collaborator) {
        collaborator.contributions++;
        collaborator.lastActive = new Date();
        await this.saveWorkspace(workspace);
    }
};
async;
publishWorkspaceEvent(workspaceId, string, event, any);
Promise < void  > {
    const: channel = `${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`,
    await, this: .redis.publish(channel, JSON.stringify(event))
};
getPermissionsForRole(role, CollaboratorRole);
Permission[];
{
    switch (role) {
        case CollaboratorRole.OWNER:
            return Object.values(Permission);
        case CollaboratorRole.ADMIN:
            return [Permission.READ, Permission.WRITE, Permission.DELETE, Permission.INVITE];
        case CollaboratorRole.EDITOR:
            return [Permission.READ, Permission.WRITE];
        case CollaboratorRole.VIEWER:
            return [Permission.READ];
        default:
            return [Permission.READ];
    }
}
generateKnowledgeId();
string;
{
    return `kn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
generateEdgeId();
string;
{
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
// Knowledge Graph Integration Methods
async;
discoverKnowledgeInsights(workspaceId, string);
Promise < any[] > {
    return: await this.knowledgeGraph.discoverInsights(workspaceId)
};
async;
clusterWorkspaceKnowledge(workspaceId, string, algorithm, 'kmeans' | 'hierarchical' | 'community', 'community');
Promise < any[] > {
    return: await this.knowledgeGraph.clusterKnowledge(workspaceId, algorithm)
};
async;
getKnowledgeGraphMetrics(workspaceId, string);
Promise < any > {
    return: await this.knowledgeGraph.getGraphMetrics(workspaceId)
};
async;
getKnowledgeEvolution(workspaceId, string, limit, number = 50);
Promise < any[] > {
    return: await this.knowledgeGraph.getEvolutionHistory(workspaceId, limit)
};
async;
queryKnowledgeGraph(workspaceId, string, query, any);
Promise < any > {
    return: await this.knowledgeGraph.queryGraph(workspaceId, query)
};
//# sourceMappingURL=workspace-manager.js.map