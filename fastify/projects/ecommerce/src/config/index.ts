/**
 * Simple Configuration
 * 
 * Basic configuration for the application.
 */

export const config = {
  server: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10)
  },
  database: {
    url: process.env.DATABASE_URL || 'postgresql://user:pass@localhost:5432/ecommerce'
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },
  env: process.env.NODE_ENV || 'development'
}
