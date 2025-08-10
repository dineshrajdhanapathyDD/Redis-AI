import { BaseEmbeddingProvider, EmbeddingConfig } from './base';
import { Content } from '@/types';
export declare class LocalEmbeddingProvider extends BaseEmbeddingProvider {
    private vocabulary;
    private idfScores;
    private documentCount;
    constructor(config: EmbeddingConfig);
    generateEmbedding(content: Content): Promise<number[]>;
    private preprocessContent;
    private generateTFIDFEmbedding;
    private updateVocabulary;
    private normalizeVector;
    private initializeVocabulary;
    getVocabularyStats(): {
        size: number;
        documentCount: number;
        topWords: string[];
    };
    exportVocabulary(): {
        vocabulary: [string, number][];
        idfScores: [string, number][];
        documentCount: number;
    };
    importVocabulary(data: {
        vocabulary: [string, number][];
        idfScores: [string, number][];
        documentCount: number;
    }): void;
}
//# sourceMappingURL=local.d.ts.map