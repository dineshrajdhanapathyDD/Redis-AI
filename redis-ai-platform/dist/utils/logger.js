"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAIOperation = exports.logRedisOperation = exports.logRequest = void 0;
const winston_1 = __importDefault(require("winston"));
const environment_1 = __importDefault(require("@/config/environment"));
// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    debug: 3,
};
// Define colors for each log level
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    debug: 'blue',
};
winston_1.default.addColors(colors);
// Create custom format
const format = winston_1.default.format.combine(winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json(), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
        logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
// Create console format for development
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize({ all: true }), winston_1.default.format.timestamp({ format: 'HH:mm:ss' }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let logMessage = `${timestamp} ${level}: ${message}`;
    // Add metadata if present and in debug mode
    if (environment_1.default.development.enableDebugLogs && Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
// Create transports
const transports = [];
// Console transport for development
if (environment_1.default.env === 'development') {
    transports.push(new winston_1.default.transports.Console({
        format: consoleFormat,
        level: environment_1.default.logLevel,
    }));
}
else {
    // JSON format for production
    transports.push(new winston_1.default.transports.Console({
        format: format,
        level: environment_1.default.logLevel,
    }));
}
// File transports for production
if (environment_1.default.env === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
    }));
}
// Create logger instance
const logger = winston_1.default.createLogger({
    level: environment_1.default.logLevel,
    levels,
    format,
    transports,
    exitOnError: false,
});
// Add request logging helper
const logRequest = (req, res, responseTime) => {
    const logData = {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        responseTime: `${responseTime}ms`,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
    };
    if (res.statusCode >= 400) {
        logger.warn('HTTP Request', logData);
    }
    else {
        logger.info('HTTP Request', logData);
    }
};
exports.logRequest = logRequest;
// Add Redis operation logging helper
const logRedisOperation = (operation, key, duration, success) => {
    const logData = {
        operation,
        key,
        duration: `${duration}ms`,
        success,
    };
    if (success) {
        logger.debug('Redis Operation', logData);
    }
    else {
        logger.error('Redis Operation Failed', logData);
    }
};
exports.logRedisOperation = logRedisOperation;
// Add AI operation logging helper
const logAIOperation = (operation, model, duration, success, metadata) => {
    const logData = {
        operation,
        model,
        duration: `${duration}ms`,
        success,
        ...metadata,
    };
    if (success) {
        logger.info('AI Operation', logData);
    }
    else {
        logger.error('AI Operation Failed', logData);
    }
};
exports.logAIOperation = logAIOperation;
exports.default = logger;
//# sourceMappingURL=logger.js.map