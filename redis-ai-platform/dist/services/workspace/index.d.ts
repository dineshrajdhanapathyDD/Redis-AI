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
export declare class WorkspaceService {
    readonly manager: WorkspaceManager;
    readonly sync: SyncEngine;
    readonly access: AccessControl;
    readonly knowledgeGraph: KnowledgeGraph;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map