import { Content, VectorEmbedding, ContentType, SearchQuery, SearchResult } from '@/types';
export declare class EmbeddingManager {
    private embeddingService;
    private vectorStorage;
    private config;
    constructor(managerConfig?: Partial<EmbeddingManagerConfig>);
    private initializeProviders;
    processContent(content: Content): Promise<VectorEmbedding>;
    processBatchContent(contents: Content[]): Promise<VectorEmbedding[]>;
    searchSimilarContent(query: SearchQuery, queryEmbedding?: number[]): Promise<SearchResult[]>;
    findSimilarEmbeddings(embeddingId: string, limit?: number, threshold?: number): Promise<VectorEmbedding[]>;
    updateEmbeddingRelationships(embeddingId: string): Promise<void>;
    getEmbeddingStats(): Promise<{
        totalEmbeddings: number;
        embeddingsByType: Record<ContentType, number>;
        averageDimensions: number;
        providers: Array<{
            contentType: ContentType;
            provider: string;
            model: string;
        }>;
    }>;
    private findCrossModalRelationships;
    private findCrossModalMatches;
}
export declare function createEmbeddingManager(config?: Partial<EmbeddingManagerConfig>): EmbeddingManager;
export declare function getEmbeddingManager(): EmbeddingManager;
//# sourceMappingURL=embedding-manager.d.ts.map