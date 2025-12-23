/**
 * Environment Configuration
 */

import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/ecommerce_enterprise'),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  BCRYPT_ROUNDS: z.string().transform(Number).default('12'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
}).passthrough()

// For development, provide fallback values
const envWithDefaults = {
  NODE_ENV: process.env['NODE_ENV'] || 'development',
  PORT: process.env['PORT'] || '3000',
  DATABASE_URL: process.env['DATABASE_URL'] || 'postgresql://postgres:password@localhost:5432/ecommerce_enterprise',
  REDIS_URL: process.env['REDIS_URL'] || 'redis://localhost:6379',
  JWT_SECRET: process.env['JWT_SECRET'] || 'your-super-secret-jwt-key-change-in-production',
  JWT_EXPIRES_IN: process.env['JWT_EXPIRES_IN'] || '15m',
  BCRYPT_ROUNDS: process.env['BCRYPT_ROUNDS'] || '12',
  LOG_LEVEL: process.env['LOG_LEVEL'] || 'info'
}

export const env = envSchema.parse(envWithDefaults)
