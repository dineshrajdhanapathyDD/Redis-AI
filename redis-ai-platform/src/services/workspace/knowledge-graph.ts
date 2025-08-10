import { Redis } from 'ioredis';
import { logger } from '../../utils/logger';
import { EmbeddingManager } from '../embedding-manager';
import { KnowledgeNode, KnowledgeEdge, KnowledgeType, RelationshipType, KnowledgeMetadata } from './workspace-manager';

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

export enum PathType {
  DIRECT = 'direct',
  INDIRECT = 'indirect',
  SEMANTIC = 'semantic',
  TEMPORAL = 'temporal'
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

export enum InsightType {
  PATTERN_DISCOVERY = 'pattern_discovery',
  KNOWLEDGE_GAP = 'knowledge_gap',
  CONTRADICTION = 'contradiction',
  TREND_ANALYSIS = 'trend_analysis',
  RECOMMENDATION = 'recommendation',
  SUMMARY = 'summary'
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

export enum ChangeType {
  NODE_ADDED = 'node_added',
  NODE_UPDATED = 'node_updated',
  NODE_DELETED = 'node_deleted',
  EDGE_ADDED = 'edge_added',
  EDGE_UPDATED = 'edge_updated',
  EDGE_DELETED = 'edge_deleted',
  RELATIONSHIP_STRENGTHENED = 'relationship_strengthened',
  RELATIONSHIP_WEAKENED = 'relationship_weakened'
}

export interface EvolutionImpact {
  localImpact: number;
  globalImpact: number;
  affectedNodes: string[];
  affectedClusters: string[];
}

export class KnowledgeGraph {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private readonly GRAPH_PREFIX = 'knowledge_graph';
  private readonly NODE_PREFIX = 'kg_node';
  private readonly EDGE_PREFIX = 'kg_edge';
  private readonly CLUSTER_PREFIX = 'kg_cluster';
  private readonly INSIGHT_PREFIX = 'kg_insight';
  private readonly EVOLUTION_PREFIX = 'kg_evolution';

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.redis = redis;
    this.embeddingManager = embeddingManager;
  }

  async addNode(workspaceId: string, node: Omit<KnowledgeNode, 'id' | 'embeddings' | 'createdAt'>): Promise<KnowledgeNode> {
    const nodeId = this.generateNodeId();
    const embeddings = await this.embeddingManager.generateEmbedding(node.content);
    
    const knowledgeNode: KnowledgeNode = {
      ...node,
      id: nodeId,
      embeddings,
      createdAt: new Date()
    };

    // Store node in Redis with vector indexing
    const nodeKey = `${this.NODE_PREFIX}:${workspaceId}:${nodeId}`;
    await this.redis.hset(nodeKey,
      'id', nodeId,
      'type', node.type,
      'content', node.content,
      'embeddings', Buffer.from(new Float32Array(embeddings).buffer),
      'metadata', JSON.stringify(node.metadata),
      'createdBy', node.createdBy,
      'createdAt', knowledgeNode.createdAt.toISOString()
    );

    // Update graph structure
    await this.updateGraphStructure(workspaceId, 'node_added', nodeId);

    // Record evolution
    await this.recordEvolution(workspaceId, {
      timestamp: new Date(),
      changeType: ChangeType.NODE_ADDED,
      nodeId,
      newValue: knowledgeNode,
      impact: await this.calculateEvolutionImpact(workspaceId, 'node_added', nodeId)
    });

    // Trigger automatic relationship discovery
    await this.discoverRelationships(workspaceId, knowledgeNode);

    logger.info(`Added knowledge node ${nodeId} to workspace ${workspaceId}`);
    return knowledgeNode;
  }

  async addEdge(workspaceId: string, edge: Omit<KnowledgeEdge, 'id' | 'createdAt'>): Promise<KnowledgeEdge> {
    const edgeId = this.generateEdgeId();
    const knowledgeEdge: KnowledgeEdge = {
      ...edge,
      id: edgeId,
      createdAt: new Date()
    };

    // Store edge in Redis
    const edgeKey = `${this.EDGE_PREFIX}:${workspaceId}:${edgeId}`;
    await this.redis.hset(edgeKey,
      'id', edgeId,
      'sourceId', edge.sourceId,
      'targetId', edge.targetId,
      'relationship', edge.relationship,
      'strength', edge.strength.toString(),
      'createdAt', knowledgeEdge.createdAt.toISOString()
    );

    // Update adjacency lists for efficient graph traversal
    await this.updateAdjacencyLists(workspaceId, edge.sourceId, edge.targetId, edgeId);

    // Update graph structure
    await this.updateGraphStructure(workspaceId, 'edge_added', edgeId);

    // Record evolution
    await this.recordEvolution(workspaceId, {
      timestamp: new Date(),
      changeType: ChangeType.EDGE_ADDED,
      edgeId,
      newValue: knowledgeEdge,
      impact: await this.calculateEvolutionImpact(workspaceId, 'edge_added', edgeId)
    });

    logger.info(`Added knowledge edge ${edgeId} to workspace ${workspaceId}`);
    return knowledgeEdge;
  }

