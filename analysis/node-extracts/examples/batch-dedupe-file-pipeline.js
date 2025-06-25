/**
 * Real-World Example: Batching, Deduplication, and File Writing in a Stream Pipeline
 *
 * This example demonstrates:
 *  - Batching: Collect N items and emit them as an array.
 *  - Deduplication: Only allow unique items through.
 *  - File writing: Write results to a file using Node's fs module.
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('../internal/streams/transform');
const fs = require('fs');

// Batch operator: collects N items and emits them as an array
function batch(size) {
  let buffer = '';
  let state = 'HEADER';
  let header;

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer += chunk;
      let idx; // <-- Make sure this is declared here!
      while ((idx = buffer.indexOf('\n')) !== -1) {
        const line = buffer.slice(0, idx);
        buffer = buffer.slice(idx + 1);

        if (state === 'HEADER') {
          header = line;
          state = 'BODY';
        } else if (state === 'BODY') {
          const body = line;
          this.push({ header, body });
          state = 'HEADER';
        }
      }
      callback();
    },
    flush(callback) {
      if (buffer.length > 0) {
        console.log('[batch] flushing:', buffer);
        callback(null, buffer);
      } else callback();
    }
  });
}

// Dedupe operator: only allows unique items through (by value)
function dedupe() {
  const seen = new Set();
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (Array.isArray(chunk)) {
        const unique = chunk.filter(x => {
          if (seen.has(x)) return false;
          seen.add(x);
          return true;
        });
        if (unique.length > 0) {
          console.log('[dedupe] emitting:', unique);
          callback(null, unique);
        } else {
          callback();
        }
      } else {
        if (seen.has(chunk)) return callback();
        seen.add(chunk);
        callback(null, chunk);
      }
    }
  });
}

// Example async generator: emits numbers with some duplicates
async function* numbersWithDuplicates() {
  const nums = [1, 2, 2, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10];
  for (const n of nums) {
    await new Promise(r => setTimeout(r, 20));
    console.log('[generator] yielding:', n);  // Add this debug log
    yield n;
  }
}

const numberStream = from(numbersWithDuplicates());

// Add debug logging
numberStream.on('data', d => console.log('[source]', d));
numberStream.on('end', () => console.log('[source] ended'));

// Compose pipeline: batch, dedupe, and write to file
const batchedAndDeduped = numberStream
  .pipe(batch(4))
  .pipe(dedupe());

// Add more debug logging
batchedAndDeduped.on('data', d => console.log('[pipeline]', d));
batchedAndDeduped.on('end', () => console.log('[pipeline] ended'));

// Writable stream to file
const output = fs.createWriteStream('output-batch-dedupe.txt', { encoding: 'utf8' });

(async () => {
  console.log('Batch/dedupe/file pipeline started');
  for await (const arr of batchedAndDeduped) {
    output.write(arr.join(',') + '\n');
    console.log('[output batch]', arr);
  }
  output.end();
  console.log('Batch/dedupe/file pipeline complete! See output-batch-dedupe.txt');
})();