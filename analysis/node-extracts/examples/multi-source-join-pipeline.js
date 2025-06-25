/**
 * Advanced Pattern: Multi-Source Join
 * 
 * This example demonstrates:
 *  - Joining three streams together by arrival order
 *  - Useful for synchronizing multiple data feeds
 */

const { Readable, PassThrough } = require('stream');

function multiSourceZip(streams) {
  const output = new PassThrough({ objectMode: true });
  const buffers = streams.map(() => []);
  let ended = streams.map(() => false);

  streams.forEach((s, idx) => {
    s.on('data', chunk => {
      buffers[idx].push(chunk);
      emitIfReady();
    });
    s.on('end', () => {
      ended[idx] = true;
      if (ended.every(Boolean)) output.end();
    });
  });

  function emitIfReady() {
    if (buffers.every(buf => buf.length)) {
      output.write(buffers.map(buf => buf.shift()));
    }
  }

  return output;
}

// Example: three number streams
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

const s1 = numberStream(1, 4, 40);
const s2 = numberStream(101, 104, 60);
const s3 = numberStream(201, 204, 80);

const zipped = multiSourceZip([s1, s2, s3]);

(async () => {
  console.log('Multi-source join pipeline started');
  for await (const [a, b, c] of zipped) {
    console.log(`[multi-zip] ${a} <-> ${b} <-> ${c}`);
  }
  console.log('Pipeline complete!');
})();