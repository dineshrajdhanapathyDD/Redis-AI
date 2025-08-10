export * from './code-analyzer';
export * from './code-generator';
export * from './quality-analyzer';

import { Redis } from 'ioredis';
import { EmbeddingManager } from '../embedding-manager';
import { CodeAnalyzer } from './code-analyzer';
import { CodeGenerator } from './code-generator';
import { QualityAnalyzer } from './quality-analyzer';

export class CodeIntelligenceService {
  public readonly analyzer: CodeAnalyzer;
  public readonly generator: CodeGenerator;
  public readonly qualityAnalyzer: QualityAnalyzer;

  constructor(redis: Redis, embeddingManager: EmbeddingManager) {
    this.analyzer = new CodeAnalyzer(redis, embeddingManager);
    this.generator = new CodeGenerator(redis, embeddingManager, this.analyzer);
    this.qualityAnalyzer = new QualityAnalyzer(redis, this.analyzer);
  }

  async initialize(): Promise<void> {
    // Initialize code intelligence service components
    logger.info('Initializing Code Intelligence Service');
    
    // Set up Redis indices for code search
    await this.setupCodeIndices();
    
    // Load code patterns and templates
    await this.loadCodePatterns();
    
    logger.info('Code Intelligence Service initialized successfully');
  }

  async shutdown(): Promise<void> {
    // Cleanup logic when shutting down the service
    logger.info('Shutting down Code Intelligence Service');
    
    // Save any pending analysis results
    await this.savePendingResults();
    
    logger.info('Code Intelligence Service shutdown complete');
  }

  private async setupCodeIndices(): Promise<void> {
    // Set up vector indices for different programming languages
    const languages = ['typescript', 'javascript', 'python', 'java', 'csharp', 'cpp'];
    
    for (const language of languages) {
      const indexName = `code:${language}:index`;
      
      try {
        await this.analyzer['redis'].call('FT.CREATE', indexName,
          'ON', 'HASH',
          'PREFIX', '1', `code:${language}:`,
          'SCHEMA',
          'content', 'TEXT',
          'path', 'TEXT',
          'function_name', 'TEXT',
          'class_name', 'TEXT',
          'start_line', 'NUMERIC',
          'end_line', 'NUMERIC',
          'complexity', 'NUMERIC',
          'embeddings', 'VECTOR', 'HNSW', '6',
          'TYPE', 'FLOAT32',
          'DIM', '1536',
          'DISTANCE_METRIC', 'COSINE'
        );
        logger.info(`Created code index for ${language}`);
      } catch (error) {
        if (!error.message.includes('Index already exists')) {
          logger.error(`Failed to create code index for ${language}: ${error.message}`);
        }
      }
    }
  }

  private async loadCodePatterns(): Promise<void> {
    // Load common code patterns and anti-patterns
    const patterns = [
      {
        id: 'singleton',
        name: 'Singleton Pattern',
        category: 'design_pattern',
        description: 'Ensures a class has only one instance',
        pattern: 'class.*private.*constructor.*static.*getInstance'
      },
      {
        id: 'factory',
        name: 'Factory Pattern',
        category: 'design_pattern',
        description: 'Creates objects without specifying exact classes',
        pattern: 'create.*return.*new'
      },
      {
        id: 'god-class',
        name: 'God Class',
        category: 'anti_pattern',
        description: 'Class with too many responsibilities',
        pattern: 'class.*{[^}]{500,}}'
      }
    ];

    for (const pattern of patterns) {
      await this.analyzer['redis'].hset(
        `pattern:${pattern.id}`,
        'data', JSON.stringify(pattern)
      );
    }

    logger.info(`Loaded ${patterns.length} code patterns`);
  }

  private async savePendingResults(): Promise<void> {
    // Save any pending analysis or generation results
    // This would be implemented based on specific requirements
  }
}

import { logger } from '../../utils/logger';