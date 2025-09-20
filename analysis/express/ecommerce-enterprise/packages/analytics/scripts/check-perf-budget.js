#!/usr/bin/env node
const fs = require('fs');

const p95Budget = Number(process.env.P95_BUDGET_MS || 50);
const p99Budget = Number(process.env.P99_BUDGET_MS || 120);

const text = fs.readFileSync('perf.txt', 'utf8');
const m = /Latency \(ms\): p50=(\d+) p95=(\d+) p99=(\d+)/.exec(text);
if (!m) {
  console.error('Could not parse perf.txt');
  process.exit(1);
}
const [, p50, p95, p99] = m.map(Number);
console.log(`Parsed: p50=${p50} p95=${p95} p99=${p99}`);
let failed = false;
if (p95 > p95Budget) { console.error(`p95 ${p95} > budget ${p95Budget}`); failed = true; }
if (p99 > p99Budget) { console.error(`p99 ${p99} > budget ${p99Budget}`); failed = true; }
process.exit(failed ? 2 : 0);


