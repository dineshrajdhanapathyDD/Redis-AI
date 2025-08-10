import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { KnowledgeNode, KnowledgeEdge, KnowledgeType, RelationshipType } from './workspace-manager';
export interface KnowledgeGraphQuery {
    query: string;
    nodeTypes?: KnowledgeType[];
    relationshipTypes?: RelationshipType[];
    maxDepth?: number;
    limit?: number;
    includeMetadata?: boolean;
}
export interface KnowledgeGraphResult {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    paths: KnowledgePath[];
    totalResults: number;
    queryTime: number;
}
export interface KnowledgePath {
    nodes: KnowledgeNode[];
    edges: KnowledgeEdge[];
    score: number;
    pathType: PathType;
}
export declare enum PathType {
    DIRECT = "direct",
    INDIRECT = "indirect",
    SEMANTIC = "semantic",
    TEMPORAL = "temporal"
}
export interface KnowledgeCluster {
    id: string;
    centroid: KnowledgeNode;
    members: KnowledgeNode[];
    coherenceScore: number;
    topics: string[];
    createdAt: Date;
}
export interface KnowledgeInsight {
    id: string;
    type: InsightType;
    title: string;
    description: string;
    evidence: KnowledgeNode[];
    confidence: number;
    impact: InsightImpact;
    generatedAt: Date;
    validUntil?: Date;
}
export declare enum InsightType {
    PATTERN_DISCOVERY = "pattern_discovery",
    KNOWLEDGE_GAP = "knowledge_gap",
    CONTRADICTION = "contradiction",
    TREND_ANALYSIS = "trend_analysis",
    RECOMMENDATION = "recommendation",
    SUMMARY = "summary"
}
export interface InsightImpact {
    relevance: number;
    novelty: number;
    actionability: number;
    confidence: number;
}
export interface GraphMetrics {
    nodeCount: number;
    edgeCount: number;
    density: number;
    averageDegree: number;
    clusteringCoefficient: number;
    centralityScores: Map<string, number>;
    communityStructure: KnowledgeCluster[];
}
export interface KnowledgeEvolution {
    timestamp: Date;
    changeType: ChangeType;
    nodeId?: string;
    edgeId?: string;
    oldValue?: any;
    newValue?: any;
    impact: EvolutionImpact;
}
export declare enum ChangeType {
    NODE_ADDED = "node_added",
    NODE_UPDATED = "node_updated",
    NODE_DELETED = "node_deleted",
    EDGE_ADDED = "edge_added",
    EDGE_UPDATED = "edge_updated",
    EDGE_DELETED = "edge_deleted",
    RELATIONSHIP_STRENGTHENED = "relationship_strengthened",
    RELATIONSHIP_WEAKENED = "relationship_weakened"
}
export interface EvolutionImpact {
    localImpact: number;
    globalImpact: number;
    affectedNodes: string[];
    affectedClusters: string[];
}
export declare class KnowledgeGraph {
    private redis;
    private embeddingManager;
    private readonly GRAPH_PREFIX;
    private readonly NODE_PREFIX;
    private readonly EDGE_PREFIX;
    private readonly CLUSTER_PREFIX;
    private readonly INSIGHT_PREFIX;
    private readonly EVOLUTION_PREFIX;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    addNode(workspaceId: string, node: Omit<KnowledgeNode, 'id' | 'embeddings' | 'createdAt'>): Promise<KnowledgeNode>;
    addEdge(workspaceId: string, edge: Omit<KnowledgeEdge, 'id' | 'createdAt'>): Promise<KnowledgeEdge>;
    queryGraph(workspaceId: string, query: KnowledgeGraphQuery): Promise<KnowledgeGraphResult>;
    discoverInsights(workspaceId: string): Promise<KnowledgeInsight[]>;
    clusterKnowledge(workspaceId: string, algorithm?: 'kmeans' | 'hierarchical' | 'community'): Promise<KnowledgeCluster[]>;
    getGraphMetrics(workspaceId: string): Promise<GraphMetrics>;
    getEvolutionHistory(workspaceId: string, limit?: number): Promise<KnowledgeEvolution[]>;
    private findSimilarNodes;
    private findRelatedEdges;
    private findKnowledgePaths;
    private findPathsBetweenNodes;
    private discoverRelationships;
    private inferRelationshipType;
    private discoverPatterns;
    private identifyKnowledgeGaps;
    private detectContradictions;
    private analyzeTrends;
    private communityDetection;
    private kMeansClustering;
    private hierarchicalClustering;
    private calculateCosineSimilarity;
    private calculateClusterSimilarity;
    private findCentroid;
    private calculateCoherenceScore;
    private extractTopics;
    private expandCluster;
    private calculatePathScore;
    private calculateClusteringCoefficient;
    private calculateCentralityScores;
    private getAllNodes;
    private getAllEdges;
    private getNodeById;
    private getNodesByIds;
    private getEdgesForPath;
    private getAdjacentNodes;
    private parseNodeData;
    private parseNodeSearchResults;
    private updateAdjacencyLists;
    private updateGraphStructure;
    private recordEvolution;
    private calculateEvolutionImpact;
    private storeInsight;
    private storeCluster;
    private generateNodeId;
    private generateEdgeId;
    private generateInsightId;
    private generateClusterId;
}
//# sourceMappingURL=knowledge-graph.d.ts.map