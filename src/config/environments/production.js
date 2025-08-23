/**
 * Production Environment Configuration
 */

module.exports = {
  server: {
    port: parseInt(process.env.PORT, 10) || 8080,
    trustProxy: true,
    http2: true,
    bodyLimit: 5242880, // 5MB for production
  },
  database: {
    ssl: true,
    poolMin: 10,
    poolMax: 50,
    connectionTimeout: 30000,
  },
  redis: {
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 5,
  },
  logging: {
    level: 'info',
    format: 'json',
  },
  security: {
    rateLimitMax: 100,
    rateLimitWindow: 900000, // 15 minutes
    helmet: {
      contentSecurityPolicy: true,
      hsts: true,
    },
  },
  monitoring: {
    metricsEnabled: true,
    tracingEnabled: true,
    healthCheckInterval: 10000, // More frequent health checks
  },
};
