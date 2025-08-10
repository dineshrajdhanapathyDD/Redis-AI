import { RedisClientType, RedisClusterType } from 'redis';
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
    m?: number;
    efConstruction?: number;
}
export declare class RedisConnectionManager {
    private client;
    private config;
    private isConnected;
    private reconnectAttempts;
    constructor(config: RedisConfig);
    connect(): Promise<RedisClientType | RedisClusterType>;
    private setupEventListeners;
    disconnect(): Promise<void>;
    getClient(): RedisClientType | RedisClusterType;
    isClientConnected(): boolean;
    ping(): Promise<string>;
    createVectorIndex(config: VectorIndexConfig): Promise<void>;
    dropVectorIndex(indexName: string): Promise<void>;
    getIndexInfo(indexName: string): Promise<any>;
}
export declare function createRedisManager(config: RedisConfig): RedisConnectionManager;
export declare function getRedisManager(): RedisConnectionManager;
//# sourceMappingURL=redis.d.ts.map