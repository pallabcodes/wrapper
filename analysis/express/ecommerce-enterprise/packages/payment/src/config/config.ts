/**
 * Configuration for the payment microservice
 */

export const config = {
  // Server configuration
  port: process.env['PORT'] || 3001,
  environment: process.env['NODE_ENV'] || 'development',
  
  // Database configuration
  database: {
    postgres: {
      url: process.env['POSTGRES_URL'] || 'postgresql://postgres:password@localhost:5432/ecommerce_enterprise',
      pool: {
        min: parseInt(process.env['DB_POOL_MIN'] || '2'),
        max: parseInt(process.env['DB_POOL_MAX'] || '10')
      }
    },
    redis: {
      url: process.env['REDIS_URL'] || 'redis://localhost:6379',
      ttl: parseInt(process.env['REDIS_TTL'] || '3600')
    }
  },
  
  // Payment providers
  stripe: {
    secretKey: process.env['STRIPE_SECRET_KEY'] || '',
    publishableKey: process.env['STRIPE_PUBLISHABLE_KEY'] || '',
    webhookSecret: process.env['STRIPE_WEBHOOK_SECRET'] || ''
  },
  
  paypal: {
    clientId: process.env['PAYPAL_CLIENT_ID'] || '',
    clientSecret: process.env['PAYPAL_CLIENT_SECRET'] || '',
    mode: process.env['PAYPAL_MODE'] || 'sandbox'
  },
  
  braintree: {
    merchantId: process.env['BRAINTREE_MERCHANT_ID'] || '',
    publicKey: process.env['BRAINTREE_PUBLIC_KEY'] || '',
    privateKey: process.env['BRAINTREE_PRIVATE_KEY'] || '',
    environment: process.env['BRAINTREE_ENVIRONMENT'] || 'sandbox'
  },
  
  // Security configuration
  security: {
    jwtSecret: process.env['JWT_SECRET'] || 'your-secret-key',
    jwtExpiresIn: process.env['JWT_EXPIRES_IN'] || '15m',
    bcryptRounds: parseInt(process.env['BCRYPT_ROUNDS'] || '12'),
    cors: {
      allowedOrigins: process.env['ALLOWED_ORIGINS']?.split(',') || ['http://localhost:3000'],
      credentials: true
    }
  },
  
  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env['RATE_LIMIT_MAX'] || '100')
  },
  
  // Payment settings
  payment: {
    defaultCurrency: process.env['DEFAULT_CURRENCY'] || 'USD',
    supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'],
    maxAmount: parseInt(process.env['MAX_PAYMENT_AMOUNT'] || '1000000'),
    minAmount: parseInt(process.env['MIN_PAYMENT_AMOUNT'] || '1')
  }
}
