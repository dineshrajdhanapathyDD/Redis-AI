import { getRedisManager } from '@/config/redis';
import { VectorEmbedding, ContentType, SearchQuery, SearchResult } from '@/types';
import logger from '@/utils/logger';

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
  includeVectors?: boolean;
}

export interface VectorSearchResult {
  id: string;
  score: number;
  embedding?: VectorEmbedding;
  metadata?: any;
}

export class VectorStorageService {
  private redisManager = getRedisManager();
  private indexPrefix: string;

  constructor(indexPrefix = 'ai_platform') {
    this.indexPrefix = indexPrefix;
  }

  async storeEmbedding(embedding: VectorEmbedding): Promise<void> {
    try {
      const client = this.redisManager.getClient();
      const key = this.getEmbeddingKey(embedding.id);

      // Prepare the document for Redis
      const document = {
        id: embedding.id,
        vector: embedding.vector,
        contentId: embedding.contentId,
        contentType: embedding.contentType,
        metadata: JSON.stringify(embedding.metadata),
        relationships: JSON.stringify(embedding.relationships),
        createdAt: embedding.createdAt.toISOString(),
        updatedAt: embedding.updatedAt.toISOString(),
      };

      // Store the embedding document
      await client.json.set(key, '$', document);

      logger.debug('Embedding stored successfully', {
        embeddingId: embedding.id,
        contentId: embedding.contentId,
        contentType: embedding.contentType,
        dimensions: embedding.vector.length,
      });

    } catch (error) {
      logger.error('Failed to store embedding', {
        embeddingId: embedding.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async storeBatchEmbeddings(embeddings: VectorEmbedding[]): Promise<void> {
    try {
      const client = this.redisManager.getClient();
      const pipeline = client.multi();

      for (const embedding of embeddings) {
        const key = this.getEmbeddingKey(embedding.id);
        const document = {
          id: embedding.id,
          vector: embedding.vector,
          contentId: embedding.contentId,
          contentType: embedding.contentType,
          metadata: JSON.stringify(embedding.metadata),
          relationships: JSON.stringify(embedding.relationships),
          createdAt: embedding.createdAt.toISOString(),
          updatedAt: embedding.updatedAt.toISOString(),
        };

        pipeline.json.set(key, '$', document);
      }

      await pipeline.exec();

      logger.info('Batch embeddings stored successfully', {
        count: embeddings.length,
        contentTypes: [...new Set(embeddings.map(e => e.contentType))],
      });

    } catch (error) {
      logger.error('Failed to store batch embeddings', {
        count: embeddings.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getEmbedding(embeddingId: string): Promise<VectorEmbedding | null> {
    try {
      const client = this.redisManager.getClient();
      const key = this.getEmbeddingKey(embeddingId);

      const document = await client.json.get(key);
      
      if (!document) {
        return null;
      }

      return this.parseEmbeddingDocument(document);

    } catch (error) {
      logger.error('Failed to get embedding', {
        embeddingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async deleteEmbedding(embeddingId: string): Promise<boolean> {
    try {
      const client = this.redisManager.getClient();
      const key = this.getEmbeddingKey(embeddingId);

      const result = await client.del(key);
      
      logger.debug('Embedding deleted', {
        embeddingId,
        deleted: result > 0,
      });

      return result > 0;

    } catch (error) {
      logger.error('Failed to delete embedding', {
        embeddingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async searchSimilarVectors(
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const client = this.redisManager.getClient();
      const indexName = `${this.indexPrefix}:vectors`;
      
      const {
        limit = 10,
        threshold = 0.7,
        includeMetadata = true,
        includeVectors = false,
      } = options;

      // Build the search query
      const searchQuery = `*=>[KNN ${limit} @vector $query_vector AS score]`;
      
      const searchParams = {
        query_vector: Buffer.from(new Float32Array(queryVector).buffer),
      };

      // Execute the search
      const searchResult = await client.ft.search(indexName, searchQuery, {
        PARAMS: searchParams,
        RETURN: includeVectors ? 
          ['id', 'contentId', 'contentType', 'metadata', 'vector', 'score'] :
          ['id', 'contentId', 'contentType', 'metadata', 'score'],
        SORTBY: 'score',
        LIMIT: { from: 0, size: limit },
      });

      // Process results
      const results: VectorSearchResult[] = [];
      
      for (const doc of searchResult.documents) {
        const score = parseFloat(doc.value.score as string);
        
        // Filter by threshold
        if (score >= threshold) {
          const result: VectorSearchResult = {
            id: doc.value.id as string,
            score,
          };

          if (includeMetadata && doc.value.metadata) {
            result.metadata = JSON.parse(doc.value.metadata as string);
          }

          if (includeVectors) {
            // Reconstruct the full embedding if needed
            const embedding = await this.getEmbedding(doc.value.id as string);
            if (embedding) {
              result.embedding = embedding;
            }
          }

          results.push(result);
        }
      }

      logger.debug('Vector similarity search completed', {
        queryDimensions: queryVector.length,
        totalResults: searchResult.total,
        filteredResults: results.length,
        threshold,
        limit,
      });

      return results;

    } catch (error) {
      logger.error('Failed to search similar vectors', {
        queryDimensions: queryVector.length,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async searchByContentType(
    queryVector: number[],
    contentType: ContentType,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      const client = this.redisManager.getClient();
      const indexName = `${this.indexPrefix}:vectors`;
      
      const {
        limit = 10,
        threshold = 0.7,
        includeMetadata = true,
        includeVectors = false,
      } = options;

      // Build the search query with content type filter
      const searchQuery = `@contentType:{${contentType}}=>[KNN ${limit} @vector $query_vector AS score]`;
      
      const searchParams = {
        query_vector: Buffer.from(new Float32Array(queryVector).buffer),
      };

      // Execute the search
      const searchResult = await client.ft.search(indexName, searchQuery, {
        PARAMS: searchParams,
        RETURN: includeVectors ? 
          ['id', 'contentId', 'contentType', 'metadata', 'vector', 'score'] :
          ['id', 'contentId', 'contentType', 'metadata', 'score'],
        SORTBY: 'score',
        LIMIT: { from: 0, size: limit },
      });

      // Process results (same as searchSimilarVectors)
      const results: VectorSearchResult[] = [];
      
      for (const doc of searchResult.documents) {
        const score = parseFloat(doc.value.score as string);
        
        if (score >= threshold) {
          const result: VectorSearchResult = {
            id: doc.value.id as string,
            score,
          };

          if (includeMetadata && doc.value.metadata) {
            result.metadata = JSON.parse(doc.value.metadata as string);
          }

          if (includeVectors) {
            const embedding = await this.getEmbedding(doc.value.id as string);
            if (embedding) {
              result.embedding = embedding;
            }
          }

          results.push(result);
        }
      }

      logger.debug('Content type vector search completed', {
        contentType,
        queryDimensions: queryVector.length,
        totalResults: searchResult.total,
        filteredResults: results.length,
        threshold,
        limit,
      });

      return results;

    } catch (error) {
      logger.error('Failed to search vectors by content type', {
        contentType,
        queryDimensions: queryVector.length,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getEmbeddingsByContentId(contentId: string): Promise<VectorEmbedding[]> {
    try {
      const client = this.redisManager.getClient();
      const indexName = `${this.indexPrefix}:vectors`;

      // Search for embeddings with the specific content ID
      const searchResult = await client.ft.search(indexName, `@contentId:{${contentId}}`, {
        RETURN: ['id', 'contentId', 'contentType', 'metadata', 'vector', 'relationships', 'createdAt', 'updatedAt'],
      });

      const embeddings: VectorEmbedding[] = [];
      
      for (const doc of searchResult.documents) {
        const embedding = this.parseEmbeddingDocument(doc.value);
        embeddings.push(embedding);
      }

      logger.debug('Retrieved embeddings by content ID', {
        contentId,
        count: embeddings.length,
      });

      return embeddings;

    } catch (error) {
      logger.error('Failed to get embeddings by content ID', {
        contentId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async updateEmbeddingRelationships(
    embeddingId: string,
    relationships: VectorEmbedding['relationships']
  ): Promise<void> {
    try {
      const client = this.redisManager.getClient();
      const key = this.getEmbeddingKey(embeddingId);

      // Update only the relationships field
      await client.json.set(key, '$.relationships', relationships);
      await client.json.set(key, '$.updatedAt', new Date().toISOString());

      logger.debug('Embedding relationships updated', {
        embeddingId,
        relationships,
      });

    } catch (error) {
      logger.error('Failed to update embedding relationships', {
        embeddingId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async getStorageStats(): Promise<{
    totalEmbeddings: number;
    embeddingsByType: Record<ContentType, number>;
    indexInfo: any;
  }> {
    try {
      const client = this.redisManager.getClient();
      const indexName = `${this.indexPrefix}:vectors`;

      // Get index information
      const indexInfo = await this.redisManager.getIndexInfo(indexName);

      // Count embeddings by type
      const embeddingsByType: Record<ContentType, number> = {} as Record<ContentType, number>;
      let totalEmbeddings = 0;

      for (const contentType of Object.values(ContentType)) {
        try {
          const searchResult = await client.ft.search(indexName, `@contentType:{${contentType}}`, {
            LIMIT: { from: 0, size: 0 }, // Only get count
          });
          embeddingsByType[contentType] = searchResult.total;
          totalEmbeddings += searchResult.total;
        } catch (error) {
          embeddingsByType[contentType] = 0;
        }
      }

      logger.debug('Storage stats retrieved', {
        totalEmbeddings,
        embeddingsByType,
      });

      return {
        totalEmbeddings,
        embeddingsByType,
        indexInfo,
      };

    } catch (error) {
      logger.error('Failed to get storage stats', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  private getEmbeddingKey(embeddingId: string): string {
    return `${this.indexPrefix}:embedding:${embeddingId}`;
  }

  private parseEmbeddingDocument(document: any): VectorEmbedding {
    return {
      id: document.id,
      vector: Array.isArray(document.vector) ? document.vector : JSON.parse(document.vector),
      contentId: document.contentId,
      contentType: document.contentType as ContentType,
      metadata: typeof document.metadata === 'string' ? 
        JSON.parse(document.metadata) : document.metadata,
      relationships: typeof document.relationships === 'string' ? 
        JSON.parse(document.relationships) : document.relationships,
      createdAt: new Date(document.createdAt),
      updatedAt: new Date(document.updatedAt),
    };
  }
}