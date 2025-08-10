import { Socket } from 'socket.io';
import { Redis } from 'ioredis';
import { MonitoringService } from '../../../services/monitoring';
export interface MonitoringHandlers {
    subscribeToMetrics: (socket: Socket, data: {
        types?: string[];
        interval?: number;
    }) => void;
    subscribeToAlerts: (socket: Socket) => void;
    subscribeToHealth: (socket: Socket, data: {
        services?: string[];
    }) => void;
    subscribeToTraces: (socket: Socket, data: {
        filters?: any;
    }) => void;
    unsubscribeFromMetrics: (socket: Socket) => void;
    unsubscribeFromAlerts: (socket: Socket) => void;
    unsubscribeFromHealth: (socket: Socket) => void;
    unsubscribeFromTraces: (socket: Socket) => void;
    getDashboardData: (socket: Socket, data: {
        section?: string;
    }) => void;
    acknowledgeAlert: (socket: Socket, data: {
        alertId: string;
        userId: string;
    }) => void;
    resolveAlert: (socket: Socket, data: {
        alertId: string;
        userId: string;
    }) => void;
}
export declare function createMonitoringHandlers(redis: Redis, monitoring: MonitoringService): MonitoringHandlers;
//# sourceMappingURL=monitoring.d.ts.map