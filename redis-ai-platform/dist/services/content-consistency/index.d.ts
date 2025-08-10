export { BrandAnalyzer } from './brand-analyzer';
export { ContentAdapter } from './content-adapter';
export { PerformanceTracker } from './performance-tracker';
export type { BrandProfile, ContentItem, BrandConsistencyReport, BrandViolation, ConsistencyScore, BrandRecommendation } from './brand-analyzer';
export type { Platform, AdaptationRequest, AdaptationResult, AdaptedContent } from './content-adapter';
export type { ContentPerformance, PerformanceReport, PerformanceInsight } from './performance-tracker';
import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { BrandAnalyzer } from './brand-analyzer';
import { ContentAdapter } from './content-adapter';
import { PerformanceTracker } from './performance-tracker';
export declare class ContentConsistencyService {
    readonly brandAnalyzer: BrandAnalyzer;
    readonly contentAdapter: ContentAdapter;
    readonly performanceTracker: PerformanceTracker;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private setupDefaultPlatforms;
    private setupPerformanceTracking;
    private savePendingData;
}
//# sourceMappingURL=index.d.ts.map