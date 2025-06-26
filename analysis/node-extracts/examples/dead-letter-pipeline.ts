/**
 * Dead-letter Queue Example
 */
import { Readable, Transform } from 'stream';

const deadLetter: any[] = [];

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

function processWithDLQ() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      if (chunk.value % 3 === 0) {
        deadLetter.push(chunk);
        cb(); // Drop
      } else {
        this.push(chunk);
        cb();
      }
    }
  });
}

(async () => {
  const src = eventStream().pipe(processWithDLQ());
  for await (const event of src) {
    console.log('[dlq] Event:', event.value);
  }
  console.log('[dlq] Dead-lettered:', deadLetter.map(e => e.value));
})();