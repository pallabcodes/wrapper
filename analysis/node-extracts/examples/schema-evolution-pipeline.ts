import { Readable, Transform } from 'stream';

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      // Simulate v1 and v2 events
      this.push(i % 2 === 0 ? { value: i, version: 2, extra: 'foo' } : { value: i, version: 1 });
      i++;
    }
  });
}

function schemaValidatorAndMigrator() {
  return new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      if (chunk.version === 1) {
        // Migrate to v2
        chunk.version = 2;
        chunk.extra = 'migrated';
      }
      this.push(chunk);
      cb();
    }
  });
}

const src = eventStream().pipe(schemaValidatorAndMigrator());

(async () => {
  for await (const item of src) {
    console.log('[schema]', item);
  }
  console.log('Pipeline complete!');
})();