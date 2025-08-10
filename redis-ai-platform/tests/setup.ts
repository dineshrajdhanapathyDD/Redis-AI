// Jest setup file for Redis AI Platform tests

import { createRedisManager } from '../src/config/redis';
import config from '../src/config/environment';

// Mock Redis for tests
jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
    ft: {
      create: jest.fn().mockResolvedValue('OK'),
      info: jest.fn().mockRejectedValue(new Error('Index not found')),
      dropIndex: jest.fn().mockResolvedValue('OK'),
      search: jest.fn().mockResolvedValue({ total: 0, documents: [] }),
    },
    json: {
      set: jest.fn().mockResolvedValue('OK'),
      get: jest.fn().mockResolvedValue(null),
      del: jest.fn().mockResolvedValue(1),
    },
    ts: {
      add: jest.fn().mockResolvedValue(Date.now()),
      range: jest.fn().mockResolvedValue([]),
    },
    publish: jest.fn().mockResolvedValue(0),
    subscribe: jest.fn().mockResolvedValue(undefined),
  })),
  createCluster: jest.fn(() => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn().mockResolvedValue(undefined),
    ping: jest.fn().mockResolvedValue('PONG'),
    on: jest.fn(),
  })),
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockWorkspace: () => ({
    id: 'test-workspace-id',
    name: 'Test Workspace',
    description: 'A test workspace',
    ownerId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockVectorEmbedding: () => ({
    id: 'test-embedding-id',
    vector: Array(1536).fill(0).map(() => Math.random()),
    contentId: 'test-content-id',
    contentType: 'text',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
};