/**
 * Advanced ETL: Streaming Upsert/Merge Logic
 * 
 * This example demonstrates:
 *  - Idempotent upsert/merge of records into a target store
 *  - Useful for slowly changing dimensions or CDC ETL
 */

const { Transform } = require('stream');

// Simulated in-memory store
const store = new Map();

// Simulated incoming records (some updates)
async function* records() {
  const arr = [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 1, name: 'Alicia' },
    { id: 3, name: 'Carol' }
  ];
  for (const rec of arr) {
    await new Promise(r => setTimeout(r, 40));
    yield rec;
  }
}

// Upsert transform
function upsertStore() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      store.set(chunk.id, chunk);
      this.push({ ...chunk, op: 'upserted' });
      callback();
    }
  });
}

(async () => {
  console.log('Upsert/Merge pipeline started');
  for await (const rec of records()) {
    upsertStore().write(rec);
    store.set(rec.id, rec);
    console.log('[Upserted]', rec);
  }
  console.log('Final store:', Array.from(store.values()));
})();