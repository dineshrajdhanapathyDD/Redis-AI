import { Express } from 'express';
import { Redis } from 'ioredis';
import { EmbeddingManager } from '../../services/embedding-manager';
import { VectorStorage } from '../../services/vector-storage';
import { MultiModalSearch } from '../../services/search';
import { WorkspaceService } from '../../services/workspace';
import { AIRoutingService } from '../../services/ai-routing';
import { LearningService } from '../../services/learning';
import { CodeIntelligenceService } from '../../services/code-intelligence';
import { ContentConsistencyService } from '../../services/content-consistency';
import { OptimizationService } from '../../services/optimization';
import { AdaptiveUIService } from '../../services/adaptive-ui';
export interface APIServices {
    embeddingManager: EmbeddingManager;
    vectorStorage: VectorStorage;
    multiModalSearch: MultiModalSearch;
    workspaceService: WorkspaceService;
    aiRoutingService: AIRoutingService;
    learningService: LearningService;
    codeIntelligenceService: CodeIntelligenceService;
    contentConsistencyService: ContentConsistencyService;
    optimizationService: OptimizationService;
    adaptiveUIService: AdaptiveUIService;
}
export interface APIConfig {
    port: number;
    corsOrigins: string[];
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    enableHelmet: boolean;
    enableLogging: boolean;
}
export declare class RestAPI {
    private app;
    private redis;
    private services;
    private config;
    constructor(redis: Redis, services: APIServices, config: APIConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupErrorHandling;
    getApp(): Express;
    start(): Promise<void>;
}
export declare const defaultAPIConfig: APIConfig;
//# sourceMappingURL=index.d.ts.map