import winston from 'winston';
import config from '@/config/environment';

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

winston.addColors(colors);

// Create custom format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    
    let logMessage = `${timestamp} ${level}: ${message}`;
    
    // Add metadata if present and in debug mode
    if (config.development.enableDebugLogs && Object.keys(meta).length > 0) {
      logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return logMessage;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport for development
if (config.env === 'development') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logLevel,
    })
  );
} else {
  // JSON format for production
  transports.push(
    new winston.transports.Console({
      format: format,
      level: config.logLevel,
    })
  );
}

// File transports for production
if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: config.logLevel,
  levels,
  format,
  transports,
  exitOnError: false,
});

// Add request logging helper
export const logRequest = (req: any, res: any, responseTime: number) => {
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
  } else {
    logger.info('HTTP Request', logData);
  }
};

// Add Redis operation logging helper
export const logRedisOperation = (operation: string, key: string, duration: number, success: boolean) => {
  const logData = {
    operation,
    key,
    duration: `${duration}ms`,
    success,
  };

  if (success) {
    logger.debug('Redis Operation', logData);
  } else {
    logger.error('Redis Operation Failed', logData);
  }
};

// Add AI operation logging helper
export const logAIOperation = (operation: string, model: string, duration: number, success: boolean, metadata?: any) => {
  const logData = {
    operation,
    model,
    duration: `${duration}ms`,
    success,
    ...metadata,
  };

  if (success) {
    logger.info('AI Operation', logData);
  } else {
    logger.error('AI Operation Failed', logData);
  }
};

export default logger;