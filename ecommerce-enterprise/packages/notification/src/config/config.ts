/**
 * Configuration for the notification microservice
 */

export const config = {
  // Server configuration
  port: process.env['PORT'] || 3002,
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
  
      // Email providers
    email: {
      sendgrid: {
        apiKey: process.env['SENDGRID_API_KEY'] || '',
        fromEmail: process.env['SENDGRID_FROM_EMAIL'] || 'noreply@example.com'
      },
      mailgun: {
        apiKey: process.env['MAILGUN_API_KEY'] || '',
        domain: process.env['MAILGUN_DOMAIN'] || '',
        fromEmail: process.env['MAILGUN_FROM_EMAIL'] || 'noreply@example.com'
      },
      ses: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
        region: process.env['AWS_REGION'] || 'us-east-1',
        fromEmail: process.env['SES_FROM_EMAIL'] || 'noreply@example.com'
      },
      smtp: {
        host: process.env['SMTP_HOST'] || 'localhost',
        port: parseInt(process.env['SMTP_PORT'] || '587'),
        secure: process.env['SMTP_SECURE'] === 'true',
        auth: {
          user: process.env['SMTP_USER'] || '',
          pass: process.env['SMTP_PASS'] || ''
        }
      }
    },
  
      // SMS providers
    sms: {
      twilio: {
        accountSid: process.env['TWILIO_ACCOUNT_SID'] || '',
        authToken: process.env['TWILIO_AUTH_TOKEN'] || '',
        fromNumber: process.env['TWILIO_FROM_NUMBER'] || ''
      },
      awsSns: {
        accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
        secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
        region: process.env['AWS_REGION'] || 'us-east-1'
      }
    },
  
      // Push notification providers
    push: {
      firebase: {
        projectId: process.env['FIREBASE_PROJECT_ID'] || '',
        privateKey: process.env['FIREBASE_PRIVATE_KEY'] || '',
        clientEmail: process.env['FIREBASE_CLIENT_EMAIL'] || ''
      },
      apns: {
        keyId: process.env['APNS_KEY_ID'] || '',
        teamId: process.env['APNS_TEAM_ID'] || '',
        privateKey: process.env['APNS_PRIVATE_KEY'] || ''
      }
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
    
    // Notification settings
    notification: {
      maxRetries: parseInt(process.env['MAX_RETRIES'] || '3'),
      retryDelay: parseInt(process.env['RETRY_DELAY'] || '5000'),
      batchSize: parseInt(process.env['BATCH_SIZE'] || '100'),
      defaultPriority: process.env['DEFAULT_PRIORITY'] || 'normal'
    }
}
