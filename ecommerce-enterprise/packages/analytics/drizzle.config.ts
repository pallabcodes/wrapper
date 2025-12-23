import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/database/schema/analytics.ts',
  out: './src/database/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env['DATABASE_URL'] || 
      `postgresql://${process.env['DATABASE_USER'] || 'postgres'}:${process.env['DATABASE_PASSWORD'] || 'password'}@${process.env['DATABASE_HOST'] || 'localhost'}:${process.env['DATABASE_PORT'] || '5432'}/${process.env['DATABASE_NAME'] || 'analytics_db'}`,
  },
});
