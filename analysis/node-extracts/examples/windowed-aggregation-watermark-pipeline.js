/**
 * Advanced Pattern: Windowed Aggregation with Watermark
 * 
 * This example demonstrates:
 *  - Aggregating events in a time window
 *  - Emitting results when a watermark (event-time completeness) is reached
 */

const { Readable, Transform } = require('stream');

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 10) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 40);
    }
  });
}

function windowedAggregator(windowMs, watermarkMs) {
  let buffer = [];
  let lastWatermark = 0;
  let timer = null;

  function emitWindow(self, watermark) {
    const windowEvents = buffer.filter(e => e.ts <= watermark);
    if (windowEvents.length) {
      const sum = windowEvents.reduce((a, b) => a + b.value, 0);
      self.push({ watermark, sum });
      buffer = buffer.filter(e => e.ts > watermark);
    }
  }

  return new Transform({
    objectMode: true,
    transform(chunk, encoding, callback) {
      buffer.push(chunk);
      if (!timer) {
        timer = setInterval(() => {
          const watermark = Date.now() - watermarkMs;
          emitWindow(this, watermark);
          lastWatermark = watermark;
        }, windowMs);
      }
      callback();
    },
    flush(callback) {
      if (timer) clearInterval(timer);
      emitWindow(this, Date.now());
      callback();
    }
  });
}

const pipeline = eventStream().pipe(windowedAggregator(200, 100));

(async () => {
  console.log('Windowed aggregation with watermark pipeline started');
  for await (const result of pipeline) {
    console.log(`[windowed-sum] up to watermark ${result.watermark}: sum=${result.sum}`);
  }
  console.log('Pipeline complete!');
})();