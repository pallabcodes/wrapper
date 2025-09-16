import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema/analytics';
// Use dynamic import for postgres to avoid TypeScript issues
const postgres = require('postgres');

const connectionString = process.env['DATABASE_URL'] || 
  `postgresql://${process.env['DATABASE_USER'] || 'postgres'}:${process.env['DATABASE_PASSWORD'] || 'password'}@${process.env['DATABASE_HOST'] || 'localhost'}:${process.env['DATABASE_PORT'] || '5432'}/${process.env['DATABASE_NAME'] || 'analytics_db'}`;

const client = postgres(connectionString, {
  max: 1,
  ssl: process.env['NODE_ENV'] === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(client, { schema });

export default db;
