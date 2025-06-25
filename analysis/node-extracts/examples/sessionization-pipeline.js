/**
 * Advanced Pattern: Event-Time Sessionization
 * 
 * This example demonstrates:
 *  - Grouping events into sessions based on inactivity gap
 *  - Useful for analytics and user behavior tracking
 */

const { from } = require('../internal/streams/from');
const { Transform } = require('stream');

function sessionize(gapMs) {
  let session = [];
  let lastTs = null;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      const { ts, value } = chunk;
      if (lastTs !== null && ts - lastTs > gapMs) {
        this.push([...session]);
        session = [];
      }
      session.push(value);
      lastTs = ts;
      callback();
    },
    flush(callback) {
      if (session.length) this.push([...session]);
      callback();
    }
  });
}

// Example async generator: events with timestamps and gaps
async function* events() {
  const arr = [
    { ts: 1000, value: 'A' },
    { ts: 1100, value: 'B' },
    { ts: 1200, value: 'C' },
    { ts: 2000, value: 'D' }, // gap > 500
    { ts: 2100, value: 'E' },
    { ts: 3000, value: 'F' }
  ];
  for (const e of arr) {
    await new Promise(r => setTimeout(r, 50));
    yield e;
  }
}

const pipeline = from(events()).pipe(sessionize(500));

(async () => {
  console.log('Sessionization pipeline started');
  for await (const session of pipeline) {
    console.log(`[session] ${session.join(', ')}`);
  }
  console.log('Pipeline complete!');
})();