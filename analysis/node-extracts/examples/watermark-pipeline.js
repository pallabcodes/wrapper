/**
 * Advanced Pattern: Watermarking
 * 
 * This example demonstrates:
 *  - Emitting a watermark to signal completeness up to a timestamp
 *  - Useful for event-time processing and late data handling
 */

const { Readable, Transform } = require('stream');

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 10) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 50);
    }
  });
}

function watermark(intervalMs) {
  let lastTs = 0;
  let timer = null;
  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      lastTs = chunk.ts;
      this.push(chunk);
      if (!timer) {
        timer = setInterval(() => {
          this.push({ watermark: lastTs });
        }, intervalMs);
      }
      callback();
    },
    flush(callback) {
      if (timer) clearInterval(timer);
      this.push({ watermark: lastTs });
      callback();
    }
  });
}

const pipeline = eventStream().pipe(watermark(200));

(async () => {
  console.log('Watermark pipeline started');
  for await (const item of pipeline) {
    if (item.watermark !== undefined) {
      console.log(`[watermark] up to ts: ${item.watermark}`);
    } else {
      console.log(`[event] value: ${item.value}`);
    }
  }
  console.log('Pipeline complete!');
})();