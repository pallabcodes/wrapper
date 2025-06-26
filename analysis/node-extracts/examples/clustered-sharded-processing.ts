/**
 * Clustered Sharded Processing Example
 * 
 * Demonstrates orchestration of sharded stream processing using Node.js cluster.
 */

import cluster from 'cluster';
import { cpus } from 'os';
import { Readable } from 'stream';

interface EventData {
  ts: number;
  value: number;
  key: string;
}

const numShards = cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  // Fork workers
  for (let i = 0; i < numShards; i++) {
    cluster.fork({ SHARD_IDX: i });
  }

  // Simulate event source and distribute to workers
  let i = 1;
  function produce() {
    if (i > 40) return;
    const key = `shard${i % numShards}`;
    const event: EventData = { ts: Date.now(), value: i++, key };
    // Send to the correct worker
    for (const id in cluster.workers) {
      const worker = cluster.workers[id];
      // Type assertion to access env
      const env = (worker?.process as any).env;
      if (worker && parseInt(env.SHARD_IDX || '0', 10) === i % numShards) {
        worker.send(event);
      }
    }
    setTimeout(produce, 20);
  }
  produce();

  cluster.on('exit', (worker) => {
    console.log(`Worker ${worker.process.pid} exited`);
  });
} else {
  // Worker: process only its shard
  const shardIdx = parseInt(process.env.SHARD_IDX || '0', 10);
  process.on('message', (event: EventData) => {
    if (event.key === `shard${shardIdx}`) {
      console.log(`[worker ${process.pid}][shard-${shardIdx}] value=${event.value} key=${event.key}`);
    }
  });
}