/**
 * Test Environment Configuration
 */

module.exports = {
  server: {
    port: 0, // Random port for testing
    trustProxy: false,
    http2: false,
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'ecommerce_test',
    username: 'postgres',
    password: 'test_password',
    ssl: false,
    poolMin: 1,
    poolMax: 5,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 1, // Different DB for testing
  },
  logging: {
    level: 'silent', // No logs during testing
  },
  security: {
    rateLimitMax: 10000, // Very lenient for testing
    bcryptRounds: 4, // Faster for testing
  },
  monitoring: {
    metricsEnabled: false,
    tracingEnabled: false,
  },
  jwt: {
    expiresIn: '1h', // Shorter for testing
  },
};
