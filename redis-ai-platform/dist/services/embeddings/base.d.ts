import { ContentType, VectorEmbedding, Content } from '@/types';
export interface EmbeddingProvider {
    generateEmbedding(content: Content): Promise<number[]>;
    getDimensions(): number;
    getModel(): string;
    getSupportedTypes(): ContentType[];
}
export interface EmbeddingConfig {
    provider: string;
    model: string;
    dimensions: number;
    apiKey?: string;
    endpoint?: string;
    maxTokens?: number;
    batchSize?: number;
}
export declare abstract class BaseEmbeddingProvider implements EmbeddingProvider {
    protected config: EmbeddingConfig;
    protected supportedTypes: ContentType[];
    constructor(config: EmbeddingConfig, supportedTypes: ContentType[]);
    abstract generateEmbedding(content: Content): Promise<number[]>;
    getDimensions(): number;
    getModel(): string;
    getSupportedTypes(): ContentType[];
    protected validateContent(content: Content): void;
    protected measurePerformance<T>(operation: () => Promise<T>, operationName: string, contentType: ContentType): Promise<T>;
}
export declare class EmbeddingService {
    private providers;
    private defaultProvider?;
    registerProvider(contentType: ContentType, provider: EmbeddingProvider): void;
    setDefaultProvider(provider: EmbeddingProvider): void;
    generateEmbedding(content: Content): Promise<VectorEmbedding>;
    generateBatchEmbeddings(contents: Content[]): Promise<VectorEmbedding[]>;
    getAvailableProviders(): Array<{
        contentType: ContentType;
        provider: string;
        model: string;
    }>;
    validateEmbedding(embedding: VectorEmbedding): Promise<boolean>;
}
//# sourceMappingURL=base.d.ts.map