import { Redis } from 'ioredis';
import { KnowledgeGraph, KnowledgeType, RelationshipType, InsightType } from '../../../src/services/workspace/knowledge-graph';
import { EmbeddingManager } from '../../../src/services/embedding-manager';

describe('KnowledgeGraph', () => {
  let redis: Redis;
  let embeddingManager: EmbeddingManager;
  let knowledgeGraph: KnowledgeGraph;
  const workspaceId = 'test-workspace-kg';

  beforeEach(async () => {
    redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: 1 // Use test database
    });

    // Clear test data
    await redis.flushdb();

    embeddingManager = new EmbeddingManager(redis);
    await embeddingManager.initialize();

    knowledgeGraph = new KnowledgeGraph(redis, embeddingManager);
  });

  afterEach(async () => {
    await redis.quit();
  });

  describe('Node Operations', () => {
    it('should add a knowledge node', async () => {
      const nodeData = {
        type: KnowledgeType.INSIGHT,
        content: 'Machine learning models benefit from larger datasets',
        metadata: {
          tags: ['ml', 'data'],
          confidence: 0.9,
          source: 'research',
          version: 1
        },
        createdBy: 'researcher@example.com'
      };

      const node = await knowledgeGraph.addNode(workspaceId, nodeData);

      expect(node.id).toBeDefined();
      expect(node.type).toBe(KnowledgeType.INSIGHT);
      expect(node.content).toBe(nodeData.content);
      expect(node.embeddings).toBeDefined();
      expect(node.embeddings.length).toBeGreaterThan(0);
      expect(node.createdBy).toBe(nodeData.createdBy);
      expect(node.createdAt).toBeInstanceOf(Date);
    });

    it('should add multiple nodes and discover relationships', async () => {
      const nodes = [
        {
          type: KnowledgeType.INSIGHT,
          content: 'Deep learning requires large amounts of training data',
          metadata: { tags: ['deep-learning', 'data'], confidence: 0.9, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.DECISION,
          content: 'We will use transfer learning to reduce data requirements',
          metadata: { tags: ['transfer-learning', 'data'], confidence: 0.8, source: 'team', version: 1 },
          createdBy: 'team-lead@example.com'
        }
      ];

      const addedNodes = [];
      for (const nodeData of nodes) {
        const node = await knowledgeGraph.addNode(workspaceId, nodeData);
        addedNodes.push(node);
      }

      expect(addedNodes).toHaveLength(2);
      expect(addedNodes[0].type).toBe(KnowledgeType.INSIGHT);
      expect(addedNodes[1].type).toBe(KnowledgeType.DECISION);
    });
  });

  describe('Edge Operations', () => {
    it('should add edges between nodes', async () => {
      // First add some nodes
      const node1 = await knowledgeGraph.addNode(workspaceId, {
        type: KnowledgeType.INSIGHT,
        content: 'Machine learning models need quality data',
        metadata: { tags: ['ml'], confidence: 0.9, source: 'research', version: 1 },
        createdBy: 'researcher@example.com'
      });

      const node2 = await knowledgeGraph.addNode(workspaceId, {
        type: KnowledgeType.DECISION,
        content: 'We will implement data quality checks',
        metadata: { tags: ['data-quality'], confidence: 0.8, source: 'team', version: 1 },
        createdBy: 'team-lead@example.com'
      });

      // Add edge
      const edge = await knowledgeGraph.addEdge(workspaceId, {
        sourceId: node1.id,
        targetId: node2.id,
        relationship: RelationshipType.SUPPORTS,
        strength: 0.8
      });

      expect(edge.id).toBeDefined();
      expect(edge.sourceId).toBe(node1.id);
      expect(edge.targetId).toBe(node2.id);
      expect(edge.relationship).toBe(RelationshipType.SUPPORTS);
      expect(edge.strength).toBe(0.8);
      expect(edge.createdAt).toBeInstanceOf(Date);
    });
  });

  describe('Graph Querying', () => {
    beforeEach(async () => {
      // Set up test data
      const testNodes = [
        {
          type: KnowledgeType.INSIGHT,
          content: 'Neural networks excel at pattern recognition tasks',
          metadata: { tags: ['neural-networks', 'patterns'], confidence: 0.9, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.DECISION,
          content: 'We chose convolutional neural networks for image processing',
          metadata: { tags: ['cnn', 'images'], confidence: 0.85, source: 'team', version: 1 },
          createdBy: 'team-lead@example.com'
        },
        {
          type: KnowledgeType.QUESTION,
          content: 'How can we improve model accuracy on edge cases?',
          metadata: { tags: ['accuracy', 'edge-cases'], confidence: 0.7, source: 'user', version: 1 },
          createdBy: 'developer@example.com'
        }
      ];

      const nodes = [];
      for (const nodeData of testNodes) {
        const node = await knowledgeGraph.addNode(workspaceId, nodeData);
        nodes.push(node);
      }

      // Add relationships
      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: nodes[0].id,
        targetId: nodes[1].id,
        relationship: RelationshipType.SUPPORTS,
        strength: 0.8
      });

      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: nodes[1].id,
        targetId: nodes[2].id,
        relationship: RelationshipType.RELATES_TO,
        strength: 0.6
      });
    });

    it('should query the knowledge graph', async () => {
      const query = {
        query: 'neural network pattern recognition',
        nodeTypes: [KnowledgeType.INSIGHT, KnowledgeType.DECISION],
        maxDepth: 2,
        limit: 10,
        includeMetadata: true
      };

      const result = await knowledgeGraph.queryGraph(workspaceId, query);

      expect(result.nodes.length).toBeGreaterThan(0);
      expect(result.edges.length).toBeGreaterThanOrEqual(0);
      expect(result.paths.length).toBeGreaterThanOrEqual(0);
      expect(result.totalResults).toBe(result.nodes.length);
      expect(result.queryTime).toBeGreaterThan(0);

      // Check that results are relevant
      const relevantNode = result.nodes.find(node => 
        node.content.toLowerCase().includes('neural') || 
        node.content.toLowerCase().includes('pattern')
      );
      expect(relevantNode).toBeDefined();
    });

    it('should find paths between nodes', async () => {
      const query = {
        query: 'neural networks and accuracy',
        maxDepth: 3,
        limit: 5,
        includeMetadata: true
      };

      const result = await knowledgeGraph.queryGraph(workspaceId, query);

      if (result.paths.length > 0) {
        const path = result.paths[0];
        expect(path.nodes.length).toBeGreaterThan(1);
        expect(path.edges.length).toBe(path.nodes.length - 1);
        expect(path.score).toBeGreaterThan(0);
        expect(path.pathType).toBeDefined();
      }
    });
  });

  describe('Knowledge Insights', () => {
    beforeEach(async () => {
      // Add diverse knowledge for insight discovery
      const knowledgeItems = [
        {
          type: KnowledgeType.INSIGHT,
          content: 'Data preprocessing significantly improves model performance',
          metadata: { tags: ['preprocessing', 'performance'], confidence: 0.9, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.INSIGHT,
          content: 'Feature engineering is crucial for machine learning success',
          metadata: { tags: ['features', 'engineering'], confidence: 0.85, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.INSIGHT,
          content: 'Model validation prevents overfitting issues',
          metadata: { tags: ['validation', 'overfitting'], confidence: 0.8, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.DECISION,
          content: 'We will implement cross-validation for all models',
          metadata: { tags: ['cross-validation', 'models'], confidence: 0.9, source: 'team', version: 1 },
          createdBy: 'team-lead@example.com'
        }
      ];

      for (const item of knowledgeItems) {
        await knowledgeGraph.addNode(workspaceId, item);
      }
    });

    it('should discover knowledge insights', async () => {
      const insights = await knowledgeGraph.discoverInsights(workspaceId);

      expect(insights.length).toBeGreaterThan(0);

      const insight = insights[0];
      expect(insight.id).toBeDefined();
      expect(insight.type).toBeDefined();
      expect(Object.values(InsightType)).toContain(insight.type);
      expect(insight.title).toBeDefined();
      expect(insight.description).toBeDefined();
      expect(insight.confidence).toBeGreaterThan(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
      expect(insight.impact).toBeDefined();
      expect(insight.generatedAt).toBeInstanceOf(Date);
    });

    it('should identify different types of insights', async () => {
      const insights = await knowledgeGraph.discoverInsights(workspaceId);

      // Should have various insight types
      const insightTypes = new Set(insights.map(i => i.type));
      expect(insightTypes.size).toBeGreaterThan(0);

      // Check for pattern discovery
      const patternInsights = insights.filter(i => i.type === InsightType.PATTERN_DISCOVERY);
      if (patternInsights.length > 0) {
        expect(patternInsights[0].evidence.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Knowledge Clustering', () => {
    beforeEach(async () => {
      // Add nodes that should form clusters
      const clusterData = [
        // ML Performance cluster
        {
          type: KnowledgeType.INSIGHT,
          content: 'Larger datasets improve model accuracy',
          metadata: { tags: ['datasets', 'accuracy'], confidence: 0.9, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        {
          type: KnowledgeType.INSIGHT,
          content: 'Data quality is more important than quantity',
          metadata: { tags: ['data-quality', 'performance'], confidence: 0.85, source: 'research', version: 1 },
          createdBy: 'researcher@example.com'
        },
        // Architecture cluster
        {
          type: KnowledgeType.DECISION,
          content: 'We chose transformer architecture for NLP tasks',
          metadata: { tags: ['transformers', 'nlp'], confidence: 0.9, source: 'team', version: 1 },
          createdBy: 'team-lead@example.com'
        },
        {
          type: KnowledgeType.DECISION,
          content: 'CNN architecture selected for image processing',
          metadata: { tags: ['cnn', 'images'], confidence: 0.8, source: 'team', version: 1 },
          createdBy: 'team-lead@example.com'
        }
      ];

      for (const item of clusterData) {
        await knowledgeGraph.addNode(workspaceId, item);
      }
    });

    it('should cluster knowledge using community detection', async () => {
      const clusters = await knowledgeGraph.clusterKnowledge(workspaceId, 'community');

      expect(clusters.length).toBeGreaterThan(0);

      const cluster = clusters[0];
      expect(cluster.id).toBeDefined();
      expect(cluster.centroid).toBeDefined();
      expect(cluster.members.length).toBeGreaterThan(0);
      expect(cluster.coherenceScore).toBeGreaterThan(0);
      expect(cluster.coherenceScore).toBeLessThanOrEqual(1);
      expect(cluster.topics).toBeDefined();
      expect(cluster.topics.length).toBeGreaterThan(0);
      expect(cluster.createdAt).toBeInstanceOf(Date);
    });

    it('should cluster knowledge using k-means', async () => {
      const clusters = await knowledgeGraph.clusterKnowledge(workspaceId, 'kmeans');

      expect(clusters.length).toBeGreaterThan(0);
      
      // All clusters should have members
      clusters.forEach(cluster => {
        expect(cluster.members.length).toBeGreaterThan(0);
        expect(cluster.coherenceScore).toBeGreaterThanOrEqual(0);
        expect(cluster.topics.length).toBeGreaterThan(0);
      });
    });

    it('should cluster knowledge using hierarchical clustering', async () => {
      const clusters = await knowledgeGraph.clusterKnowledge(workspaceId, 'hierarchical');

      expect(clusters.length).toBeGreaterThan(0);
      
      // Check cluster quality
      clusters.forEach(cluster => {
        expect(cluster.members.length).toBeGreaterThan(0);
        expect(cluster.centroid).toBeDefined();
        expect(cluster.coherenceScore).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Graph Metrics', () => {
    beforeEach(async () => {
      // Create a small graph with known structure
      const nodes = [];
      for (let i = 0; i < 5; i++) {
        const node = await knowledgeGraph.addNode(workspaceId, {
          type: KnowledgeType.INSIGHT,
          content: `Test insight ${i + 1} about machine learning`,
          metadata: { tags: ['test'], confidence: 0.8, source: 'test', version: 1 },
          createdBy: 'test@example.com'
        });
        nodes.push(node);
      }

      // Add some edges to create structure
      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: nodes[0].id,
        targetId: nodes[1].id,
        relationship: RelationshipType.RELATES_TO,
        strength: 0.8
      });

      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: nodes[1].id,
        targetId: nodes[2].id,
        relationship: RelationshipType.SUPPORTS,
        strength: 0.7
      });

      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: nodes[2].id,
        targetId: nodes[3].id,
        relationship: RelationshipType.RELATES_TO,
        strength: 0.6
      });
    });

    it('should calculate graph metrics', async () => {
      const metrics = await knowledgeGraph.getGraphMetrics(workspaceId);

      expect(metrics.nodeCount).toBe(5);
      expect(metrics.edgeCount).toBe(3);
      expect(metrics.density).toBeGreaterThanOrEqual(0);
      expect(metrics.density).toBeLessThanOrEqual(1);
      expect(metrics.averageDegree).toBeGreaterThanOrEqual(0);
      expect(metrics.clusteringCoefficient).toBeGreaterThanOrEqual(0);
      expect(metrics.clusteringCoefficient).toBeLessThanOrEqual(1);
      expect(metrics.centralityScores).toBeInstanceOf(Map);
      expect(metrics.centralityScores.size).toBe(5);
      expect(metrics.communityStructure).toBeDefined();
    });

    it('should track centrality scores', async () => {
      const metrics = await knowledgeGraph.getGraphMetrics(workspaceId);

      // All nodes should have centrality scores
      expect(metrics.centralityScores.size).toBe(metrics.nodeCount);

      // Centrality scores should be between 0 and 1
      for (const [nodeId, score] of metrics.centralityScores) {
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
        expect(nodeId).toBeDefined();
      }
    });
  });

  describe('Knowledge Evolution', () => {
    it('should track knowledge evolution', async () => {
      // Add a node
      const node = await knowledgeGraph.addNode(workspaceId, {
        type: KnowledgeType.INSIGHT,
        content: 'Initial insight about machine learning',
        metadata: { tags: ['ml'], confidence: 0.8, source: 'test', version: 1 },
        createdBy: 'test@example.com'
      });

      // Add another node
      const node2 = await knowledgeGraph.addNode(workspaceId, {
        type: KnowledgeType.DECISION,
        content: 'Decision based on the insight',
        metadata: { tags: ['decision'], confidence: 0.9, source: 'test', version: 1 },
        createdBy: 'test@example.com'
      });

      // Add an edge
      await knowledgeGraph.addEdge(workspaceId, {
        sourceId: node.id,
        targetId: node2.id,
        relationship: RelationshipType.SUPPORTS,
        strength: 0.8
      });

      // Get evolution history
      const evolution = await knowledgeGraph.getEvolutionHistory(workspaceId, 10);

      expect(evolution.length).toBeGreaterThan(0);

      const change = evolution[0];
      expect(change.timestamp).toBeInstanceOf(Date);
      expect(change.changeType).toBeDefined();
      expect(change.impact).toBeDefined();
      expect(change.impact.localImpact).toBeGreaterThanOrEqual(0);
      expect(change.impact.globalImpact).toBeGreaterThanOrEqual(0);
    });
  });
});