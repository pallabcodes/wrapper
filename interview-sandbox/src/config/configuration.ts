export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_db',
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    retry: {
      max: 3,
      delay: 1000,
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  otp: {
    expiration: parseInt(process.env.OTP_EXPIRATION || '600000', 10), // 10 minutes
    length: parseInt(process.env.OTP_LENGTH || '6', 10),
  },
  app: {
    name: process.env.APP_NAME || 'Interview Sandbox API',
    env: process.env.NODE_ENV || 'development',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: process.env.CORS_CREDENTIALS === 'true',
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    enableFileLogging: process.env.LOG_FILE_ENABLED !== 'false',
    enableConsoleLogging: process.env.LOG_CONSOLE_ENABLED !== 'false',
    logDirectory: process.env.LOG_DIRECTORY || 'logs',
    maxFiles: process.env.LOG_MAX_FILES || '14d', // Keep logs for 14 days by default
    maxSize: process.env.LOG_MAX_SIZE || '20m',
    enableScheduledDeletion: process.env.LOG_SCHEDULED_DELETION === 'true', // Opt-out by default
    deletionSchedule: process.env.LOG_DELETION_SCHEDULE || '1w', // 1 week, 1 month, etc.
  },
});

