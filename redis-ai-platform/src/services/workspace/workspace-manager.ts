import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { EmbeddingManager } from '../embedding-manager';
import { KnowledgeGraph } from './knowledge-graph';

export interface WorkspaceConfig {
  name: string;
  description: string;
  ownerId: string;
  isPublic: boolean;
  maxCollaborators: number;
  settings: WorkspaceSettings;
}

export interface WorkspaceSettings {
  allowGuestAccess: boolean;
  autoSaveInterval: number;
  knowledgeRetentionDays: number;
  syncMode: 'realtime' | 'batch';
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  settings: WorkspaceSettings;
  collaborators: Collaborator[];
  knowledgeGraph: KnowledgeGraph;
  sharedContext: SharedContext;
}

export interface Collaborator {
  userId: string;
  role: CollaboratorRole;
  joinedAt: Date;
  lastActive: Date;
  permissions: Permission[];
  contributions: number;
}

export enum CollaboratorRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer'
}

export enum Permission {
  READ = 'read',
  WRITE = 'write',
  DELETE = 'delete',
  INVITE = 'invite',
  MANAGE_SETTINGS = 'manage_settings'
}

export interface KnowledgeGraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  lastUpdated: Date;
}

export interface KnowledgeNode {
  id: string;
  type: KnowledgeType;
  content: string;
  embeddings: number[];
  metadata: KnowledgeMetadata;
  createdBy: string;
  createdAt: Date;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relationship: RelationshipType;
  strength: number;
  createdAt: Date;
}

export enum KnowledgeType {
  INSIGHT = 'insight',
  DECISION = 'decision',
  QUESTION = 'question',
  ANSWER = 'answer',
  DOCUMENT = 'document',
  CODE = 'code',
  DISCUSSION = 'discussion'
}

export enum RelationshipType {
  RELATES_TO = 'relates_to',
  DEPENDS_ON = 'depends_on',
  CONTRADICTS = 'contradicts',
  SUPPORTS = 'supports',
  DERIVED_FROM = 'derived_from',
  REFERENCES = 'references'
}

export interface KnowledgeMetadata {
  tags: string[];
  confidence: number;
  source: string;
  version: number;
  relevanceScore?: number;
}

export interface SharedContext {
  conversationHistory: Message[];
  activeTopics: Topic[];
  recentInsights: Insight[];
  collaborativeState: CollaborativeState;
}

export interface Message {
  id: string;
  userId: string;
  content: string;
  timestamp: Date;
  type: MessageType;
  metadata: MessageMetadata;
}

export enum MessageType {
  TEXT = 'text',
  AI_RESPONSE = 'ai_response',
  SYSTEM = 'system',
  FILE_UPLOAD = 'file_upload',
  CODE_SNIPPET = 'code_snippet'
}

export interface MessageMetadata {
  aiModel?: string;
  confidence?: number;
  references?: string[];
  attachments?: string[];
}

export interface Topic {
  id: string;
  name: string;
  description: string;
  participants: string[];
  lastActivity: Date;
  messageCount: number;
}

export interface Insight {
  id: string;
  content: string;
  type: InsightType;
  confidence: number;
  generatedBy: string;
  generatedAt: Date;
  votes: InsightVote[];
}

export enum InsightType {
  PATTERN = 'pattern',
  RECOMMENDATION = 'recommendation',
  PREDICTION = 'prediction',
  SUMMARY = 'summary',
  CORRELATION = 'correlation'
}

export interface InsightVote {
  userId: string;
  vote: 'up' | 'down';
  timestamp: Date;
}

export interface CollaborativeState {
  activeUsers: ActiveUser[];
  currentFocus: string;
  sharedCursor: CursorPosition[];
  lockState: LockState[];
}

export interface ActiveUser {
  userId: string;
  status: UserStatus;
  lastSeen: Date;
  currentActivity: string;
}

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
  BUSY = 'busy',
  OFFLINE = 'offline'
}

export interface CursorPosition {
  userId: string;
  position: {
    x: number;
    y: number;
    elementId?: string;
  };
  timestamp: Date;
}

export interface LockState {
  resourceId: string;
  lockedBy: string;
  lockedAt: Date;
  lockType: 'read' | 'write';
}

