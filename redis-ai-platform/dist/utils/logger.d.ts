import winston from 'winston';
declare const logger: winston.Logger;
export declare const logRequest: (req: any, res: any, responseTime: number) => void;
export declare const logRedisOperation: (operation: string, key: string, duration: number, success: boolean) => void;
export declare const logAIOperation: (operation: string, model: string, duration: number, success: boolean, metadata?: any) => void;
export default logger;
//# sourceMappingURL=logger.d.ts.map