  async queryGraph(workspaceId: string, query: KnowledgeGraphQuery): Promise<KnowledgeGraphResult> {
    const startTime = Date.now();
    
    // Generate query embedding
    const queryEmbedding = await this.embeddingManager.generateEmbedding(query.query);
    
    // Perform vector similarity search for nodes
    const similarNodes = await this.findSimilarNodes(workspaceId, queryEmbedding, query.nodeTypes, query.limit || 20);
    
    // Find related edges
    const relatedEdges = await this.findRelatedEdges(workspaceId, similarNodes.map(n => n.id), query.relationshipTypes);
    
    // Discover paths between relevant nodes
    const paths = await this.findKnowledgePaths(workspaceId, similarNodes, query.maxDepth || 3);
    
    const queryTime = Date.now() - startTime;
    
    return {
      nodes: similarNodes,
      edges: relatedEdges,
      paths,
      totalResults: similarNodes.length,
      queryTime
    };
  }

  async discoverInsights(workspaceId: string): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];
    
    // Pattern discovery
    const patterns = await this.discoverPatterns(workspaceId);
    insights.push(...patterns);
    
    // Knowledge gap analysis
    const gaps = await this.identifyKnowledgeGaps(workspaceId);
    insights.push(...gaps);
    
    // Contradiction detection
    const contradictions = await this.detectContradictions(workspaceId);
    insights.push(...contradictions);
    
    // Trend analysis
    const trends = await this.analyzeTrends(workspaceId);
    insights.push(...trends);
    
    // Store insights
    for (const insight of insights) {
      await this.storeInsight(workspaceId, insight);
    }
    
