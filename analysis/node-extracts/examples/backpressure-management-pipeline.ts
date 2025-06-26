import { Readable, Transform } from 'stream';

function fastProducer() {
  let i = 1;
  return new Readable({
    objectMode: true,
    highWaterMark: 2, // Small buffer to show backpressure
    read() {
      if (i > 20) return this.push(null);
      this.push({ value: i++ });
    }
  });
}

function slowConsumer() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      setTimeout(() => {
        this.push(chunk);
        cb();
      }, 200); // Slow processing
    }
  });
}

const src = fastProducer().pipe(slowConsumer());

(async () => {
  for await (const item of src) {
    console.log('[backpressure]', item);
  }
  console.log('Pipeline complete!');
})();