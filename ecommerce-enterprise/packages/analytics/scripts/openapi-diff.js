#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baselinePath = path.join(process.cwd(), 'openapi', 'analytics-baseline.json');
const currentPath = path.join(process.cwd(), 'openapi', 'analytics.json');

if (!fs.existsSync(currentPath)) {
  console.error('Current OpenAPI not found at', currentPath);
  process.exit(1);
}

if (!fs.existsSync(baselinePath)) {
  console.warn('Baseline OpenAPI not found; skipping breaking-change check. Commit openapi/analytics-baseline.json to enable.');
  process.exit(0);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const current = JSON.parse(fs.readFileSync(currentPath, 'utf8'));

function listOps(doc) {
  const out = new Set();
  const paths = doc.paths || {};
  for (const p of Object.keys(paths)) {
    const item = paths[p] || {};
    for (const method of Object.keys(item)) {
      const m = method.toLowerCase();
      if (['get','post','put','patch','delete','options','head'].includes(m)) {
        out.add(`${m} ${p}`);
      }
    }
  }
  return out;
}

const baseOps = listOps(baseline);
const currOps = listOps(current);

const removed = [];
for (const op of baseOps) {
  if (!currOps.has(op)) removed.push(op);
}

if (removed.length) {
  console.error('Breaking change detected: removed operations since baseline:');
  for (const op of removed) console.error(' -', op);
  process.exit(2);
}

console.log('OpenAPI diff check passed: no removed operations.');
process.exit(0);


