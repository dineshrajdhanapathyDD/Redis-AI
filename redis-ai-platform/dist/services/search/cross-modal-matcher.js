"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrossModalRelationshipType = void 0;
exports.createCrossModalMatcher = createCrossModalMatcher;
const vector_storage_1 = require("../vector-storage");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
var CrossModalRelationshipType;
(function (CrossModalRelationshipType) {
    CrossModalRelationshipType["SEMANTIC_SIMILARITY"] = "semantic_similarity";
    CrossModalRelationshipType["CONCEPTUAL_RELATION"] = "conceptual_relation";
    CrossModalRelationshipType["IMPLEMENTATION_OF"] = "implementation_of";
    CrossModalRelationshipType["DOCUMENTATION_OF"] = "documentation_of";
    CrossModalRelationshipType["EXAMPLE_OF"] = "example_of";
    CrossModalRelationshipType["VISUALIZATION_OF"] = "visualization_of";
    CrossModalRelationshipType["EXPLANATION_OF"] = "explanation_of";
    CrossModalRelationshipType["COMPLEMENT_TO"] = "complement_to";
})(CrossModalRelationshipType || (exports.CrossModalRelationshipType = CrossModalRelationshipType = {}));
expor;
t;
class CrossModalMatcher {
    config;
    vectorStorage = new vector_storage_1.VectorStorageService();
    relationshipCache = new Map();
    cacheTimeout = 10 * 60 * 1000; // 10 minutes
    constructor(config) {
        this.config = config;
    }
    async findCrossModalMatches(sourceEmbedding, targetModalities) {
        try {
            const matches = [];
            // Check cache first
            const cacheKey = this.generateCacheKey(sourceEmbedding.id, targetModalities);
            const cachedMatches = this.getCachedMatches(cacheKey);
            if (cachedMatches) {
                logger_1.default.debug('Cross-modal matches cache hit', {
                    sourceId: sourceEmbedding.id,
                    sourceType: sourceEmbedding.contentType,
                    targetModalities,
                });
                return this.convertRelationshipsToMatches(cachedMatches);
            }
            // Find matches for each target modality
            for (const targetModality of targetModalities) {
                if (!this.isModalityPairEnabled(sourceEmbedding.contentType, targetModality)) {
                    continue;
                }
                const modalityMatches = await this.findModalityMatches(sourceEmbedding, targetModality);
                matches.push(...modalityMatches);
            }
            // Sort by confidence and limit results
            matches.sort((a, b) => b.score - a.score);
            const limitedMatches = matches.slice(0, this.config.maxMatchesPerType * targetModalities.length);
            // Cache the relationships
            const relationships = await this.convertMatchesToRelationships(sourceEmbedding, limitedMatches);
            this.cacheRelationships(cacheKey, relationships);
            logger_1.default.debug('Cross-modal matches found', {
                sourceId: sourceEmbedding.id,
                sourceType: sourceEmbedding.contentType,
                targetModalities,
                matchesFound: limitedMatches.length,
            });
            return limitedMatches;
        }
        catch (error) {
            logger_1.default.error('Failed to find cross-modal matches', {
                sourceId: sourceEmbedding.id,
                sourceType: sourceEmbedding.contentType,
                targetModalities,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
    async findModalityMatches(sourceEmbedding, targetModality) {
        const matches = [];
        try {
            // Direct vector similarity search
            const similarResults = await this.vectorStorage.searchByContentType(sourceEmbedding.vector, targetModality, {
                limit: this.config.maxMatchesPerType * 2, // Get more for filtering
                threshold: this.config.similarityThreshold,
                includeMetadata: true,
                includeVectors: false,
            });
            for (const result of similarResults) {
                const relationshipType = this.determineRelationshipType(sourceEmbedding.contentType, targetModality, result.metadata);
                const contextualRelevance = this.calculateContextualRelevance(sourceEmbedding, result.metadata);
                // Apply contextual filtering
                if (contextualRelevance > 0.3) {
                    matches.push({
                        contentId: result.id,
                        type: targetModality,
                        score: result.score * contextualRelevance, // Adjust score by context
                        relationship: relationshipType,
                    });
                }
            }
            // Apply semantic bridging if enabled
            if (this.config.useSemanticBridging && matches.length < this.config.maxMatchesPerType) {
                const bridgedMatches = await this.findSemanticBridgeMatches(sourceEmbedding, targetModality);
                matches.push(...bridgedMatches);
            }
        }
        catch (error) {
            logger_1.default.warn('Failed to find matches for modality', {
                sourceType: sourceEmbedding.contentType,
                targetModality,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        return matches.slice(0, this.config.maxMatchesPerType);
    }
    async findSemanticBridgeMatches(sourceEmbedding, targetModality) {
        // Semantic bridging: find intermediate content that connects source to target
        const bridgeMatches = [];
        try {
            // Find intermediate content (usually text) that's similar to source
            const intermediateResults = await this.vectorStorage.searchByContentType(sourceEmbedding.vector, types_1.ContentType.TEXT, // Use text as bridge
            {
                limit: 5,
                threshold: 0.6,
                includeMetadata: true,
                includeVectors: true,
            });
            // For each intermediate result, find similar content in target modality
            for (const intermediate of intermediateResults) {
                if (intermediate.embedding) {
                    const targetResults = await this.vectorStorage.searchByContentType(intermediate.embedding.vector, targetModality, {
                        limit: 2,
                        threshold: 0.5,
                        includeMetadata: true,
                    });
                    for (const target of targetResults) {
                        // Calculate bridged confidence
                        const bridgedConfidence = intermediate.score * target.score * 0.8; // Penalty for bridging
                        if (bridgedConfidence > this.config.similarityThreshold) {
                            bridgeMatches.push({
                                contentId: target.id,
                                type: targetModality,
                                score: bridgedConfidence,
                                relationship: 'semantic_similarity',
                            });
                        }
                    }
                }
            }
        }
        catch (error) {
            logger_1.default.debug('Semantic bridging failed', {
                sourceType: sourceEmbedding.contentType,
                targetModality,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
        return bridgeMatches;
    }
    determineRelationshipType(sourceType, targetType, targetMetadata) {
        // Determine the type of relationship based on content types and metadata
        const typeKey = `${sourceType}->${targetType}`;
        const relationshipMap = {
            [`${types_1.ContentType.TEXT}->${types_1.ContentType.CODE}`]: CrossModalRelationshipType.IMPLEMENTATION_OF,
            [`${types_1.ContentType.CODE}->${types_1.ContentType.TEXT}`]: CrossModalRelationshipType.DOCUMENTATION_OF,
            [`${types_1.ContentType.TEXT}->${types_1.ContentType.IMAGE}`]: CrossModalRelationshipType.VISUALIZATION_OF,
            [`${types_1.ContentType.IMAGE}->${types_1.ContentType.TEXT}`]: CrossModalRelationshipType.EXPLANATION_OF,
            [`${types_1.ContentType.CODE}->${types_1.ContentType.IMAGE}`]: CrossModalRelationshipType.VISUALIZATION_OF,
            [`${types_1.ContentType.AUDIO}->${types_1.ContentType.TEXT}`]: CrossModalRelationshipType.EXPLANATION_OF,
        };
        // Check for specific relationship indicators in metadata
        if (targetMetadata?.tags) {
            const tags = targetMetadata.tags.map((tag) => tag.toLowerCase());
            if (tags.includes('example') || tags.includes('demo')) {
                return CrossModalRelationshipType.EXAMPLE_OF;
            }
            if (tags.includes('documentation') || tags.includes('guide')) {
                return CrossModalRelationshipType.DOCUMENTATION_OF;
            }
            if (tags.includes('implementation') || tags.includes('code')) {
                return CrossModalRelationshipType.IMPLEMENTATION_OF;
            }
        }
        return relationshipMap[typeKey] || CrossModalRelationshipType.SEMANTIC_SIMILARITY;
    }
    calculateContextualRelevance(sourceEmbedding, targetMetadata) {
        let relevance = 0.5; // Base relevance
        // Tag overlap
        if (sourceEmbedding.metadata.tags && targetMetadata?.tags) {
            const sourceTags = sourceEmbedding.metadata.tags.map((tag) => tag.toLowerCase());
            const targetTags = targetMetadata.tags.map((tag) => tag.toLowerCase());
            const commonTags = sourceTags.filter((tag) => targetTags.includes(tag));
            const tagRelevance = commonTags.length / Math.max(sourceTags.length, targetTags.length);
            relevance += tagRelevance * 0.3;
        }
        // Source similarity
        if (sourceEmbedding.metadata.source && targetMetadata?.source) {
            const sourceParts = sourceEmbedding.metadata.source.toLowerCase().split(/[\/\-_\.]/);
            const targetParts = targetMetadata.source.toLowerCase().split(/[\/\-_\.]/);
            const commonParts = sourceParts.filter((part) => targetParts.includes(part));
            const sourceRelevance = commonParts.length / Math.max(sourceParts.length, targetParts.length);
            relevance += sourceRelevance * 0.2;
        }
        // Temporal relevance (if timestamps are available)
        if (sourceEmbedding.createdAt && targetMetadata?.timestamp) {
            const timeDiff = Math.abs(sourceEmbedding.createdAt.getTime() - new Date(targetMetadata.timestamp).getTime());
            const daysDiff = timeDiff / (24 * 60 * 60 * 1000);
            // Higher relevance for content created around the same time
            const temporalRelevance = Math.max(0, 1 - daysDiff / 30); // Decay over 30 days
            relevance += temporalRelevance * 0.1;
        }
        return Math.min(relevance, 1.0);
    }
    isModalityPairEnabled(sourceType, targetType) {
        const pairKey = `${sourceType}->${targetType}`;
        const enabledPairs = {
            [`${types_1.ContentType.TEXT}->${types_1.ContentType.CODE}`]: this.config.enableTextToCode,
            [`${types_1.ContentType.TEXT}->${types_1.ContentType.IMAGE}`]: this.config.enableTextToImage,
            [`${types_1.ContentType.CODE}->${types_1.ContentType.TEXT}`]: this.config.enableCodeToText,
            [`${types_1.ContentType.IMAGE}->${types_1.ContentType.TEXT}`]: this.config.enableImageToText,
            [`${types_1.ContentType.AUDIO}->${types_1.ContentType.TEXT}`]: this.config.enableAudioToText,
        };
        return enabledPairs[pairKey] ?? true; // Default to enabled
    }
    generateCacheKey(sourceId, targetModalities) {
        return `${sourceId}:${targetModalities.sort().join(',')}`;
    }
    getCachedMatches(cacheKey) {
        const cached = this.relationshipCache.get(cacheKey);
        if (cached && Date.now() - cached[0]?.contextualRelevance < this.cacheTimeout) {
            return cached;
        }
        if (cached) {
            this.relationshipCache.delete(cacheKey);
        }
        return null;
    }
    cacheRelationships(cacheKey, relationships) {
        this.relationshipCache.set(cacheKey, relationships);
        // Clean up old cache entries
        if (this.relationshipCache.size > 1000) {
            this.cleanupCache();
        }
    }
    cleanupCache() {
        const now = Date.now();
        for (const [key, relationships] of this.relationshipCache.entries()) {
            if (relationships.length > 0 && now - relationships[0].contextualRelevance > this.cacheTimeout) {
                this.relationshipCache.delete(key);
            }
        }
    }
    convertRelationshipsToMatches(relationships) {
        return relationships.map(rel => ({
            contentId: rel.targetId,
            type: rel.targetType,
            score: rel.confidence,
            relationship: rel.relationshipType,
        }));
    }
    async convertMatchesToRelationships(sourceEmbedding, matches) {
        return matches.map(match => ({
            sourceId: sourceEmbedding.id,
            sourceType: sourceEmbedding.contentType,
            targetId: match.contentId,
            targetType: match.type,
            relationshipType: match.relationship,
            confidence: match.score,
            semanticDistance: 1 - match.score, // Inverse of similarity
            contextualRelevance: Date.now(), // Using timestamp as placeholder
        }));
    }
    // Public methods for managing cross-modal relationships
    async buildCrossModalIndex() {
        logger_1.default.info('Building cross-modal relationship index');
        try {
            const stats = await this.vectorStorage.getStorageStats();
            let processedCount = 0;
            // Process each content type
            for (const [contentType, count] of Object.entries(stats.embeddingsByType)) {
                if (count === 0)
                    continue;
                logger_1.default.info(`Processing ${count} ${contentType} embeddings for cross-modal relationships`);
                // This would be implemented with batch processing in a real system
                // For now, we'll just log the intent
                processedCount += count;
            }
            logger_1.default.info('Cross-modal index building completed', {
                totalProcessed: processedCount,
                relationshipsFound: this.relationshipCache.size,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to build cross-modal index', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getRelationshipStats() {
        const stats = {
            totalRelationships: 0,
            relationshipsByType: {},
            modalityPairs: {},
            averageConfidence: 0,
        };
        let totalConfidence = 0;
        for (const relationships of this.relationshipCache.values()) {
            for (const rel of relationships) {
                stats.totalRelationships++;
                totalConfidence += rel.confidence;
                // Count by relationship type
                stats.relationshipsByType[rel.relationshipType] =
                    (stats.relationshipsByType[rel.relationshipType] || 0) + 1;
                // Count by modality pair
                const pairKey = `${rel.sourceType}->${rel.targetType}`;
                stats.modalityPairs[pairKey] = (stats.modalityPairs[pairKey] || 0) + 1;
            }
        }
        stats.averageConfidence = stats.totalRelationships > 0
            ? totalConfidence / stats.totalRelationships
            : 0;
        return stats;
    }
    clearCache() {
        this.relationshipCache.clear();
        logger_1.default.info('Cross-modal relationship cache cleared');
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        logger_1.default.info('Cross-modal matcher configuration updated', { config: this.config });
    }
}
// Factory function to create cross-modal matcher with default config
function createCrossModalMatcher(config) {
    const defaultConfig = {
        enableTextToCode: true,
        enableTextToImage: true,
        enableCodeToText: true,
        enableImageToText: true,
        enableAudioToText: true,
        similarityThreshold: 0.4,
        maxMatchesPerType: 5,
        useSemanticBridging: true,
    };
    return new CrossModalMatcher({ ...defaultConfig, ...config });
}
//# sourceMappingURL=cross-modal-matcher.js.map