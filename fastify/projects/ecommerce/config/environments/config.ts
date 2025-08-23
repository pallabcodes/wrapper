/**
 * Environment Configuration System
 * 
 * Type-safe configuration management for different environments.
 * Follows 12-factor app principles with validation and sensible defaults.
 */

import { z } from 'zod'

// ============================================================================
// CONFIGURATION SCHEMAS
// ============================================================================

const ServerConfigSchema = z.object({
  host: z.string().default('0.0.0.0'),
  port: z.coerce.number().int().min(1).max(65535).default(3000),
  cors: z.object({
    origin: z.union([z.string(), z.array(z.string()), z.boolean()]).default(true),
    credentials: z.boolean().default(true),
    methods: z.array(z.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS']),
    allowedHeaders: z.array(z.string()).default(['Content-Type', 'Authorization', 'X-Request-ID'])
  }).default({})
})

const DatabaseConfigSchema = z.object({
  url: z.string().url(),
  pool: z.object({
    min: z.number().int().min(0).default(2),
    max: z.number().int().min(1).default(20)
  }).default({}),
  ssl: z.boolean().default(false),
  logging: z.boolean().default(false)
})

const RedisConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.coerce.number().int().min(1).max(65535).default(6379),
  password: z.string().optional(),
  db: z.coerce.number().int().min(0).default(0),
  keyPrefix: z.string().default('ecommerce:'),
  retryDelayOnFailover: z.number().default(100),
  maxRetriesPerRequest: z.number().default(3),
  lazyConnect: z.boolean().default(true)
})

const JwtConfigSchema = z.object({
  secret: z.string().min(32),
  accessTokenExpiry: z.string().default('15m'),
  refreshTokenExpiry: z.string().default('7d'),
  issuer: z.string().default('ecommerce-platform'),
  audience: z.string().default('ecommerce-users')
})

const PaymentConfigSchema = z.object({
  stripe: z.object({
    publicKey: z.string(),
    secretKey: z.string(),
    webhookSecret: z.string(),
    apiVersion: z.string().default('2023-10-16')
  }),
  paypal: z.object({
    clientId: z.string(),
    clientSecret: z.string(),
    environment: z.enum(['sandbox', 'production']).default('sandbox')
  })
})

const EmailConfigSchema = z.object({
  provider: z.enum(['smtp', 'sendgrid', 'ses']).default('smtp'),
  smtp: z.object({
    host: z.string(),
    port: z.coerce.number().int().default(587),
    secure: z.boolean().default(false),
    auth: z.object({
      user: z.string(),
      pass: z.string()
    })
  }).optional(),
  sendgrid: z.object({
    apiKey: z.string()
  }).optional(),
  ses: z.object({
    region: z.string().default('us-east-1'),
    accessKeyId: z.string(),
    secretAccessKey: z.string()
  }).optional(),
  from: z.object({
    name: z.string().default('Ecommerce Platform'),
    email: z.string().email()
  })
})

const StorageConfigSchema = z.object({
  provider: z.enum(['local', 's3', 'gcs']).default('local'),
  local: z.object({
    uploadPath: z.string().default('./uploads'),
    maxFileSize: z.number().default(10 * 1024 * 1024) // 10MB
  }).optional(),
  s3: z.object({
    bucket: z.string(),
    region: z.string().default('us-east-1'),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    endpoint: z.string().optional()
  }).optional(),
  gcs: z.object({
    bucket: z.string(),
    projectId: z.string(),
    keyFilename: z.string()
  }).optional()
})

const ObservabilityConfigSchema = z.object({
  metrics: z.object({
    enabled: z.boolean().default(true),
    port: z.coerce.number().int().default(9090),
    path: z.string().default('/metrics')
  }).default({}),
  tracing: z.object({
    enabled: z.boolean().default(false),
    jaegerEndpoint: z.string().optional(),
    serviceName: z.string().default('ecommerce-api')
  }).default({}),
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
    pretty: z.boolean().default(false),
    file: z.object({
      enabled: z.boolean().default(false),
      path: z.string().default('./logs/app.log'),
      maxSize: z.string().default('10MB'),
      maxFiles: z.number().default(5)
    }).default({})
  }).default({})
})

