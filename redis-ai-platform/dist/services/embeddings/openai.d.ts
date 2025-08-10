import { BaseEmbeddingProvider, EmbeddingConfig } from './base';
import { Content } from '@/types';
export declare class OpenAIEmbeddingProvider extends BaseEmbeddingProvider {
    private apiKey;
    private baseUrl;
    constructor(config: EmbeddingConfig);
    generateEmbedding(content: Content): Promise<number[]>;
    private preprocessContent;
    private preprocessText;
    private preprocessCode;
    generateBatchEmbeddings(contents: Content[]): Promise<number[][]>;
}
//# sourceMappingURL=openai.d.ts.map