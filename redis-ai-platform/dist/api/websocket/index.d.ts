import { Server as HTTPServer } from 'http';
import { Redis } from 'ioredis';
import { APIServices } from '../rest/index';
export interface WebSocketConfig {
    cors: {
        origin: string[];
        methods: string[];
        credentials: boolean;
    };
    connectionTimeout: number;
    pingTimeout: number;
    pingInterval: number;
    maxConnections: number;
    enableAuth: boolean;
    enableRateLimit: boolean;
    rateLimitMax: number;
    rateLimitWindow: number;
}
export interface SocketUser {
    id: string;
    email?: string;
    role?: string;
    workspaces?: string[];
    connectedAt: Date;
    lastActivity: Date;
}
export interface ConnectionInfo {
    id: string;
    userId?: string;
    user?: SocketUser;
    ipAddress: string;
    userAgent: string;
    connectedAt: Date;
    lastActivity: Date;
    subscriptions: Set<string>;
    rateLimitCount: number;
    rateLimitResetTime: number;
}
export declare class WebSocketGateway {
    private io;
    private redis;
    private services;
    private config;
    private connections;
    private userConnections;
    private workspaceHandler;
    private learningHandler;
    private adaptiveUIHandler;
    private systemHandler;
    private aiRoutingHandler;
    n: any;
    private searchHandler;
    constructor(httpServer: HTTPServer, redis: Redis, services: APIServices, config: WebSocketConfig);
    private setupMiddleware;
    private setupEventHandlers;
    private handleConnection;
    private setupSocketHandlers;
    private handleSubscription;
    private handleUnsubscription;
    private handleDisconnection;
    private cleanupSocketSubscriptions;
    private setupRedisSubscriptions;
    private handleRedisMessage;
    private authenticateToken;
    private canSubscribeToChannel;
    private startCleanupInterval;
    private cleanupInactiveConnections;
    private cleanupRedisSubscriptions;
    broadcast(event: string, data: any): void;
    broadcastToRoom(room: string, event: string, data: any): void;
    emitToUser(userId: string, event: string, data: any): void;
    publishToRedis(channel: string, data: any): Promise<void>;
    getStats(): any;
    getConnectionInfo(socketId: string): ConnectionInfo | undefined;
    getUserConnections(userId: string): string[];
    shutdown(): Promise<void>;
}
export declare const defaultWebSocketConfig: WebSocketConfig;
//# sourceMappingURL=index.d.ts.map