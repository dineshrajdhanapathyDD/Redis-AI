import { createClient, RedisClientType, RedisClusterType, createCluster } from 'redis';
import { SchemaFieldTypes, VectorAlgorithms } from '@redis/search';
import logger from '@/utils/logger';

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  clusterEnabled: boolean;
  clusterNodes?: string[];
  maxConnections: number;
  connectionTimeout: number;
  commandTimeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface VectorIndexConfig {
  indexName: string;
  prefix: string;
  dimensions: number;
  algorithm: 'FLAT' | 'HNSW';
  distanceMetric: 'L2' | 'IP' | 'COSINE';
  m?: number; // HNSW parameter
  efConstruction?: number; // HNSW parameter
}

export class RedisConnectionManager {
  private client: RedisClientType | RedisClusterType | null = null;
  private config: RedisConfig;
  private isConnected = false;
  private reconnectAttempts = 0;

  constructor(config: RedisConfig) {
    this.config = config;
  }

  async connect(): Promise<RedisClientType | RedisClusterType> {
    try {
      if (this.config.clusterEnabled && this.config.clusterNodes) {
        // Create Redis Cluster connection
        this.client = createCluster({
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
      } else {
        // Create single Redis connection
        this.client = createClient({
          url: `redis://${this.config.host}:${this.config.port}`,
          password: this.config.password,
          database: this.config.db,
          socket: {
            connectTimeout: this.config.connectionTimeout,
            commandTimeout: this.config.commandTimeout,
            reconnectStrategy: (retries) => {
              if (retries >= this.config.retryAttempts) {
                logger.error('Redis connection failed after maximum retry attempts');
                return false;
              }
              const delay = Math.min(this.config.retryDelay * Math.pow(2, retries), 30000);
              logger.warn(`Redis reconnection attempt ${retries + 1} in ${delay}ms`);
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

      logger.info('Redis connection established successfully', {
        cluster: this.config.clusterEnabled,
        host: this.config.host,
        port: this.config.port,
      });

      return this.client;
    } catch (error) {
      logger.error('Failed to connect to Redis', { error });
      throw error;
    }
  }

  private setupEventListeners(): void {
    if (!this.client) return;

    this.client.on('connect', () => {
      logger.info('Redis client connected');
      this.isConnected = true;
    });

    this.client.on('ready', () => {
      logger.info('Redis client ready');
    });

    this.client.on('error', (error) => {
      logger.error('Redis client error', { error });
      this.isConnected = false;
    });

    this.client.on('end', () => {
      logger.warn('Redis client connection ended');
      this.isConnected = false;
    });

    this.client.on('reconnecting', () => {
      this.reconnectAttempts++;
      logger.info(`Redis client reconnecting (attempt ${this.reconnectAttempts})`);
    });
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.disconnect();
      this.isConnected = false;
      logger.info('Redis connection closed');
    }
  }

  getClient(): RedisClientType | RedisClusterType {
    if (!this.client || !this.isConnected) {
      throw new Error('Redis client is not connected');
    }
    return this.client;
  }

  isClientConnected(): boolean {
    return this.isConnected;
  }

  async ping(): Promise<string> {
    const client = this.getClient();
    return await client.ping();
  }

  async createVectorIndex(config: VectorIndexConfig): Promise<void> {
    try {
      const client = this.getClient();
      
      // Check if index already exists
      try {
        await client.ft.info(config.indexName);
        logger.info(`Vector index ${config.indexName} already exists`);
        return;
      } catch (error) {
        // Index doesn't exist, create it
      }

      const schema = {
        '$.vector': {
          type: SchemaFieldTypes.VECTOR,
          ALGORITHM: config.algorithm,
          TYPE: 'FLOAT32',
          DIM: config.dimensions,
          DISTANCE_METRIC: config.distanceMetric,
          ...(config.algorithm === 'HNSW' && {
            M: config.m || 16,
            EF_CONSTRUCTION: config.efConstruction || 200,
          }),
        } as any,
        '$.content': SchemaFieldTypes.TEXT,
        '$.contentType': SchemaFieldTypes.TAG,
        '$.timestamp': SchemaFieldTypes.NUMERIC,
        '$.metadata': SchemaFieldTypes.TEXT,
      };

      await client.ft.create(config.indexName, schema, {
        ON: 'JSON',
        PREFIX: config.prefix,
      });

      logger.info(`Vector index ${config.indexName} created successfully`, {
        dimensions: config.dimensions,
        algorithm: config.algorithm,
        distanceMetric: config.distanceMetric,
      });
    } catch (error) {
      logger.error(`Failed to create vector index ${config.indexName}`, { error });
      throw error;
    }
  }

  async dropVectorIndex(indexName: string): Promise<void> {
    try {
      const client = this.getClient();
      await client.ft.dropIndex(indexName);
      logger.info(`Vector index ${indexName} dropped successfully`);
    } catch (error) {
      logger.error(`Failed to drop vector index ${indexName}`, { error });
      throw error;
    }
  }

  async getIndexInfo(indexName: string): Promise<any> {
    try {
      const client = this.getClient();
      return await client.ft.info(indexName);
    } catch (error) {
      logger.error(`Failed to get index info for ${indexName}`, { error });
      throw error;
    }
  }
}

// Singleton instance
let redisManager: RedisConnectionManager | null = null;

export function createRedisManager(config: RedisConfig): RedisConnectionManager {
  if (!redisManager) {
    redisManager = new RedisConnectionManager(config);
  }
  return redisManager;
}

export function getRedisManager(): RedisConnectionManager {
  if (!redisManager) {
    throw new Error('Redis manager not initialized. Call createRedisManager first.');
  }
  return redisManager;
}