/**
 * Redis Streams Example
 * Requires: npm install redis
 */
import { createClient } from 'redis';

const client = createClient();
const STREAM_KEY = 'example:stream';

async function produce() {
  await client.connect();
  for (let i = 1; i <= 10; i++) {
    await client.xAdd(STREAM_KEY, '*', { value: i.toString() });
  }
  await client.quit();
}

async function consume() {
  await client.connect();
  let lastId = '0-0';
  for (let i = 0; i < 10; i++) {
    const res = await client.xRead({ key: STREAM_KEY, id: lastId }, { COUNT: 1, BLOCK: 1000 });
    if (Array.isArray(res)) {
      for (const entry of res as Array<{ name: string; messages: Array<{ id: string; message: { value: string } }> }>) {
        for (const msg of entry.messages) {
          console.log('[redis-streams] Event:', msg.message.value);
          lastId = msg.id;
        }
      }
    }
  }
  await client.quit();
}

produce().then(consume);