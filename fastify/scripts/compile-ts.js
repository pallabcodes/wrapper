#!/usr/bin/env node

/**
 * Advanced TypeScript Compilation Script
 * Handles TypeScript compilation with comprehensive error handling and optimization
 * Part of the Silicon Valley-grade engineering standards
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.dirname(__dirname)

console.log('🔄 TypeScript Compilation - Silicon Valley Engineering Standards')
console.log('===============================================================')

// Ensure dist directory exists
const distDir = path.join(projectRoot, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Step 1: Type checking
console.log('\n📋 Step 1: Type checking...')
try {
  execSync('npx tsc --noEmit', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf8'
  })
  console.log('✅ Type checking passed')
} catch (error) {
  console.error('❌ Type checking failed')
  process.exit(1)
}

// Step 2: Compilation
console.log('\n🔨 Step 2: Compiling TypeScript...')
try {
  execSync('npx tsc', { 
    cwd: projectRoot, 
    stdio: 'inherit',
    encoding: 'utf8'
  })
  console.log('✅ TypeScript compilation successful')
} catch (error) {
  console.error('❌ TypeScript compilation failed')
  process.exit(1)
}

// Step 3: Copy additional assets
console.log('\n📁 Step 3: Copying additional assets...')

const assetsToCopy = [
  // Core JavaScript files
  { src: 'core', dest: 'dist/core', pattern: '*.js' },
  // Utility JavaScript files
  { src: '.', dest: 'dist', files: [
    'bufferUtils.js', 'contentTypeParser.js', 'decoratorUtils.js', 
    'errorHandler.js', 'fileValidator.js', 'hookUtils.js', 
    'httpLifecycleUtils.js', 'promiseUtils.js', 'replyUtils.js', 
    'requestContext.js', 'requestUtils.js', 'symbols.js', 'validationUtils.js'
  ]},
  // Configuration files
  { src: '.', dest: 'dist', files: [
    'package.json', 'README.md', 'Dockerfile', 
    'docker-compose.yml', 'ecosystem.config.js'
  ]}
]

for (const asset of assetsToCopy) {
  const srcDir = path.join(projectRoot, asset.src)
  const destDir = path.join(projectRoot, asset.dest)
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }
  
  if (asset.pattern) {
    // Copy files matching pattern
    if (fs.existsSync(srcDir)) {
      const files = fs.readdirSync(srcDir)
      files.filter(file => file.endsWith(asset.pattern.replace('*', ''))).forEach(file => {
        const srcPath = path.join(srcDir, file)
        const destPath = path.join(destDir, file)
        fs.copyFileSync(srcPath, destPath)
        console.log(`  ✅ Copied: ${file}`)
      })
    }
  } else if (asset.files) {
    // Copy specific files
    asset.files.forEach(file => {
      const srcPath = path.join(srcDir, file)
      if (fs.existsSync(srcPath)) {
        const destPath = path.join(destDir, file)
        fs.copyFileSync(srcPath, destPath)
        console.log(`  ✅ Copied: ${file}`)
      }
    })
  }
}

// Step 4: Generate build metadata
console.log('\n📊 Step 4: Generating build metadata...')
const buildMetadata = {
  timestamp: new Date().toISOString(),
  version: process.env.npm_package_version || '2.0.0-phase2',
  nodeVersion: process.version,
  platform: process.platform,
  arch: process.arch,
  buildType: 'TypeScript',
  features: [
    'Advanced Buffer Management',
    'High-Performance Streaming',
    'Enterprise E-commerce Architecture',
    'Functional Programming Paradigm',
    'Silicon Valley Engineering Standards'
  ],
  performance: {
    targetConcurrentUsers: '100-1M+',
    targetMAU: '10M+',
    targetDAU: '1M+',
    architecture: 'Hybrid Modular Monolith'
  }
}

fs.writeFileSync(
  path.join(distDir, 'build-metadata.json'), 
  JSON.stringify(buildMetadata, null, 2)
)
console.log('✅ Build metadata generated')

// Step 5: Validation
console.log('\n🔍 Step 5: Build validation...')
const requiredFiles = [
  'dist/index.js',
  'dist/index.d.ts',
  'dist/types/index.d.ts',
  'dist/utils/bufferSystem.js',
  'dist/utils/streamSystem.js',
  'dist/ecommerce/index.js'
]

let validationPassed = true
for (const file of requiredFiles) {
  const filePath = path.join(projectRoot, file)
  if (fs.existsSync(filePath)) {
    console.log(`  ✅ ${file}`)
  } else {
    console.log(`  ❌ ${file} - MISSING`)
    validationPassed = false
  }
}

if (validationPassed) {
  console.log('\n🎉 COMPILATION SUCCESSFUL!')
  console.log('===============================')
  console.log('✨ Silicon Valley-grade TypeScript build completed')
  console.log('🚀 Ready for production deployment')
  console.log('📦 Distribution files available in: dist/')
  console.log('\nNext steps:')
  console.log('  • npm run test          - Run comprehensive tests')
  console.log('  • npm run docker:build  - Build Docker container')
  console.log('  • npm run pm2:start     - Deploy with PM2')
} else {
  console.error('\n❌ BUILD VALIDATION FAILED')
  console.error('Some required files are missing from the build output.')
  process.exit(1)
}
