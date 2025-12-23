#!/usr/bin/env node
const autocannon = require('autocannon');

const url = process.env.URL || 'http://localhost:3003/api/v1/analytics/health';
const duration = Number(process.env.DURATION || 10);
const connections = Number(process.env.CONNECTIONS || 50);

console.log(`Benchmarking ${url} for ${duration}s with ${connections} connections...`);

autocannon(
  {
    url,
    duration,
    connections,
    headers: { 'accept-encoding': 'gzip' },
  },
  (err, res) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    const { latency } = res;
    console.log('Latency (ms): p50=%d p95=%d p99=%d', latency.p50, latency.p95, latency.p99);
    process.exit(0);
  },
);


