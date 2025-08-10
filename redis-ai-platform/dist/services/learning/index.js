"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningService = void 0;
__exportStar(require("./behavior-tracker"), exports);
__exportStar(require("./pattern-analyzer"), exports);
__exportStar(require("./personalization-engine"), exports);
const behavior_tracker_1 = require("./behavior-tracker");
const pattern_analyzer_1 = require("./pattern-analyzer");
const personalization_engine_1 = require("./personalization-engine");
class LearningService {
    behaviorTracker;
    patternAnalyzer;
    personalizationEngine;
    constructor(redis) {
        this.behaviorTracker = new behavior_tracker_1.BehaviorTracker(redis);
        this.patternAnalyzer = new pattern_analyzer_1.PatternAnalyzer(redis, this.behaviorTracker);
        this.personalizationEngine = new personalization_engine_1.PersonalizationEngine(redis, this.behaviorTracker, this.patternAnalyzer);
    }
    async initialize() {
        // Initialize learning service components
        logger_1.logger.info('Initializing Learning Service');
        // Set up any required Redis data structures
        await this.setupRedisStructures();
        // Start background processes
        await this.startBackgroundProcesses();
        logger_1.logger.info('Learning Service initialized successfully');
    }
    async shutdown() {
        // Cleanup logic when shutting down the service
        logger_1.logger.info('Shutting down Learning Service');
        // Stop background processes
        await this.stopBackgroundProcesses();
        logger_1.logger.info('Learning Service shutdown complete');
    }
    async setupRedisStructures() {
        // Set up any required Redis indices or data structures
        // This could include creating time series for behavior tracking
        // or setting up vector indices for user similarity
    }
    async startBackgroundProcesses() {
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
    async stopBackgroundProcesses() {
        // Stop any running background processes
    }
    async runPatternAnalysisJob() {
        try {
            // Get list of active users
            const activeUsers = await this.getActiveUsers();
            // Analyze patterns for each user
            for (const userId of activeUsers) {
                try {
                    await this.patternAnalyzer.analyzeUserPatterns(userId);
                    await this.patternAnalyzer.updateUserSimilarity(userId);
                }
                catch (error) {
                    logger_1.logger.error(`Pattern analysis failed for user ${userId}: ${error.message}`);
                }
            }
            logger_1.logger.info(`Pattern analysis completed for ${activeUsers.length} users`);
        }
        catch (error) {
            logger_1.logger.error(`Pattern analysis job failed: ${error.message}`);
        }
    }
    async runModelUpdateJob() {
        try {
            // Update personalization models
            const activeUsers = await this.getActiveUsers();
            for (const userId of activeUsers) {
                try {
                    // This would trigger model retraining if needed
                    await this.personalizationEngine.getPersonalizationInsights(userId);
                }
                catch (error) {
                    logger_1.logger.error(`Model update failed for user ${userId}: ${error.message}`);
                }
            }
            logger_1.logger.info(`Model update completed for ${activeUsers.length} users`);
        }
        catch (error) {
            logger_1.logger.error(`Model update job failed: ${error.message}`);
        }
    }
    async getActiveUsers() {
        // Get list of users who have been active recently
        // This could query Redis for users with recent behavior data
        const userKeys = await this.behaviorTracker['redis'].keys('behavior:*');
        return userKeys.map(key => key.split(':')[1]).filter(Boolean);
    }
}
exports.LearningService = LearningService;
const logger_1 = require("../../utils/logger");
//# sourceMappingURL=index.js.map