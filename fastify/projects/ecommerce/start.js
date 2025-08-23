#!/usr/bin/env node

/**
 * Enterprise Ecommerce Platform Startup Script
 * 
 * Simple startup script to run the TypeScript application
 */

const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting Enterprise Ecommerce Platform...')
console.log('📁 Project directory:', __dirname)

// Use tsx to run TypeScript directly
const child = spawn('npx', ['tsx', 'src/app.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: process.env.PORT || '3000'
  }
})

child.on('error', (error) => {
  console.error('❌ Failed to start server:', error)
  process.exit(1)
})

child.on('exit', (code) => {
  console.log(`🏁 Server exited with code ${code}`)
  process.exit(code)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down...')
  child.kill('SIGTERM')
})

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down...')
  child.kill('SIGINT')
})
