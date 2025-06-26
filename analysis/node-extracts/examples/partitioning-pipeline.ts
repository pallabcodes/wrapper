import { Readable, Transform, PassThrough } from 'stream';

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 20) return this.push(null);
      this.push({ key: i % 4, value: i++ });
    }
  });
}

function partitioner(numPartitions: number) {
  const outputs = Array.from({ length: numPartitions }, () => new PassThrough({ objectMode: true }));
  const transform = new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      outputs[chunk.key].write(chunk);
      cb();
    },
    flush(cb) {
      outputs.forEach(o => o.end());
      cb();
    }
  });
  return { transform, outputs };
}

const { transform, outputs } = partitioner(4);
eventStream().pipe(transform);

outputs.forEach((stream, idx) => {
  (async () => {
    for await (const item of stream) {
      console.log(`[partition ${idx}]`, item);
    }
  })();
});