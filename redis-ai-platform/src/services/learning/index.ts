export * from './behavior-tracker';
export * from './pattern-analyzer';
export * from './personalization-engine';

import { Redis } from 'ioredis';
import { BehaviorTracker } from './behavior-tracker';
import { PatternAnalyzer } from './pattern-analyzer';
import { PersonalizationEngine } from './personalization-engine';

export class LearningService {
  public readonly behaviorTracker: BehaviorTracker;
  public readonly patternAnalyzer: PatternAnalyzer;
  public readonly personalizationEngine: PersonalizationEngine;

  constructor(redis: Redis) {
    this.behaviorTracker = new BehaviorTracker(redis);
    this.patternAnalyzer = new PatternAnalyzer(redis, this.behaviorTracker);
    this.personalizationEngine = new PersonalizationEngine(redis, this.behaviorTracker, this.patternAnalyzer);
  }

  async initialize(): Promise<void> {
    // Initialize learning service components
    logger.info('Initializing Learning Service');
    
    // Set up any required Redis data structures
    await this.setupRedisStructures();
    
    // Start background processes
    await this.startBackgroundProcesses();
    
    logger.info('Learning Service initialized successfully');
  }

  async shutdown(): Promise<void> {
    // Cleanup logic when shutting down the service
    logger.info('Shutting down Learning Service');
    
    // Stop background processes
    await this.stopBackgroundProcesses();
    
    logger.info('Learning Service shutdown complete');
  }

  private async setupRedisStructures(): Promise<void> {
    // Set up any required Redis indices or data structures
    // This could include creating time series for behavior tracking
    // or setting up vector indices for user similarity
  }

  private async startBackgroundProcesses(): Promise<void> {
    // Start background processes for:
    // - Pattern analysis
    // - Model updates
    // - Data cleanup
    
    // Example: Start pattern analysis job
    setInterval(async () => {
      await this.runPatternAnalysisJob();
    }, 60000 * 60); // Run every hour
    
    // Example: Start model update job
    setInterval(async () => {
      await this.runModelUpdateJob();
    }, 60000 * 60 * 24); // Run daily
  }

  private async stopBackgroundProcesses(): Promise<void> {
    // Stop any running background processes
  }

  private async runPatternAnalysisJob(): Promise<void> {
    try {
      // Get list of active users
      const activeUsers = await this.getActiveUsers();
      
      // Analyze patterns for each user
      for (const userId of activeUsers) {
        try {
          await this.patternAnalyzer.analyzeUserPatterns(userId);
          await this.patternAnalyzer.updateUserSimilarity(userId);
        } catch (error) {
          logger.error(`Pattern analysis failed for user ${userId}: ${error.message}`);
        }
      }
      
      logger.info(`Pattern analysis completed for ${activeUsers.length} users`);
    } catch (error) {
      logger.error(`Pattern analysis job failed: ${error.message}`);
    }
  }

  private async runModelUpdateJob(): Promise<void> {
    try {
      // Update personalization models
      const activeUsers = await this.getActiveUsers();
      
      for (const userId of activeUsers) {
        try {
          // This would trigger model retraining if needed
          await this.personalizationEngine.getPersonalizationInsights(userId);
        } catch (error) {
          logger.error(`Model update failed for user ${userId}: ${error.message}`);
        }
      }
      
      logger.info(`Model update completed for ${activeUsers.length} users`);
    } catch (error) {
      logger.error(`Model update job failed: ${error.message}`);
    }
  }

  private async getActiveUsers(): Promise<string[]> {
    // Get list of users who have been active recently
    // This could query Redis for users with recent behavior data
    const userKeys = await this.behaviorTracker['redis'].keys('behavior:*');
    return userKeys.map(key => key.split(':')[1]).filter(Boolean);
  }
}

import { logger } from '../../utils/logger';