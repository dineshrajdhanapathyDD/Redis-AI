import { ModelEndpoint, ModelPerformance, AIRequestType } from '@/types';
export interface ModelCapability {
    requestType: AIRequestType;
    maxTokens: number;
    supportedLanguages: string[];
    specializations: string[];
    qualityScore: number;
}
export interface ModelConstraints {
    maxConcurrentRequests: number;
    rateLimitPerMinute: number;
    maxRequestSize: number;
    requiredHeaders: string[];
    supportedFormats: string[];
}
export interface RegisteredModel {
    id: string;
    name: string;
    provider: string;
    endpoint: ModelEndpoint;
    capabilities: ModelCapability[];
    constraints: ModelConstraints;
    performance: ModelPerformance;
    isActive: boolean;
    priority: number;
    createdAt: Date;
    updatedAt: Date;
}
export declare class ModelRegistry {
    private models;
    private capabilityIndex;
    private providerIndex;
    registerModel(modelConfig: {
        id: string;
        name: string;
        provider: string;
        endpoint: ModelEndpoint;
        capabilities: ModelCapability[];
        constraints: ModelConstraints;
        priority?: number;
    }): void;
    unregisterModel(modelId: string): boolean;
    getModel(modelId: string): RegisteredModel | undefined;
    getAllModels(): RegisteredModel[];
    getActiveModels(): RegisteredModel[];
    getModelsForRequestType(requestType: AIRequestType): RegisteredModel[];
    getModelsByProvider(provider: string): RegisteredModel[];
    updateModelPerformance(modelId: string, performance: Partial<ModelPerformance>): void;
    setModelActive(modelId: string, isActive: boolean): void;
    findBestModelsForRequest(requestType: AIRequestType, requirements?: {
        maxLatency?: number;
        minAccuracy?: number;
        maxCost?: number;
        requiredCapabilities?: string[];
        excludeProviders?: string[];
    }): RegisteredModel[];
    private calculateModelScore;
    private updateIndices;
    private removeFromIndices;
    getRegistryStats(): {
        totalModels: number;
        activeModels: number;
        modelsByProvider: Record<string, number>;
        modelsByRequestType: Record<AIRequestType, number>;
        averagePerformance: {
            latency: number;
            accuracy: number;
            availability: number;
            errorRate: number;
        };
    };
    validateModelConfig(config: any): {
        isValid: boolean;
        errors: string[];
    };
}
export declare function getModelRegistry(): ModelRegistry;
export declare function createModelRegistry(): ModelRegistry;
//# sourceMappingURL=model-registry.d.ts.map