import { Readable, Transform } from 'stream';
import { promises as fs } from 'fs';

const CHECKPOINT_FILE = './checkpoint.json';

async function saveCheckpoint(state: any) {
  await fs.writeFile(CHECKPOINT_FILE, JSON.stringify(state));
}

async function loadCheckpoint() {
  try {
    const data = await fs.readFile(CHECKPOINT_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return { lastValue: 0 };
  }
}

function eventStream(start: number) {
  let i = start;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 20) return this.push(null);
      this.push({ value: i++ });
    }
  });
}

(async () => {
  const checkpoint = await loadCheckpoint();
  const src = eventStream(checkpoint.lastValue + 1);

  let lastValue = checkpoint.lastValue;
  const cpTransform = new Transform({
    objectMode: true,
    transform(chunk, _enc, cb) {
      lastValue = chunk.value;
      this.push(chunk);
      saveCheckpoint({ lastValue }).then(() => cb());
    }
  });

  for await (const item of src.pipe(cpTransform)) {
    console.log('[checkpoint]', item);
  }
  console.log('Pipeline complete!');
})();