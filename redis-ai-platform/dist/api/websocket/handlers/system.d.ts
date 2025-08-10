import { Server as SocketIOServer } from 'socket.io';
import { Redis } from 'ioredis';
import { APIServices } from '../../rest/index';
import { ConnectionInfo } from '../index';
export declare class SystemHandler {
    private io;
    private redis;
    private services;
    private metricsInterval;
    private alertsInterval;
    constructor(io: SocketIOServer, redis: Redis, services: APIServices);
    setupHandlers(socket: any, connectionInfo: ConnectionInfo): void;
    private startSystemMonitoring;
    private getSystemStatus;
    private getSystemMetrics;
    private getSystemHealth;
    private getSystemStats;
    private checkSystemAlerts;
    private parseRedisInfo;
    shutdown(): void;
}
//# sourceMappingURL=system.d.ts.map