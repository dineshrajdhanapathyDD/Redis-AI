import { Redis } from 'ioredis';
import { ConnectionPoolConfig, PerformanceMetrics } from './types';
import { logger } from '../../utils/logger';

interface PooledConnection {
  client: Redis;
  inUse: boolean;
  lastUsed: number;
  createdAt: number;
  usageCount: number;
}

export class ConnectionPool {
  private connections: PooledConnection[] = [];
  private config: ConnectionPoolConfig;
  private metrics = {
    totalConnections: 0,
    activeConnections: 0,
    waitingRequests: 0,
    totalAcquisitions: 0,
    totalReleases: 0,
    timeouts: 0,
    errors: 0
  };

  constructor(config: ConnectionPoolConfig) {
    this.config = config;
    this.initializePool();
    this.startMaintenanceTask();
  }

  private async initializePool(): Promise<void> {
    // Create minimum number of connections
    for (let i = 0; i < this.config.minConnections; i++) {
      await this.createConnection();
    }
    logger.info(`Connection pool initialized with ${this.config.minConnections} connections`);
  }

  private async createConnection(): Promise<PooledConnection> {
    try {
      const client = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: this.config.maxRetries,
        lazyConnect: true,
        keepAlive: 30000,
        connectTimeout: 10000,
        commandTimeout: 5000
      });

      await client.connect();

      const connection: PooledConnection = {
        client,
        inUse: false,
        lastUsed: Date.now(),
        createdAt: Date.now(),
        usageCount: 0
      };

      this.connections.push(connection);
      this.metrics.totalConnections++;
      
      // Set up connection event handlers
      client.on('error', (error) => {
        logger.error('Redis connection error:', error);
        this.metrics.errors++;
        this.removeConnection(connection);
      });

      client.on('close', () => {
        logger.warn('Redis connection closed');
        this.removeConnection(connection);
      });

      return connection;
    } catch (error) {
      logger.error('Failed to create Redis connection:', error);
      this.metrics.errors++;
      throw error;
    }
  }

  private removeConnection(connection: PooledConnection): void {
    const index = this.connections.indexOf(connection);
    if (index > -1) {
      this.connections.splice(index, 1);
      this.metrics.totalConnections--;
      if (connection.inUse) {
        this.metrics.activeConnections--;
      }
    }
  }

  async acquire(): Promise<Redis> {
    const startTime = Date.now();
    this.metrics.waitingRequests++;

    try {
      // Find available connection
      let connection = this.connections.find(conn => !conn.inUse);

      // Create new connection if none available and under max limit
      if (!connection && this.connections.length < this.config.maxConnections) {
        connection = await this.createConnection();
      }

      // Wait for connection to become available
      if (!connection) {
        connection = await this.waitForConnection();
      }

      if (!connection) {
        this.metrics.timeouts++;
        throw new Error('Connection acquisition timeout');
      }

      // Mark connection as in use
      connection.inUse = true;
      connection.lastUsed = Date.now();
      connection.usageCount++;
      this.metrics.activeConnections++;
      this.metrics.totalAcquisitions++;
      this.metrics.waitingRequests--;

      return connection.client;
    } catch (error) {
      this.metrics.waitingRequests--;
      this.metrics.errors++;
      throw error;
    }
  }

  private async waitForConnection(): Promise<PooledConnection | null> {
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        resolve(null);
      }, this.config.acquireTimeoutMs);

      const checkForConnection = () => {
        const connection = this.connections.find(conn => !conn.inUse);
        if (connection) {
          clearTimeout(timeout);
          resolve(connection);
        } else {
          setTimeout(checkForConnection, 10);
        }
      };

      checkForConnection();
    });
  }

  release(client: Redis): void {
    const connection = this.connections.find(conn => conn.client === client);
    if (connection && connection.inUse) {
      connection.inUse = false;
      connection.lastUsed = Date.now();
      this.metrics.activeConnections--;
      this.metrics.totalReleases++;
    }
  }

  private startMaintenanceTask(): void {
    setInterval(() => {
      this.performMaintenance();
    }, 30000); // Run every 30 seconds
  }

  private async performMaintenance(): Promise<void> {
    const now = Date.now();
    const idleConnections = this.connections.filter(
      conn => !conn.inUse && (now - conn.lastUsed) > this.config.idleTimeoutMs
    );

    // Remove excess idle connections
    const excessConnections = Math.max(0, this.connections.length - this.config.minConnections);
    const connectionsToRemove = Math.min(idleConnections.length, excessConnections);

    for (let i = 0; i < connectionsToRemove; i++) {
      const connection = idleConnections[i];
      try {
        await connection.client.quit();
      } catch (error) {
        logger.warn('Error closing idle connection:', error);
      }
      this.removeConnection(connection);
    }

    // Health check remaining connections
    for (const connection of this.connections) {
      if (!connection.inUse) {
        try {
          await connection.client.ping();
        } catch (error) {
          logger.warn('Connection health check failed:', error);
          this.removeConnection(connection);
        }
      }
    }

    // Ensure minimum connections
    while (this.connections.length < this.config.minConnections) {
      try {
        await this.createConnection();
      } catch (error) {
        logger.error('Failed to maintain minimum connections:', error);
        break;
      }
    }
  }

  getMetrics(): any {
    return {
      ...this.metrics,
      poolUtilization: this.metrics.activeConnections / this.metrics.totalConnections,
      averageUsagePerConnection: this.connections.reduce((sum, conn) => sum + conn.usageCount, 0) / this.connections.length || 0
    };
  }

  async close(): Promise<void> {
    logger.info('Closing connection pool...');
    
    // Close all connections
    await Promise.all(
      this.connections.map(async (connection) => {
        try {
          await connection.client.quit();
        } catch (error) {
          logger.warn('Error closing connection:', error);
        }
      })
    );

    this.connections = [];
    this.metrics.totalConnections = 0;
    this.metrics.activeConnections = 0;
  }
}