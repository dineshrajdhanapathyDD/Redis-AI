import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { APIServices } from '../../rest/index';
import { ConnectionInfo } from '../index';
export declare class LearningHandler {
    private io;
    private redis;
    private services;
    constructor(io: SocketIOServer, redis: Redis, services: APIServices);
    setupHandlers(socket: any, connectionInfo: ConnectionInfo): void;
    broadcastNewRecommendation(userId: string, recommendation: any): Promise<void>;
    broadcastPatternDiscovered(userId: string, pattern: any): Promise<void>;
}
//# sourceMappingURL=learning.d.ts.map