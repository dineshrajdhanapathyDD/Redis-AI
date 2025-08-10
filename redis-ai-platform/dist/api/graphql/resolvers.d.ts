import { APIServices } from '../rest/index';
import { KnowledgeType } from '../../services/workspace';
export declare function createResolvers(services: APIServices): {
    Date: {
        serialize: (date: Date) => string;
        parseValue: (value: string) => Date;
        parseLiteral: (ast: any) => Date;
    };
    JSON: {
        serialize: (value: any) => any;
        parseValue: (value: any) => any;
        parseLiteral: (ast: any) => any;
    };
    Query: {
        search: (_: any, { input }: any) => Promise<{
            query: any;
            results: any;
            totalResults: any;
            searchTime: number;
        }>;
        searchSuggestions: (_: any, { query, limit }: any) => Promise<string[]>;
        workspace: (_: any, { id }: any) => Promise<any>;
        workspaces: (_: any, { userId }: any) => Promise<any>;
        workspaceKnowledge: (_: any, { workspaceId, query, limit }: any) => Promise<any>;
        workspaceInsights: (_: any, { workspaceId }: any) => Promise<any>;
        workspaceClusters: (_: any, { workspaceId, algorithm }: any) => Promise<any>;
        workspaceMetrics: (_: any, { workspaceId }: any) => Promise<any>;
        availableModels: (_: any, { capability, provider }: any) => Promise<any>;
        modelMetrics: (_: any, { modelId, timeframe }: any) => Promise<any>;
        routingAnalytics: (_: any, { timeframe }: any) => Promise<{
            timeframe: any;
            totalRequests: number;
            successfulRoutes: number;
            failedRoutes: number;
            averageRoutingTime: number;
            modelUsage: {
                'gpt-4': {
                    requests: number;
                    successRate: number;
                    avgLatency: number;
                };
                'claude-3': {
                    requests: number;
                    successRate: number;
                    avgLatency: number;
                };
                'local-llama': {
                    requests: number;
                    successRate: number;
                    avgLatency: number;
                };
            };
        }>;
        userPatterns: (_: any, { userId, timeframe, limit }: any) => Promise<import("../../services/learning").AnalysisResult>;
        recommendations: (_: any, { userId, context, limit }: any) => Promise<import("../../services/learning").PersonalizationRecommendation[]>;
        userPreferences: (_: any, { userId }: any) => Promise<any>;
        similarUsers: (_: any, { userId, threshold, limit }: any) => Promise<import("../../services/learning").SimilarUser[]>;
        analyzeCode: (_: any, { code, language, filePath, context }: any) => Promise<any>;
        searchCode: (_: any, { query, language, limit }: any) => Promise<any>;
        analyzeBrandConsistency: (_: any, { content, brandId, contentType, platform }: any) => Promise<import("../../services/content-consistency").BrandConsistencyReport>;
        systemMetrics: (_: any, { timeframe }: any) => Promise<any>;
        optimizationRecommendations: () => Promise<any>;
        anomalies: (_: any, { timeframe }: any) => Promise<any>;
        personalizationSuggestions: (_: any, { userId }: any) => Promise<any>;
        userInteractions: (_: any, { userId, limit }: any) => Promise<any>;
    };
    Mutation: {
        createWorkspace: (_: any, { input }: any) => Promise<import("../../services/workspace").Workspace>;
        joinWorkspace: (_: any, { workspaceId, userId, role }: any) => Promise<boolean>;
        leaveWorkspace: (_: any, { workspaceId, userId }: any) => Promise<boolean>;
        addKnowledge: (_: any, { workspaceId, input }: any) => Promise<any>;
        addKnowledgeRelationship: (_: any, { workspaceId, sourceId, targetId, relationship, strength }: any) => Promise<boolean>;
        updateWorkspaceSettings: (_: any, { workspaceId, settings }: any) => Promise<boolean>;
        routeAIRequest: (_: any, { input }: any) => Promise<any>;
        updateModel: (_: any, { modelId, updates }: any) => Promise<any>;
        testModelConnectivity: (_: any, { modelId, testPrompt }: any) => Promise<any>;
        trackBehavior: (_: any, { input }: any) => Promise<boolean>;
        updateUserPreferences: (_: any, { userId, preferences }: any) => Promise<boolean>;
        provideFeedback: (_: any, { userId, recommendationId, feedback, rating, context }: any) => Promise<boolean>;
        generateCode: (_: any, { prompt, language, context, style }: any) => Promise<any>;
        adaptContent: (_: any, { content, sourcePlatform, targetPlatform, brandId }: any) => Promise<import("../../services/content-consistency").AdaptationResult>;
        trackInteraction: (_: any, { input }: any) => Promise<boolean>;
        processAdaptationRequest: (_: any, { input }: any) => Promise<import("../../services/adaptive-ui").AdaptationResult>;
        exportUserData: (_: any, { userId, format }: any) => Promise<any>;
        deleteUserData: (_: any, { userId, confirm }: any) => Promise<boolean>;
    };
    Subscription: {
        workspaceUpdates: {
            subscribe: () => {
                [Symbol.asyncIterator]: () => AsyncGenerator<{
                    workspaceUpdates: {
                        type: string;
                        timestamp: number;
                    };
                }, never, unknown>;
            };
        };
        knowledgeAdded: {
            subscribe: () => {
                [Symbol.asyncIterator]: () => AsyncGenerator<{
                    knowledgeAdded: {
                        id: string;
                        type: KnowledgeType;
                        content: string;
                        createdAt: Date;
                        createdBy: string;
                    };
                }, never, unknown>;
            };
        };
        systemAlert: {
            subscribe: () => {
                [Symbol.asyncIterator]: () => AsyncGenerator<{
                    systemAlert: {
                        type: string;
                        message: string;
                        timestamp: number;
                    };
                }, never, unknown>;
            };
        };
    };
};
//# sourceMappingURL=resolvers.d.ts.map