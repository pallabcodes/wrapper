/**
 * Advanced Pattern: Stream Zip (Pairwise Combination)
 * 
 * This example demonstrates:
 *  - Zipping two streams together into pairs
 *  - Useful for synchronizing related data sources
 */

const { Readable, PassThrough } = require('stream');

function zipStreams(a, b) {
  const output = new PassThrough({ objectMode: true });
  const aBuffer = [];
  const bBuffer = [];
  let aEnded = false, bEnded = false;

  a.on('data', chunk => {
    aBuffer.push(chunk);
    emitIfReady();
  });
  b.on('data', chunk => {
    bBuffer.push(chunk);
    emitIfReady();
  });
  a.on('end', () => { aEnded = true; checkEnd(); });
  b.on('end', () => { bEnded = true; checkEnd(); });

  function emitIfReady() {
    while (aBuffer.length && bBuffer.length) {
      output.write([aBuffer.shift(), bBuffer.shift()]);
    }
  }
  function checkEnd() {
    if (aEnded && bEnded) output.end();
  }
  return output;
}

// Example: two number streams
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

const s1 = numberStream(1, 5, 40);
const s2 = numberStream(101, 105, 60);

const zipped = zipStreams(s1, s2);

(async () => {
  console.log('Zip pipeline started');
  for await (const [a, b] of zipped) {
    console.log(`[zip] ${a} <-> ${b}`);
  }
  console.log('Pipeline complete!');
})();