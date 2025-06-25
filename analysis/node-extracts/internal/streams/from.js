/**
 * Node.js Stream.from Core - Repurposable Extraction
 *
 * This is the distilled, hacky, and ingenious core of Node.js's Readable.from utility.
 * It allows you to create a readable stream from any iterable or async iterable source.
 *
 * You can repurpose this pattern to bridge between pull-based (iterators) and push-based (streams) systems.
 */

// Import the core Readable pattern
const { Readable } = require('./readable');

// Create a readable stream from an (async) iterable
function from(iterable, options = {}) {
  const iterator = Symbol.asyncIterator in iterable
    ? iterable[Symbol.asyncIterator]()
    : iterable[Symbol.iterator]();

  return new Readable({
    ...options,
    objectMode: true,
    read() {
      console.log('[from] _read called');
      const next = () => {
        console.log('[from] pulling next value');
        iterator.next().then(
          ({ value, done }) => {
            if (done) {
              console.log('[from] iterator done');
              this.push(null);
            } else {
              console.log('[from] got value:', value);
              const more = this.push(value);
              console.log('[from] push result:', more);
              if (more) {
                next();
              } else {
                console.log('[from] backpressure, waiting for next _read');
              }
            }
          },
          err => {
            console.error('[from] iterator error:', err);
            this.destroy(err);
          }
        );
      };
      next();
    }
  });
}

// Repurposing: Use from() to turn any iterable into a stream
// Example: Stream numbers 1 to 5
/*
const nums = [1, 2, 3, 4, 5];
const numStream = from(nums);
numStream.on('data', x => console.log(x));
*/

module.exports = { from };

/*
Key takeaways for repurposing:
- from() bridges iterables and streams, enabling flexible data pipelines.
- Works with both sync and async iterables.
- This pattern is the backbone for adapting generators, paginated APIs, etc.
*/