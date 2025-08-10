import { BaseEmbeddingProvider, EmbeddingConfig } from './base';
import { Content, ContentType } from '@/types';
import logger from '@/utils/logger';

interface HuggingFaceEmbeddingResponse {
  embeddings?: number[][];
  error?: string;
}

export class HuggingFaceEmbeddingProvider extends BaseEmbeddingProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: EmbeddingConfig) {
    // HuggingFace supports multiple content types depending on the model
    super(config, [ContentType.TEXT, ContentType.CODE, ContentType.IMAGE]);
    
    if (!config.apiKey) {
      throw new Error('HuggingFace API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.baseUrl = config.endpoint || 'https://api-inference.huggingface.co';
  }

  async generateEmbedding(content: Content): Promise<number[]> {
    this.validateContent(content);

    return this.measurePerformance(
      async () => {
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
            logger.warn('HuggingFace model is loading, retrying...', {
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

        let embedding: number[];
        
        // Handle different response formats
        if (Array.isArray(data) && data.length > 0) {
          if (Array.isArray(data[0])) {
            // 2D array - take first embedding or average
            embedding = data[0];
          } else {
            // 1D array
            embedding = data;
          }
        } else if (data.embeddings && Array.isArray(data.embeddings[0])) {
          embedding = data.embeddings[0];
        } else {
          throw new Error('Unexpected response format from HuggingFace API');
        }

        // Validate and normalize embedding
        if (!Array.isArray(embedding) || embedding.length === 0) {
          throw new Error('Invalid embedding received from HuggingFace');
        }

        // Normalize embedding if needed (some models return unnormalized vectors)
        const normalizedEmbedding = this.normalizeVector(embedding);

        logger.debug('HuggingFace embedding generated', {
          contentId: content.id,
          contentType: content.type,
          model: this.config.model,
          dimensions: normalizedEmbedding.length,
        });

        return normalizedEmbedding;
      },
      'generateEmbedding',
      content.type
    );
  }

  private preparePayload(content: Content): any {
    switch (content.type) {
      case ContentType.TEXT:
      case ContentType.CODE:
        return {
          inputs: this.preprocessText(content),
          options: {
            wait_for_model: true,
            use_cache: true,
          },
        };
      
      case ContentType.IMAGE:
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

  private preprocessText(content: Content): string {
    let text: string;

    if (typeof content.data === 'string') {
      text = content.data;
    } else if (Buffer.isBuffer(content.data)) {
      text = content.data.toString('utf-8');
    } else {
      throw new Error('Unsupported content data type for text embedding');
    }

    // Clean and normalize text
    text = text.replace(/\s+/g, ' ').trim();

    // Add context for code
    if (content.type === ContentType.CODE && content.metadata.language) {
      text = `[${content.metadata.language}] ${text}`;
    }

    // Truncate if too long
    const maxLength = this.config.maxTokens ? this.config.maxTokens * 4 : 8000;
    if (text.length > maxLength) {
      text = text.substring(0, maxLength) + '...';
    }

    return text;
  }

  private preprocessImage(content: Content): string {
    if (typeof content.data === 'string') {
      // Assume it's a base64 encoded image
      return content.data;
    } else if (Buffer.isBuffer(content.data)) {
      // Convert buffer to base64
      return content.data.toString('base64');
    } else {
      throw new Error('Unsupported image data type for HuggingFace embedding');
    }
  }

  private normalizeVector(vector: number[]): number[] {
    // Calculate L2 norm
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (norm === 0) {
      logger.warn('Zero vector detected, returning original', {
        model: this.config.model,
        dimensions: vector.length,
      });
      return vector;
    }

    // Normalize vector
    return vector.map(val => val / norm);
  }

  async generateBatchEmbeddings(contents: Content[]): Promise<number[][]> {
    // HuggingFace Inference API doesn't support batch requests well
    // Process sequentially with rate limiting
    const results: number[][] = [];
    
    for (let i = 0; i < contents.length; i++) {
      try {
        const embedding = await this.generateEmbedding(contents[i]);
        results.push(embedding);
        
        // Rate limiting - wait between requests
        if (i < contents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
        logger.error('Failed to generate embedding in batch', {
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
  async checkModelAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models/${this.config.model}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      });

      if (response.ok) {
        const modelInfo = await response.json();
        logger.info('HuggingFace model info', {
          model: this.config.model,
          pipeline_tag: modelInfo.pipeline_tag,
          library_name: modelInfo.library_name,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to check HuggingFace model availability', {
        model: this.config.model,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }
}