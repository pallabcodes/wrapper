/**
 * Advanced ETL: Change Data Capture (CDC) to Data Lake
 * 
 * This example demonstrates:
 *  - Streaming change events (insert/update/delete)
 *  - Writing append-only logs for data lake ingestion
 */

const fs = require('fs');
const { Transform } = require('stream');

// Simulated CDC event generator
async function* cdcEvents() {
  const events = [
    { op: 'insert', id: 1, name: 'Alice' },
    { op: 'insert', id: 2, name: 'Bob' },
    { op: 'update', id: 1, name: 'Alicia' },
    { op: 'delete', id: 2 }
  ];
  for (const e of events) {
    await new Promise(r => setTimeout(r, 50));
    yield e;
  }
}

// Transform: format as JSON lines
function toJsonl() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(JSON.stringify(chunk) + '\n');
      callback();
    }
  });
}

const output = fs.createWriteStream('cdc-datalake.log');

(async () => {
  console.log('CDC to Data Lake pipeline started');
  for await (const line of cdcEvents()) {
    output.write(JSON.stringify(line) + '\n');
    console.log('[CDC]', line);
  }
  output.end(() => console.log('CDC pipeline complete!'));
})();