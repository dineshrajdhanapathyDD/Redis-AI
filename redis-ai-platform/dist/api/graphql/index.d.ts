import { ApolloServer } from 'apollo-server-express';
import { Express } from 'express';
import { Redis } from 'ioredis';
import { APIServices } from '../rest/index';
export interface GraphQLConfig {
    path: string;
    subscriptionsPath: string;
    playground: boolean;
    introspection: boolean;
    cors: {
        origin: string[];
        credentials: boolean;
    };
    context: {
        enableAuth: boolean;
        enableRateLimit: boolean;
        rateLimitMax: number;
        rateLimitWindow: number;
    };
}
export declare class GraphQLAPI {
    private server;
    private subscriptionServer;
    private redis;
    private services;
    private config;
    private schema;
    constructor(redis: Redis, services: APIServices, config: GraphQLConfig);
    private createContext;
    private authenticateUser;
    private checkRateLimit;
    private formatError;
    private formatResponse;
    applyMiddleware(app: Express): Promise<void>;
    createSubscriptionServer(httpServer: any): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    getServer(): ApolloServer;
}
export declare const defaultGraphQLConfig: GraphQLConfig;
//# sourceMappingURL=index.d.ts.map