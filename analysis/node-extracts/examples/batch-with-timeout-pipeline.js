/**
 * Advanced Pattern: Batching with Timeout
 * 
 * This example demonstrates:
 *  - Emitting a batch when it reaches a size OR after a timeout
 *  - Useful for buffering network writes, database inserts, etc.
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function batchWithTimeout(size, timeoutMs) {
  let buffer = [];
  let timer = null;

  function flush(self, callback) {
    if (buffer.length > 0) {
      self.push(buffer);
      buffer = [];
    }
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (callback) callback();
  }

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer.push(chunk);
      if (!timer) {
        timer = setTimeout(() => flush(this), timeoutMs);
      }
      if (buffer.length >= size) {
        flush(this);
      }
      callback();
    },
    flush(callback) {
      flush(this, callback);
    }
  });
}

// Example async generator: numbers 1-15
async function* numbers() {
  for (let i = 1; i <= 15; i++) {
    await new Promise(r => setTimeout(r, Math.random() * 100));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(batchWithTimeout(5, 300));

(async () => {
  console.log('Batch with timeout pipeline started');
  for await (const batch of pipeline) {
    console.log(`[batch] ${batch.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();