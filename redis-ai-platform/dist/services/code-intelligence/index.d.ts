export * from './code-analyzer';
export * from './code-generator';
export * from './quality-analyzer';
import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { CodeAnalyzer } from './code-analyzer';
import { CodeGenerator } from './code-generator';
import { QualityAnalyzer } from './quality-analyzer';
export declare class CodeIntelligenceService {
    readonly analyzer: CodeAnalyzer;
    readonly generator: CodeGenerator;
    readonly qualityAnalyzer: QualityAnalyzer;
    constructor(redis: Redis, embeddingManager: EmbeddingManager);
    initialize(): Promise<void>;
    shutdown(): Promise<void>;
    private setupCodeIndices;
    private loadCodePatterns;
    private savePendingResults;
}
//# sourceMappingURL=index.d.ts.map