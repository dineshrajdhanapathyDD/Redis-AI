"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalEmbeddingProvider = exports.HuggingFaceEmbeddingProvider = exports.OpenAIEmbeddingProvider = exports.EmbeddingService = exports.BaseEmbeddingProvider = void 0;
exports.createEmbeddingService = createEmbeddingService;
exports.createContent = createContent;
exports.validateEmbeddingDimensions = validateEmbeddingDimensions;
exports.cosineSimilarity = cosineSimilarity;
exports.normalizeEmbedding = normalizeEmbedding;
// Export all embedding providers and services
var base_1 = require("./base");
Object.defineProperty(exports, "BaseEmbeddingProvider", { enumerable: true, get: function () { return base_1.BaseEmbeddingProvider; } });
Object.defineProperty(exports, "EmbeddingService", { enumerable: true, get: function () { return base_1.EmbeddingService; } });
var openai_1 = require("./openai");
Object.defineProperty(exports, "OpenAIEmbeddingProvider", { enumerable: true, get: function () { return openai_1.OpenAIEmbeddingProvider; } });
var huggingface_1 = require("./huggingface");
Object.defineProperty(exports, "HuggingFaceEmbeddingProvider", { enumerable: true, get: function () { return huggingface_1.HuggingFaceEmbeddingProvider; } });
var local_1 = require("./local");
Object.defineProperty(exports, "LocalEmbeddingProvider", { enumerable: true, get: function () { return local_1.LocalEmbeddingProvider; } });
const base_2 = require("./base");
const openai_2 = require("./openai");
const huggingface_2 = require("./huggingface");
const local_2 = require("./local");
const types_1 = require("@/types");
const environment_1 = __importDefault(require("@/config/environment"));
const logger_1 = __importDefault(require("@/utils/logger"));
// Factory function to create embedding service with configured providers
function createEmbeddingService() {
    const service = new base_2.EmbeddingService();
    try {
        // Configure providers based on environment settings
        switch (environment_1.default.embedding.service) {
            case 'openai':
                if (environment_1.default.ai.openaiApiKey) {
                    const openaiProvider = new openai_2.OpenAIEmbeddingProvider({
                        provider: 'openai',
                        model: environment_1.default.embedding.model,
                        dimensions: environment_1.default.embedding.dimensions,
                        apiKey: environment_1.default.ai.openaiApiKey,
                        maxTokens: 8000,
                        batchSize: 100,
                    });
                    service.registerProvider(types_1.ContentType.TEXT, openaiProvider);
                    service.registerProvider(types_1.ContentType.CODE, openaiProvider);
                    service.setDefaultProvider(openaiProvider);
                    logger_1.default.info('OpenAI embedding provider configured', {
                        model: environment_1.default.embedding.model,
                        dimensions: environment_1.default.embedding.dimensions,
                    });
                }
                else {
                    logger_1.default.warn('OpenAI API key not provided, falling back to local provider');
                    setupLocalProvider(service);
                }
                break;
            case 'huggingface':
                if (environment_1.default.ai.huggingfaceApiKey) {
                    const hfProvider = new huggingface_2.HuggingFaceEmbeddingProvider({
                        provider: 'huggingface',
                        model: environment_1.default.embedding.model,
                        dimensions: environment_1.default.embedding.dimensions,
                        apiKey: environment_1.default.ai.huggingfaceApiKey,
                        maxTokens: 8000,
                    });
                    service.registerProvider(types_1.ContentType.TEXT, hfProvider);
                    service.registerProvider(types_1.ContentType.CODE, hfProvider);
                    service.registerProvider(types_1.ContentType.IMAGE, hfProvider);
                    service.setDefaultProvider(hfProvider);
                    logger_1.default.info('HuggingFace embedding provider configured', {
                        model: environment_1.default.embedding.model,
                        dimensions: environment_1.default.embedding.dimensions,
                    });
                }
                else {
                    logger_1.default.warn('HuggingFace API key not provided, falling back to local provider');
                    setupLocalProvider(service);
                }
                break;
            case 'local':
            default:
                setupLocalProvider(service);
                break;
        }
        // Always set up local provider as fallback
        if (environment_1.default.embedding.service !== 'local') {
            const localProvider = new local_2.LocalEmbeddingProvider({
                provider: 'local',
                model: 'tfidf',
                dimensions: environment_1.default.embedding.dimensions,
            });
            // Register as fallback for unsupported types
            if (!service.getAvailableProviders().some(p => p.contentType === types_1.ContentType.AUDIO)) {
                service.registerProvider(types_1.ContentType.AUDIO, localProvider);
            }
        }
        logger_1.default.info('Embedding service initialized', {
            availableProviders: service.getAvailableProviders(),
        });
        return service;
    }
    catch (error) {
        logger_1.default.error('Failed to initialize embedding service', { error });
        // Fallback to local provider
        const localService = new base_2.EmbeddingService();
        setupLocalProvider(localService);
        return localService;
    }
}
function setupLocalProvider(service) {
    const localProvider = new local_2.LocalEmbeddingProvider({
        provider: 'local',
        model: 'tfidf',
        dimensions: environment_1.default.embedding.dimensions,
    });
    service.registerProvider(types_1.ContentType.TEXT, localProvider);
    service.registerProvider(types_1.ContentType.CODE, localProvider);
    service.setDefaultProvider(localProvider);
    logger_1.default.info('Local embedding provider configured', {
        model: 'tfidf',
        dimensions: environment_1.default.embedding.dimensions,
    });
}
// Utility function to create content for embedding
function createContent(id, type, data, metadata = {}) {
    return {
        id,
        type,
        data,
        metadata: {
            title: metadata.title,
            description: metadata.description,
            tags: metadata.tags || [],
            source: metadata.source || 'unknown',
            language: metadata.language,
            format: metadata.format,
        },
    };
}
// Utility function to validate embedding dimensions
function validateEmbeddingDimensions(embedding, expectedDimensions) {
    if (!Array.isArray(embedding)) {
        return false;
    }
    if (embedding.length !== expectedDimensions) {
        logger_1.default.warn('Embedding dimension mismatch', {
            expected: expectedDimensions,
            actual: embedding.length,
        });
        return false;
    }
    // Check for invalid values
    const hasInvalidValues = embedding.some(value => !Number.isFinite(value) || Number.isNaN(value));
    if (hasInvalidValues) {
        logger_1.default.warn('Embedding contains invalid values');
        return false;
    }
    return true;
}
// Utility function to calculate cosine similarity between embeddings
function cosineSimilarity(a, b) {
    if (a.length !== b.length) {
        throw new Error('Embeddings must have the same dimensions');
    }
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    if (normA === 0 || normB === 0) {
        return 0;
    }
    return dotProduct / (normA * normB);
}
// Utility function to normalize embedding vector
function normalizeEmbedding(embedding) {
    const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) {
        return embedding;
    }
    return embedding.map(val => val / norm);
}
//# sourceMappingURL=index.js.map