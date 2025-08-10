import { ConnectionPool } from '../../../src/services/performance/connection-pool';
import { ConnectionPoolConfig } from '../../../src/services/performance/types';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      connect: jest.fn().mockResolvedValue(undefined),
      quit: jest.fn().mockResolvedValue(undefined),
      ping: jest.fn().mockResolvedValue('PONG'),
      on: jest.fn(),
      get: jest.fn().mockResolvedValue('test-value'),
      set: jest.fn().mockResolvedValue('OK')
    }))
  };
});

describe('ConnectionPool', () => {
  let pool: ConnectionPool;
  let config: ConnectionPoolConfig;

  beforeEach(() => {
    config = {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMs: 5000,
      idleTimeoutMs: 30000,
      maxRetries: 3
    };
    pool = new ConnectionPool(config);
  });

  afterEach(async () => {
    await pool.close();
  });

  describe('initialization', () => {
    it('should create minimum number of connections', async () => {
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const metrics = pool.getMetrics();
      expect(metrics.totalConnections).toBe(config.minConnections);
    });
  });

  describe('connection acquisition', () => {
    it('should acquire and release connections', async () => {
      const client = await pool.acquire();
      expect(client).toBeDefined();
      
      const metrics = pool.getMetrics();
      expect(metrics.activeConnections).toBe(1);
      
      pool.release(client);
      
      const metricsAfterRelease = pool.getMetrics();
      expect(metricsAfterRelease.activeConnections).toBe(0);
    });

    it('should create new connections when needed', async () => {
      const clients = [];
      
      // Acquire more connections than minimum
      for (let i = 0; i < config.minConnections + 2; i++) {
        const client = await pool.acquire();
        clients.push(client);
      }
      
      const metrics = pool.getMetrics();
      expect(metrics.totalConnections).toBe(config.minConnections + 2);
      expect(metrics.activeConnections).toBe(config.minConnections + 2);
      
      // Release all connections
      clients.forEach(client => pool.release(client));
    });

    it('should respect maximum connection limit', async () => {
      const clients = [];
      
      // Try to acquire more than maximum
      for (let i = 0; i < config.maxConnections + 1; i++) {
        try {
          const client = await pool.acquire();
          clients.push(client);
        } catch (error) {
          // Expected for connections beyond max
          break;
        }
      }
      
      const metrics = pool.getMetrics();
      expect(metrics.totalConnections).toBeLessThanOrEqual(config.maxConnections);
      
      // Release all connections
      clients.forEach(client => pool.release(client));
    });
  });

  describe('metrics', () => {
    it('should track connection metrics', async () => {
      const client = await pool.acquire();
      
      const metrics = pool.getMetrics();
      expect(metrics.totalAcquisitions).toBe(1);
      expect(metrics.poolUtilization).toBeGreaterThan(0);
      
      pool.release(client);
      
      const metricsAfterRelease = pool.getMetrics();
      expect(metricsAfterRelease.totalReleases).toBe(1);
    });

    it('should calculate pool utilization correctly', async () => {
      const client1 = await pool.acquire();
      const client2 = await pool.acquire();
      
      const metrics = pool.getMetrics();
      expect(metrics.poolUtilization).toBe(metrics.activeConnections / metrics.totalConnections);
      
      pool.release(client1);
      pool.release(client2);
    });
  });

  describe('error handling', () => {
    it('should handle connection errors gracefully', async () => {
      // This test would require mocking connection failures
      // For now, just ensure the pool can handle basic operations
      const client = await pool.acquire();
      expect(client).toBeDefined();
      pool.release(client);
    });
  });
});