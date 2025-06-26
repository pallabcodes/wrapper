/**
 * Retry Mechanism Example
 */
import { Readable, Transform } from 'stream';

function flakyEventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      setTimeout(() => {
        if (Math.random() < 0.5) this.destroy(new Error('Random failure'));
        else this.push({ ts: Date.now(), value: i++ });
      }, 100);
    }
  });
}

function retryStream(retries: number) {
  let attempts = 0;
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      this.push(chunk);
      cb();
    },
    final(cb) {
      if (++attempts < retries) {
        console.log(`[retry] Retrying attempt ${attempts}`);
        flakyEventStream().pipe(this, { end: false });
      }
      cb();
    }
  });
}

(async () => {
  const src = flakyEventStream().pipe(retryStream(3));
  try {
    for await (const event of src) {
      console.log('[retry] Event:', event.value);
    }
  } catch (e) {
    console.error('[retry] Stream failed after retries');
  }
})();