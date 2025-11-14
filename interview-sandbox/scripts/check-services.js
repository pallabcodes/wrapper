#!/usr/bin/env node

const mysql = require('mysql2/promise');
const redis = require('ioredis');
require('dotenv').config();

async function checkMySQL() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
  };

  const databaseName = process.env.DB_NAME || 'interview_db';

  try {
    const connection = await mysql.createConnection(config);
    await connection.query(`USE \`${databaseName}\``);
    await connection.end();
    return { status: 'ok', message: `MySQL connected and database '${databaseName}' exists` };
  } catch (error) {
    return { status: 'error', message: `MySQL: ${error.message}` };
  }
}

async function checkRedis() {
  const config = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB || '0', 10),
    retryStrategy: () => null, // Don't retry, fail fast
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
  };

  return new Promise((resolve) => {
    const client = new redis(config);
    
    const timeout = setTimeout(() => {
      client.disconnect();
      resolve({ status: 'error', message: 'Redis: Connection timeout' });
    }, 2000);

    client.ping()
      .then(() => {
        clearTimeout(timeout);
        client.disconnect();
        resolve({ status: 'ok', message: 'Redis connected' });
      })
      .catch((error) => {
        clearTimeout(timeout);
        client.disconnect();
        resolve({ status: 'error', message: `Redis: ${error.message}` });
      });
  });
}

async function main() {
  console.log('🔍 Checking required services...\n');

  const mysqlResult = await checkMySQL();
  const redisResult = await checkRedis();

  console.log('MySQL:', mysqlResult.status === 'ok' ? '✅' : '❌', mysqlResult.message);
  console.log('Redis:', redisResult.status === 'ok' ? '✅' : '❌', redisResult.message);

  console.log('\n📋 Summary:');
  if (mysqlResult.status === 'ok') {
    console.log('✅ MySQL is ready - Core features will work');
  } else {
    console.log('❌ MySQL is not available - Application will not start');
    console.log('   Fix: Start MySQL or run "npm run docker:up"');
  }

  if (redisResult.status === 'ok') {
    console.log('✅ Redis is ready - Background jobs (BullMQ) will work');
  } else {
    console.log('⚠️  Redis is not available - Background jobs will fail');
    console.log('   Note: Core features (auth, users, files, payments) will still work');
    console.log('   Fix: Start Redis or run "npm run docker:up"');
  }

  if (mysqlResult.status === 'ok') {
    console.log('\n✅ You can start the application with: npm run start:dev');
    process.exit(0);
  } else {
    console.log('\n❌ Cannot start application - MySQL is required');
    process.exit(1);
  }
}

main();

