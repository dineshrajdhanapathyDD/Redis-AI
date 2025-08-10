import { ContentType, VectorEmbedding, Content, EmbeddingMetadata } from '@/types';
import logger from '@/utils/logger';

export interface EmbeddingProvider {
  generateEmbedding(content: Content): Promise<number[]>;
  getDimensions(): number;
  getModel(): string;
  getSupportedTypes(): ContentType[];
}

export interface EmbeddingConfig {
  provider: string;
  model: string;
  dimensions: number;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  batchSize?: number;
}

export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  protected config: EmbeddingConfig;
  protected supportedTypes: ContentType[];

  constructor(config: EmbeddingConfig, supportedTypes: ContentType[]) {
    this.config = config;
    this.supportedTypes = supportedTypes;
  }

  abstract generateEmbedding(content: Content): Promise<number[]>;

  getDimensions(): number {
    return this.config.dimensions;
  }

  getModel(): string {
    return this.config.model;
  }

  getSupportedTypes(): ContentType[] {
    return this.supportedTypes;
  }

  protected validateContent(content: Content): void {
    if (!this.supportedTypes.includes(content.type)) {
      throw new Error(`Content type ${content.type} not supported by ${this.config.provider}`);
    }

    if (!content.data) {
      throw new Error('Content data is required for embedding generation');
    }
  }

  protected async measurePerformance<T>(
    operation: () => Promise<T>,
    operationName: string,
    contentType: ContentType
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await operation();
      const duration = Date.now() - startTime;
      
      logger.debug('Embedding generation completed', {
        provider: this.config.provider,
        model: this.config.model,
        operation: operationName,
        contentType,
        duration: `${duration}ms`,
        success: true,
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error('Embedding generation failed', {
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

export class EmbeddingService {
  private providers: Map<ContentType, EmbeddingProvider> = new Map();
  private defaultProvider?: EmbeddingProvider;

  registerProvider(contentType: ContentType, provider: EmbeddingProvider): void {
    this.providers.set(contentType, provider);
    logger.info('Embedding provider registered', {
      contentType,
      provider: provider.getModel(),
      dimensions: provider.getDimensions(),
    });
  }

  setDefaultProvider(provider: EmbeddingProvider): void {
    this.defaultProvider = provider;
    logger.info('Default embedding provider set', {
      provider: provider.getModel(),
      supportedTypes: provider.getSupportedTypes(),
    });
  }

  async generateEmbedding(content: Content): Promise<VectorEmbedding> {
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

      const embedding: VectorEmbedding = {
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

      logger.info('Embedding generated successfully', {
        embeddingId: embedding.id,
        contentId: content.id,
        contentType: content.type,
        dimensions: vector.length,
        processingTime: `${processingTime}ms`,
        provider: provider.getModel(),
      });

      return embedding;
    } catch (error) {
      logger.error('Failed to generate embedding', {
        contentId: content.id,
        contentType: content.type,
        provider: provider.getModel(),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async generateBatchEmbeddings(contents: Content[]): Promise<VectorEmbedding[]> {
    const results: VectorEmbedding[] = [];
    const errors: Array<{ content: Content; error: Error }> = [];

    // Group contents by type for efficient batch processing
    const contentsByType = new Map<ContentType, Content[]>();
    
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
        } catch (error) {
          errors.push({ 
            content, 
            error: error instanceof Error ? error : new Error('Unknown error') 
          });
        }
      }
    }

    if (errors.length > 0) {
      logger.warn('Some embeddings failed to generate', {
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

  getAvailableProviders(): Array<{ contentType: ContentType; provider: string; model: string }> {
    const providers: Array<{ contentType: ContentType; provider: string; model: string }> = [];
    
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

  async validateEmbedding(embedding: VectorEmbedding): Promise<boolean> {
    try {
      // Validate vector dimensions
      if (!Array.isArray(embedding.vector)) {
        logger.error('Invalid embedding: vector is not an array', { embeddingId: embedding.id });
        return false;
      }

      if (embedding.vector.length === 0) {
        logger.error('Invalid embedding: vector is empty', { embeddingId: embedding.id });
        return false;
      }

      // Validate vector values
      const hasInvalidValues = embedding.vector.some(value => 
        !Number.isFinite(value) || Number.isNaN(value)
      );

      if (hasInvalidValues) {
        logger.error('Invalid embedding: vector contains invalid values', { embeddingId: embedding.id });
        return false;
      }

      // Validate metadata
      if (!embedding.metadata || !embedding.metadata.model) {
        logger.error('Invalid embedding: missing metadata', { embeddingId: embedding.id });
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating embedding', {
        embeddingId: embedding.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}