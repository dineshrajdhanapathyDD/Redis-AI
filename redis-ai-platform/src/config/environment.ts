import dotenv from 'dotenv';
import Joi from 'joi';
import { RedisConfig, VectorIndexConfig } from './redis';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_VERSION: Joi.string().default('v1'),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),

  // Redis Configuration
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().optional(),
  REDIS_DB: Joi.number().default(0),
  REDIS_CLUSTER_ENABLED: Joi.boolean().default(false),
  REDIS_CLUSTER_NODES: Joi.string().optional(),

  // Redis Vector Configuration
  REDIS_VECTOR_INDEX_PREFIX: Joi.string().default('ai_platform'),
  REDIS_VECTOR_DIMENSIONS: Joi.number().default(1536),
  REDIS_VECTOR_ALGORITHM: Joi.string().valid('FLAT', 'HNSW').default('HNSW'),
  REDIS_VECTOR_M: Joi.number().default(16),
  REDIS_VECTOR_EF_CONSTRUCTION: Joi.number().default(200),

  // Security Configuration
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
  BCRYPT_ROUNDS: Joi.number().default(12),

  // AI Model Configuration
  OPENAI_API_KEY: Joi.string().optional(),
  ANTHROPIC_API_KEY: Joi.string().optional(),
  HUGGINGFACE_API_KEY: Joi.string().optional(),

  // Embedding Configuration
  EMBEDDING_SERVICE: Joi.string().valid('openai', 'huggingface', 'local').default('openai'),
  EMBEDDING_MODEL: Joi.string().default('text-embedding-3-small'),
  EMBEDDING_DIMENSIONS: Joi.number().default(1536),

  // Performance Configuration
  MAX_CONNECTIONS: Joi.number().default(100),
  CONNECTION_TIMEOUT: Joi.number().default(5000),
  COMMAND_TIMEOUT: Joi.number().default(3000),
  RETRY_ATTEMPTS: Joi.number().default(3),
  RETRY_DELAY: Joi.number().default(1000),

  // Monitoring Configuration
  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().default(9090),
  HEALTH_CHECK_INTERVAL: Joi.number().default(30000),

  // Development Configuration
  ENABLE_CORS: Joi.boolean().default(true),
  ENABLE_SWAGGER: Joi.boolean().default(true),
  ENABLE_DEBUG_LOGS: Joi.boolean().default(false),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export interface AppConfig {
  env: string;
  port: number;
  apiVersion: string;
  logLevel: string;
  redis: RedisConfig;
  vectorIndex: VectorIndexConfig;
  security: {
    jwtSecret: string;
    jwtExpiresIn: string;
    jwtRefreshExpiresIn: string;
    bcryptRounds: number;
  };
  ai: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    huggingfaceApiKey?: string;
  };
  embedding: {
    service: string;
    model: string;
    dimensions: number;
  };
  performance: {
    maxConnections: number;
    connectionTimeout: number;
    commandTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  monitoring: {
    enabled: boolean;
    port: number;
    healthCheckInterval: number;
  };
  development: {
    enableCors: boolean;
    enableSwagger: boolean;
    enableDebugLogs: boolean;
  };
}

// Create configuration object
const config: AppConfig = {
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
    algorithm: envVars.REDIS_VECTOR_ALGORITHM as 'FLAT' | 'HNSW',
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

export default config;