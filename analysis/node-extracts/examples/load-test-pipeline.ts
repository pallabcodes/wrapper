/**
 * Load Testing Example
 */
import { Readable } from 'stream';

function eventStream(count: number) {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > count) return this.push(null);
      this.push({ ts: Date.now(), value: i++ });
    }
  });
}

(async () => {
  const start = Date.now();
  let processed = 0;
  const src = eventStream(100000);
  for await (const event of src) {
    processed++;
  }
  const duration = Date.now() - start;
  console.log(`[load-test] Processed ${processed} events in ${duration}ms`);
})();