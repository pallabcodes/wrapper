require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

// Determine database dialect from environment variable, default to MySQL
const dbDialect = (process.env.DB_DIALECT || 'mysql').toLowerCase();
const isPostgres = dbDialect === 'postgres' || dbDialect === 'postgresql';
const dialect = isPostgres ? 'postgres' : 'mysql';
const defaultPort = isPostgres ? 5432 : 3306;
const defaultUsername = isPostgres ? 'postgres' : 'root';

module.exports = {
  development: {
    username: process.env.DB_USERNAME || defaultUsername,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_db',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || String(defaultPort), 10),
    dialect: dialect,
    logging: console.log,
  },
  test: {
    username: process.env.DB_USERNAME || defaultUsername,
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'interview_db_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || String(defaultPort), 10),
    dialect: dialect,
    logging: false,
  },
  production: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || String(defaultPort), 10),
    dialect: dialect,
    logging: false,
  },
};

