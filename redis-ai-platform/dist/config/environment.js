"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const joi_1 = __importDefault(require("joi"));
// Load environment variables
dotenv_1.default.config();
// Environment validation schema
const envSchema = joi_1.default.object({
    NODE_ENV: joi_1.default.string().valid('development', 'production', 'test').default('development'),
    PORT: joi_1.default.number().default(3000),
    API_VERSION: joi_1.default.string().default('v1'),
    LOG_LEVEL: joi_1.default.string().valid('error', 'warn', 'info', 'debug').default('info'),
    // Redis Configuration
    REDIS_HOST: joi_1.default.string().default('localhost'),
    REDIS_PORT: joi_1.default.number().default(6379),
    REDIS_PASSWORD: joi_1.default.string().optional(),
    REDIS_DB: joi_1.default.number().default(0),
    REDIS_CLUSTER_ENABLED: joi_1.default.boolean().default(false),
    REDIS_CLUSTER_NODES: joi_1.default.string().optional(),
    // Redis Vector Configuration
    REDIS_VECTOR_INDEX_PREFIX: joi_1.default.string().default('ai_platform'),
    REDIS_VECTOR_DIMENSIONS: joi_1.default.number().default(1536),
    REDIS_VECTOR_ALGORITHM: joi_1.default.string().valid('FLAT', 'HNSW').default('HNSW'),
    REDIS_VECTOR_M: joi_1.default.number().default(16),
    REDIS_VECTOR_EF_CONSTRUCTION: joi_1.default.number().default(200),
    // Security Configuration
    JWT_SECRET: joi_1.default.string().required(),
    JWT_EXPIRES_IN: joi_1.default.string().default('24h'),
    JWT_REFRESH_EXPIRES_IN: joi_1.default.string().default('7d'),
    BCRYPT_ROUNDS: joi_1.default.number().default(12),
    // AI Model Configuration
    OPENAI_API_KEY: joi_1.default.string().optional(),
    ANTHROPIC_API_KEY: joi_1.default.string().optional(),
    HUGGINGFACE_API_KEY: joi_1.default.string().optional(),
    // Embedding Configuration
    EMBEDDING_SERVICE: joi_1.default.string().valid('openai', 'huggingface', 'local').default('openai'),
    EMBEDDING_MODEL: joi_1.default.string().default('text-embedding-3-small'),
    EMBEDDING_DIMENSIONS: joi_1.default.number().default(1536),
    // Performance Configuration
    MAX_CONNECTIONS: joi_1.default.number().default(100),
    CONNECTION_TIMEOUT: joi_1.default.number().default(5000),
    COMMAND_TIMEOUT: joi_1.default.number().default(3000),
    RETRY_ATTEMPTS: joi_1.default.number().default(3),
    RETRY_DELAY: joi_1.default.number().default(1000),
    // Monitoring Configuration
    METRICS_ENABLED: joi_1.default.boolean().default(true),
    METRICS_PORT: joi_1.default.number().default(9090),
    HEALTH_CHECK_INTERVAL: joi_1.default.number().default(30000),
    // Development Configuration
    ENABLE_CORS: joi_1.default.boolean().default(true),
    ENABLE_SWAGGER: joi_1.default.boolean().default(true),
    ENABLE_DEBUG_LOGS: joi_1.default.boolean().default(false),
}).unknown();
// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}
// Create configuration object
const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    apiVersion: envVars.API_VERSION,
    logLevel: envVars.LOG_LEVEL,
    redis: {
        host: envVars.REDIS_HOST,
        port: envVars.REDIS_PORT,
        password: envVars.REDIS_PASSWORD,
        db: envVars.REDIS_DB,
        clusterEnabled: envVars.REDIS_CLUSTER_ENABLED,
        clusterNodes: envVars.REDIS_CLUSTER_NODES ?
            envVars.REDIS_CLUSTER_NODES.split(',') : undefined,
        maxConnections: envVars.MAX_CONNECTIONS,
        connectionTimeout: envVars.CONNECTION_TIMEOUT,
        commandTimeout: envVars.COMMAND_TIMEOUT,
        retryAttempts: envVars.RETRY_ATTEMPTS,
        retryDelay: envVars.RETRY_DELAY,
    },
    vectorIndex: {
        indexName: `${envVars.REDIS_VECTOR_INDEX_PREFIX}:vectors`,
        prefix: `${envVars.REDIS_VECTOR_INDEX_PREFIX}:`,
        dimensions: envVars.REDIS_VECTOR_DIMENSIONS,
        algorithm: envVars.REDIS_VECTOR_ALGORITHM,
        distanceMetric: 'COSINE',
        m: envVars.REDIS_VECTOR_M,
        efConstruction: envVars.REDIS_VECTOR_EF_CONSTRUCTION,
    },
    security: {
        jwtSecret: envVars.JWT_SECRET,
        jwtExpiresIn: envVars.JWT_EXPIRES_IN,
        jwtRefreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
        bcryptRounds: envVars.BCRYPT_ROUNDS,
    },
    ai: {
        openaiApiKey: envVars.OPENAI_API_KEY,
        anthropicApiKey: envVars.ANTHROPIC_API_KEY,
        huggingfaceApiKey: envVars.HUGGINGFACE_API_KEY,
    },
    embedding: {
        service: envVars.EMBEDDING_SERVICE,
        model: envVars.EMBEDDING_MODEL,
        dimensions: envVars.EMBEDDING_DIMENSIONS,
    },
    performance: {
        maxConnections: envVars.MAX_CONNECTIONS,
        connectionTimeout: envVars.CONNECTION_TIMEOUT,
        commandTimeout: envVars.COMMAND_TIMEOUT,
        retryAttempts: envVars.RETRY_ATTEMPTS,
        retryDelay: envVars.RETRY_DELAY,
    },
    monitoring: {
        enabled: envVars.METRICS_ENABLED,
        port: envVars.METRICS_PORT,
        healthCheckInterval: envVars.HEALTH_CHECK_INTERVAL,
    },
    development: {
        enableCors: envVars.ENABLE_CORS,
        enableSwagger: envVars.ENABLE_SWAGGER,
        enableDebugLogs: envVars.ENABLE_DEBUG_LOGS,
    },
};
exports.default = config;
//# sourceMappingURL=environment.js.map