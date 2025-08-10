import { Redis } from 'ioredis';
export declare class LearningDemo {
    private redis;
    private learningService;
    constructor(redis: Redis);
    runDemo(): Promise<void>;
    private demoBehaviorTracking;
    private demoPatternAnalysis;
    private demoPersonalizedRecommendations;
    private demoInterfaceAdaptation;
    private demoCollaborativeFiltering;
    private simulateExtendedBehavior;
    private simulateOtherUsers;
}
export declare function runLearningDemo(): Promise<void>;
//# sourceMappingURL=learning-demo.d.ts.map