import { VectorEmbedding, ContentType } from '@/types';
export interface VectorSearchOptions {
    limit?: number;
    threshold?: number;
    includeMetadata?: boolean;
    includeVectors?: boolean;
}
export interface VectorSearchResult {
    id: string;
    score: number;
    embedding?: VectorEmbedding;
    metadata?: any;
}
export declare class VectorStorageService {
    private redisManager;
    private indexPrefix;
    constructor(indexPrefix?: string);
    storeEmbedding(embedding: VectorEmbedding): Promise<void>;
    storeBatchEmbeddings(embeddings: VectorEmbedding[]): Promise<void>;
    getEmbedding(embeddingId: string): Promise<VectorEmbedding | null>;
    deleteEmbedding(embeddingId: string): Promise<boolean>;
    searchSimilarVectors(queryVector: number[], options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
    searchByContentType(queryVector: number[], contentType: ContentType, options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
    getEmbeddingsByContentId(contentId: string): Promise<VectorEmbedding[]>;
    updateEmbeddingRelationships(embeddingId: string, relationships: VectorEmbedding['relationships']): Promise<void>;
    getStorageStats(): Promise<{
        totalEmbeddings: number;
        embeddingsByType: Record<ContentType, number>;
        indexInfo: any;
    }>;
    private getEmbeddingKey;
    private parseEmbeddingDocument;
}
//# sourceMappingURL=vector-storage.d.ts.map