export class WorkspaceManager {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private knowledgeGraph: KnowledgeGraph;
  private readonly WORKSPACE_PREFIX = 'workspace';
  private readonly KNOWLEDGE_PREFIX = 'knowledge';
  private readonly SYNC_CHANNEL_PREFIX = 'sync';

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.redis = redis;
    this.embeddingManager = embeddingManager;
    this.knowledgeGraph = new KnowledgeGraph(redis, embeddingManager);
  }

  async createWorkspace(config: WorkspaceConfig): Promise<Workspace> {
    const workspaceId = this.generateWorkspaceId();
    const now = new Date();

    const workspace: Workspace = {
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
    await this.redis.hset(
      `${this.WORKSPACE_PREFIX}:${workspaceId}`,
      'data',
      JSON.stringify(workspace)
    );

    // Create workspace indices
    await this.createWorkspaceIndices(workspaceId);

    logger.info(`Created workspace ${workspaceId} for user ${config.ownerId}`);
    return workspace;
  }

  private generateWorkspaceId(): string {
    return `ws_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async createWorkspaceIndices(workspaceId: string): Promise<void> {
    // Create vector index for knowledge embeddings
    const indexName = `${this.KNOWLEDGE_PREFIX}:${workspaceId}:index`;
    
    try {
      await this.redis.call('FT.CREATE', indexName,
        'ON', 'HASH',
        'PREFIX', '1', `${this.KNOWLEDGE_PREFIX}:${workspaceId}:`,
        'SCHEMA',
        'content', 'TEXT',
        'type', 'TAG',
        'embeddings', 'VECTOR', 'HNSW', '6',
        'TYPE', 'FLOAT32',
        'DIM', '1536',
        'DISTANCE_METRIC', 'COSINE'
      );
      logger.info(`Created knowledge index for workspace ${workspaceId}`);
    } catch (error) {
      if (!error.message.includes('Index already exists')) {
        logger.error(`Failed to create knowledge index: ${error.message}`);
        throw error;
      }
    }
  }
}  asy
nc getWorkspace(workspaceId: string): Promise<Workspace | null> {
    const data = await this.redis.hget(`${this.WORKSPACE_PREFIX}:${workspaceId}`, 'data');
    if (!data) {
      return null;
    }

    return JSON.parse(data) as Workspace;
  }

  async joinWorkspace(workspaceId: string, userId: string, role: CollaboratorRole = CollaboratorRole.VIEWER): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // Check if user is already a collaborator
    const existingCollaborator = workspace.collaborators.find(c => c.userId === userId);
    if (existingCollaborator) {
      // Update last active time
      existingCollaborator.lastActive = new Date();
    } else {
      // Add new collaborator
      const permissions = this.getPermissionsForRole(role);
      workspace.collaborators.push({
        userId,
        role,
        joinedAt: new Date(),
        lastActive: new Date(),
        permissions,
        contributions: 0
      });
    }

    workspace.updatedAt = new Date();
    await this.saveWorkspace(workspace);

    // Notify other collaborators
    await this.publishWorkspaceEvent(workspaceId, {
      type: 'user_joined',
      userId,
      timestamp: new Date()
    });

    logger.info(`User ${userId} joined workspace ${workspaceId}`);
  }

  async leaveWorkspace(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // Remove collaborator
    workspace.collaborators = workspace.collaborators.filter(c => c.userId !== userId);
    workspace.updatedAt = new Date();
    await this.saveWorkspace(workspace);

    // Notify other collaborators
    await this.publishWorkspaceEvent(workspaceId, {
      type: 'user_left',
      userId,
      timestamp: new Date()
    });

    logger.info(`User ${userId} left workspace ${workspaceId}`);
  }

  async addKnowledge(workspaceId: string, knowledge: Omit<KnowledgeNode, 'id' | 'embeddings' | 'createdAt'>): Promise<KnowledgeNode> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // Use the knowledge graph to add the node
    const knowledgeNode = await this.knowledgeGraph.addNode(workspaceId, knowledge);

    // Add to workspace knowledge graph reference
    workspace.knowledgeGraph.nodes.push(knowledgeNode);
    workspace.knowledgeGraph.lastUpdated = new Date();
    workspace.updatedAt = new Date();

    await this.saveWorkspace(workspace);

    // Update collaborator contributions
    await this.updateCollaboratorContributions(workspaceId, knowledge.createdBy);

    // Notify collaborators
    await this.publishWorkspaceEvent(workspaceId, {
      type: 'knowledge_added',
      knowledgeId: knowledgeNode.id,
      userId: knowledge.createdBy,
      timestamp: new Date()
    });

    logger.info(`Added knowledge ${knowledgeNode.id} to workspace ${workspaceId}`);
    return knowledgeNode;
  }

  async queryKnowledge(workspaceId: string, query: string, limit: number = 10): Promise<KnowledgeNode[]> {
    // Use the knowledge graph for querying
    const result = await this.knowledgeGraph.queryGraph(workspaceId, {
      query,
      limit,
      includeMetadata: true
    });

    return result.nodes;
  }

  async addKnowledgeRelationship(workspaceId: string, sourceId: string, targetId: string, relationship: RelationshipType, strength: number = 1.0): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    // Use the knowledge graph to add the edge
    const edge = await this.knowledgeGraph.addEdge(workspaceId, {
      sourceId,
      targetId,
      relationship,
      strength
    });

    // Add to workspace knowledge graph reference
    workspace.knowledgeGraph.edges.push(edge);
    workspace.knowledgeGraph.lastUpdated = new Date();
    workspace.updatedAt = new Date();

    await this.saveWorkspace(workspace);

    logger.info(`Added knowledge relationship ${edge.id} in workspace ${workspaceId}`);
  }

  async updateWorkspaceSettings(workspaceId: string, settings: Partial<WorkspaceSettings>): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) {
      throw new Error(`Workspace ${workspaceId} not found`);
    }

    workspace.settings = { ...workspace.settings, ...settings };
    workspace.updatedAt = new Date();
    await this.saveWorkspace(workspace);

    // Notify collaborators
    await this.publishWorkspaceEvent(workspaceId, {
      type: 'settings_updated',
      settings,
      timestamp: new Date()
    });

    logger.info(`Updated settings for workspace ${workspaceId}`);
  }

  async getWorkspacesByUser(userId: string): Promise<Workspace[]> {
    // Get all workspace keys
    const workspaceKeys = await this.redis.keys(`${this.WORKSPACE_PREFIX}:*`);
    const workspaces: Workspace[] = [];

    for (const key of workspaceKeys) {
      const data = await this.redis.hget(key, 'data');
      if (data) {
        const workspace = JSON.parse(data) as Workspace;
        // Check if user is a collaborator
        if (workspace.collaborators.some(c => c.userId === userId)) {
          workspaces.push(workspace);
        }
      }
    }

    return workspaces.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  private async saveWorkspace(workspace: Workspace): Promise<void> {
    await this.redis.hset(
      `${this.WORKSPACE_PREFIX}:${workspace.id}`,
      'data',
      JSON.stringify(workspace)
    );
  }

  private async updateCollaboratorContributions(workspaceId: string, userId: string): Promise<void> {
    const workspace = await this.getWorkspace(workspaceId);
    if (!workspace) return;

    const collaborator = workspace.collaborators.find(c => c.userId === userId);
    if (collaborator) {
      collaborator.contributions++;
      collaborator.lastActive = new Date();
      await this.saveWorkspace(workspace);
    }
  }

  private async publishWorkspaceEvent(workspaceId: string, event: any): Promise<void> {
    const channel = `${this.SYNC_CHANNEL_PREFIX}:${workspaceId}`;
    await this.redis.publish(channel, JSON.stringify(event));
  }

  private getPermissionsForRole(role: CollaboratorRole): Permission[] {
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

  private generateKnowledgeId(): string {
    return `kn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEdgeId(): string {
    return `edge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Knowledge Graph Integration Methods
  async discoverKnowledgeInsights(workspaceId: string): Promise<any[]> {
    return await this.knowledgeGraph.discoverInsights(workspaceId);
  }

  async clusterWorkspaceKnowledge(workspaceId: string, algorithm: 'kmeans' | 'hierarchical' | 'community' = 'community'): Promise<any[]> {
    return await this.knowledgeGraph.clusterKnowledge(workspaceId, algorithm);
  }

  async getKnowledgeGraphMetrics(workspaceId: string): Promise<any> {
    return await this.knowledgeGraph.getGraphMetrics(workspaceId);
  }

  async getKnowledgeEvolution(workspaceId: string, limit: number = 50): Promise<any[]> {
    return await this.knowledgeGraph.getEvolutionHistory(workspaceId, limit);
  }

  async queryKnowledgeGraph(workspaceId: string, query: any): Promise<any> {
    return await this.knowledgeGraph.queryGraph(workspaceId, query);
  }
}