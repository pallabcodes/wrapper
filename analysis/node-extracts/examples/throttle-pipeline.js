/**
 * Real-World Example: Throttling a Stream Pipeline
 *
 * This example demonstrates how to throttle a stream of data so that only one chunk
 * passes through every 100ms, regardless of how fast the source produces data.
 * This is useful for rate-limiting API calls, UI updates, or network traffic.
 */

const { from } = require('../internal/streams/from');
const { map, debug } = require('../internal/streams/operators');
const { Transform } = require('../internal/streams/transform');

// Throttle operator: allows one chunk every `interval` ms
function throttle(interval) {
  let lastTime = 0;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const now = Date.now();
      const wait = Math.max(0, interval - (now - lastTime));
      setTimeout(() => {
        lastTime = Date.now();
        callback(null, chunk);
      }, wait);
    }
  });
}

// Example async generator: emits numbers as fast as possible
async function* fastNumbers() {
  for (let i = 1; i <= 10; i++) {
    yield i;
  }
}

const fastStream = from(fastNumbers());

const throttled = fastStream
  .pipe(debug('before-throttle'))
  .pipe(throttle(100))
  .pipe(debug('after-throttle'));

(async () => {
  console.log('Throttle pipeline started');
  for await (const value of throttled) {
    console.log('[output]', value);
  }
  console.log('Throttle pipeline complete!');
})();