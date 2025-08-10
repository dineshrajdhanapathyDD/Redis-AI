import { BaseEmbeddingProvider, EmbeddingConfig } from './base';
import { Content, ContentType } from '@/types';
import logger from '@/utils/logger';

// Simple local embedding provider for development and testing
// In production, this could be replaced with a local model server
export class LocalEmbeddingProvider extends BaseEmbeddingProvider {
  private vocabulary: Map<string, number> = new Map();
  private idfScores: Map<string, number> = new Map();
  private documentCount = 0;

  constructor(config: EmbeddingConfig) {
    super(config, [ContentType.TEXT, ContentType.CODE]);
    this.initializeVocabulary();
  }

  async generateEmbedding(content: Content): Promise<number[]> {
    this.validateContent(content);

    return this.measurePerformance(
      async () => {
        const text = this.preprocessContent(content);
        const embedding = this.generateTFIDFEmbedding(text);
        
        logger.debug('Local embedding generated', {
          contentId: content.id,
          contentType: content.type,
          dimensions: embedding.length,
          method: 'TF-IDF',
        });

        return embedding;
      },
      'generateEmbedding',
      content.type
    );
  }

  private preprocessContent(content: Content): string {
    let text: string;

    if (typeof content.data === 'string') {
      text = content.data;
    } else if (Buffer.isBuffer(content.data)) {
      text = content.data.toString('utf-8');
    } else {
      throw new Error('Unsupported content data type for local embedding');
    }

    // Basic text preprocessing
    text = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    // Add metadata context
    if (content.metadata.title) {
      text = `${content.metadata.title} ${text}`;
    }

    if (content.metadata.tags.length > 0) {
      text = `${text} ${content.metadata.tags.join(' ')}`;
    }

    return text;
  }

  private generateTFIDFEmbedding(text: string): number[] {
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const wordCounts = new Map<string, number>();
    
    // Count word frequencies
    for (const word of words) {
      wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
    }

    // Update vocabulary and document count
    this.updateVocabulary(words);
    this.documentCount++;

    // Generate TF-IDF vector
    const embedding = new Array(this.config.dimensions).fill(0);
    
    for (const [word, count] of wordCounts) {
      const wordIndex = this.vocabulary.get(word);
      if (wordIndex !== undefined && wordIndex < this.config.dimensions) {
        const tf = count / words.length; // Term frequency
        const idf = this.idfScores.get(word) || 1; // Inverse document frequency
        embedding[wordIndex] = tf * idf;
      }
    }

    // Add some randomness to make embeddings more realistic
    for (let i = 0; i < embedding.length; i++) {
      if (embedding[i] === 0) {
        embedding[i] = (Math.random() - 0.5) * 0.01; // Small random values
      }
    }

    // Normalize the vector
    return this.normalizeVector(embedding);
  }

  private updateVocabulary(words: string[]): void {
    const uniqueWords = new Set(words);
    
    for (const word of uniqueWords) {
      if (!this.vocabulary.has(word) && this.vocabulary.size < this.config.dimensions) {
        this.vocabulary.set(word, this.vocabulary.size);
      }
      
      // Update IDF scores
      const currentIdf = this.idfScores.get(word) || 0;
      this.idfScores.set(word, currentIdf + 1);
    }

    // Recalculate IDF scores
    for (const [word, docFreq] of this.idfScores) {
      const idf = Math.log(this.documentCount / docFreq);
      this.idfScores.set(word, idf);
    }
  }

  private normalizeVector(vector: number[]): number[] {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (norm === 0) {
      return vector;
    }

    return vector.map(val => val / norm);
  }

  private initializeVocabulary(): void {
    // Initialize with common words for better embeddings
    const commonWords = [
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
      'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
      'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
      'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
      'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
      'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
      'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
      'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
      'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first',
      'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day',
      'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had', 'were', 'said',
      'each', 'which', 'their', 'time', 'will', 'about', 'if', 'up', 'out', 'many',
      // Code-specific terms
      'function', 'class', 'method', 'variable', 'return', 'import', 'export',
      'const', 'let', 'var', 'if', 'else', 'for', 'while', 'try', 'catch',
      'async', 'await', 'promise', 'callback', 'array', 'object', 'string',
      'number', 'boolean', 'null', 'undefined', 'true', 'false',
    ];

    commonWords.forEach((word, index) => {
      if (index < this.config.dimensions) {
        this.vocabulary.set(word, index);
        this.idfScores.set(word, 1);
      }
    });

    logger.info('Local embedding vocabulary initialized', {
      vocabularySize: this.vocabulary.size,
      dimensions: this.config.dimensions,
    });
  }

  // Method to get vocabulary statistics
  getVocabularyStats(): { size: number; documentCount: number; topWords: string[] } {
    const sortedWords = Array.from(this.idfScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([word]) => word);

    return {
      size: this.vocabulary.size,
      documentCount: this.documentCount,
      topWords: sortedWords,
    };
  }

  // Method to save vocabulary (for persistence)
  exportVocabulary(): { vocabulary: [string, number][]; idfScores: [string, number][]; documentCount: number } {
    return {
      vocabulary: Array.from(this.vocabulary.entries()),
      idfScores: Array.from(this.idfScores.entries()),
      documentCount: this.documentCount,
    };
  }

  // Method to load vocabulary (for persistence)
  importVocabulary(data: { vocabulary: [string, number][]; idfScores: [string, number][]; documentCount: number }): void {
    this.vocabulary = new Map(data.vocabulary);
    this.idfScores = new Map(data.idfScores);
    this.documentCount = data.documentCount;

    logger.info('Local embedding vocabulary imported', {
      vocabularySize: this.vocabulary.size,
      documentCount: this.documentCount,
    });
  }
}