    return insights.sort((a, b) => b.confidence - a.confidence);
  }

  async clusterKnowledge(workspaceId: string, algorithm: 'kmeans' | 'hierarchical' | 'community' = 'community'): Promise<KnowledgeCluster[]> {
    const nodes = await this.getAllNodes(workspaceId);
    
    if (nodes.length < 2) {
      return [];
    }
    
    let clusters: KnowledgeCluster[] = [];
    
    switch (algorithm) {
      case 'community':
        clusters = await this.communityDetection(workspaceId, nodes);
        break;
      case 'kmeans':
        clusters = await this.kMeansClustering(nodes);
        break;
      case 'hierarchical':
        clusters = await this.hierarchicalClustering(nodes);
        break;
    }
    
    // Store clusters
    for (const cluster of clusters) {
      await this.storeCluster(workspaceId, cluster);
    }
    
    return clusters;
  }

  async getGraphMetrics(workspaceId: string): Promise<GraphMetrics> {
    const nodes = await this.getAllNodes(workspaceId);
    const edges = await this.getAllEdges(workspaceId);
    
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    const density = nodeCount > 1 ? (2 * edgeCount) / (nodeCount * (nodeCount - 1)) : 0;
    const averageDegree = nodeCount > 0 ? (2 * edgeCount) / nodeCount : 0;
    
    // Calculate clustering coefficient
    const clusteringCoefficient = await this.calculateClusteringCoefficient(workspaceId, nodes, edges);
    
    // Calculate centrality scores
    const centralityScores = await this.calculateCentralityScores(workspaceId, nodes, edges);
    
    // Get community structure
    const communityStructure = await this.clusterKnowledge(workspaceId, 'community');
    
    return {
      nodeCount,
      edgeCount,
      density,
      averageDegree,
      clusteringCoefficient,
      centralityScores,
      communityStructure
    };
  }

  async getEvolutionHistory(workspaceId: string, limit: number = 100): Promise<KnowledgeEvolution[]> {
    const evolutionKeys = await this.redis.keys(`${this.EVOLUTION_PREFIX}:${workspaceId}:*`);
    const evolutions: KnowledgeEvolution[] = [];
    
    for (const key of evolutionKeys.slice(0, limit)) {
      const evolutionData = await this.redis.get(key);
      if (evolutionData) {
        evolutions.push(JSON.parse(evolutionData));
      }
    }
    
    return evolutions.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async findSimilarNodes(workspaceId: string, queryEmbedding: number[], nodeTypes?: KnowledgeType[], limit: number = 20): Promise<KnowledgeNode[]> {
    const indexName = `${this.NODE_PREFIX}:${workspaceId}:index`;
    
    try {
      // Build type filter if specified
      let typeFilter = '';
      if (nodeTypes && nodeTypes.length > 0) {
        typeFilter = `@type:{${nodeTypes.join('|')}}`;
      }
      
      const searchQuery = typeFilter ? 
        `(${typeFilter}) => [KNN ${limit} @embeddings $query_vec AS score]` :
        `*=>[KNN ${limit} @embeddings $query_vec AS score]`;
      
      const results = await this.redis.call('FT.SEARCH', indexName,
        searchQuery,
        'PARAMS', '2', 'query_vec', Buffer.from(new Float32Array(queryEmbedding).buffer),
        'SORTBY', 'score',
        'RETURN', '7', 'id', 'type', 'content', 'metadata', 'createdBy', 'createdAt', 'score',
        'DIALECT', '2'
      );
      
      return this.parseNodeSearchResults(results);
    } catch (error) {
      logger.error(`Node similarity search failed: ${error.message}`);
      return [];
    }
  }

  private async findRelatedEdges(workspaceId: string, nodeIds: string[], relationshipTypes?: RelationshipType[]): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];
    
    for (const nodeId of nodeIds) {
      // Get outgoing edges
      const outgoingKeys = await this.redis.smembers(`adj_out:${workspaceId}:${nodeId}`);
      // Get incoming edges
      const incomingKeys = await this.redis.smembers(`adj_in:${workspaceId}:${nodeId}`);
      
      const allEdgeKeys = [...outgoingKeys, ...incomingKeys];
      
      for (const edgeKey of allEdgeKeys) {
        const edgeData = await this.redis.hgetall(edgeKey);
        if (edgeData && Object.keys(edgeData).length > 0) {
          const edge: KnowledgeEdge = {
            id: edgeData.id,
            sourceId: edgeData.sourceId,
            targetId: edgeData.targetId,
            relationship: edgeData.relationship as RelationshipType,
            strength: parseFloat(edgeData.strength),
            createdAt: new Date(edgeData.createdAt)
          };
          
          // Filter by relationship type if specified
          if (!relationshipTypes || relationshipTypes.includes(edge.relationship)) {
            edges.push(edge);
          }
        }
      }
    }
    
    // Remove duplicates
    const uniqueEdges = edges.filter((edge, index, self) => 
      index === self.findIndex(e => e.id === edge.id)
    );
    
    return uniqueEdges;
  }

  private async findKnowledgePaths(workspaceId: string, nodes: KnowledgeNode[], maxDepth: number): Promise<KnowledgePath[]> {
    const paths: KnowledgePath[] = [];
    
    // Find paths between highly relevant nodes
    const topNodes = nodes.slice(0, Math.min(5, nodes.length));
    
    for (let i = 0; i < topNodes.length; i++) {
      for (let j = i + 1; j < topNodes.length; j++) {
        const pathsFound = await this.findPathsBetweenNodes(
          workspaceId, 
          topNodes[i].id, 
          topNodes[j].id, 
          maxDepth
        );
        paths.push(...pathsFound);
      }
    }
    
    return paths.sort((a, b) => b.score - a.score);
  }

  private async findPathsBetweenNodes(workspaceId: string, sourceId: string, targetId: string, maxDepth: number): Promise<KnowledgePath[]> {
    const paths: KnowledgePath[] = [];
    const visited = new Set<string>();
    const queue: { nodeId: string; path: string[]; depth: number }[] = [
      { nodeId: sourceId, path: [sourceId], depth: 0 }
    ];
    
    while (queue.length > 0 && paths.length < 10) { // Limit to 10 paths
      const { nodeId, path, depth } = queue.shift()!;
      
      if (depth >= maxDepth) continue;
      if (visited.has(nodeId)) continue;
      
      visited.add(nodeId);
      
      if (nodeId === targetId && path.length > 1) {
        // Found a path
        const pathNodes = await this.getNodesByIds(workspaceId, path);
        const pathEdges = await this.getEdgesForPath(workspaceId, path);
        const score = this.calculatePathScore(pathNodes, pathEdges);
        
        paths.push({
          nodes: pathNodes,
          edges: pathEdges,
          score,
          pathType: depth === 1 ? PathType.DIRECT : PathType.INDIRECT
        });
        continue;
      }
      
      // Get adjacent nodes
      const adjacentNodes = await this.getAdjacentNodes(workspaceId, nodeId);
      
      for (const adjacentId of adjacentNodes) {
        if (!path.includes(adjacentId)) {
          queue.push({
            nodeId: adjacentId,
            path: [...path, adjacentId],
            depth: depth + 1
          });
        }
      }
    }
    
    return paths;
  }

  private async discoverRelationships(workspaceId: string, newNode: KnowledgeNode): Promise<void> {
    const existingNodes = await this.getAllNodes(workspaceId);
    const threshold = 0.7; // Similarity threshold for automatic relationship creation
    
    for (const existingNode of existingNodes) {
      if (existingNode.id === newNode.id) continue;
      
      // Calculate semantic similarity
      const similarity = this.calculateCosineSimilarity(newNode.embeddings, existingNode.embeddings);
      
      if (similarity > threshold) {
        // Determine relationship type based on content analysis
        const relationshipType = await this.inferRelationshipType(newNode, existingNode);
        
        await this.addEdge(workspaceId, {
          sourceId: newNode.id,
          targetId: existingNode.id,
          relationship: relationshipType,
          strength: similarity
        });
      }
    }
  }

  private async inferRelationshipType(node1: KnowledgeNode, node2: KnowledgeNode): Promise<RelationshipType> {
    // Simple heuristic-based relationship inference
    // In a real implementation, this could use more sophisticated NLP
    
    const content1 = node1.content.toLowerCase();
    const content2 = node2.content.toLowerCase();
    
    // Check for temporal relationships
    if (content1.includes('because') || content1.includes('therefore') || 
        content2.includes('because') || content2.includes('therefore')) {
      return RelationshipType.DEPENDS_ON;
    }
    
    // Check for contradictions
    if ((content1.includes('not') && content2.includes('is')) ||
        (content1.includes('false') && content2.includes('true'))) {
      return RelationshipType.CONTRADICTS;
    }
    
    // Check for support relationships
    if (content1.includes('supports') || content1.includes('confirms') ||
        content2.includes('supports') || content2.includes('confirms')) {
      return RelationshipType.SUPPORTS;
    }
    
    // Check for references
    if (content1.includes('see') || content1.includes('refer') ||
        content2.includes('see') || content2.includes('refer')) {
      return RelationshipType.REFERENCES;
    }
    
    // Default to general relationship
    return RelationshipType.RELATES_TO;
  }

  private async discoverPatterns(workspaceId: string): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];
    const nodes = await this.getAllNodes(workspaceId);
    
    // Group nodes by type and analyze patterns
    const nodesByType = new Map<KnowledgeType, KnowledgeNode[]>();
    
    for (const node of nodes) {
      if (!nodesByType.has(node.type)) {
        nodesByType.set(node.type, []);
      }
      nodesByType.get(node.type)!.push(node);
    }
    
    // Analyze patterns within each type
    for (const [type, typeNodes] of nodesByType) {
      if (typeNodes.length >= 3) {
        // Find common themes using clustering
        const clusters = await this.kMeansClustering(typeNodes, 3);
        
        for (const cluster of clusters) {
          if (cluster.coherenceScore > 0.7) {
            insights.push({
              id: this.generateInsightId(),
              type: InsightType.PATTERN_DISCOVERY,
              title: `Pattern in ${type} knowledge`,
              description: `Discovered a coherent pattern among ${cluster.members.length} ${type} items: ${cluster.topics.join(', ')}`,
              evidence: cluster.members,
              confidence: cluster.coherenceScore,
              impact: {
                relevance: 0.8,
                novelty: 0.6,
                actionability: 0.7,
                confidence: cluster.coherenceScore
              },
              generatedAt: new Date()
            });
          }
        }
      }
    }
    
    return insights;
  }

  private async identifyKnowledgeGaps(workspaceId: string): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];
    const nodes = await this.getAllNodes(workspaceId);
    const edges = await this.getAllEdges(workspaceId);
    
    // Find nodes with few connections (potential knowledge gaps)
    const connectionCounts = new Map<string, number>();
    
    for (const edge of edges) {
      connectionCounts.set(edge.sourceId, (connectionCounts.get(edge.sourceId) || 0) + 1);
      connectionCounts.set(edge.targetId, (connectionCounts.get(edge.targetId) || 0) + 1);
    }
    
    const isolatedNodes = nodes.filter(node => (connectionCounts.get(node.id) || 0) < 2);
    
    if (isolatedNodes.length > 0) {
      insights.push({
        id: this.generateInsightId(),
        type: InsightType.KNOWLEDGE_GAP,
        title: 'Isolated Knowledge Items',
        description: `Found ${isolatedNodes.length} knowledge items with few connections, indicating potential knowledge gaps`,
        evidence: isolatedNodes,
        confidence: 0.8,
        impact: {
          relevance: 0.9,
          novelty: 0.5,
          actionability: 0.8,
          confidence: 0.8
        },
        generatedAt: new Date()
      });
    }
    
    return insights;
  }

  private async detectContradictions(workspaceId: string): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];
    const edges = await this.getAllEdges(workspaceId);
    
    // Find contradiction relationships
    const contradictionEdges = edges.filter(edge => edge.relationship === RelationshipType.CONTRADICTS);
    
    if (contradictionEdges.length > 0) {
      for (const edge of contradictionEdges) {
        const sourceNode = await this.getNodeById(workspaceId, edge.sourceId);
        const targetNode = await this.getNodeById(workspaceId, edge.targetId);
        
        if (sourceNode && targetNode) {
          insights.push({
            id: this.generateInsightId(),
            type: InsightType.CONTRADICTION,
            title: 'Knowledge Contradiction Detected',
            description: `Contradiction found between "${sourceNode.content.substring(0, 50)}..." and "${targetNode.content.substring(0, 50)}..."`,
            evidence: [sourceNode, targetNode],
            confidence: edge.strength,
            impact: {
              relevance: 0.9,
              novelty: 0.8,
              actionability: 0.9,
              confidence: edge.strength
            },
            generatedAt: new Date()
          });
        }
      }
    }
    
    return insights;
  }

  private async analyzeTrends(workspaceId: string): Promise<KnowledgeInsight[]> {
    const insights: KnowledgeInsight[] = [];
    const evolutions = await this.getEvolutionHistory(workspaceId, 100);
    
    // Analyze recent activity patterns
    const recentEvolutions = evolutions.filter(e => 
      Date.now() - e.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
    );
    
    if (recentEvolutions.length > 10) {
      const changeTypes = new Map<ChangeType, number>();
      
      for (const evolution of recentEvolutions) {
        changeTypes.set(evolution.changeType, (changeTypes.get(evolution.changeType) || 0) + 1);
      }
      
      const dominantChangeType = Array.from(changeTypes.entries())
        .sort((a, b) => b[1] - a[1])[0];
      
      insights.push({
        id: this.generateInsightId(),
        type: InsightType.TREND_ANALYSIS,
        title: 'Knowledge Activity Trend',
        description: `Recent trend shows increased ${dominantChangeType[0]} activity (${dominantChangeType[1]} occurrences)`,
        evidence: [],
        confidence: 0.7,
        impact: {
          relevance: 0.6,
          novelty: 0.5,
          actionability: 0.6,
          confidence: 0.7
        },
        generatedAt: new Date()
      });
    }
    
    return insights;
  }

  private async communityDetection(workspaceId: string, nodes: KnowledgeNode[]): Promise<KnowledgeCluster[]> {
    // Simplified community detection using modularity optimization
    const clusters: KnowledgeCluster[] = [];
    const edges = await this.getAllEdges(workspaceId);
    
    // Build adjacency matrix
    const nodeIds = nodes.map(n => n.id);
    const adjacencyMatrix = new Map<string, Map<string, number>>();
    
    for (const nodeId of nodeIds) {
      adjacencyMatrix.set(nodeId, new Map());
    }
    
    for (const edge of edges) {
      if (nodeIds.includes(edge.sourceId) && nodeIds.includes(edge.targetId)) {
        adjacencyMatrix.get(edge.sourceId)!.set(edge.targetId, edge.strength);
        adjacencyMatrix.get(edge.targetId)!.set(edge.sourceId, edge.strength);
      }
    }
    
    // Simple clustering based on connectivity
    const visited = new Set<string>();
    
    for (const node of nodes) {
      if (visited.has(node.id)) continue;
      
      const cluster = await this.expandCluster(node, nodes, adjacencyMatrix, visited);
      
      if (cluster.length >= 2) {
        const centroid = this.findCentroid(cluster);
        const coherenceScore = this.calculateCoherenceScore(cluster);
        const topics = this.extractTopics(cluster);
        
        clusters.push({
          id: this.generateClusterId(),
          centroid,
          members: cluster,
          coherenceScore,
          topics,
          createdAt: new Date()
        });
      }
    }
    
    return clusters;
  }

  private async kMeansClustering(nodes: KnowledgeNode[], k: number = 3): Promise<KnowledgeCluster[]> {
    if (nodes.length < k) {
      k = Math.max(1, nodes.length);
    }
    
    // Initialize centroids randomly
    const centroids = nodes.slice(0, k);
    const clusters: KnowledgeNode[][] = Array(k).fill(null).map(() => []);
    
    // Simplified k-means (single iteration for demo)
    for (const node of nodes) {
      let bestCluster = 0;
      let bestSimilarity = -1;
      
      for (let i = 0; i < centroids.length; i++) {
        const similarity = this.calculateCosineSimilarity(node.embeddings, centroids[i].embeddings);
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
          bestCluster = i;
        }
      }
      
      clusters[bestCluster].push(node);
    }
    
    return clusters.map((cluster, index) => ({
      id: this.generateClusterId(),
      centroid: centroids[index],
      members: cluster,
      coherenceScore: this.calculateCoherenceScore(cluster),
      topics: this.extractTopics(cluster),
      createdAt: new Date()
    })).filter(cluster => cluster.members.length > 0);
  }

  private async hierarchicalClustering(nodes: KnowledgeNode[]): Promise<KnowledgeCluster[]> {
    // Simplified hierarchical clustering
    const clusters: KnowledgeCluster[] = [];
    
    // Start with each node as its own cluster
    let currentClusters = nodes.map(node => [node]);
    
    // Merge clusters based on similarity until we have a reasonable number
    while (currentClusters.length > Math.max(2, Math.floor(nodes.length / 3))) {
      let bestMerge = { i: 0, j: 1, similarity: -1 };
      
      for (let i = 0; i < currentClusters.length; i++) {
        for (let j = i + 1; j < currentClusters.length; j++) {
          const similarity = this.calculateClusterSimilarity(currentClusters[i], currentClusters[j]);
          if (similarity > bestMerge.similarity) {
            bestMerge = { i, j, similarity };
          }
        }
      }
      
      // Merge the most similar clusters
      const merged = [...currentClusters[bestMerge.i], ...currentClusters[bestMerge.j]];
      currentClusters = currentClusters.filter((_, index) => index !== bestMerge.i && index !== bestMerge.j);
      currentClusters.push(merged);
    }
    
    return currentClusters.map(cluster => ({
      id: this.generateClusterId(),
      centroid: this.findCentroid(cluster),
      members: cluster,
      coherenceScore: this.calculateCoherenceScore(cluster),
      topics: this.extractTopics(cluster),
      createdAt: new Date()
    }));
  }

  // Helper methods
  private calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;
    
    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      norm1 += vec1[i] * vec1[i];
      norm2 += vec2[i] * vec2[i];
    }
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  private calculateClusterSimilarity(cluster1: KnowledgeNode[], cluster2: KnowledgeNode[]): number {
    let totalSimilarity = 0;
    let count = 0;
    
    for (const node1 of cluster1) {
      for (const node2 of cluster2) {
        totalSimilarity += this.calculateCosineSimilarity(node1.embeddings, node2.embeddings);
        count++;
      }
    }
    
    return count > 0 ? totalSimilarity / count : 0;
  }

  private findCentroid(cluster: KnowledgeNode[]): KnowledgeNode {
    // Return the node closest to the average embedding
    if (cluster.length === 1) return cluster[0];
    
    const avgEmbedding = new Array(cluster[0].embeddings.length).fill(0);
    
    for (const node of cluster) {
      for (let i = 0; i < node.embeddings.length; i++) {
        avgEmbedding[i] += node.embeddings[i];
      }
    }
    
    for (let i = 0; i < avgEmbedding.length; i++) {
      avgEmbedding[i] /= cluster.length;
    }
    
    let bestNode = cluster[0];
    let bestSimilarity = this.calculateCosineSimilarity(cluster[0].embeddings, avgEmbedding);
    
    for (const node of cluster.slice(1)) {
      const similarity = this.calculateCosineSimilarity(node.embeddings, avgEmbedding);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestNode = node;
      }
    }
    
    return bestNode;
  }

  private calculateCoherenceScore(cluster: KnowledgeNode[]): number {
    if (cluster.length < 2) return 1.0;
    
    let totalSimilarity = 0;
    let count = 0;
    
    for (let i = 0; i < cluster.length; i++) {
      for (let j = i + 1; j < cluster.length; j++) {
        totalSimilarity += this.calculateCosineSimilarity(cluster[i].embeddings, cluster[j].embeddings);
        count++;
      }
    }
    
    return count > 0 ? totalSimilarity / count : 0;
  }

  private extractTopics(cluster: KnowledgeNode[]): string[] {
    // Simple topic extraction based on common words
    const wordCounts = new Map<string, number>();
    
    for (const node of cluster) {
      const words = node.content.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3);
      
      for (const word of words) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    }
    
    return Array.from(wordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private async expandCluster(
    startNode: KnowledgeNode,
    allNodes: KnowledgeNode[],
    adjacencyMatrix: Map<string, Map<string, number>>,
    visited: Set<string>
  ): Promise<KnowledgeNode[]> {
    const cluster = [startNode];
    const queue = [startNode.id];
    visited.add(startNode.id);
    
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const neighbors = adjacencyMatrix.get(currentId);
      
      if (neighbors) {
        for (const [neighborId, strength] of neighbors) {
          if (!visited.has(neighborId) && strength > 0.5) {
            visited.add(neighborId);
            const neighborNode = allNodes.find(n => n.id === neighborId);
            if (neighborNode) {
              cluster.push(neighborNode);
              queue.push(neighborId);
            }
          }
        }
      }
    }
    
    return cluster;
  }

  private calculatePathScore(nodes: KnowledgeNode[], edges: KnowledgeEdge[]): number {
    if (edges.length === 0) return 0;
    
    // Score based on edge strengths and path length
    const avgStrength = edges.reduce((sum, edge) => sum + edge.strength, 0) / edges.length;
    const lengthPenalty = 1 / (1 + edges.length * 0.1);
    
    return avgStrength * lengthPenalty;
  }

  private async calculateClusteringCoefficient(workspaceId: string, nodes: KnowledgeNode[], edges: KnowledgeEdge[]): Promise<number> {
    if (nodes.length < 3) return 0;
    
    let totalCoefficient = 0;
    
    for (const node of nodes) {
      const neighbors = await this.getAdjacentNodes(workspaceId, node.id);
      
      if (neighbors.length < 2) continue;
      
      let triangles = 0;
      const possibleTriangles = (neighbors.length * (neighbors.length - 1)) / 2;
      
      for (let i = 0; i < neighbors.length; i++) {
        for (let j = i + 1; j < neighbors.length; j++) {
          const edgeExists = edges.some(edge => 
            (edge.sourceId === neighbors[i] && edge.targetId === neighbors[j]) ||
            (edge.sourceId === neighbors[j] && edge.targetId === neighbors[i])
          );
          
          if (edgeExists) triangles++;
        }
      }
      
      totalCoefficient += possibleTriangles > 0 ? triangles / possibleTriangles : 0;
    }
    
    return totalCoefficient / nodes.length;
  }

  private async calculateCentralityScores(workspaceId: string, nodes: KnowledgeNode[], edges: KnowledgeEdge[]): Promise<Map<string, number>> {
    const centralityScores = new Map<string, number>();
    
    // Calculate degree centrality
    const degreeCounts = new Map<string, number>();
    
    for (const edge of edges) {
      degreeCounts.set(edge.sourceId, (degreeCounts.get(edge.sourceId) || 0) + 1);
      degreeCounts.set(edge.targetId, (degreeCounts.get(edge.targetId) || 0) + 1);
    }
    
    const maxDegree = Math.max(...Array.from(degreeCounts.values()));
    
    for (const node of nodes) {
      const degree = degreeCounts.get(node.id) || 0;
      centralityScores.set(node.id, maxDegree > 0 ? degree / maxDegree : 0);
    }
    
    return centralityScores;
  }

  // Storage and retrieval methods
  private async getAllNodes(workspaceId: string): Promise<KnowledgeNode[]> {
    const nodeKeys = await this.redis.keys(`${this.NODE_PREFIX}:${workspaceId}:*`);
    const nodes: KnowledgeNode[] = [];
    
    for (const key of nodeKeys) {
      const nodeData = await this.redis.hgetall(key);
      if (nodeData && Object.keys(nodeData).length > 0) {
        nodes.push(this.parseNodeData(nodeData));
      }
    }
    
    return nodes;
  }

  private async getAllEdges(workspaceId: string): Promise<KnowledgeEdge[]> {
    const edgeKeys = await this.redis.keys(`${this.EDGE_PREFIX}:${workspaceId}:*`);
    const edges: KnowledgeEdge[] = [];
    
    for (const key of edgeKeys) {
      const edgeData = await this.redis.hgetall(key);
      if (edgeData && Object.keys(edgeData).length > 0) {
        edges.push({
          id: edgeData.id,
          sourceId: edgeData.sourceId,
          targetId: edgeData.targetId,
          relationship: edgeData.relationship as RelationshipType,
          strength: parseFloat(edgeData.strength),
          createdAt: new Date(edgeData.createdAt)
        });
      }
    }
    
    return edges;
  }

  private async getNodeById(workspaceId: string, nodeId: string): Promise<KnowledgeNode | null> {
    const nodeData = await this.redis.hgetall(`${this.NODE_PREFIX}:${workspaceId}:${nodeId}`);
    return nodeData && Object.keys(nodeData).length > 0 ? this.parseNodeData(nodeData) : null;
  }

  private async getNodesByIds(workspaceId: string, nodeIds: string[]): Promise<KnowledgeNode[]> {
    const nodes: KnowledgeNode[] = [];
    
    for (const nodeId of nodeIds) {
      const node = await this.getNodeById(workspaceId, nodeId);
      if (node) nodes.push(node);
    }
    
    return nodes;
  }

  private async getEdgesForPath(workspaceId: string, nodePath: string[]): Promise<KnowledgeEdge[]> {
    const edges: KnowledgeEdge[] = [];
    
    for (let i = 0; i < nodePath.length - 1; i++) {
      const sourceId = nodePath[i];
      const targetId = nodePath[i + 1];
      
      // Find edge between these nodes
      const edgeKeys = await this.redis.keys(`${this.EDGE_PREFIX}:${workspaceId}:*`);
      
      for (const key of edgeKeys) {
        const edgeData = await this.redis.hgetall(key);
        if (edgeData && 
            ((edgeData.sourceId === sourceId && edgeData.targetId === targetId) ||
             (edgeData.sourceId === targetId && edgeData.targetId === sourceId))) {
          edges.push({
            id: edgeData.id,
            sourceId: edgeData.sourceId,
            targetId: edgeData.targetId,
            relationship: edgeData.relationship as RelationshipType,
            strength: parseFloat(edgeData.strength),
            createdAt: new Date(edgeData.createdAt)
          });
          break;
        }
      }
    }
    
    return edges;
  }

  private async getAdjacentNodes(workspaceId: string, nodeId: string): Promise<string[]> {
    const outgoing = await this.redis.smembers(`adj_out:${workspaceId}:${nodeId}`);
    const incoming = await this.redis.smembers(`adj_in:${workspaceId}:${nodeId}`);
    
    // Extract node IDs from edge keys
    const adjacentIds = new Set<string>();
    
    for (const edgeKey of [...outgoing, ...incoming]) {
      const edgeData = await this.redis.hgetall(edgeKey);
      if (edgeData) {
        if (edgeData.sourceId !== nodeId) adjacentIds.add(edgeData.sourceId);
        if (edgeData.targetId !== nodeId) adjacentIds.add(edgeData.targetId);
      }
    }
    
    return Array.from(adjacentIds);
  }

  private parseNodeData(nodeData: any): KnowledgeNode {
    return {
      id: nodeData.id,
      type: nodeData.type as KnowledgeType,
      content: nodeData.content,
      embeddings: nodeData.embeddings ? Array.from(new Float32Array(nodeData.embeddings)) : [],
      metadata: JSON.parse(nodeData.metadata || '{}'),
      createdBy: nodeData.createdBy,
      createdAt: new Date(nodeData.createdAt)
    };
  }

  private parseNodeSearchResults(results: any[]): KnowledgeNode[] {
    const nodes: KnowledgeNode[] = [];
    
    for (let i = 1; i < results.length; i += 2) {
      const fields = results[i + 1];
      const fieldsObj: any = {};
      
      for (let j = 0; j < fields.length; j += 2) {
        fieldsObj[fields[j]] = fields[j + 1];
      }
      
      nodes.push({
        id: fieldsObj.id,
        type: fieldsObj.type as KnowledgeType,
        content: fieldsObj.content,
        embeddings: [], // Don't return full embeddings in search results
        metadata: JSON.parse(fieldsObj.metadata || '{}'),
        createdBy: fieldsObj.createdBy,
        createdAt: new Date(fieldsObj.createdAt)
      });
    }
    
    return nodes;
  }

  private async updateAdjacencyLists(workspaceId: string, sourceId: string, targetId: string, edgeId: string): Promise<void> {
    const edgeKey = `${this.EDGE_PREFIX}:${workspaceId}:${edgeId}`;
    
    // Add to outgoing adjacency list of source
    await this.redis.sadd(`adj_out:${workspaceId}:${sourceId}`, edgeKey);
    
    // Add to incoming adjacency list of target
    await this.redis.sadd(`adj_in:${workspaceId}:${targetId}`, edgeKey);
  }

  private async updateGraphStructure(workspaceId: string, changeType: string, elementId: string): Promise<void> {
    const structureKey = `${this.GRAPH_PREFIX}:${workspaceId}:structure`;
    const timestamp = Date.now();
    
    await this.redis.zadd(structureKey, timestamp, `${changeType}:${elementId}`);
  }

  private async recordEvolution(workspaceId: string, evolution: KnowledgeEvolution): Promise<void> {
    const evolutionKey = `${this.EVOLUTION_PREFIX}:${workspaceId}:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await this.redis.setex(evolutionKey, 2592000, JSON.stringify(evolution)); // 30 days TTL
  }

  private async calculateEvolutionImpact(workspaceId: string, changeType: string, elementId: string): Promise<EvolutionImpact> {
    // Simplified impact calculation
    return {
      localImpact: 0.5,
      globalImpact: 0.3,
      affectedNodes: [elementId],
      affectedClusters: []
    };
  }

  private async storeInsight(workspaceId: string, insight: KnowledgeInsight): Promise<void> {
    const insightKey = `${this.INSIGHT_PREFIX}:${workspaceId}:${insight.id}`;
    await this.redis.setex(insightKey, 604800, JSON.stringify(insight)); // 7 days TTL
  }

  private async storeCluster(workspaceId: string, cluster: KnowledgeCluster): Promise<void> {
    const clusterKey = `${this.CLUSTER_PREFIX}:${workspaceId}:${cluster.id}`;
    await this.redis.setex(clusterKey, 86400, JSON.stringify(cluster)); // 24 hours TTL
  }

  // ID generators
  private generateNodeId(): string {
    return `kn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEdgeId(): string {
    return `ke_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateInsightId(): string {
    return `ki_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateClusterId(): string {
    return `kc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}