"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingManager = void 0;
exports.createEmbeddingManager = createEmbeddingManager;
exports.getEmbeddingManager = getEmbeddingManager;
const base_1 = require("./embeddings/base");
const vector_storage_1 = require("./vector-storage");
const openai_1 = require("./embeddings/openai");
const huggingface_1 = require("./embeddings/huggingface");
const local_1 = require("./embeddings/local");
const types_1 = require("@/types");
const environment_1 = __importDefault(require("@/config/environment"));
const logger_1 = __importDefault(require("@/utils/logger"));
 in
    terface;
EmbeddingManagerConfig;
{
    primaryProvider: string;
    fallbackProviders: string[];
    enableCrossModal: boolean;
    batchSize: number;
    cacheResults: boolean;
}
class EmbeddingManager {
    embeddingService;
    vectorStorage;
    config;
    constructor(managerConfig) {
        this.config = {
            primaryProvider: environment_1.default.embedding.service,
            fallbackProviders: ['openai', 'huggingface'],
            enableCrossModal: true,
            batchSize: 50,
            cacheResults: true,
            ...managerConfig,
        };
        this.embeddingService = new base_1.EmbeddingService();
        this.vectorStorage = new vector_storage_1.VectorStorageService();
        this.initializeProviders();
    }
    initializeProviders() {
        try {
            // Initialize OpenAI provider
            if (environment_1.default.ai.openaiApiKey) {
                const openaiProvider = new openai_1.OpenAIEmbeddingProvider({
                    provider: 'openai',
                    model: environment_1.default.embedding.model,
                    dimensions: environment_1.default.embedding.dimensions,
                    apiKey: environment_1.default.ai.openaiApiKey,
                    maxTokens: 8000,
                    batchSize: 100,
                });
                this.embeddingService.registerProvider(types_1.ContentType.TEXT, openaiProvider);
                this.embeddingService.registerProvider(types_1.ContentType.CODE, openaiProvider);
                if (this.config.primaryProvider === 'openai') {
                    this.embeddingService.setDefaultProvider(openaiProvider);
                }
            }
            // Initialize Hugging Face provider
            if (environment_1.default.ai.huggingfaceApiKey) {
                const hfProvider = new huggingface_1.HuggingFaceEmbeddingProvider({
                    provider: 'huggingface',
                    model: 'sentence-transformers/all-MiniLM-L6-v2',
                    dimensions: 384,
                    apiKey: environment_1.default.ai.huggingfaceApiKey,
                    batchSize: 32,
                });
                this.embeddingService.registerProvider(types_1.ContentType.TEXT, hfProvider);
                if (this.config.primaryProvider === 'huggingface') {
                    this.embeddingService.setDefaultProvider(hfProvider);
                }
            }
            // Initialize Local provider as fallback
            const localProvider = new local_1.LocalEmbeddingProvider({
                provider: 'local',
                model: 'sentence-transformers/all-MiniLM-L6-v2',
                dimensions: 384,
            });
            // Register local provider for all types as fallback
            if (!environment_1.default.ai.openaiApiKey && !environment_1.default.ai.huggingfaceApiKey) {
                this.embeddingService.setDefaultProvider(localProvider);
            }
            logger_1.default.info('Embedding providers initialized', {
                providers: this.embeddingService.getAvailableProviders(),
                primaryProvider: this.config.primaryProvider,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to initialize embedding providers', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async processContent(content) {
        try {
            // Generate embedding
            const embedding = await this.embeddingService.generateEmbedding(content);
            // Validate embedding
            const isValid = await this.embeddingService.validateEmbedding(embedding);
            if (!isValid) {
                throw new Error('Generated embedding failed validation');
            }
            // Store embedding
            await this.vectorStorage.storeEmbedding(embedding);
            // Find and store cross-modal relationships if enabled
            if (this.config.enableCrossModal) {
                await this.findCrossModalRelationships(embedding);
            }
            logger_1.default.info('Content processed successfully', {
                contentId: content.id,
                contentType: content.type,
                embeddingId: embedding.id,
                dimensions: embedding.vector.length,
            });
            return embedding;
        }
        catch (error) {
            logger_1.default.error('Failed to process content', {
                contentId: content.id,
                contentType: content.type,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async processBatchContent(contents) {
        try {
            const results = [];
            const batchSize = this.config.batchSize;
            // Process in batches to avoid overwhelming the system
            for (let i = 0; i < contents.length; i += batchSize) {
                const batch = contents.slice(i, i + batchSize);
                logger_1.default.info('Processing content batch', {
                    batchNumber: Math.floor(i / batchSize) + 1,
                    batchSize: batch.length,
                    totalBatches: Math.ceil(contents.length / batchSize),
                });
                // Generate embeddings for the batch
                const embeddings = await this.embeddingService.generateBatchEmbeddings(batch);
                // Validate and store embeddings
                const validEmbeddings = [];
                for (const embedding of embeddings) {
                    const isValid = await this.embeddingService.validateEmbedding(embedding);
                    if (isValid) {
                        validEmbeddings.push(embedding);
                    }
                    else {
                        logger_1.default.warn('Invalid embedding skipped', {
                            embeddingId: embedding.id,
                            contentId: embedding.contentId,
                        });
                    }
                }
                // Store valid embeddings
                if (validEmbeddings.length > 0) {
                    await this.vectorStorage.storeBatchEmbeddings(validEmbeddings);
                    results.push(...validEmbeddings);
                }
                // Find cross-modal relationships for the batch
                if (this.config.enableCrossModal) {
                    for (const embedding of validEmbeddings) {
                        await this.findCrossModalRelationships(embedding);
                    }
                }
            }
            logger_1.default.info('Batch content processing completed', {
                totalContents: contents.length,
                successfulEmbeddings: results.length,
                failedEmbeddings: contents.length - results.length,
            });
            return results;
        }
        catch (error) {
            logger_1.default.error('Failed to process batch content', {
                contentCount: contents.length,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async searchSimilarContent(query, queryEmbedding) {
        try {
            let searchVector;
            if (queryEmbedding) {
                searchVector = queryEmbedding;
            }
            else {
                // Generate embedding for the query
                const queryContent = {
                    id: `query_${Date.now()}`,
                    type: types_1.ContentType.TEXT,
                    data: query.query,
                    metadata: {
                        title: 'Search Query',
                        description: '',
                        tags: [],
                        source: 'search',
                    },
                };
                const queryEmbeddingObj = await this.embeddingService.generateEmbedding(queryContent);
                searchVector = queryEmbeddingObj.vector;
            }
            const searchResults = [];
            // Search across specified modalities
            for (const modality of query.modalities) {
                const vectorResults = await this.vectorStorage.searchByContentType(searchVector, modality, {
                    limit: query.limit || 10,
                    threshold: query.threshold || 0.7,
                    includeMetadata: true,
                    includeVectors: false,
                });
                // Convert vector results to search results
                for (const vectorResult of vectorResults) {
                    const embedding = await this.vectorStorage.getEmbedding(vectorResult.id);
                    if (embedding) {
                        const searchResult = {
                            id: embedding.contentId,
                            content: {
                                id: embedding.contentId,
                                type: embedding.contentType,
                                data: '', // Content data would need to be retrieved separately
                                metadata: {
                                    title: '',
                                    description: '',
                                    tags: embedding.metadata.tags,
                                    source: embedding.metadata.source,
                                },
                            },
                            type: embedding.contentType,
                            relevanceScore: vectorResult.score,
                            crossModalMatches: [],
                            metadata: {
                                searchTime: 0, // Will be calculated
                                totalResults: 0, // Will be updated
                                appliedFilters: query.filters || {},
                                suggestions: [],
                            },
                        };
                        searchResults.push(searchResult);
                    }
                }
            }
            // Sort by relevance score
            searchResults.sort((a, b) => b.relevanceScore - a.relevanceScore);
            // Find cross-modal matches if enabled
            if (this.config.enableCrossModal) {
                for (const result of searchResults) {
                    result.crossModalMatches = await this.findCrossModalMatches(searchVector, result.type, query.modalities);
                }
            }
            logger_1.default.info('Similar content search completed', {
                query: query.query,
                modalities: query.modalities,
                resultsFound: searchResults.length,
                threshold: query.threshold,
            });
            return searchResults;
        }
        catch (error) {
            logger_1.default.error('Failed to search similar content', {
                query: query.query,
                modalities: query.modalities,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async findSimilarEmbeddings(embeddingId, limit = 10, threshold = 0.8) {
        try {
            const sourceEmbedding = await this.vectorStorage.getEmbedding(embeddingId);
            if (!sourceEmbedding) {
                throw new Error(`Embedding not found: ${embeddingId}`);
            }
            const similarResults = await this.vectorStorage.searchSimilarVectors(sourceEmbedding.vector, {
                limit: limit + 1, // +1 to exclude the source embedding
                threshold,
                includeVectors: true,
            });
            // Filter out the source embedding and convert to VectorEmbedding objects
            const similarEmbeddings = [];
            for (const result of similarResults) {
                if (result.id !== embeddingId && result.embedding) {
                    similarEmbeddings.push(result.embedding);
                }
            }
            logger_1.default.debug('Similar embeddings found', {
                sourceEmbeddingId: embeddingId,
                similarCount: similarEmbeddings.length,
                threshold,
            });
            return similarEmbeddings.slice(0, limit);
        }
        catch (error) {
            logger_1.default.error('Failed to find similar embeddings', {
                embeddingId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async updateEmbeddingRelationships(embeddingId) {
        try {
            const embedding = await this.vectorStorage.getEmbedding(embeddingId);
            if (!embedding) {
                throw new Error(`Embedding not found: ${embeddingId}`);
            }
            // Find similar embeddings
            const similarEmbeddings = await this.findSimilarEmbeddings(embeddingId, 20, 0.8);
            // Update relationships
            const relationships = {
                ...embedding.relationships,
                similarIds: similarEmbeddings.map(e => e.id),
            };
            // Find cross-modal relationships
            if (this.config.enableCrossModal) {
                const crossModalMatches = await this.findCrossModalMatches(embedding.vector, embedding.contentType, Object.values(types_1.ContentType).filter(type => type !== embedding.contentType));
                relationships.crossModalIds = crossModalMatches.map(match => match.contentId);
            }
            await this.vectorStorage.updateEmbeddingRelationships(embeddingId, relationships);
            logger_1.default.debug('Embedding relationships updated', {
                embeddingId,
                similarCount: relationships.similarIds.length,
                crossModalCount: relationships.crossModalIds.length,
            });
        }
        catch (error) {
            logger_1.default.error('Failed to update embedding relationships', {
                embeddingId,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async getEmbeddingStats() {
        try {
            const storageStats = await this.vectorStorage.getStorageStats();
            const providers = this.embeddingService.getAvailableProviders();
            // Calculate average dimensions (simplified - assumes all embeddings have same dimensions)
            const averageDimensions = environment_1.default.embedding.dimensions;
            return {
                totalEmbeddings: storageStats.totalEmbeddings,
                embeddingsByType: storageStats.embeddingsByType,
                averageDimensions,
                providers,
            };
        }
        catch (error) {
            logger_1.default.error('Failed to get embedding stats', {
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async findCrossModalRelationships(embedding) {
        try {
            // Find similar embeddings in other modalities
            const otherModalities = Object.values(types_1.ContentType).filter(type => type !== embedding.contentType);
            for (const modality of otherModalities) {
                const similarResults = await this.vectorStorage.searchByContentType(embedding.vector, modality, {
                    limit: 5,
                    threshold: 0.6, // Lower threshold for cross-modal matches
                    includeMetadata: false,
                });
                if (similarResults.length > 0) {
                    // Update relationships to include cross-modal matches
                    const crossModalIds = similarResults.map(result => result.id);
                    const updatedRelationships = {
                        ...embedding.relationships,
                        crossModalIds: [
                            ...embedding.relationships.crossModalIds,
                            ...crossModalIds,
                        ],
                    };
                    await this.vectorStorage.updateEmbeddingRelationships(embedding.id, updatedRelationships);
                }
            }
        }
        catch (error) {
            logger_1.default.error('Failed to find cross-modal relationships', {
                embeddingId: embedding.id,
                contentType: embedding.contentType,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    }
    async findCrossModalMatches(queryVector, sourceType, targetModalities) {
        try {
            const crossModalMatches = [];
            for (const modality of targetModalities) {
                if (modality === sourceType)
                    continue;
                const results = await this.vectorStorage.searchByContentType(queryVector, modality, {
                    limit: 3,
                    threshold: 0.5, // Lower threshold for cross-modal
                    includeMetadata: true,
                });
                for (const result of results) {
                    crossModalMatches.push({
                        contentId: result.id,
                        type: modality,
                        score: result.score,
                        relationship: 'semantic_similarity',
                    });
                }
            }
            return crossModalMatches;
        }
        catch (error) {
            logger_1.default.error('Failed to find cross-modal matches', {
                sourceType,
                targetModalities,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return [];
        }
    }
}
exports.EmbeddingManager = EmbeddingManager;
// Export singleton instance
let embeddingManager = null;
function createEmbeddingManager(config) {
    if (!embeddingManager) {
        embeddingManager = new EmbeddingManager(config);
    }
    return embeddingManager;
}
function getEmbeddingManager() {
    if (!embeddingManager) {
        throw new Error('Embedding manager not initialized. Call createEmbeddingManager first.');
    }
    return embeddingManager;
}
//# sourceMappingURL=embedding-manager.js.map