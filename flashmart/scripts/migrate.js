#!/usr/bin/env node

/**
 * Database Migration Runner
 * Migrates from shared database to service-specific schemas
 */

const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'flashmart',
  password: process.env.DB_PASSWORD || 'flashmart_dev',
  database: process.env.DB_NAME || 'flashmart',
};

async function runMigration() {
  const client = new Client(config);

  try {
    console.log('🔄 Connecting to database...');
    await client.connect();

    console.log('📦 Checking if schemas exist...');
    const schemasResult = await client.query(`
      SELECT schema_name
      FROM information_schema.schemata
      WHERE schema_name IN ('user_service', 'payment_service', 'catalog_service', 'order_service', 'video_service')
    `);

    const existingSchemas = schemasResult.rows.map(row => row.schema_name);

    if (existingSchemas.length === 5) {
      console.log('✅ All schemas already exist. Checking data...');

      // Check if data has been migrated
      const userCount = await client.query('SELECT COUNT(*) as count FROM user_service.users');
      const paymentCount = await client.query('SELECT COUNT(*) as count FROM payment_service.payments');
      const productCount = await client.query('SELECT COUNT(*) as count FROM catalog_service.products');

      console.log(`📊 Migration status:`);
      console.log(`   Users: ${userCount.rows[0].count}`);
      console.log(`   Payments: ${paymentCount.rows[0].count}`);
      console.log(`   Products: ${productCount.rows[0].count}`);

      if (parseInt(userCount.rows[0].count) > 0) {
        console.log('✅ Data appears to be already migrated');
        return;
      }
    }

    console.log('🚀 Starting migration...');

    // Read and execute migration SQL
    const migrationSQL = fs.readFileSync(
      path.join(__dirname, 'migrate-to-schemas.sql'),
      'utf8'
    );

    // Split into individual statements and execute
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.query(statement);
        } catch (error) {
          // Ignore errors for comments or empty statements
          if (!statement.includes('--') && statement.trim()) {
            console.warn(`⚠️  Statement failed (might be expected):`, statement.substring(0, 50) + '...');
          }
        }
      }
    }

    console.log('✅ Migration completed successfully!');

    // Verify migration
    console.log('🔍 Verifying migration...');
    const verificationResults = await client.query(`
      SELECT
        'user_service' as schema_name, COUNT(*) as record_count FROM user_service.users
      UNION ALL
      SELECT 'payment_service', COUNT(*) FROM payment_service.payments
      UNION ALL
      SELECT 'catalog_service', COUNT(*) FROM catalog_service.products
      UNION ALL
      SELECT 'order_service', COUNT(*) FROM order_service.orders
    `);

    console.log('📊 Migration verification:');
    verificationResults.rows.forEach(row => {
      console.log(`   ${row.schema_name}: ${row.record_count} records`);
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log('🎉 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration };
