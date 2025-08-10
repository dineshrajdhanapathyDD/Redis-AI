"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisConnectionManager = void 0;
exports.createRedisManager = createRedisManager;
exports.getRedisManager = getRedisManager;
const redis_1 = require("redis");
const search_1 = require("@redis/search");
const logger_1 = __importDefault(require("@/utils/logger"));
class RedisConnectionManager {
    client = null;
    config;
    isConnected = false;
    reconnectAttempts = 0;
    constructor(config) {
        this.config = config;
    }
    async connect() {
        try {
            if (this.config.clusterEnabled && this.config.clusterNodes) {
                // Create Redis Cluster connection
                this.client = (0, redis_1.createCluster)({
                    rootNodes: this.config.clusterNodes.map(node => {
                        const [host, port] = node.split(':');
                        return { url: `redis://${host}:${port}` };
                    }),
                    defaults: {
                        password: this.config.password,
                        socket: {
                            connectTimeout: this.config.connectionTimeout,
                            commandTimeout: this.config.commandTimeout,
                        },
                    },
                });
            }
            else {
                // Create single Redis connection
                this.client = (0, redis_1.createClient)({
                    url: `redis://${this.config.host}:${this.config.port}`,
                    password: this.config.password,
                    database: this.config.db,
                    socket: {
                        connectTimeout: this.config.connectionTimeout,
                        commandTimeout: this.config.commandTimeout,
                        reconnectStrategy: (retries) => {
                            if (retries >= this.config.retryAttempts) {
                                logger_1.default.error('Redis connection failed after maximum retry attempts');
                                return false;
                            }
                            const delay = Math.min(this.config.retryDelay * Math.pow(2, retries), 30000);
                            logger_1.default.warn(`Redis reconnection attempt ${retries + 1} in ${delay}ms`);
                            return delay;
                        },
                    },
                });
            }
            // Set up event listeners
            this.setupEventListeners();
            // Connect to Redis
            await this.client.connect();
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger_1.default.info('Redis connection established successfully', {
                cluster: this.config.clusterEnabled,
                host: this.config.host,
                port: this.config.port,
            });
            return this.client;
        }
        catch (error) {
            logger_1.default.error('Failed to connect to Redis', { error });
            throw error;
        }
    }
    setupEventListeners() {
        if (!this.client)
            return;
        this.client.on('connect', () => {
            logger_1.default.info('Redis client connected');
            this.isConnected = true;
        });
        this.client.on('ready', () => {
            logger_1.default.info('Redis client ready');
        });
        this.client.on('error', (error) => {
            logger_1.default.error('Redis client error', { error });
            this.isConnected = false;
        });
        this.client.on('end', () => {
            logger_1.default.warn('Redis client connection ended');
            this.isConnected = false;
        });
        this.client.on('reconnecting', () => {
            this.reconnectAttempts++;
            logger_1.default.info(`Redis client reconnecting (attempt ${this.reconnectAttempts})`);
        });
    }
    async disconnect() {
        if (this.client && this.isConnected) {
            await this.client.disconnect();
            this.isConnected = false;
            logger_1.default.info('Redis connection closed');
        }
    }
    getClient() {
        if (!this.client || !this.isConnected) {
            throw new Error('Redis client is not connected');
        }
        return this.client;
    }
    isClientConnected() {
        return this.isConnected;
    }
    async ping() {
        const client = this.getClient();
        return await client.ping();
    }
    async createVectorIndex(config) {
        try {
            const client = this.getClient();
            // Check if index already exists
            try {
                await client.ft.info(config.indexName);
                logger_1.default.info(`Vector index ${config.indexName} already exists`);
                return;
            }
            catch (error) {
                // Index doesn't exist, create it
            }
            const schema = {
                '$.vector': {
                    type: search_1.SchemaFieldTypes.VECTOR,
                    ALGORITHM: config.algorithm,
                    TYPE: 'FLOAT32',
                    DIM: config.dimensions,
                    DISTANCE_METRIC: config.distanceMetric,
                    ...(config.algorithm === 'HNSW' && {
                        M: config.m || 16,
                        EF_CONSTRUCTION: config.efConstruction || 200,
                    }),
                },
                '$.content': search_1.SchemaFieldTypes.TEXT,
                '$.contentType': search_1.SchemaFieldTypes.TAG,
                '$.timestamp': search_1.SchemaFieldTypes.NUMERIC,
                '$.metadata': search_1.SchemaFieldTypes.TEXT,
            };
            await client.ft.create(config.indexName, schema, {
                ON: 'JSON',
                PREFIX: config.prefix,
            });
            logger_1.default.info(`Vector index ${config.indexName} created successfully`, {
                dimensions: config.dimensions,
                algorithm: config.algorithm,
                distanceMetric: config.distanceMetric,
            });
        }
        catch (error) {
            logger_1.default.error(`Failed to create vector index ${config.indexName}`, { error });
            throw error;
        }
    }
    async dropVectorIndex(indexName) {
        try {
            const client = this.getClient();
            await client.ft.dropIndex(indexName);
            logger_1.default.info(`Vector index ${indexName} dropped successfully`);
        }
        catch (error) {
            logger_1.default.error(`Failed to drop vector index ${indexName}`, { error });
            throw error;
        }
    }
    async getIndexInfo(indexName) {
        try {
            const client = this.getClient();
            return await client.ft.info(indexName);
        }
        catch (error) {
            logger_1.default.error(`Failed to get index info for ${indexName}`, { error });
            throw error;
        }
    }
}
exports.RedisConnectionManager = RedisConnectionManager;
// Singleton instance
let redisManager = null;
function createRedisManager(config) {
    if (!redisManager) {
        redisManager = new RedisConnectionManager(config);
    }
    return redisManager;
}
function getRedisManager() {
    if (!redisManager) {
        throw new Error('Redis manager not initialized. Call createRedisManager first.');
    }
    return redisManager;
}
//# sourceMappingURL=redis.js.map