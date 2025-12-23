#!/usr/bin/env node

/**
 * Type Safety Audit Script
 * 
 * Scans the codebase for `any` type usage and generates a categorized report.
 * Usage: node scripts/audit-any-types.js [--output report.md]
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PACKAGES_DIR = path.join(__dirname, '..', 'packages');
const OUTPUT_FILE = process.argv.includes('--output') 
  ? process.argv[process.argv.indexOf('--output') + 1]
  : path.join(__dirname, '..', 'docs', 'type-safety-audit-report.md');

// Categories for `any` usage
const CATEGORIES = {
  guards: ['guard', 'guards'],
  interceptors: ['interceptor', 'interceptors'],
  controllers: ['controller', 'controllers'],
  services: ['service', 'services'],
  repositories: ['repository', 'repositories'],
  dto: ['dto', 'dto'],
  entities: ['entity', 'entities'],
  types: ['types', 'type'],
  utils: ['util', 'utils', 'helper', 'helpers'],
  middleware: ['middleware'],
  decorators: ['decorator', 'decorators'],
  modules: ['module', 'modules'],
  other: []
};

function findAnyTypes(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, dist, coverage, etc.
      if (!['node_modules', 'dist', 'coverage', '.git'].includes(file)) {
        findAnyTypes(filePath, fileList);
      }
    } else if (file.endsWith('.ts') && !file.endsWith('.d.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        // Match `any` type usage (but not in comments or strings)
        const anyMatches = line.match(/\bany\b/g);
        if (anyMatches && !line.trim().startsWith('//') && !line.includes('//')) {
          // Check if it's in a string literal
          const inString = (line.match(/['"`]/g) || []).length % 2 !== 0;
          if (!inString) {
            fileList.push({
              file: path.relative(path.join(__dirname, '..'), filePath),
              line: index + 1,
              content: line.trim(),
              category: categorizeFile(filePath)
            });
          }
        }
      });
    }
  });

  return fileList;
}

function categorizeFile(filePath) {
  const lowerPath = filePath.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORIES)) {
    if (category === 'other') continue;
    if (keywords.some(keyword => lowerPath.includes(keyword))) {
      return category;
    }
  }
  
  return 'other';
}

function generateReport(anyTypes) {
  const byCategory = {};
  const byFile = {};
  
  anyTypes.forEach(item => {
    // Group by category
    if (!byCategory[item.category]) {
      byCategory[item.category] = [];
    }
    byCategory[item.category].push(item);
    
    // Group by file
    if (!byFile[item.file]) {
      byFile[item.file] = [];
    }
    byFile[item.file].push(item);
  });

  let report = `# Type Safety Audit Report\n\n`;
  report += `Generated: ${new Date().toISOString()}\n\n`;
  report += `## Summary\n\n`;
  report += `- **Total \`any\` types found**: ${anyTypes.length}\n`;
  report += `- **Files affected**: ${Object.keys(byFile).length}\n`;
  report += `- **Categories**: ${Object.keys(byCategory).length}\n\n`;

  report += `## By Category\n\n`;
  
  // Sort categories by count (descending)
  const sortedCategories = Object.entries(byCategory)
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedCategories.forEach(([category, items]) => {
    report += `### ${category.charAt(0).toUpperCase() + category.slice(1)} (${items.length} instances)\n\n`;
    
    // Group by file within category
    const byFileInCategory = {};
    items.forEach(item => {
      if (!byFileInCategory[item.file]) {
        byFileInCategory[item.file] = [];
      }
      byFileInCategory[item.file].push(item);
    });
    
    Object.entries(byFileInCategory)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([file, fileItems]) => {
        report += `#### ${file} (${fileItems.length} instances)\n\n`;
        fileItems.forEach(item => {
          report += `- Line ${item.line}: \`${item.content.substring(0, 80)}${item.content.length > 80 ? '...' : ''}\`\n`;
        });
        report += `\n`;
      });
  });

  report += `## By File\n\n`;
  
  // Sort files by count (descending)
  const sortedFiles = Object.entries(byFile)
    .sort((a, b) => b[1].length - a[1].length);
  
  sortedFiles.forEach(([file, items]) => {
    report += `### ${file} (${items.length} instances)\n\n`;
    items.forEach(item => {
      report += `- Line ${item.line} [${item.category}]: \`${item.content.substring(0, 80)}${item.content.length > 80 ? '...' : ''}\`\n`;
    });
    report += `\n`;
  });

  report += `## Priority Recommendations\n\n`;
  
  // High priority: guards, interceptors, controllers (public APIs)
  const highPriority = ['guards', 'interceptors', 'controllers'];
  const highPriorityCount = sortedCategories
    .filter(([cat]) => highPriority.includes(cat))
    .reduce((sum, [, items]) => sum + items.length, 0);
  
  report += `1. **Fix public API types first** (${highPriorityCount} instances in guards, interceptors, controllers)\n`;
  report += `2. **Fix service layer types** (${byCategory.services?.length || 0} instances)\n`;
  report += `3. **Fix remaining internal types** (${byCategory.other?.length || 0} instances)\n\n`;

  return report;
}

function main() {
  console.log('Scanning for `any` type usage...');
  
  if (!fs.existsSync(PACKAGES_DIR)) {
    console.error(`Error: Packages directory not found: ${PACKAGES_DIR}`);
    process.exit(1);
  }

  const anyTypes = findAnyTypes(PACKAGES_DIR);
  
  if (anyTypes.length === 0) {
    console.log('✅ No `any` types found!');
    return;
  }

  console.log(`Found ${anyTypes.length} instances of \`any\` type`);
  
  const report = generateReport(anyTypes);
  
  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(OUTPUT_FILE, report, 'utf8');
  console.log(`\n✅ Report generated: ${OUTPUT_FILE}`);
  console.log(`\nSummary:`);
  console.log(`- Total instances: ${anyTypes.length}`);
  console.log(`- Files affected: ${Object.keys(anyTypes.reduce((acc, item) => {
    acc[item.file] = true;
    return acc;
  }, {})).length}`);
}

if (require.main === module) {
  main();
}

module.exports = { findAnyTypes, generateReport };