const SecurityConfigSchema = z.object({
  rateLimiting: z.object({
    global: z.object({
      max: z.number().default(1000),
      timeWindow: z.string().default('1 minute')
    }).default({}),
    auth: z.object({
      max: z.number().default(5),
      timeWindow: z.string().default('1 minute')
    }).default({})
  }).default({}),
  helmet: z.object({
    enabled: z.boolean().default(true),
    contentSecurityPolicy: z.boolean().default(true),
    hsts: z.boolean().default(true)
  }).default({}),
  encryption: z.object({
    algorithm: z.string().default('aes-256-gcm'),
    keyDerivation: z.string().default('pbkdf2'),
    saltLength: z.number().default(32),
    ivLength: z.number().default(16)
  }).default({})
})

const Http2ConfigSchema = z.object({
  enabled: z.boolean().default(false),
  sessionTimeout: z.number().default(72000),
  allowHTTP1: z.boolean().default(true)
})

// Main configuration schema
const ConfigSchema = z.object({
  env: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  server: ServerConfigSchema,
  database: DatabaseConfigSchema,
  redis: RedisConfigSchema,
  jwt: JwtConfigSchema,
  payment: PaymentConfigSchema,
  email: EmailConfigSchema,
  storage: StorageConfigSchema,
  observability: ObservabilityConfigSchema,
  security: SecurityConfigSchema,
  http2: Http2ConfigSchema
})

export type Config = z.infer<typeof ConfigSchema>

// ============================================================================
// ENVIRONMENT VARIABLE MAPPING
// ============================================================================

