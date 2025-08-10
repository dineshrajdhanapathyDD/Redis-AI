export * from './workspace-manager';
export * from './sync-engine';
export * from './access-control';
export * from './knowledge-graph';

import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { WorkspaceManager } from './workspace-manager';
import { SyncEngine } from './sync-engine';
import { AccessControl } from './access-control';
import { KnowledgeGraph } from './knowledge-graph';

export class WorkspaceService {
  public readonly manager: WorkspaceManager;
  public readonly sync: SyncEngine;
  public readonly access: AccessControl;
  public readonly knowledgeGraph: KnowledgeGraph;

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.manager = new WorkspaceManager(redis, embeddingManager);
    this.sync = new SyncEngine(redis, this.manager);
    this.access = new AccessControl(redis);
    this.knowledgeGraph = new KnowledgeGraph(redis, embeddingManager);
  }

  async initialize(): Promise<void> {
    // Any initialization logic for the workspace service
    // This could include setting up default policies, cleaning up expired data, etc.
  }

  async shutdown(): Promise<void> {
    // Cleanup logic when shutting down the service
    // This could include unsubscribing from Redis channels, saving state, etc.
  }
}