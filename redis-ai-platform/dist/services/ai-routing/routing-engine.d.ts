import { RegisteredModel } from './model-registry';
import { RequestContext } from './request-analyzer';
import { AIRequest } from '@/types';
export interface RoutingDecision {
    selectedModel: RegisteredModel;
    alternativeModels: RegisteredModel[];
    confidence: number;
    reasoning: string[];
    estimatedLatency: number;
    estimatedCost: number;
    fallbackStrategy: 'retry' | 'alternative' | 'queue';
}
export interface RoutingConfig {
    enableLoadBalancing: boolean;
    enableFailover: boolean;
    maxRetries: number;
    retryDelay: number;
    costOptimization: boolean;
    latencyOptimization: boolean;
    qualityOptimization: boolean;
    weights: {
        performance: number;
        cost: number;
        quality: number;
        availability: number;
    };
}
export interface RoutingMetrics {
    totalRequests: number;
    successfulRoutes: number;
    failedRoutes: number;
    averageDecisionTime: number;
    modelUsageDistribution: Record<string, number>;
    fallbackUsage: Record<string, number>;
}
export declare class RoutingEngine {
    private modelRegistry;
    private performanceMonitor;
    private requestAnalyzer;
    private config;
    private metrics;
    private circuitBreakers;
    constructor(config?: Partial<RoutingConfig>);
    route(request: AIRequest, context?: RequestContext): Promise<RoutingDecision>;
    executeRequest(request: AIRequest, decision: RoutingDecision, context?: RequestContext): Promise<any>;
    private getCandidateModels;
    private scoreModels;
    private calculateModelScore;
    private calculatePerformanceScore;
    private calculateCostScore;
    private calculateQualityScore;
    private applyLoadBalancing;
    private createRoutingDecision;
    private calculateConfidence;
    private generateReasoning;
    private determineFallbackStrategy;
    private estimateRequestCost;
    private getCircuitBreaker;
    private callModelAPI;
    private recordMetric;
    private calculateCost;
    private estimateAccuracy;
    private updateMetrics;
    getMetrics(): RoutingMetrics;
    updateConfig(newConfig: Partial<RoutingConfig>): void;
    getHealthStatus(): Promise<{
        isHealthy: boolean;
        activeModels: number;
        circuitBreakersOpen: number;
        averageResponseTime: number;
        successRate: number;
    }>;
}
export declare function getRoutingEngine(): RoutingEngine;
export declare function createRoutingEngine(config?: Partial<RoutingConfig>): RoutingEngine;
//# sourceMappingURL=routing-engine.d.ts.map