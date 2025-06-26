/**
 * Sharded Stream Processing Example
 * 
 * Demonstrates partitioning/sharding by key.
 */

import { Readable, Transform } from 'stream';

interface EventData {
  ts: number;
  value: number;
  key: string;
}

// Simulate a stream of events with keys
function eventStream() {
  let i = 1;
  return new Readable({
    objectMode: true,
    read() {
      if (i > 20) return this.push(null);
      const key = `shard${i % 4}`; // 4 shards
      setTimeout(() => this.push({ ts: Date.now(), value: i++, key }), 30);
    }
  });
}

// Partition events by key
function partitionByKey(numShards: number) {
  const shards: Transform[] = Array.from({ length: numShards }, () =>
    new Transform({
      objectMode: true,
      transform(chunk: EventData, _enc, cb) {
        this.push(chunk);
        cb();
      }
    })
  );
  return {
    write(chunk: EventData) {
      const shardIdx = parseInt(chunk.key.replace('shard', ''), 10) % numShards;
      shards[shardIdx].write(chunk);
    },
    shards,
  };
}

// Usage
const src = eventStream();
const { write, shards } = partitionByKey(4);

src.on('data', write);

shards.forEach((shard, idx) => {
  shard.on('data', (event: EventData) => {
    console.log(`[shard-${idx}] value=${event.value} key=${event.key}`);
  });
});