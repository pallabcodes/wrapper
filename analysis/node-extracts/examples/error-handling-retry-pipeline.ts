import { Readable, Transform } from 'stream';

function flakyEventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 10) return this.push(null);
      setTimeout(() => this.push({ value: i++ }), 50);
    }
  });
}

function retryTransform(maxRetries = 3) {
  return new Transform({
    objectMode: true,
    async transform(chunk, _enc, cb) {
      let attempts = 0;
      let lastErr: Error | null = null;
      while (attempts < maxRetries) {
        try {
          // Simulate flaky operation
          if (Math.random() < 0.3) throw new Error('Random failure');
          this.push({ ...chunk, processed: true });
          return cb();
        } catch (err) {
          lastErr = err as Error;
          attempts++;
          await new Promise(r => setTimeout(r, 100 * attempts)); // Exponential backoff
        }
      }
      cb(lastErr);
    }
  });
}

const src = flakyEventStream().pipe(retryTransform());

(async () => {
  for await (const item of src) {
    console.log('[retry-pipeline]', item);
  }
  console.log('Pipeline complete!');
})();