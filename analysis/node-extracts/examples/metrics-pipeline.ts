import { Readable, Transform } from 'stream';

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 100) return this.push(null);
      this.push({ value: i++ });
    }
  });
}

function metricsTransform() {
  let count = 0;
  setInterval(() => {
    console.log(`[metrics] Processed: ${count} events`);
  }, 1000);

  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      count++;
      this.push(chunk);
      cb();
    }
  });
}

const src = eventStream().pipe(metricsTransform());

(async () => {
  for await (const item of src) {
    // Consume
  }
  console.log('Pipeline complete!');
})();