import { Readable, Transform } from 'stream';

const VALID_API_KEYS = new Set(['abc123', 'def456']);

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 10) return this.push(null);
      this.push({ value: i++, apiKey: i % 2 === 0 ? 'abc123' : 'invalid' });
    }
  });
}

function apiKeyValidator() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      if (!VALID_API_KEYS.has(chunk.apiKey)) {
        return cb(new Error('Invalid API key'));
      }
      this.push(chunk);
      cb();
    }
  });
}

const src = eventStream().pipe(apiKeyValidator());

(async () => {
  try {
    for await (const item of src) {
      console.log('[secure]', item);
    }
  } catch (err) {
    console.error('[security error]', err.message);
  }
  console.log('Pipeline complete!');
})();