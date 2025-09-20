#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), 'openapi', 'analytics.json');
const dst = path.join(process.cwd(), 'openapi', 'analytics-baseline.json');

if (!fs.existsSync(src)) {
  console.error('Missing openapi/analytics.json; run openapi:gen first');
  process.exit(1);
}
fs.copyFileSync(src, dst);
console.log('Baseline written to', dst);