const createConfigFromEnv = (): Config => {
  const rawConfig = {
    env: process.env.NODE_ENV,
    
    server: {
      host: process.env.HOST,
      port: process.env.PORT,
      cors: {
        origin: process.env.CORS_ORIGIN ? JSON.parse(process.env.CORS_ORIGIN) : undefined,
        credentials: process.env.CORS_CREDENTIALS === 'true'
      }
    },
    
    database: {
      url: process.env.DATABASE_URL,
      pool: {
        min: process.env.DB_POOL_MIN,
        max: process.env.DB_POOL_MAX
      },
      ssl: process.env.DB_SSL === 'true',
      logging: process.env.DB_LOGGING === 'true'
    },
    
    redis: {
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
      db: process.env.REDIS_DB,
      keyPrefix: process.env.REDIS_KEY_PREFIX
    },
    
    jwt: {
      secret: process.env.JWT_SECRET,
      accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY,
      refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    },
    
    payment: {
      stripe: {
        publicKey: process.env.STRIPE_PUBLIC_KEY,
        secretKey: process.env.STRIPE_SECRET_KEY,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
        apiVersion: process.env.STRIPE_API_VERSION
      },
      paypal: {
        clientId: process.env.PAYPAL_CLIENT_ID,
        clientSecret: process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT
      }
    },
    
    email: {
      provider: process.env.EMAIL_PROVIDER,
      smtp: process.env.SMTP_HOST ? {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      } : undefined,
      sendgrid: process.env.SENDGRID_API_KEY ? {
        apiKey: process.env.SENDGRID_API_KEY
      } : undefined,
      ses: process.env.AWS_SES_REGION ? {
        region: process.env.AWS_SES_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      } : undefined,
      from: {
        name: process.env.EMAIL_FROM_NAME,
        email: process.env.EMAIL_FROM_ADDRESS
      }
    },
    
    storage: {
      provider: process.env.STORAGE_PROVIDER,
      local: process.env.STORAGE_PROVIDER === 'local' ? {
        uploadPath: process.env.UPLOAD_PATH,
        maxFileSize: process.env.MAX_FILE_SIZE ? parseInt(process.env.MAX_FILE_SIZE) : undefined
      } : undefined,
      s3: process.env.AWS_S3_BUCKET ? {
        bucket: process.env.AWS_S3_BUCKET,
        region: process.env.AWS_S3_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        endpoint: process.env.AWS_S3_ENDPOINT
      } : undefined
    },
    
    observability: {
      metrics: {
        enabled: process.env.METRICS_ENABLED !== 'false',
        port: process.env.METRICS_PORT,
        path: process.env.METRICS_PATH
      },
      tracing: {
        enabled: process.env.TRACING_ENABLED === 'true',
        jaegerEndpoint: process.env.JAEGER_ENDPOINT,
        serviceName: process.env.SERVICE_NAME
      },
      logging: {
        level: process.env.LOG_LEVEL,
        pretty: process.env.LOG_PRETTY === 'true',
        file: {
          enabled: process.env.LOG_FILE_ENABLED === 'true',
          path: process.env.LOG_FILE_PATH,
          maxSize: process.env.LOG_FILE_MAX_SIZE,
          maxFiles: process.env.LOG_FILE_MAX_FILES ? parseInt(process.env.LOG_FILE_MAX_FILES) : undefined
        }
      }
    },
    
    security: {
      rateLimiting: {
        global: {
          max: process.env.RATE_LIMIT_GLOBAL_MAX ? parseInt(process.env.RATE_LIMIT_GLOBAL_MAX) : undefined,
          timeWindow: process.env.RATE_LIMIT_GLOBAL_WINDOW
        },
        auth: {
          max: process.env.RATE_LIMIT_AUTH_MAX ? parseInt(process.env.RATE_LIMIT_AUTH_MAX) : undefined,
          timeWindow: process.env.RATE_LIMIT_AUTH_WINDOW
        }
      },
      helmet: {
        enabled: process.env.HELMET_ENABLED !== 'false',
        contentSecurityPolicy: process.env.CSP_ENABLED !== 'false',
        hsts: process.env.HSTS_ENABLED !== 'false'
      },
      encryption: {
        algorithm: process.env.ENCRYPTION_ALGORITHM,
        keyDerivation: process.env.KEY_DERIVATION,
        saltLength: process.env.SALT_LENGTH ? parseInt(process.env.SALT_LENGTH) : undefined,
        ivLength: process.env.IV_LENGTH ? parseInt(process.env.IV_LENGTH) : undefined
      }
    },
    
    http2: {
      enabled: process.env.HTTP2_ENABLED === 'true',
      sessionTimeout: process.env.HTTP2_SESSION_TIMEOUT ? parseInt(process.env.HTTP2_SESSION_TIMEOUT) : undefined,
      allowHTTP1: process.env.HTTP2_ALLOW_HTTP1 !== 'false'
    }
  }
  
  // Remove undefined values to let Zod apply defaults
  const cleanedConfig = JSON.parse(JSON.stringify(rawConfig, (key, value) => 
    value === undefined ? undefined : value
  ))
  
  return ConfigSchema.parse(cleanedConfig)
}

// ============================================================================
// CONFIGURATION INSTANCE
// ============================================================================

export const config = createConfigFromEnv()

// Validate critical configuration on startup
const validateCriticalConfig = (config: Config): void => {
  const errors: string[] = []
  
  if (!config.database.url) {
    errors.push('DATABASE_URL is required')
  }
  
  if (!config.jwt.secret || config.jwt.secret.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long')
  }
  
  if (config.env === 'production') {
    if (!config.payment.stripe.secretKey) {
      errors.push('STRIPE_SECRET_KEY is required in production')
    }
    
    if (!config.email.from.email) {
      errors.push('EMAIL_FROM_ADDRESS is required in production')
    }
  }
  
  if (errors.length > 0) {
    console.error('Configuration validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    process.exit(1)
  }
}

// Only validate in non-test environments
if (config.env !== 'test') {
  validateCriticalConfig(config)
}

export { ConfigSchema, createConfigFromEnv }
