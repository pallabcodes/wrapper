#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function createDatabase() {
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
  };

  const databaseName = process.env.DB_NAME || 'interview_db';

  let connection;
  try {
    console.log(`Connecting to MySQL at ${config.host}:${config.port}...`);
    connection = await mysql.createConnection(config);

    console.log(`Creating database '${databaseName}' if it doesn't exist...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    console.log(`✅ Database '${databaseName}' is ready!`);
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    if (connection) {
      await connection.end();
    }
    process.exit(1);
  }
}

createDatabase();

