import { Redis } from 'ioredis';
import { EmbeddingManager } from '../services/embedding-manager';
export declare class WorkspaceDemo {
    private redis;
    private embeddingManager;
    private workspaceService;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    runDemo(): Promise<void>;
    private demoWorkspaceManagement;
    private demoRealTimeCollaboration;
    private demoKnowledgeManagement;
    private demoAccessControl;
}
export declare function runWorkspaceDemo(): Promise<void>;
//# sourceMappingURL=workspace-demo.d.ts.map