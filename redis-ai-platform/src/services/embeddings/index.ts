// Export all embedding providers and services
export { BaseEmbeddingProvider, EmbeddingService } from './base';
export { OpenAIEmbeddingProvider } from './openai';
export { HuggingFaceEmbeddingProvider } from './huggingface';
export { LocalEmbeddingProvider } from './local';

import { EmbeddingService } from './base';
import { OpenAIEmbeddingProvider } from './openai';
import { HuggingFaceEmbeddingProvider } from './huggingface';
import { LocalEmbeddingProvider } from './local';
import { ContentType } from '@/types';
import config from '@/config/environment';
import logger from '@/utils/logger';

// Factory function to create embedding service with configured providers
export function createEmbeddingService(): EmbeddingService {
  const service = new EmbeddingService();

  try {
    // Configure providers based on environment settings
    switch (config.embedding.service) {
      case 'openai':
        if (config.ai.openaiApiKey) {
          const openaiProvider = new OpenAIEmbeddingProvider({
            provider: 'openai',
            model: config.embedding.model,
            dimensions: config.embedding.dimensions,
            apiKey: config.ai.openaiApiKey,
            maxTokens: 8000,
            batchSize: 100,
          });
          
          service.registerProvider(ContentType.TEXT, openaiProvider);
          service.registerProvider(ContentType.CODE, openaiProvider);
          service.setDefaultProvider(openaiProvider);
          
          logger.info('OpenAI embedding provider configured', {
            model: config.embedding.model,
            dimensions: config.embedding.dimensions,
          });
        } else {
          logger.warn('OpenAI API key not provided, falling back to local provider');
          setupLocalProvider(service);
        }
        break;

      case 'huggingface':
        if (config.ai.huggingfaceApiKey) {
          const hfProvider = new HuggingFaceEmbeddingProvider({
            provider: 'huggingface',
            model: config.embedding.model,
            dimensions: config.embedding.dimensions,
            apiKey: config.ai.huggingfaceApiKey,
            maxTokens: 8000,
          });
          
          service.registerProvider(ContentType.TEXT, hfProvider);
          service.registerProvider(ContentType.CODE, hfProvider);
          service.registerProvider(ContentType.IMAGE, hfProvider);
          service.setDefaultProvider(hfProvider);
          
          logger.info('HuggingFace embedding provider configured', {
            model: config.embedding.model,
            dimensions: config.embedding.dimensions,
          });
        } else {
          logger.warn('HuggingFace API key not provided, falling back to local provider');
          setupLocalProvider(service);
        }
        break;

      case 'local':
      default:
        setupLocalProvider(service);
        break;
    }

    // Always set up local provider as fallback
    if (config.embedding.service !== 'local') {
      const localProvider = new LocalEmbeddingProvider({
        provider: 'local',
        model: 'tfidf',
        dimensions: config.embedding.dimensions,
      });
      
      // Register as fallback for unsupported types
      if (!service.getAvailableProviders().some(p => p.contentType === ContentType.AUDIO)) {
        service.registerProvider(ContentType.AUDIO, localProvider);
      }
    }

    logger.info('Embedding service initialized', {
      availableProviders: service.getAvailableProviders(),
    });

    return service;

  } catch (error) {
    logger.error('Failed to initialize embedding service', { error });
    
    // Fallback to local provider
    const localService = new EmbeddingService();
    setupLocalProvider(localService);
    return localService;
  }
}

function setupLocalProvider(service: EmbeddingService): void {
  const localProvider = new LocalEmbeddingProvider({
    provider: 'local',
    model: 'tfidf',
    dimensions: config.embedding.dimensions,
  });
  
  service.registerProvider(ContentType.TEXT, localProvider);
  service.registerProvider(ContentType.CODE, localProvider);
  service.setDefaultProvider(localProvider);
  
  logger.info('Local embedding provider configured', {
    model: 'tfidf',
    dimensions: config.embedding.dimensions,
  });
}

// Utility function to create content for embedding
export function createContent(
  id: string,
  type: ContentType,
  data: string | Buffer,
  metadata: {
    title?: string;
    description?: string;
    tags?: string[];
    source?: string;
    language?: string;
    format?: string;
  } = {}
) {
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
export function validateEmbeddingDimensions(embedding: number[], expectedDimensions: number): boolean {
  if (!Array.isArray(embedding)) {
    return false;
  }
  
  if (embedding.length !== expectedDimensions) {
    logger.warn('Embedding dimension mismatch', {
      expected: expectedDimensions,
      actual: embedding.length,
    });
    return false;
  }
  
  // Check for invalid values
  const hasInvalidValues = embedding.some(value => 
    !Number.isFinite(value) || Number.isNaN(value)
  );
  
  if (hasInvalidValues) {
    logger.warn('Embedding contains invalid values');
    return false;
  }
  
  return true;
}

// Utility function to calculate cosine similarity between embeddings
export function cosineSimilarity(a: number[], b: number[]): number {
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
export function normalizeEmbedding(embedding: number[]): number[] {
  const norm = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  
  if (norm === 0) {
    return embedding;
  }
  
  return embedding.map(val => val / norm);
}