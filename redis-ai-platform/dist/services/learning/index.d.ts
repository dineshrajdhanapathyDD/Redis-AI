export * from './behavior-tracker';
export * from './pattern-analyzer';
export * from './personalization-engine';
import { Redis } from 'ioredis';
import { BehaviorTracker } from './behavior-tracker';
import { PatternAnalyzer } from './pattern-analyzer';
import { PersonalizationEngine } from './personalization-engine';
export declare class LearningService {
    readonly behaviorTracker: BehaviorTracker;
    readonly patternAnalyzer: PatternAnalyzer;
    readonly personalizationEngine: PersonalizationEngine;
    constructor(redis: Redis);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private setupRedisStructures;
    private startBackgroundProcesses;
    private stopBackgroundProcesses;
    private runPatternAnalysisJob;
    private runModelUpdateJob;
    private getActiveUsers;
}
//# sourceMappingURL=index.d.ts.map