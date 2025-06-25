/**
 * Advanced Pattern: Dynamic Pipeline Reconfiguration
 * 
 * This example demonstrates:
 *  - Switching transforms in the pipeline at runtime
 *  - Useful for feature flags, A/B testing, or hot reloading logic
 */

const { from } = require('../internal/streams/from');
const { Transform, PassThrough } = require('stream');

function double() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(chunk * 2);
      callback();
    }
  });
}

function square() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(chunk * chunk);
      callback();
    }
  });
}

// Example async generator: numbers 1-8
async function* numbers() {
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 50));
    yield i;
  }
}

const source = from(numbers());
let currentTransform = double();
const passthrough = new PassThrough({ objectMode: true });

source.pipe(passthrough).pipe(currentTransform);

setTimeout(() => {
  // Switch to square after 300ms
  passthrough.unpipe(currentTransform);
  currentTransform = square();
  passthrough.pipe(currentTransform);
  console.log('[dynamic] Switched to square transform!');
}, 300);

(async () => {
  console.log('Dynamic pipeline started');
  for await (const value of currentTransform) {
    console.log(`[output] ${value}`);
  }
  console.log('Pipeline complete!');
})();