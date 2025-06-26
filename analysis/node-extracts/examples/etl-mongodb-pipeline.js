/**
 * Real-World ETL: Stream to MongoDB
 * 
 * This example demonstrates:
 *  - Extracting data from an async generator
 *  - Transforming data in a stream
 *  - Loading data into MongoDB using the official driver
 * 
 * Prerequisites:
 *   npm install mongodb
 *   (MongoDB server running locally or update the URI)
 */

const { Transform } = require('stream');
const { MongoClient } = require('mongodb');

const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'streamdemo';
const COLLECTION = 'users';

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
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const collection = db.collection(COLLECTION);

  // Clean up for demo
  await collection.deleteMany({});

  console.log('ETL to MongoDB pipeline started');
  const source = fakeApi();
  const transformer = transformNames();

  for await (const row of source) {
    transformer.write(row);
  }
  transformer.end();

  for await (const doc of transformer) {
    await collection.insertOne(doc);
    console.log('[ETL-MongoDB]', doc);
  }

  await client.close();
  console.log('ETL to MongoDB pipeline complete!');
})();