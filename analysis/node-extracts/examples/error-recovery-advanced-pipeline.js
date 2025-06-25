/**
 * Advanced Pattern: Custom Error Propagation and Recovery
 * 
 * This example demonstrates:
 *  - Catching and logging errors in the pipeline
 *  - Recovering from errors and continuing processing
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function riskyTransform() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      if (chunk === 5) {
        callback(new Error('Bad value: 5'));
      } else {
        this.push(chunk);
        callback();
      }
    }
  });
}

function errorCatcher() {
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      this.push(chunk);
      callback();
    }
  });
}

// Example async generator: numbers 1-8
async function* numbers() {
  for (let i = 1; i <= 8; i++) {
    await new Promise(r => setTimeout(r, 40));
    yield i;
  }
}

const pipeline = from(numbers()).pipe(riskyTransform());

pipeline.on('error', err => {
  console.error('[error-catcher] Caught error:', err.message);
  // Optionally, you could resume or restart the pipeline here
});

(async () => {
  console.log('Error recovery advanced pipeline started');
  try {
    for await (const value of pipeline) {
      console.log(`[output] ${value}`);
    }
  } catch (err) {
    console.error('[main] Pipeline error:', err.message);
  }
  console.log('Pipeline complete!');
})();