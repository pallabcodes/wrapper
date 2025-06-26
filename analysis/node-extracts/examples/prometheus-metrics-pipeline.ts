/**
 * Prometheus Metrics Example
 * Requires: npm install prom-client
 */
import { Counter, collectDefaultMetrics, Registry } from 'prom-client';
import { Readable } from 'stream';

collectDefaultMetrics();
const registry = new Registry();
const eventCounter = new Counter({ name: 'stream_events_total', help: 'Total events processed' });

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 10) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 100);
    }
  });
}

(async () => {
  const src = eventStream();
  for await (const event of src) {
    eventCounter.inc();
    console.log('[metrics] Event:', event.value);
  }
  console.log(await registry.metrics());
})();