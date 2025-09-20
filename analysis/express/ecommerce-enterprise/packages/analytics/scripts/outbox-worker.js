#!/usr/bin/env node
const { createClient } = require('redis');

const url = process.env.REDIS_URL || 'redis://localhost:6379';
const batch = Number(process.env.OUTBOX_BATCH || 50);
const sleepMs = Number(process.env.OUTBOX_INTERVAL_MS || 1000);
const outboxKey = 'outbox:queue';
const inboxSet = 'inbox:processed';

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function main() {
  const client = createClient({ url });
  await client.connect();
  console.log(`[outbox-worker] connected to ${url}`);
  while (true) {
    try {
      let processed = 0;
      for (let i = 0; i < batch; i++) {
        const raw = await client.lPop(outboxKey);
        if (!raw) break;
        const evt = JSON.parse(raw);
        const seen = await client.sAdd(inboxSet, evt.id);
        if (seen === 0) {
          // already processed
          continue;
        }
        // Example consumer: just log; real systems would route by evt.type
        console.log(`[outbox-worker] consumed ${evt.type} ${evt.id}`);
        processed++;
      }
      if (processed === 0) await sleep(sleepMs);
    } catch (err) {
      console.error('[outbox-worker] error', err);
      await sleep(sleepMs);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


