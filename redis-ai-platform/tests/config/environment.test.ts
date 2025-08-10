import config from '../../src/config/environment';

describe('Environment Configuration', () => {
  it('should load default configuration values', () => {
    expect(config).toBeDefined();
    expect(config.env).toBe('test');
    expect(config.port).toBe(3000);
    expect(config.apiVersion).toBe('v1');
  });

  it('should have Redis configuration', () => {
    expect(config.redis).toBeDefined();
    expect(config.redis.host).toBe('localhost');
    expect(config.redis.port).toBe(6379);
    expect(config.redis.clusterEnabled).toBe(false);
  });

  it('should have vector index configuration', () => {
    expect(config.vectorIndex).toBeDefined();
    expect(config.vectorIndex.dimensions).toBe(1536);
    expect(config.vectorIndex.algorithm).toBe('HNSW');
    expect(config.vectorIndex.distanceMetric).toBe('COSINE');
  });

  it('should have security configuration', () => {
    expect(config.security).toBeDefined();
    expect(config.security.jwtSecret).toBe('test-jwt-secret');
    expect(config.security.bcryptRounds).toBe(12);
  });

  it('should have performance configuration', () => {
    expect(config.performance).toBeDefined();
    expect(config.performance.maxConnections).toBe(100);
    expect(config.performance.connectionTimeout).toBe(5000);
    expect(config.performance.retryAttempts).toBe(3);
  });

  it('should have monitoring configuration', () => {
    expect(config.monitoring).toBeDefined();
    expect(config.monitoring.enabled).toBe(true);
    expect(config.monitoring.port).toBe(9090);
  });
});