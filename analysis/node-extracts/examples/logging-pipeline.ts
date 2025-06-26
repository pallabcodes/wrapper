/**
 * Logging Example with Pino
 * Requires: npm install pino
 */
import pino from 'pino';
import { Readable } from 'stream';

const logger = pino();

function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 5) return this.push(null);
      setTimeout(() => this.push({ ts: Date.now(), value: i++ }), 100);
    }
  });
}

(async () => {
  const src = eventStream();
  for await (const event of src) {
    logger.info({ event }, 'Processing event');
  }
})();