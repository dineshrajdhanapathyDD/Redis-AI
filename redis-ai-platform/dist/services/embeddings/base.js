"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = exports.BaseEmbeddingProvider = void 0;
const logger_1 = __importDefault(require("@/utils/logger"));
class BaseEmbeddingProvider {
    config;
    supportedTypes;
    constructor(config, supportedTypes) {
        this.config = config;
        this.supportedTypes = supportedTypes;
    }
    getDimensions() {
        return this.config.dimensions;
    }
    getModel() {
        return this.config.model;
    }
    getSupportedTypes() {
        return this.supportedTypes;
    }
    validateContent(content) {
        if (!this.supportedTypes.includes(content.type)) {
            throw new Error(`Content type ${content.type} not supported by ${this.config.provider}`);
        }
        if (!content.data) {
            throw new Error('Content data is required for embedding generation');
        }
    }
    async measurePerformance(operation, operationName, contentType) {
        const startTime = Date.now();
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            logger_1.default.debug('Embedding generation completed', {
                provider: this.config.provider,
                model: this.config.model,
                operation: operationName,
                contentType,
                duration: `${duration}ms`,
                success: true,
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger_1.default.error('Embedding generation failed', {
                provider: this.config.provider,
                model: this.config.model,
                operation: operationName,
                contentType,
                duration: `${duration}ms`,
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
}
exports.BaseEmbeddingProvider = BaseEmbeddingProvider;
class EmbeddingService {
    providers = new Map();
    defaultProvider;
    registerProvider(contentType, provider) {
        this.providers.set(contentType, provider);
        logger_1.default.info('Embedding provider registered', {
            contentType,
            provider: provider.getModel(),
            dimensions: provider.getDimensions(),
        });
    }
    setDefaultProvider(provider) {
        this.defaultProvider = provider;
        logger_1.default.info('Default embedding provider set', {
            provider: provider.getModel(),
            supportedTypes: provider.getSupportedTypes(),
        });
    }
    async generateEmbedding(content) {
        const provider = this.providers.get(content.type) || this.defaultProvider;
        if (!provider) {
            throw new Error(`No embedding provider available for content type: ${content.type}`);
        }
        if (!provider.getSupportedTypes().includes(content.type)) {
            throw new Error(`Provider does not support content type: ${content.type}`);
        }
        const startTime = Date.now();
        try {
            const vector = await provider.generateEmbedding(content);
            const processingTime = Date.now() - startTime;
            const embedding = {
                id: `emb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                vector,
                contentId: content.id,
                contentType: content.type,
                metadata: {
                    source: content.metadata.source,
                    timestamp: new Date(),
                    version: 1,
                    tags: content.metadata.tags,
                    model: provider.getModel(),
                    dimensions: provider.getDimensions(),
                },
                relationships: {
                    childIds: [],
                    similarIds: [],
                    crossModalIds: [],
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            logger_1.default.info('Embedding generated successfully', {
                embeddingId: embedding.id,
                contentId: content.id,
                contentType: content.type,
                dimensions: vector.length,
                processingTime: `${processingTime}ms`,
                provider: provider.getModel(),
            });
            return embedding;
        }
        catch (error) {
            logger_1.default.error('Failed to generate embedding', {
                contentId: content.id,
                contentType: content.type,
                provider: provider.getModel(),
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            throw error;
        }
    }
    async generateBatchEmbeddings(contents) {
        const results = [];
        const errors = [];
        // Group contents by type for efficient batch processing
        const contentsByType = new Map();
        for (const content of contents) {
            const typeContents = contentsByType.get(content.type) || [];
            typeContents.push(content);
            contentsByType.set(content.type, typeContents);
        }
        // Process each content type
        for (const [contentType, typeContents] of contentsByType) {
            const provider = this.providers.get(contentType) || this.defaultProvider;
            if (!provider) {
                const error = new Error(`No embedding provider available for content type: ${contentType}`);
                typeContents.forEach(content => errors.push({ content, error }));
                continue;
            }
            // Process contents sequentially to avoid rate limits
            for (const content of typeContents) {
                try {
                    const embedding = await this.generateEmbedding(content);
                    results.push(embedding);
                }
                catch (error) {
                    errors.push({
                        content,
                        error: error instanceof Error ? error : new Error('Unknown error')
                    });
                }
            }
        }
        if (errors.length > 0) {
            logger_1.default.warn('Some embeddings failed to generate', {
                totalContents: contents.length,
                successful: results.length,
                failed: errors.length,
                errors: errors.map(e => ({
                    contentId: e.content.id,
                    contentType: e.content.type,
                    error: e.error.message,
                })),
            });
        }
        return results;
    }
    getAvailableProviders() {
        const providers = [];
        for (const [contentType, provider] of this.providers) {
            providers.push({
                contentType,
                provider: provider.constructor.name,
                model: provider.getModel(),
            });
        }
        if (this.defaultProvider) {
            for (const contentType of this.defaultProvider.getSupportedTypes()) {
                if (!this.providers.has(contentType)) {
                    providers.push({
                        contentType,
                        provider: `${this.defaultProvider.constructor.name} (default)`,
                        model: this.defaultProvider.getModel(),
                    });
                }
            }
        }
        return providers;
    }
    async validateEmbedding(embedding) {
        try {
            // Validate vector dimensions
            if (!Array.isArray(embedding.vector)) {
                logger_1.default.error('Invalid embedding: vector is not an array', { embeddingId: embedding.id });
                return false;
            }
            if (embedding.vector.length === 0) {
                logger_1.default.error('Invalid embedding: vector is empty', { embeddingId: embedding.id });
                return false;
            }
            // Validate vector values
            const hasInvalidValues = embedding.vector.some(value => !Number.isFinite(value) || Number.isNaN(value));
            if (hasInvalidValues) {
                logger_1.default.error('Invalid embedding: vector contains invalid values', { embeddingId: embedding.id });
                return false;
            }
            // Validate metadata
            if (!embedding.metadata || !embedding.metadata.model) {
                logger_1.default.error('Invalid embedding: missing metadata', { embeddingId: embedding.id });
                return false;
            }
            return true;
        }
        catch (error) {
            logger_1.default.error('Error validating embedding', {
                embeddingId: embedding.id,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=base.js.map