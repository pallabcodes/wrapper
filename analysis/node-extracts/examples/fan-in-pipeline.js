/**
 * Advanced Pattern: Fan-In (Merging Streams)
 * 
 * This example demonstrates:
 *  - Merging multiple input streams into one output stream
 *  - Useful for aggregating data from multiple sources
 */

const { PassThrough, Readable } = require('stream');
const { once } = require('events');

function fanIn(streams) {
  const output = new PassThrough({ objectMode: true });
  let ended = 0;
  streams.forEach(stream => {
    stream.on('data', chunk => output.write(chunk));
    stream.on('end', () => {
      ended++;
      if (ended === streams.length) output.end();
    });
  });
  return output;
}

// Example: create three number streams
function numberStream(start, end, delay) {
  let i = start;
  return new Readable({
    objectMode: true,
    read() {
      if (i > end) return this.push(null);
      setTimeout(() => this.push(i++), delay);
    }
  });
}

const s1 = numberStream(1, 5, 50);
const s2 = numberStream(101, 105, 70);
const s3 = numberStream(201, 205, 30);

const merged = fanIn([s1, s2, s3]);

(async () => {
  console.log('Fan-in pipeline started');
  for await (const value of merged) {
    console.log(`[merged] ${value}`);
  }
  console.log('Pipeline complete!');
})();