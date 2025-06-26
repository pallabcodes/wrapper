import { Readable, Transform } from 'stream';

function unorderedEventStream() {
  const events = [
    { id: 2, value: 'B' },
    { id: 1, value: 'A' },
    { id: 3, value: 'C' }
  ];
  let i = 0;
  return new Readable({
    objectMode: true,
    read() {
      if (i >= events.length) return this.push(null);
      this.push(events[i++]);
    }
  });
}

function orderById() {
  const buffer: any[] = [];
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      buffer.push(chunk);
      cb();
    },
    flush(cb) {
      buffer.sort((a, b) => a.id - b.id);
      buffer.forEach(e => this.push(e));
      cb();
    }
  });
}

const src = unorderedEventStream().pipe(orderById());

(async () => {
  for await (const item of src) {
    console.log('[ordered]', item);
  }
  console.log('Pipeline complete!');
})();