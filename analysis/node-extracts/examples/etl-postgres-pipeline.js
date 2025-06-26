/**
 * Real-World ETL: Stream to PostgreSQL
 * 
 * This example demonstrates:
 *  - Extracting data from an async generator
 *  - Transforming data in a stream
 *  - Loading data into PostgreSQL using the 'pg' library
 * 
 * Prerequisites:
 *   npm install pg
 *   (PostgreSQL server running locally or update the connection string)
 */

const { Transform } = require('stream');
const { Client } = require('pg');

const PG_URI = 'postgresql://postgres:postgres@localhost:5432/postgres';

// Fake extractor (async generator)
async function* fakeApi() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 40));
    yield { id: i, name: `user${i}` };
  }
}

// Transform: uppercase names
function transformNames() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      chunk.name = chunk.name.toUpperCase();
      this.push(chunk);
      callback();
    }
  });
}

(async () => {
  const client = new Client({ connectionString: PG_URI });
  await client.connect();

  // Setup table for demo
  await client.query('DROP TABLE IF EXISTS users');
  await client.query('CREATE TABLE users (id INT PRIMARY KEY, name TEXT)');

  console.log('ETL to PostgreSQL pipeline started');
  const source = fakeApi();
  const transformer = transformNames();

  for await (const row of source) {
    transformer.write(row);
  }
  transformer.end();

  for await (const doc of transformer) {
    await client.query('INSERT INTO users (id, name) VALUES ($1, $2)', [doc.id, doc.name]);
    console.log('[ETL-Postgres]', doc);
  }

  await client.end();
  console.log('ETL to PostgreSQL pipeline complete!');
})();