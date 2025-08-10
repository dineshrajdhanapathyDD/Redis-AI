"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIEmbeddingProvider = void 0;
const base_1 = require("./base");
const types_1 = require("@/types");
const logger_1 = __importDefault(require("@/utils/logger"));
class OpenAIEmbeddingProvider extends base_1.BaseEmbeddingProvider {
    apiKey;
    baseUrl;
    constructor(config) {
        super(config, [types_1.ContentType.TEXT, types_1.ContentType.CODE]);
        if (!config.apiKey) {
            throw new Error('OpenAI API key is required');
        }
        this.apiKey = config.apiKey;
        this.baseUrl = config.endpoint || 'https://api.openai.com/v1';
    }
    async generateEmbedding(content) {
        this.validateContent(content);
        return this.measurePerformance(async () => {
            const text = this.preprocessContent(content);
            const response = await fetch(`${this.baseUrl}/embeddings`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    input: text,
                    model: this.config.model,
                    encoding_format: 'float',
                }),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            if (!data.data || data.data.length === 0) {
                throw new Error('No embedding data received from OpenAI');
            }
            const embedding = data.data[0].embedding;
            // Validate embedding dimensions
            if (embedding.length !== this.config.dimensions) {
                logger_1.default.warn('Embedding dimension mismatch', {
                    expected: this.config.dimensions,
                    received: embedding.length,
                    model: this.config.model,
                });
            }
            logger_1.default.debug('OpenAI embedding generated', {
                contentId: content.id,
                contentType: content.type,
                model: data.model,
                dimensions: embedding.length,
                tokensUsed: data.usage.total_tokens,
            });
            return embedding;
        }, 'generateEmbedding', content.type);
    }
    preprocessContent(content) {
        let text;
        if (typeof content.data === 'string') {
            text = content.data;
        }
        else if (Buffer.isBuffer(content.data)) {
            text = content.data.toString('utf-8');
        }
        else {
            throw new Error('Unsupported content data type for OpenAI embedding');
        }
        // Handle different content types
        switch (content.type) {
            case types_1.ContentType.TEXT:
                return this.preprocessText(text, content);
            case types_1.ContentType.CODE:
                return this.preprocessCode(text, content);
            default:
                throw new Error(`Unsupported content type: ${content.type}`);
        }
    }
    preprocessText(text, content) {
        // Clean and normalize text
        let processedText = text
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        // Add metadata context if available
        if (content.metadata.title) {
            processedText = `Title: ${content.metadata.title}\n\n${processedText}`;
        }
        if (content.metadata.description) {
            processedText = `${processedText}\n\nDescription: ${content.metadata.description}`;
        }
        // Add tags as context
        if (content.metadata.tags.length > 0) {
            processedText = `${processedText}\n\nTags: ${content.metadata.tags.join(', ')}`;
        }
        // Truncate if too long (OpenAI has token limits)
        const maxLength = this.config.maxTokens ? this.config.maxTokens * 4 : 8000; // Rough token estimation
        if (processedText.length > maxLength) {
            processedText = processedText.substring(0, maxLength) + '...';
            logger_1.default.debug('Text truncated for embedding', {
                contentId: content.id,
                originalLength: text.length,
                truncatedLength: processedText.length,
            });
        }
        return processedText;
    }
    preprocessCode(code, content) {
        // Add language context if available
        let processedCode = code;
        if (content.metadata.language) {
            processedCode = `// Language: ${content.metadata.language}\n${processedCode}`;
        }
        // Add filename context if available in source
        if (content.metadata.source && content.metadata.source.includes('.')) {
            const filename = content.metadata.source.split('/').pop();
            processedCode = `// File: ${filename}\n${processedCode}`;
        }
        // Add description as comments if available
        if (content.metadata.description) {
            processedCode = `// Description: ${content.metadata.description}\n${processedCode}`;
        }
        // Truncate if too long
        const maxLength = this.config.maxTokens ? this.config.maxTokens * 4 : 8000;
        if (processedCode.length > maxLength) {
            processedCode = processedCode.substring(0, maxLength) + '\n// ... (truncated)';
            logger_1.default.debug('Code truncated for embedding', {
                contentId: content.id,
                originalLength: code.length,
                truncatedLength: processedCode.length,
            });
        }
        return processedCode;
    }
    async generateBatchEmbeddings(contents) {
        const batchSize = this.config.batchSize || 100; // OpenAI supports batch requests
        const results = [];
        for (let i = 0; i < contents.length; i += batchSize) {
            const batch = contents.slice(i, i + batchSize);
            const inputs = batch.map(content => this.preprocessContent(content));
            try {
                const response = await fetch(`${this.baseUrl}/embeddings`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.apiKey}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        input: inputs,
                        model: this.config.model,
                        encoding_format: 'float',
                    }),
                });
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
                }
                const data = await response.json();
                // Sort by index to maintain order
                const sortedEmbeddings = data.data
                    .sort((a, b) => a.index - b.index)
                    .map(item => item.embedding);
                results.push(...sortedEmbeddings);
                logger_1.default.debug('OpenAI batch embeddings generated', {
                    batchSize: batch.length,
                    totalTokens: data.usage.total_tokens,
                    model: data.model,
                });
                // Rate limiting - wait between batches
                if (i + batchSize < contents.length) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                logger_1.default.error('Failed to generate batch embeddings', {
                    batchStart: i,
                    batchSize: batch.length,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
                // Fallback to individual requests for this batch
                for (const content of batch) {
                    try {
                        const embedding = await this.generateEmbedding(content);
                        results.push(embedding);
                    }
                    catch (individualError) {
                        logger_1.default.error('Failed to generate individual embedding in batch fallback', {
                            contentId: content.id,
                            error: individualError instanceof Error ? individualError.message : 'Unknown error',
                        });
                        // Push empty array as placeholder to maintain indices
                        results.push([]);
                    }
                }
            }
        }
        return results;
    }
}
exports.OpenAIEmbeddingProvider = OpenAIEmbeddingProvider;
//# sourceMappingURL=openai.js.map