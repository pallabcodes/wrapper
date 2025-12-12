#!/usr/bin/env node

/**
 * Type Safety Check Script
 * 
 * Validates that no `any` types exist in published code.
 * Usage: node scripts/check-type-safety.js
 * 
 * Exit code: 0 if no `any` types found, 1 otherwise
 */

const { findAnyTypes } = require('./audit-any-types');
const path = require('path');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');

function main() {
  console.log('Checking for `any` type usage in packages...');
  
  const anyTypes = findAnyTypes(PACKAGES_DIR);
  
  if (anyTypes.length === 0) {
    console.log('✅ No `any` types found! Type safety check passed.');
    process.exit(0);
  }

  console.error(`\n❌ Type safety check failed!`);
  console.error(`Found ${anyTypes.length} instances of \`any\` type:\n`);
  
  // Group by file and show summary
  const byFile = {};
  anyTypes.forEach(item => {
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });

  // Show top 10 files with most issues
  const sortedFiles = Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  console.error('Top files with `any` types:');
  sortedFiles.forEach(([file, items]) => {
    console.error(`  ${file}: ${items.length} instances`);
  });

  if (anyTypes.length > sortedFiles.reduce((sum, [, items]) => sum + items.length, 0)) {
    console.error(`  ... and ${anyTypes.length - sortedFiles.reduce((sum, [, items]) => sum + items.length, 0)} more instances`);
  }

  console.error(`\nRun 'node scripts/audit-any-types.js' for full report.`);
  process.exit(1);
}

if (require.main === module) {
  main();
}

module.exports = { main };
