import { AIRequest } from '@/types';
export interface RequestAnalysis {
    complexity: 'low' | 'medium' | 'high';
    estimatedTokens: number;
    requiredCapabilities: string[];
    preferredModels: string[];
    urgency: 'low' | 'medium' | 'high';
    resourceRequirements: {
        memory: number;
        compute: number;
        bandwidth: number;
    };
    contextSize: number;
    expectedLatency: number;
    qualityRequirements: {
        accuracy: number;
        creativity: number;
        factuality: number;
    };
}
export interface RequestContext {
    userId: string;
    sessionId: string;
    conversationHistory: any[];
    userPreferences: any;
    workspaceId?: string;
    previousRequests: string[];
    timeConstraints?: {
        maxLatency: number;
        deadline?: Date;
    };
}
export declare class RequestAnalyzer {
    private complexityPatterns;
    private capabilityPatterns;
    private urgencyPatterns;
    constructor();
    analyzeRequest(request: AIRequest, context?: RequestContext): RequestAnalysis;
    private analyzeComplexity;
    private estimateTokens;
    private determineCapabilities;
    private analyzeUrgency;
    private calculateResourceRequirements;
    private calculateContextSize;
    private estimateLatency;
    private analyzeQualityRequirements;
    private getPreferredModels;
    private detectLanguages;
    private detectCodeLanguages;
    private detectDomains;
    private initializePatterns;
    private getDefaultAnalysis;
}
export declare function getRequestAnalyzer(): RequestAnalyzer;
export declare function createRequestAnalyzer(): RequestAnalyzer;
//# sourceMappingURL=request-analyzer.d.ts.map