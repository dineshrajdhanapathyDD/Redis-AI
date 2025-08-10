"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HuggingFaceEmbeddingProvider = void 0;
const base_1 = require("./base");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class HuggingFaceEmbeddingProvider extends base_1.BaseEmbeddingProvider {
    apiKey;
    baseUrl;
    constructor(config) {
        // HuggingFace supports multiple content types depending on the model
        super(config, [types_1.ContentType.TEXT, types_1.ContentType.CODE, types_1.ContentType.IMAGE]);
        if (!config.apiKey) {
            throw new Error('HuggingFace API key is required');
        }
        this.apiKey = config.apiKey;
        this.baseUrl = config.endpoint || 'https://api-inference.huggingface.co';
    }
    async generateEmbedding(content) {
        this.validateContent(content);
        return this.measurePerformance(async () => {
            const payload = this.preparePayload(content);
            const response = await fetch(`${this.baseUrl}/pipeline/feature-extraction/${this.config.model}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });
            if (!response.ok) {
                const errorText = await response.text();
                // Handle model loading case
                if (response.status === 503) {
                    logger_1.default.warn('HuggingFace model is loading, retrying...', {
                        model: this.config.model,
                        contentId: content.id,
                    });
                    // Wait and retry once
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    return this.generateEmbedding(content);
                }
                throw new Error(`HuggingFace API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`HuggingFace API error: ${data.error}`);
            }
            let embedding;
            // Handle different response formats
            if (Array.isArray(data) && data.length > 0) {
                if (Array.isArray(data[0])) {
                    // 2D array - take first embedding or average
                    embedding = data[0];
                }
                else {
                    // 1D array
                    embedding = data;
                }
            }
            else if (data.embeddings && Array.isArray(data.embeddings[0])) {
                embedding = data.embeddings[0];
            }
            else {
                throw new Error('Unexpected response format from HuggingFace API');
            }
            // Validate and normalize embedding
            if (!Array.isArray(embedding) || embedding.length === 0) {
                throw new Error('Invalid embedding received from HuggingFace');
            }
            // Normalize embedding if needed (some models return unnormalized vectors)
            const normalizedEmbedding = this.normalizeVector(embedding);
            logger_1.default.debug('HuggingFace embedding generated', {
                contentId: content.id,
                contentType: content.type,
                model: this.config.model,
                dimensions: normalizedEmbedding.length,
            });
            return normalizedEmbedding;
        }, 'generateEmbedding', content.type);
    }
    preparePayload(content) {
        switch (content.type) {
            case types_1.ContentType.TEXT:
            case types_1.ContentType.CODE:
                return {
                    inputs: this.preprocessText(content),
                    options: {
                        wait_for_model: true,
                        use_cache: true,
                    },
                };
            case types_1.ContentType.IMAGE:
                return {
                    inputs: this.preprocessImage(content),
                    options: {
                        wait_for_model: true,
                        use_cache: true,
                    },
                };
            default:
                throw new Error(`Unsupported content type: ${content.type}`);
        }
    }
    preprocessText(content) {
        let text;
        if (typeof content.data === 'string') {
            text = content.data;
        }
        else if (Buffer.isBuffer(content.data)) {
            text = content.data.toString('utf-8');
        }
        else {
            throw new Error('Unsupported content data type for text embedding');
        }
        // Clean and normalize text
        text = text.replace(/\s+/g, ' ').trim();
        // Add context for code
        if (content.type === types_1.ContentType.CODE && content.metadata.language) {
            text = `[${content.metadata.language}] ${text}`;
        }
        // Truncate if too long
        const maxLength = this.config.maxTokens ? this.config.maxTokens * 4 : 8000;
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + '...';
        }
        return text;
    }
    preprocessImage(content) {
        if (typeof content.data === 'string') {
            // Assume it's a base64 encoded image
            return content.data;
        }
        else if (Buffer.isBuffer(content.data)) {
            // Convert buffer to base64
            return content.data.toString('base64');
        }
        else {
            throw new Error('Unsupported image data type for HuggingFace embedding');
        }
    }
    normalizeVector(vector) {
        // Calculate L2 norm
        const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
        if (norm === 0) {
            logger_1.default.warn('Zero vector detected, returning original', {
                model: this.config.model,
                dimensions: vector.length,
            });
            return vector;
        }
        // Normalize vector
        return vector.map(val => val / norm);
    }
    async generateBatchEmbeddings(contents) {
        // HuggingFace Inference API doesn't support batch requests well
        // Process sequentially with rate limiting
        const results = [];
        for (let i = 0; i < contents.length; i++) {
            try {
                const embedding = await this.generateEmbedding(contents[i]);
                results.push(embedding);
                // Rate limiting - wait between requests
                if (i < contents.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }
            catch (error) {
                logger_1.default.error('Failed to generate embedding in batch', {
                    contentId: contents[i].id,
                    index: i,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                results.push([]); // Empty array as placeholder
            }
        }
        return results;
    }
    // Method to check if model is available
    async checkModelAvailability() {
        try {
            const response = await fetch(`${this.baseUrl}/models/${this.config.model}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });
            if (response.ok) {
                const modelInfo = await response.json();
                logger_1.default.info('HuggingFace model info', {
                    model: this.config.model,
                    pipeline_tag: modelInfo.pipeline_tag,
                    library_name: modelInfo.library_name,
                });
                return true;
            }
            return false;
        }
        catch (error) {
            logger_1.default.error('Failed to check HuggingFace model availability', {
                model: this.config.model,
                error: error instanceof Error ? error.message : 'Unknown error',
            });
            return false;
        }
    }
}
exports.HuggingFaceEmbeddingProvider = HuggingFaceEmbeddingProvider;
//# sourceMappingURL=huggingface.js.map