/**
 * Minimal Project: Composing Streams with Async Iterators
 *
 * This example shows how to bridge between async iterators and Node.js-style streams,
 * and how to compose them in a pipeline. This is a universal pattern for modern JS.
 */

// Import the core stream and from() utility
const { Readable } = require('../internal/streams/readable');
const { from } = require('../internal/streams/from');
const { map, filter, debug } = require('../internal/streams/operators');

// Example async generator (could be any async data source)
async function* asyncNumberGen() {
  for (let i = 1; i <= 10; i++) {
    await new Promise(r => setTimeout(r, 50));
    yield i;
  }
}

// Create a readable stream from the async generator
const numberStream = from(asyncNumberGen());

// Compose with stream operators (map, filter) and add logging
const mapped = numberStream
  .pipe(debug('before-map'))
  .pipe(map(x => x * 2))
  .pipe(debug('after-map'))
  .pipe(filter(x => x % 4 === 0))
  .pipe(debug('after-filter'));

// Consume as an async iterator
(async () => {
  console.log('Pipeline started');
  for await (const value of mapped) {
    console.log('[output]', value);
  }
  console.log('Pipeline complete!');
})();

numberStream.on('data', d => console.log('[numberStream data]', d));
numberStream.on('end', () => console.log('[numberStream end]'));
mapped.on('data', d => console.log('[mapped data]', d));
mapped.on('end', () => console.log('[mapped end]'));

/*
Key takeaways:
- from() bridges async iterators and streams.
- You can compose streams and operators, then consume as an async iterator.
- This pattern is universal for modern JS, Node.js, and browser streams.
*/