import { Redis } from 'ioredis';
import { WorkspaceService, WorkspaceConfig, CollaboratorRole, KnowledgeType, RelationshipType, UserStatus, ResourceType, Permission } from '../services/workspace';
import { EmbeddingManager } from '../services/embedding-manager';
import { logger } from '../utils/logger';

export class WorkspaceDemo {
  private redis: Redis;
  private embeddingManager: EmbeddingManager;
  private workspaceService: WorkspaceService;

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.redis = redis;
    this.embeddingManager = embeddingManager;
    this.workspaceService = new WorkspaceService(redis, embeddingManager);
  }

  async runDemo(): Promise<void> {
    logger.info('🚀 Starting Workspace Infrastructure Demo');

    try {
      // Demo 1: Create and manage workspaces
      await this.demoWorkspaceManagement();

      // Demo 2: Real-time collaboration
      await this.demoRealTimeCollaboration();

      // Demo 3: Knowledge management
      await this.demoKnowledgeManagement();

      // Demo 4: Access control
      await this.demoAccessControl();

      logger.info('✅ Workspace Infrastructure Demo completed successfully');
    } catch (error) {
      logger.error(`❌ Demo failed: ${error.message}`);
      throw error;
    }
  }

  private async demoWorkspaceManagement(): Promise<void> {
    logger.info('\n📁 Demo 1: Workspace Management');

    // Create a new workspace
    const workspaceConfig: WorkspaceConfig = {
      name: 'AI Research Project',
      description: 'Collaborative workspace for AI research and development',
      ownerId: 'alice@example.com',
      isPublic: false,
      maxCollaborators: 10,
      settings: {
        allowGuestAccess: false,
        autoSaveInterval: 30,
        knowledgeRetentionDays: 365,
        syncMode: 'realtime'
      }
    };

    const workspace = await this.workspaceService.manager.createWorkspace(workspaceConfig);
    logger.info(`Created workspace: ${workspace.name} (ID: ${workspace.id})`);

    // Add collaborators
    await this.workspaceService.manager.joinWorkspace(workspace.id, 'bob@example.com', CollaboratorRole.EDITOR);
    await this.workspaceService.manager.joinWorkspace(workspace.id, 'charlie@example.com', CollaboratorRole.VIEWER);
    logger.info('Added collaborators to workspace');

    // Get workspace details
    const retrievedWorkspace = await this.workspaceService.manager.getWorkspace(workspace.id);
    logger.info(`Workspace has ${retrievedWorkspace?.collaborators.length} collaborators`);

    // List workspaces for a user
    const aliceWorkspaces = await this.workspaceService.manager.getWorkspacesByUser('alice@example.com');
    logger.info(`Alice has access to ${aliceWorkspaces.length} workspaces`);

    // Update workspace settings
    await this.workspaceService.manager.updateWorkspaceSettings(workspace.id, {
      autoSaveInterval: 60,
      allowGuestAccess: true
    });
    logger.info('Updated workspace settings');
  }

  private async demoRealTimeCollaboration(): Promise<void> {
    logger.info('\n🔄 Demo 2: Real-time Collaboration');

    const workspaceId = 'ws_demo_123';
    const users = ['alice@example.com', 'bob@example.com', 'charlie@example.com'];

    // Simulate users joining the workspace
    const callbacks = users.map(userId => {
      const callback = (event: any) => {
        logger.info(`${userId} received event: ${event.type}`);
      };
      return { userId, callback };
    });

    // Subscribe users to workspace sync
    for (const { userId, callback } of callbacks) {
      await this.workspaceService.sync.subscribeToWorkspace(workspaceId, userId, callback);
      logger.info(`${userId} subscribed to workspace sync`);
    }

    // Update user presence
    await this.workspaceService.sync.updateUserPresence(workspaceId, 'alice@example.com', UserStatus.ONLINE, 'editing document');
    await this.workspaceService.sync.updateUserPresence(workspaceId, 'bob@example.com', UserStatus.ONLINE, 'reviewing code');
    logger.info('Updated user presence');

    // Simulate cursor movements
    await this.workspaceService.sync.updateCursorPosition(workspaceId, 'alice@example.com', { x: 100, y: 200, elementId: 'doc1' });
    await this.workspaceService.sync.updateCursorPosition(workspaceId, 'bob@example.com', { x: 300, y: 150, elementId: 'code1' });
    logger.info('Updated cursor positions');

    // Demonstrate locking mechanism
    const lockAcquired = await this.workspaceService.sync.acquireLock(workspaceId, 'document1', 'alice@example.com', 'write');
    logger.info(`Alice acquired lock on document1: ${lockAcquired}`);

    // Try to acquire the same lock with another user (should fail)
    const lockFailed = await this.workspaceService.sync.acquireLock(workspaceId, 'document1', 'bob@example.com', 'write');
    logger.info(`Bob tried to acquire lock on document1: ${lockFailed}`);

    // Detect conflict
    const conflict = await this.workspaceService.sync.detectConflict(workspaceId, 'document1', 'bob@example.com', 'edit', { content: 'new content' });
    if (conflict) {
      logger.info(`Conflict detected: ${conflict.conflictType}`);
      
      // Resolve conflict
      await this.workspaceService.sync.resolveConflict(workspaceId, conflict.id, {
        action: 'accept_last' as any,
        notify: true
      });
      logger.info('Conflict resolved');
    }

    // Release lock
    await this.workspaceService.sync.releaseLock(workspaceId, 'document1', 'alice@example.com');
    logger.info('Alice released lock on document1');

    // Get active users
    const activeUsers = await this.workspaceService.sync.getActiveUsers(workspaceId);
    logger.info(`Active users: ${activeUsers.map(u => u.userId).join(', ')}`);

    // Unsubscribe users
    for (const { userId } of callbacks) {
      await this.workspaceService.sync.unsubscribeFromWorkspace(workspaceId, userId);
    }
    logger.info('Users unsubscribed from workspace sync');
  }

  private async demoKnowledgeManagement(): Promise<void> {
    logger.info('\n🧠 Demo 3: Knowledge Management');

    const workspaceId = 'ws_knowledge_demo';

    // Create workspace for knowledge demo
    const workspace = await this.workspaceService.manager.createWorkspace({
      name: 'Knowledge Base',
      description: 'Demo workspace for knowledge management',
      ownerId: 'researcher@example.com',
      isPublic: false,
      maxCollaborators: 5,
      settings: {
        allowGuestAccess: false,
        autoSaveInterval: 30,
        knowledgeRetentionDays: 365,
        syncMode: 'realtime'
      }
    });

    // Add various types of knowledge
    const insights = [
      {
        type: KnowledgeType.INSIGHT,
        content: 'Machine learning models perform better with larger datasets, but there are diminishing returns after a certain point.',
        metadata: {
          tags: ['machine-learning', 'datasets', 'performance'],
          confidence: 0.9,
          source: 'research-paper',
          version: 1
        },
        createdBy: 'researcher@example.com'
      },
      {
        type: KnowledgeType.DECISION,
        content: 'We decided to use transformer architecture for our NLP tasks due to its superior performance on benchmark tests.',
        metadata: {
          tags: ['nlp', 'transformers', 'architecture'],
          confidence: 0.95,
          source: 'team-meeting',
          version: 1
        },
        createdBy: 'researcher@example.com'
      },
      {
        type: KnowledgeType.QUESTION,
        content: 'How can we optimize our model training process to reduce computational costs while maintaining accuracy?',
        metadata: {
          tags: ['optimization', 'training', 'cost-reduction'],
          confidence: 0.8,
          source: 'brainstorming',
          version: 1
        },
        createdBy: 'researcher@example.com'
      }
    ];

    const knowledgeNodes = [];
    for (const insight of insights) {
      const node = await this.workspaceService.manager.addKnowledge(workspace.id, insight);
      knowledgeNodes.push(node);
      logger.info(`Added knowledge: ${insight.type} - ${insight.content.substring(0, 50)}...`);
    }

    // Create relationships between knowledge nodes
    await this.workspaceService.manager.addKnowledgeRelationship(
      workspace.id,
      knowledgeNodes[0].id,
      knowledgeNodes[1].id,
      RelationshipType.SUPPORTS,
      0.8
    );

    await this.workspaceService.manager.addKnowledgeRelationship(
      workspace.id,
      knowledgeNodes[2].id,
      knowledgeNodes[0].id,
      RelationshipType.RELATES_TO,
      0.7
    );

    logger.info('Created knowledge relationships');

    // Query knowledge using semantic search
    const searchQueries = [
      'machine learning performance',
      'model architecture decisions',
      'training optimization'
    ];

    for (const query of searchQueries) {
      const results = await this.workspaceService.manager.queryKnowledge(workspace.id, query, 5);
      logger.info(`Query: "${query}" returned ${results.length} results`);
      
      results.forEach((result, index) => {
        logger.info(`  ${index + 1}. [${result.type}] ${result.content.substring(0, 80)}... (relevance: ${result.metadata.relevanceScore?.toFixed(3)})`);
      });
    }

    // Enhanced Knowledge Graph Operations
    logger.info('\n🔍 Enhanced Knowledge Graph Operations:');

    // Discover insights from the knowledge graph
    const insights = await this.workspaceService.manager.discoverKnowledgeInsights(workspace.id);
    logger.info(`Discovered ${insights.length} knowledge insights:`);
    insights.forEach((insight, index) => {
      logger.info(`  ${index + 1}. ${insight.title} (${insight.type})`);
      logger.info(`     Confidence: ${(insight.confidence * 100).toFixed(1)}%`);
      logger.info(`     ${insight.description}`);
    });

    // Cluster knowledge
    const clusters = await this.workspaceService.manager.clusterWorkspaceKnowledge(workspace.id, 'community');
    logger.info(`\nKnowledge clustering found ${clusters.length} clusters:`);
    clusters.forEach((cluster, index) => {
      logger.info(`  Cluster ${index + 1}: ${cluster.members.length} items`);
      logger.info(`     Coherence: ${(cluster.coherenceScore * 100).toFixed(1)}%`);
      logger.info(`     Topics: ${cluster.topics.join(', ')}`);
    });

    // Get graph metrics
    const metrics = await this.workspaceService.manager.getKnowledgeGraphMetrics(workspace.id);
    logger.info(`\nKnowledge graph metrics:`);
    logger.info(`  Nodes: ${metrics.nodeCount}, Edges: ${metrics.edgeCount}`);
    logger.info(`  Density: ${(metrics.density * 100).toFixed(2)}%`);
    logger.info(`  Average degree: ${metrics.averageDegree.toFixed(2)}`);
    logger.info(`  Clustering coefficient: ${(metrics.clusteringCoefficient * 100).toFixed(2)}%`);

    // Advanced graph query
    const graphQuery = {
      query: 'machine learning optimization',
      nodeTypes: [KnowledgeType.INSIGHT, KnowledgeType.DECISION],
      maxDepth: 2,
      limit: 10,
      includeMetadata: true
    };

    const graphResults = await this.workspaceService.manager.queryKnowledgeGraph(workspace.id, graphQuery);
    logger.info(`\nAdvanced graph query results:`);
    logger.info(`  Nodes: ${graphResults.nodes.length}, Edges: ${graphResults.edges.length}`);
    logger.info(`  Paths: ${graphResults.paths.length}, Query time: ${graphResults.queryTime}ms`);

    // Show knowledge evolution
    const evolution = await this.workspaceService.manager.getKnowledgeEvolution(workspace.id, 10);
    logger.info(`\nKnowledge evolution (last ${evolution.length} changes):`);
    evolution.forEach((change, index) => {
      logger.info(`  ${index + 1}. ${change.changeType} at ${change.timestamp.toISOString()}`);
      logger.info(`     Impact: Local ${change.impact.localImpact}, Global ${change.impact.globalImpact}`);
    });
  }

  private async demoAccessControl(): Promise<void> {
    logger.info('\n🔐 Demo 4: Access Control');

    const workspaceId = 'ws_access_demo';
    const userId = 'user@example.com';

    // Create access policies
    await this.workspaceService.access.createAccessPolicy({
      workspaceId,
      resourceType: ResourceType.KNOWLEDGE,
      permissions: [{
        role: CollaboratorRole.EDITOR,
        permissions: [Permission.READ, Permission.WRITE],
        conditions: [{
          type: 'time_based' as any,
          value: new Date(Date.now() + 86400000), // 24 hours from now
          operator: 'less_than' as any
        }]
      }],
      inheritanceRules: []
    });
    logger.info('Created access policy with time-based conditions');

    // Test access control
    const accessRequests = [
      {
        userId,
        workspaceId,
        resourceType: ResourceType.KNOWLEDGE,
        permission: Permission.READ
      },
      {
        userId,
        workspaceId,
        resourceType: ResourceType.KNOWLEDGE,
        permission: Permission.WRITE
      },
      {
        userId,
        workspaceId,
        resourceType: ResourceType.KNOWLEDGE,
        permission: Permission.DELETE
      }
    ];

    for (const request of accessRequests) {
      const result = await this.workspaceService.access.checkAccess(request);
      logger.info(`Access check for ${request.permission}: ${result.granted ? '✅ GRANTED' : '❌ DENIED'} - ${result.reason}`);
    }

    // Grant specific permission
    await this.workspaceService.access.grantPermission(workspaceId, userId, Permission.DELETE, ResourceType.KNOWLEDGE);
    logger.info('Granted DELETE permission to user');

    // Test access again
    const deleteRequest = {
      userId,
      workspaceId,
      resourceType: ResourceType.KNOWLEDGE,
      permission: Permission.DELETE
    };

    const deleteResult = await this.workspaceService.access.checkAccess(deleteRequest);
    logger.info(`Access check for DELETE after grant: ${deleteResult.granted ? '✅ GRANTED' : '❌ DENIED'} - ${deleteResult.reason}`);

    // Get audit logs
    const auditLogs = await this.workspaceService.access.getAuditLogs(workspaceId, userId, 10);
    logger.info(`Retrieved ${auditLogs.length} audit log entries`);

    auditLogs.forEach((log, index) => {
      logger.info(`  ${index + 1}. ${log.action} - ${log.permission} on ${log.resourceType} - ${log.result.granted ? 'GRANTED' : 'DENIED'}`);
    });

    // Revoke permission
    await this.workspaceService.access.revokePermission(workspaceId, userId, Permission.DELETE, ResourceType.KNOWLEDGE);
    logger.info('Revoked DELETE permission from user');
  }
}

// Example usage
export async function runWorkspaceDemo(): Promise<void> {
  const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  });

  const embeddingManager = new EmbeddingManager(redis);
  const demo = new WorkspaceDemo(redis, embeddingManager);

  try {
    await demo.runDemo();
  } finally {
    await redis.quit();
  }
}

// Run demo if this file is executed directly
if (require.main === module) {
  runWorkspaceDemo().catch(console.error);
}