/**
 * Configuration Management System
 * Environment-aware configuration with validation
 */

const path = require('path');
const { existsSync } = require('fs');

/**
 * Load environment-specific configuration
 * @returns {Object} Configuration object
 */
const loadConfig = async () => {
  const env = process.env.NODE_ENV || 'development';
  
  // Base configuration
  const baseConfig = {
    env,
    app: {
      name: 'ecommerce-platform',
      version: process.env.npm_package_version || '1.0.0',
      description: 'Enterprise E-Commerce Platform',
    },
    server: {
      host: process.env.HOST || '0.0.0.0',
      port: parseInt(process.env.PORT, 10) || 3000,
      trustProxy: process.env.TRUST_PROXY === 'true',
      bodyLimit: parseInt(process.env.BODY_LIMIT, 10) || 1048576, // 1MB
      keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) || 72000,
      maxParamLength: parseInt(process.env.MAX_PARAM_LENGTH, 10) || 1000,
      http2: process.env.HTTP2_ENABLED === 'true',
    },
    database: {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 5432,
      name: process.env.DB_NAME || 'ecommerce',
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
      ssl: process.env.DB_SSL === 'true',
      poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
      poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
      connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT, 10) || 10000,
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB, 10) || 0,
      keyPrefix: process.env.REDIS_KEY_PREFIX || 'ecom:',
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    },
    jwt: {
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'ecommerce-platform',
      audience: process.env.JWT_AUDIENCE || 'ecommerce-users',
    },
    security: {
      bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
      rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
      rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW, 10) || 900000, // 15 minutes
      corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      helmet: {
        contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
        hsts: process.env.HSTS_ENABLED !== 'false',
      },
    },
    logging: {
      level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
      format: process.env.LOG_FORMAT || 'json',
      destination: process.env.LOG_DESTINATION,
    },
    monitoring: {
      metricsEnabled: process.env.METRICS_ENABLED !== 'false',
      tracingEnabled: process.env.TRACING_ENABLED === 'true',
      healthCheckInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL, 10) || 30000,
    },
    queue: {
      redisUrl: process.env.QUEUE_REDIS_URL || 'redis://localhost:6379',
      defaultJobOptions: {
        removeOnComplete: parseInt(process.env.QUEUE_REMOVE_ON_COMPLETE, 10) || 10,
        removeOnFail: parseInt(process.env.QUEUE_REMOVE_ON_FAIL, 10) || 50,
        attempts: parseInt(process.env.QUEUE_ATTEMPTS, 10) || 3,
        backoff: {
          type: 'exponential',
          delay: parseInt(process.env.QUEUE_BACKOFF_DELAY, 10) || 2000,
        },
      },
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER || 'local',
      local: {
        uploadPath: process.env.LOCAL_UPLOAD_PATH || './uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
      },
      s3: {
        bucket: process.env.S3_BUCKET,
        region: process.env.S3_REGION || 'us-east-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },
    },
    payment: {
      stripe: {
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        mode: process.env.PAYPAL_MODE || 'sandbox',
      },
    },
    email: {
      provider: process.env.EMAIL_PROVIDER || 'smtp',
      smtp: {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT, 10) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      sendgrid: {
        apiKey: process.env.SENDGRID_API_KEY,
      },
      from: process.env.EMAIL_FROM || 'noreply@ecommerce.com',
    },
  };
  
  // Load environment-specific overrides
  const envConfigPath = path.join(__dirname, 'environments', `${env}.js`);
  if (existsSync(envConfigPath)) {
    const envConfig = require(envConfigPath);
    Object.assign(baseConfig, envConfig);
  }
  
  // Validate required configuration
  validateConfig(baseConfig);
  
  return baseConfig;
};

/**
 * Validate required configuration values
 * @param {Object} config - Configuration object
 */
const validateConfig = (config) => {
  const required = [
    'server.port',
    'database.host',
    'database.name',
    'jwt.secret',
  ];
  
  const missing = [];
  
  required.forEach((key) => {
    const value = key.split('.').reduce((obj, prop) => obj?.[prop], config);
    if (!value) {
      missing.push(key);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
  
  // Additional validations
  if (config.env === 'production') {
    if (config.jwt.secret === 'your-super-secret-jwt-key-change-in-production') {
      throw new Error('JWT secret must be changed in production');
    }
    
    if (!config.database.password || config.database.password === 'password') {
      throw new Error('Database password must be set in production');
    }
  }
};

module.exports = {
  loadConfig,
  validateConfig,
};
