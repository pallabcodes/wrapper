# Migrations & Seeders Guide

## Overview

This project uses Sequelize CLI for database migrations and seeding. This ensures:
- ✅ Version-controlled schema changes
- ✅ Reproducible database setup
- ✅ Production-safe deployments
- ✅ Demo data for testing

---

## Circular Dependency Prevention

### ✅ **Current Setup: SAFE**

**How it works:**
1. **Arrow Functions in Decorators**: All associations use arrow functions `() => Model` which defer evaluation
   ```typescript
   @HasMany(() => Otp, { foreignKey: 'userId', as: 'otps' })
   @BelongsTo(() => User, { foreignKey: 'userId', as: 'user' })
   ```

2. **Direct Imports**: Models import each other directly, but arrow functions prevent circular evaluation
   ```typescript
   // user.model.ts
   import { Otp } from './otp.model'; // Safe because of arrow function
   
   // otp.model.ts  
   import { User } from './user.model'; // Safe because of arrow function
   ```

3. **Barrel Export**: `index.ts` provides central export point (though not strictly needed with arrow functions)

**Why it's safe:**
- Arrow functions `() => Model` are evaluated **lazily** at runtime, not at import time
- This breaks the circular dependency chain
- TypeScript/JavaScript can resolve all imports without circular issues

---

## Migration Commands

### Run Migrations
```bash
# Run all pending migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Undo all migrations
npm run db:migrate:undo:all
```

### Migration Files

**Location:** `src/database/migrations/`

**Naming Convention:** `YYYYMMDDHHMMSS-description.js`

**Example:** `20240101000000-create-initial-schema.js`

### Current Migrations

1. **`20240101000000-create-initial-schema.js`**
   - Creates all tables: `users`, `otps`, `social_auths`, `files`, `payments`
   - Sets up foreign keys and indexes
   - Includes `up()` and `down()` methods for rollback

---

## Seeder Commands

### Run Seeders
```bash
# Run all seeders
npm run db:seed

# Undo last seeder
npm run db:seed:undo

# Undo all seeders
npm run db:seed:undo:all
```

### Seeder Files

**Location:** `src/database/seeders/`

**Naming Convention:** `YYYYMMDDHHMMSS-description.js`

**Example:** `20240101000000-demo-data.js`

### Current Seeders

1. **`20240101000000-demo-data.js`**
   - Creates demo user: `demo@example.com` / `demo123456`
   - Creates demo OTP for testing
   - Creates demo payment transaction

---

## Quick Setup

### Full Database Setup (Development)
```bash
# Create database, run migrations, and seed data
npm run db:setup
```

This runs:
1. `db:create` - Creates the database if it doesn't exist
2. `db:migrate` - Runs all migrations
3. `db:seed` - Seeds demo data

### Step-by-Step Setup
```bash
# 1. Create database
npm run db:create

# 2. Run migrations
npm run db:migrate

# 3. Seed demo data (optional)
npm run db:seed
```

---

## Environment Configuration

Migrations use the same environment variables as the application:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=
DB_NAME=interview_db
NODE_ENV=development
```

The Sequelize CLI config reads from `.env.development`, `.env.test`, or `.env.production` based on `NODE_ENV`.

---

## Migration Structure

### Example Migration

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      // ... other columns
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: drop table
    await queryInterface.dropTable('users');
  },
};
```

### Best Practices

1. **Always provide `down()` method** for rollback
2. **Drop in reverse order** (children before parents)
3. **Use transactions** for complex migrations (optional)
4. **Test migrations** in development before production

---

## Seeder Structure

### Example Seeder

```javascript
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        email: 'demo@example.com',
        // ... other fields
      },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', { email: 'demo@example.com' });
  },
};
```

---

## Production Deployment

### Recommended Workflow

1. **Backup database** (always!)
2. **Run migrations**:
   ```bash
   NODE_ENV=production npm run db:migrate
   ```
3. **Verify** tables were created correctly
4. **Seed initial data** (if needed):
   ```bash
   NODE_ENV=production npm run db:seed
   ```

### Important Notes

- ⚠️ **Never run seeders in production** unless for initial setup
- ✅ **Always test migrations** in staging first
- ✅ **Keep migrations small** and focused
- ✅ **Use transactions** for critical migrations

---

## Troubleshooting

### Migration Fails

1. **Check database connection**:
   ```bash
   npm run check:services
   ```

2. **Verify environment variables**:
   ```bash
   echo $DB_HOST $DB_NAME
   ```

3. **Check migration status**:
   ```bash
   # Sequelize CLI doesn't have status command, but you can check:
   # SELECT * FROM SequelizeMeta;
   ```

### Seeder Fails

1. **Ensure migrations ran first**:
   ```bash
   npm run db:migrate
   ```

2. **Check for duplicate data**:
   - Seeders may fail if data already exists
   - Use `bulkDelete` in `down()` method

### Circular Dependency Issues

If you encounter circular dependency errors:

1. **Verify arrow functions** are used in all decorators:
   ```typescript
   @HasMany(() => Model) // ✅ Correct
   @HasMany(Model)       // ❌ Wrong
   ```

2. **Check imports** - direct imports are fine with arrow functions

3. **Build the project** to verify:
   ```bash
   npm run build
   ```

---

## Files Created

- ✅ `.sequelizerc` - Sequelize CLI configuration
- ✅ `src/database/config/sequelize.config.js` - Database config for CLI
- ✅ `src/database/migrations/20240101000000-create-initial-schema.js` - Initial migration
- ✅ `src/database/seeders/20240101000000-demo-data.js` - Demo data seeder
- ✅ Updated `package.json` with migration/seeding scripts

---

## Summary

✅ **Circular Dependencies**: Prevented by arrow functions in decorators  
✅ **Migrations**: Full schema versioning with rollback support  
✅ **Seeders**: Demo data for testing and development  
✅ **Production Ready**: Safe for deployment workflows  

**Time Investment:** ~15-20 minutes  
**Value:** Production-ready database management 🎯

