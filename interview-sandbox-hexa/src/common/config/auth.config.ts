import { registerAs } from '@nestjs/config';

/**
 * Authentication Configuration
 * 
 * Centralized configuration for authentication module
 */
export default registerAs('auth', () => ({
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshTokenExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3000/auth/google/callback',
  },
  password: {
    minLength: parseInt(process.env.PASSWORD_MIN_LENGTH || '8', 10),
    saltRounds: parseInt(process.env.PASSWORD_SALT_ROUNDS || '10', 10),
  },
  twoFactor: {
    enabled: process.env.TWO_FACTOR_ENABLED === 'true',
    issuer: process.env.TWO_FACTOR_ISSUER || 'YourApp',
  },
}));

