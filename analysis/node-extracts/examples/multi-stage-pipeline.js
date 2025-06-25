/**
 * Advanced Pattern: Multi-Stage Pipeline
 * 
 * This example demonstrates:
 *  - Chaining multiple transforms for complex processing
 *  - Each stage can filter, map, or aggregate
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

// Stage 1: Filter even numbers
function filterEven() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk % 2 === 0) this.push(chunk);
      callback();
    }
  });
}

// Stage 2: Square the number
function square() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(chunk * chunk);
      callback();
    }
  });
}

// Stage 3: Batch results in groups of 3
function batch(size) {
  let buffer = [];
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer.push(chunk);
      if (buffer.length === size) {
        this.push(buffer);
        buffer = [];
      }
      callback();
    },
    flush(callback) {
      if (buffer.length) this.push(buffer);
      callback();
    }
  });
}

// Example async generator: numbers 1-12
async function* numbers() {
  for (let i = 1; i <= 12; i++) {
    await new Promise(r => setTimeout(r, 20));
    yield i;
  }
}

const pipeline = from(numbers())
  .pipe(filterEven())
  .pipe(square())
  .pipe(batch(3));

(async () => {
  console.log('Multi-stage pipeline started');
  for await (const group of pipeline) {
    console.log(`[batch] ${group.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();