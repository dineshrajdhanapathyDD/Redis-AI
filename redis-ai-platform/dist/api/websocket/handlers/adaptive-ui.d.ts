import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { APIServices } from '../../rest/index';
import { ConnectionInfo } from '../index';
export declare class AdaptiveUIHandler {
    private io;
    private redis;
    private services;
    constructor(io: SocketIOServer, redis: Redis, services: APIServices);
    setupHandlers(socket: any, connectionInfo: ConnectionInfo): void;
    private checkForAdaptations;
}
//# sourceMappingURL=adaptive-ui.d.ts.map