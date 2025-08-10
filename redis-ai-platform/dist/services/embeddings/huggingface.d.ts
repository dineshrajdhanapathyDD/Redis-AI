import { BaseEmbeddingProvider, EmbeddingConfig } from './base';
import { Content } from '@/types';
export declare class HuggingFaceEmbeddingProvider extends BaseEmbeddingProvider {
    private apiKey;
    private baseUrl;
    constructor(config: EmbeddingConfig);
    generateEmbedding(content: Content): Promise<number[]>;
    private preparePayload;
    private preprocessText;
    private preprocessImage;
    private normalizeVector;
    generateBatchEmbeddings(contents: Content[]): Promise<number[][]>;
    checkModelAvailability(): Promise<boolean>;
}
//# sourceMappingURL=huggingface.d.ts.map