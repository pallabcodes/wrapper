/**
 * Advanced Pattern: External Signal Window Trigger
 * 
 * This example demonstrates:
 *  - Opening/closing windows based on signals from another stream
 *  - E.g., market open/close, user session start/end
 */

const { PassThrough, Readable } = require('stream');

// Data stream
function* dataGen() {
  for (let i = 1; i <= 10; i++) {
    yield { ts: Date.now(), value: i };
  }
}
const dataStream = Readable.from(dataGen(), { objectMode: true });

// Signal stream (open/close events)
function* signalGen() {
  yield { type: 'open', ts: Date.now() + 100 };
  yield { type: 'close', ts: Date.now() + 400 };
  yield { type: 'open', ts: Date.now() + 600 };
  yield { type: 'close', ts: Date.now() + 900 };
}
const signalStream = Readable.from(signalGen(), { objectMode: true });

// Windowing logic
async function* windowBySignal(data, signals) {
  let open = false;
  let nextSignal = await signals.next();
  for await (const item of data) {
    while (nextSignal.value && item.ts >= nextSignal.value.ts) {
      open = nextSignal.value.type === 'open';
      nextSignal = await signals.next();
    }
    if (open) yield item;
  }
}

(async () => {
  console.log('External signal window pipeline started');
  const data = dataGen();
  const signals = signalGen();
  for await (const item of windowBySignal(data, signals)) {
    console.log(`[windowed] ${JSON.stringify(item)}`);
  }
  console.log('Pipeline complete!');
})();