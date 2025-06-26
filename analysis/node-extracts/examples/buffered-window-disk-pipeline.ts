import { Readable, Transform } from 'stream';
import { promises as fs } from 'fs';
import * as path from 'path';

interface EventData {
  ts: number;
  value: number;
}

const TMP_FILE = path.join(__dirname, 'buffer.tmp.json');

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 30) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 30);
    }
  });
}

function diskBufferedWindow(windowMs: number, maxBuffer: number) {
  let buffer: EventData[] = [];
  let timer: NodeJS.Timeout | null = null;

  async function flush(self: Transform) {
    if (buffer.length > 0) {
      // Write buffer to disk
      await fs.appendFile(TMP_FILE, JSON.stringify(buffer) + '\n');
      self.push([...buffer]);
      buffer = [];
    }
  }

  return new Transform({
    objectMode: true,
    async transform(chunk: EventData, _enc, cb) {
      buffer.push(chunk);

      if (buffer.length >= maxBuffer) {
        await flush(this);
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        return cb();
      }

      if (timer) clearTimeout(timer);
      timer = setTimeout(async () => {
        await flush(this);
        timer = null;
      }, windowMs);

      cb();
    },
    async flush(cb) {
      await flush(this);
      if (timer) clearTimeout(timer);
      cb();
    }
  });
}

// Usage
(async () => {
  // Clean up previous buffer file
  try { await fs.unlink(TMP_FILE); } catch {}

  const src = eventStream();
  const windowed = src.pipe(diskBufferedWindow(500, 10));

  console.log('Disk-backed buffered window pipeline started');
  for await (const batch of windowed) {
    const values = (batch as EventData[]).map(e => e.value);
    console.log(`[disk-buffered-window] Batch: ${values.join(', ')}`);
  }
  console.log('Pipeline complete! Buffer file:', TMP_FILE);
})();