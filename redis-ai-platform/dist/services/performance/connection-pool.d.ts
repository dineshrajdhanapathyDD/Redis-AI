import { Redis } from 'ioredis';
import { ConnectionPoolConfig } from './types';
export declare class ConnectionPool {
    private connections;
    private config;
    private metrics;
    constructor(config: ConnectionPoolConfig);
    private initializePool;
    private createConnection;
    private removeConnection;
    acquire(): Promise<Redis>;
    private waitForConnection;
    release(client: Redis): void;
    private startMaintenanceTask;
    private performMaintenance;
    getMetrics(): any;
    close(): Promise<void>;
}
//# sourceMappingURL=connection-pool.d.ts.map