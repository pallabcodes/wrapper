/**
 * Advanced Pattern: Stream-based ETL (Extract, Transform, Load)
 * 
 * This example demonstrates:
 *  - Extracting from an API, transforming, and loading into a file
 */

const { Transform } = require('stream');
const fs = require('fs');

// Fake API extractor (async generator)
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

// Load: write to file as JSON lines
const output = fs.createWriteStream('etl-output.jsonl');
(async () => {
  console.log('ETL pipeline started');
  for await (const row of fakeApi()) {
    const transformed = { ...row, name: row.name.toUpperCase() };
    output.write(JSON.stringify(transformed) + '\n');
    console.log('[ETL]', transformed);
  }
  output.end(() => console.log('ETL pipeline complete!'));
})();