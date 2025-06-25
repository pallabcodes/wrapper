/**
 * Advanced Pattern: Stream Tee (Duplicator)
 * 
 * This example demonstrates:
 *  - Duplicating a stream to multiple independent consumers
 */

const { from } = require('../internal/streams/from');
const { PassThrough } = require('stream');

// Tee function: returns two PassThrough streams
function tee(source) {
  const a = new PassThrough({ objectMode: true });
  const b = new PassThrough({ objectMode: true });
  source.on('data', chunk => {
    a.write(chunk);
    b.write(chunk);
  });
  source.on('end', () => {
    a.end();
    b.end();
  });
  return [a, b];
}

// Example async generator: numbers 1-6
async function* numbers() {
  for (let i = 1; i <= 6; i++) {
    await new Promise(r => setTimeout(r, 30));
    yield i;
  }
}

const source = from(numbers());
const [streamA, streamB] = tee(source);

(async () => {
  for await (const value of streamA) {
    console.log(`[A] got: ${value}`);
  }
})();

(async () => {
  for await (const value of streamB) {
    console.log(`[B] got: ${value}`);
  }
})();