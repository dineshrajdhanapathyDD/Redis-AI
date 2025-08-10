import { RedisConfig, VectorIndexConfig } from './redis';
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
declare const config: AppConfig;
export default config;
//# sourceMappingURL=environment.d.ts.map