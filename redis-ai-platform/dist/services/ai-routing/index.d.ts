export { ModelRegistry, getModelRegistry, createModelRegistry } from './model-registry';
export { PerformanceMonitor, getPerformanceMonitor, createPerformanceMonitor } from './performance-monitor';
export { RequestAnalyzer, getRequestAnalyzer, createRequestAnalyzer } from './request-analyzer';
export { RoutingEngine, getRoutingEngine, createRoutingEngine } from './routing-engine';
import { AIRequest, AIRequestType, ModelEndpoint } from '@/types';
export interface AIRoutingConfig {
    enablePerformanceMonitoring: boolean;
    enableCircuitBreakers: boolean;
    enableLoadBalancing: boolean;
    enableCostOptimization: boolean;
    routingStrategy: 'performance' | 'cost' | 'quality' | 'balanced';
    fallbackBehavior: 'retry' | 'alternative' | 'queue' | 'fail';
    maxRetries: number;
    healthCheckInterval: number;
}
export declare class AIRoutingService {
    private modelRegistry;
    private performanceMonitor;
    private requestAnalyzer;
    private routingEngine;
    private config;
    private healthCheckTimer?;
    constructor(routingConfig?: Partial<AIRoutingConfig>);
    routeRequest(request: AIRequest, context?: any): Promise<{
        result: any;
        routing: {
            selectedModel: string;
            latency: number;
            cost: number;
            confidence: number;
            alternatives: string[];
        };
    }>;
    registerModel(modelConfig: {
        id: string;
        name: string;
        provider: string;
        endpoint: ModelEndpoint;
        capabilities: Array<{
            requestType: AIRequestType;
            maxTokens: number;
            supportedLanguages: string[];
            specializations: string[];
            qualityScore: number;
        }>;
        constraints: {
            maxConcurrentRequests: number;
            rateLimitPerMinute: number;
            maxRequestSize: number;
            requiredHeaders: string[];
            supportedFormats: string[];
        };
        priority?: number;
    }): Promise<void>;
    unregisterModel(modelId: string): Promise<boolean>;
    getModelHealth(modelId?: string): Promise<any>;
    getRoutingStats(): Promise<{
        totalRequests: number;
        successRate: number;
        averageLatency: number;
        modelUsage: Record<string, number>;
        healthStatus: any;
        registryStats: any;
    }>;
    updateConfiguration(newConfig: Partial<AIRoutingConfig>): void;
    private createEngineConfig;
    private initializeDefaultModels;
    private registerDefaultOpenAIModels;
    private registerDefaultAnthropicModels;
    private registerDefaultLocalModels;
    private startHealthMonitoring;
    cleanup(): Promise<void>;
}
export declare function createAIRoutingService(config?: Partial<AIRoutingConfig>): AIRoutingService;
export declare function createAIRequest(content: string, type: AIRequestType, options?: {
    id?: string;
    context?: any;
    preferences?: any;
    metadata?: any;
}): AIRequest;
export declare function validateAIRequest(request: AIRequest): {
    isValid: boolean;
    errors: string[];
};
//# sourceMappingURL=index.d.ts.map