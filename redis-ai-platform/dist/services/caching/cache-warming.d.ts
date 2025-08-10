import { AIRequestType } from '@/types';
export interface CacheWarmingConfig {
    enablePredictiveWarming: boolean;
    enablePatternBasedWarming: boolean;
    enableScheduledWarming: boolean;
    warmingBatchSize: number;
    warmingInterval: number;
    maxWarmingQueries: number;
    popularityThreshold: number;
}
export interface WarmingQuery {
    query: string;
    type: AIRequestType;
    model?: string;
    priority: number;
    frequ: any;
}
//# sourceMappingURL=cache-warming.d.ts.map