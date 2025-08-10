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
exports.CodeIntelligenceService = void 0;
__exportStar(require("./code-analyzer"), exports);
__exportStar(require("./code-generator"), exports);
__exportStar(require("./quality-analyzer"), exports);
const code_analyzer_1 = require("./code-analyzer");
const code_generator_1 = require("./code-generator");
const quality_analyzer_1 = require("./quality-analyzer");
class CodeIntelligenceService {
    analyzer;
    generator;
    qualityAnalyzer;
    constructor(redis, embeddingManager) {
        this.analyzer = new code_analyzer_1.CodeAnalyzer(redis, embeddingManager);
        this.generator = new code_generator_1.CodeGenerator(redis, embeddingManager, this.analyzer);
        this.qualityAnalyzer = new quality_analyzer_1.QualityAnalyzer(redis, this.analyzer);
    }
    async initialize() {
        // Initialize code intelligence service components
        logger_1.logger.info('Initializing Code Intelligence Service');
        // Set up Redis indices for code search
        await this.setupCodeIndices();
        // Load code patterns and templates
        await this.loadCodePatterns();
        logger_1.logger.info('Code Intelligence Service initialized successfully');
    }
    async shutdown() {
        // Cleanup logic when shutting down the service
        logger_1.logger.info('Shutting down Code Intelligence Service');
        // Save any pending analysis results
        await this.savePendingResults();
        logger_1.logger.info('Code Intelligence Service shutdown complete');
    }
    async setupCodeIndices() {
        // Set up vector indices for different programming languages
        const languages = ['typescript', 'javascript', 'python', 'java', 'csharp', 'cpp'];
        for (const language of languages) {
            const indexName = `code:${language}:index`;
            try {
                await this.analyzer['redis'].call('FT.CREATE', indexName, 'ON', 'HASH', 'PREFIX', '1', `code:${language}:`, 'SCHEMA', 'content', 'TEXT', 'path', 'TEXT', 'function_name', 'TEXT', 'class_name', 'TEXT', 'start_line', 'NUMERIC', 'end_line', 'NUMERIC', 'complexity', 'NUMERIC', 'embeddings', 'VECTOR', 'HNSW', '6', 'TYPE', 'FLOAT32', 'DIM', '1536', 'DISTANCE_METRIC', 'COSINE');
                logger_1.logger.info(`Created code index for ${language}`);
            }
            catch (error) {
                if (!error.message.includes('Index already exists')) {
                    logger_1.logger.error(`Failed to create code index for ${language}: ${error.message}`);
                }
            }
        }
    }
    async loadCodePatterns() {
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
            await this.analyzer['redis'].hset(`pattern:${pattern.id}`, 'data', JSON.stringify(pattern));
        }
        logger_1.logger.info(`Loaded ${patterns.length} code patterns`);
    }
    async savePendingResults() {
        // Save any pending analysis or generation results
        // This would be implemented based on specific requirements
    }
}
exports.CodeIntelligenceService = CodeIntelligenceService;
const logger_1 = require("../../utils/logger");
//# sourceMappingURL=index.js.map