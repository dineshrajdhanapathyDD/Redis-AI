import { Redis } from 'ioredis';
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
export declare enum CollaboratorRole {
    OWNER = "owner",
    ADMIN = "admin",
    EDITOR = "editor",
    VIEWER = "viewer"
}
export declare enum Permission {
    READ = "read",
    WRITE = "write",
    DELETE = "delete",
    INVITE = "invite",
    MANAGE_SETTINGS = "manage_settings"
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
export declare enum KnowledgeType {
    INSIGHT = "insight",
    DECISION = "decision",
    QUESTION = "question",
    ANSWER = "answer",
    DOCUMENT = "document",
    CODE = "code",
    DISCUSSION = "discussion"
}
export declare enum RelationshipType {
    RELATES_TO = "relates_to",
    DEPENDS_ON = "depends_on",
    CONTRADICTS = "contradicts",
    SUPPORTS = "supports",
    DERIVED_FROM = "derived_from",
    REFERENCES = "references"
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
export declare enum MessageType {
    TEXT = "text",
    AI_RESPONSE = "ai_response",
    SYSTEM = "system",
    FILE_UPLOAD = "file_upload",
    CODE_SNIPPET = "code_snippet"
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
export declare enum InsightType {
    PATTERN = "pattern",
    RECOMMENDATION = "recommendation",
    PREDICTION = "prediction",
    SUMMARY = "summary",
    CORRELATION = "correlation"
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
export declare enum UserStatus {
    ONLINE = "online",
    AWAY = "away",
    BUSY = "busy",
    OFFLINE = "offline"
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
export declare class WorkspaceManager {
    private redis;
    private embeddingManager;
    private knowledgeGraph;
    private readonly WORKSPACE_PREFIX;
    private readonly KNOWLEDGE_PREFIX;
    private readonly SYNC_CHANNEL_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    createWorkspace(config: WorkspaceConfig): Promise<Workspace>;
    private generateWorkspaceId;
    private createWorkspaceIndices;
}
//# sourceMappingURL=workspace-manager.d.ts.map