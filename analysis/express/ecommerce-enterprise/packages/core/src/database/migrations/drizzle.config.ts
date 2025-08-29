/**
 * Drizzle Configuration
 * 
 * Configuration for Drizzle ORM migrations and schema management.
 * Following internal team patterns for enterprise applications.
 */

import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/database/schema.ts',
  out: './src/database/migrations'
})
