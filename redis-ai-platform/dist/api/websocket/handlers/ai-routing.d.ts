import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { APIServices } from '../../rest/index';
import { ConnectionInfo } from '../index';
export declare class AIRoutingHandler {
    private io;
    private redis;
    private services;
    constructor(io: SocketIOServer, redis: Redis, services: APIServices);
    setupHandlers(socket: any, connectionInfo: ConnectionInfo): void;
    broadcastModelStatusChange(modelId: string, status: string, metadata?: any): Promise<void>;
    broadcastMetricsUpdate(metrics: any): Promise<void>;
}
//# sourceMappingURL=ai-routing.d.ts.map