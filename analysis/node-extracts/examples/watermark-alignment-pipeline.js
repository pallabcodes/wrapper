/**
 * Advanced Pattern: Watermark Alignment Across Multiple Streams
 * 
 * This example demonstrates:
 *  - Synchronizing watermarks from several sources for consistent event-time processing
 */

const { PassThrough } = require('stream');

// Simulate N event streams with watermarks
function eventStream(id, count, delay) {
  let i = 1;
  return new PassThrough({ objectMode: true, emitClose: true }).on('pipe', function () {
    const stream = this;
    const interval = setInterval(() => {
      if (i > count) {
        clearInterval(interval);
        stream.end();
      } else {
        const ts = Date.now();
        stream.write({ id, ts, value: i });
        stream.write({ id, watermark: ts });
        i++;
      }
    }, delay);
  });
}

// Watermark aligner: emits min watermark across all streams
function watermarkAligner(numStreams) {
  const watermarks = Array(numStreams).fill(0);
  let ended = 0;
  const output = new PassThrough({ objectMode: true });

  return {
    input: (idx) => new PassThrough({
      objectMode: true,
      write(chunk, enc, cb) {
        if (chunk.watermark !== undefined) {
          watermarks[idx] = chunk.watermark;
          output.write({ alignedWatermark: Math.min(...watermarks) });
        } else {
          output.write(chunk);
        }
        cb();
      }
    }),
    output,
    end: () => { ended++; if (ended === numStreams) output.end(); }
  };
}

const streams = [
  eventStream('A', 5, 70),
  eventStream('B', 5, 100),
  eventStream('C', 5, 90)
];

const aligner = watermarkAligner(streams.length);

streams.forEach((s, idx) => {
  s.pipe(aligner.input(idx));
  s.on('end', aligner.end);
});

(async () => {
  console.log('Watermark alignment pipeline started');
  for await (const item of aligner.output) {
    if (item.alignedWatermark) {
      console.log(`[aligned watermark] ${item.alignedWatermark}`);
    } else {
      console.log(`[event]`, item);
    }
  }
  console.log('Pipeline complete!');
})();