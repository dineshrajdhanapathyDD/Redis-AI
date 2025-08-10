import { ContentType, CrossModalMatch, VectorEmbedding } from '@/types';
export interface CrossModalConfig {
    enableTextToCode: boolean;
    enableTextToImage: boolean;
    enableCodeToText: boolean;
    enableImageToText: boolean;
    enableAudioToText: boolean;
    similarityThreshold: number;
    maxMatchesPerType: number;
    useSemanticBridging: boolean;
}
export interface CrossModalRelationship {
    sourceId: string;
    sourceType: ContentType;
    targetId: string;
    targetType: ContentType;
    relationshipType: CrossModalRelationshipType;
    confidence: number;
    semanticDistance: number;
    contextualRelevance: number;
}
export declare enum CrossModalRelationshipType {
    SEMANTIC_SIMILARITY = "semantic_similarity",
    CONCEPTUAL_RELATION = "conceptual_relation",
    IMPLEMENTATION_OF = "implementation_of",
    DOCUMENTATION_OF = "documentation_of",
    EXAMPLE_OF = "example_of",
    VISUALIZATION_OF = "visualization_of",
    EXPLANATION_OF = "explanation_of",
    COMPLEMENT_TO = "complement_to"
}
declare class CrossModalMatcher {
    private config;
    private vectorStorage;
    private relationshipCache;
    private cacheTimeout;
    constructor(config: CrossModalConfig);
    findCrossModalMatches(sourceEmbedding: VectorEmbedding, targetModalities: ContentType[]): Promise<CrossModalMatch[]>;
    private findModalityMatches;
    private findSemanticBridgeMatches;
    private determineRelationshipType;
    private calculateContextualRelevance;
    private isModalityPairEnabled;
    private generateCacheKey;
    private getCachedMatches;
    private cacheRelationships;
    private cleanupCache;
    private convertRelationshipsToMatches;
    private convertMatchesToRelationships;
    buildCrossModalIndex(): Promise<void>;
    getRelationshipStats(): Promise<{
        totalRelationships: number;
        relationshipsByType: Record<CrossModalRelationshipType, number>;
        modalityPairs: Record<string, number>;
        averageConfidence: number;
    }>;
    clearCache(): void;
    updateConfig(newConfig: Partial<CrossModalConfig>): void;
}
export declare function createCrossModalMatcher(config?: Partial<CrossModalConfig>): CrossModalMatcher;
export {};
//# sourceMappingURL=cross-modal-matcher.d.ts.map