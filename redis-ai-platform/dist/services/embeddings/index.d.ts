export { BaseEmbeddingProvider, EmbeddingService } from './base';
export { OpenAIEmbeddingProvider } from './openai';
export { HuggingFaceEmbeddingProvider } from './huggingface';
export { LocalEmbeddingProvider } from './local';
import { EmbeddingService } from './base';
import { ContentType } from '@/types';
export declare function createEmbeddingService(): EmbeddingService;
export declare function createContent(id: string, type: ContentType, data: string | Buffer, metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    source?: string;
    language?: string;
    format?: string;
}): {
    id: string;
    type: ContentType;
    data: string | Buffer<ArrayBufferLike>;
    metadata: {
        title: string | undefined;
        description: string | undefined;
        tags: string[];
        source: string;
        language: string | undefined;
        format: string | undefined;
    };
};
export declare function validateEmbeddingDimensions(embedding: number[], expectedDimensions: number): boolean;
export declare function cosineSimilarity(a: number[], b: number[]): number;
export declare function normalizeEmbedding(embedding: number[]): number[];
//# sourceMappingURL=index.d.ts.map