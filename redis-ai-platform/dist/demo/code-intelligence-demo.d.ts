import { Redis } from 'ioredis';
import { EmbeddingManager } from '../services/embedding-manager';
export declare class CodeIntelligenceDemo {
    private redis;
    private embeddingManager;
    private codeIntelligenceService;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    runDemo(): Promise<void>;
    private demoCodeAnalysis;
    private demoCodeGeneration;
    private demoCodeSimilaritySearch;
    private demoQualityAnalysis;
    private demoCodeSuggestions;
    private getGradeDescription;
}
export declare function runCodeIntelligenceDemo(): Promise<void>;
//# sourceMappingURL=code-intelligence-demo.d.ts.map