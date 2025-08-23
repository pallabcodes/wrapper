/**
 * Development Environment Configuration
 */

module.exports = {
  server: {
    port: 3000,
    trustProxy: false,
    http2: false,
  },
  database: {
    host: 'localhost',
    port: 5432,
    name: 'ecommerce_dev',
    username: 'postgres',
    password: 'dev_password',
    ssl: false,
    poolMin: 2,
    poolMax: 10,
  },
  redis: {
    host: 'localhost',
    port: 6379,
    db: 0,
  },
  logging: {
    level: 'debug',
    format: 'pretty',
  },
  security: {
    rateLimitMax: 1000, // More lenient for development
    corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  },
  monitoring: {
    metricsEnabled: true,
    tracingEnabled: false,
  },
};
