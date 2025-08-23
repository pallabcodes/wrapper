#!/usr/bin/env node

/**
 * Build script for Advanced Fastify Extraction
 * Handles TypeScript compilation with proper error handling
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Building Advanced Fastify Extraction...')

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Step 1: Compile TypeScript
console.log('🔄 Compiling TypeScript...')
try {
  execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' })
  console.log('✅ TypeScript compilation completed')
} catch (error) {
  console.error('❌ TypeScript compilation failed')
  process.exit(1)
}

// Copy core JS files to dist
const coreDir = path.join(__dirname, 'core')
const distCoreDir = path.join(distDir, 'core')

if (!fs.existsSync(distCoreDir)) {
  fs.mkdirSync(distCoreDir, { recursive: true })
}

// Convert and copy core files
if (fs.existsSync(coreDir)) {
  const coreFiles = fs.readdirSync(coreDir)
  coreFiles.forEach(file => {
    if (file.endsWith('.js')) {
      const sourcePath = path.join(coreDir, file)
      const destPath = path.join(distCoreDir, file)
      
      // Read the file content
      let content = fs.readFileSync(sourcePath, 'utf8')
      
      // Convert CommonJS exports to ES module exports
      if (content.includes('module.exports')) {
        // Replace module.exports with ES module exports
        content = content.replace(/module\.exports\s*=\s*{([\s\S]*?)}/g, (match, exports) => {
          const exportNames = exports.split(',').map(name => name.trim()).filter(name => name)
          const exportStatements = exportNames.map(name => `export { ${name} }`).join('\n')
          return exportStatements
        })
        
        // Also handle individual exports
        content = content.replace(/module\.exports\.(\w+)\s*=\s*(\w+)/g, 'export const $1 = $2')
      }
      
      fs.writeFileSync(destPath, content)
      console.log(`📁 Converted and copied: ${file}`)
    }
  })
}

// Copy utility JS files to dist
const utilsDir = path.join(__dirname)
const distUtilsDir = path.join(distDir)

// Copy utility files
const utilityFiles = [
  'bufferUtils.js',
  'contentTypeParser.js',
  'decoratorUtils.js',
  'errorHandler.js',
  'fileValidator.js',
  'hookUtils.js',
  'httpLifecycleUtils.js',
  'promiseUtils.js',
  'replyUtils.js',
  'requestContext.js',
  'requestUtils.js',
  'symbols.js',
  'validationUtils.js'
]

utilityFiles.forEach(file => {
  const sourcePath = path.join(utilsDir, file)
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(distUtilsDir, file)
    fs.copyFileSync(sourcePath, destPath)
    console.log(`📁 Copied: ${file}`)
  }
})

// Copy types directory
const typesDir = path.join(__dirname, 'types')
const distTypesDir = path.join(distDir, 'types')

if (fs.existsSync(typesDir)) {
  if (!fs.existsSync(distTypesDir)) {
    fs.mkdirSync(distTypesDir, { recursive: true })
  }
  
  const typesFiles = fs.readdirSync(typesDir)
  typesFiles.forEach(file => {
    const sourcePath = path.join(typesDir, file)
    const destPath = path.join(distTypesDir, file)
    fs.copyFileSync(sourcePath, destPath)
    console.log(`📁 Copied types: ${file}`)
  })
}

// Create types/index.js for ES module compatibility
const typesIndexJs = `/**
 * Types module - JavaScript exports for ES module compatibility
 * This file provides runtime exports for the TypeScript types
 */

// Export enums as values
export const UserRole = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  MODERATOR: 'moderator'
}

export const OrderStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded'
}

export const PaymentProvider = {
  STRIPE: 'stripe',
  PAYPAL: 'paypal',
  SQUARE: 'square'
}

export const MessageType = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  SYSTEM: 'system'
}

export const Permission = {
  READ_PRODUCTS: 'read_products',
  WRITE_PRODUCTS: 'write_products',
  READ_ORDERS: 'read_orders',
  WRITE_ORDERS: 'write_orders',
  READ_USERS: 'read_users',
  WRITE_USERS: 'write_users',
  ADMIN: 'admin'
}

// Export interfaces as empty objects (for runtime compatibility)
export const FastifyRequest = {}
export const FastifyReply = {}
export const FastifyInstance = {}
export const RouteOptions = {}
export const ListenOptions = {}
export const BufferOptions = {}
export const StreamOptions = {}
export const BufferTransform = {}
export const StreamTransform = {}
export const BufferPipeline = {}
export const StreamPipeline = {}
export const BufferStats = {}
export const StreamStats = {}
export const User = {}
export const Product = {}
export const Order = {}
export const Payment = {}
export const Inventory = {}
export const ChatMessage = {}
export const RequestContext = {}
`

fs.writeFileSync(path.join(distTypesDir, 'index.js'), typesIndexJs)
console.log('📁 Created types/index.js for ES module compatibility')

// Copy examples directory
const examplesDir = path.join(__dirname, 'examples')
const distExamplesDir = path.join(distDir, 'examples')

if (fs.existsSync(examplesDir)) {
  if (!fs.existsSync(distExamplesDir)) {
    fs.mkdirSync(distExamplesDir, { recursive: true })
  }
  
  const examplesFiles = fs.readdirSync(examplesDir)
  examplesFiles.forEach(file => {
    if (file.endsWith('.ts')) {
      const sourcePath = path.join(examplesDir, file)
      const destPath = path.join(distExamplesDir, file)
      fs.copyFileSync(sourcePath, destPath)
      console.log(`📁 Copied example: ${file}`)
    }
  })
}

// Copy package.json and other config files
const configFiles = ['package.json', 'README.md', 'Dockerfile', 'docker-compose.yml', 'ecosystem.config.js']
configFiles.forEach(file => {
  const sourcePath = path.join(__dirname, file)
  if (fs.existsSync(sourcePath)) {
    const destPath = path.join(distDir, file)
    fs.copyFileSync(sourcePath, destPath)
    console.log(`📁 Copied config: ${file}`)
  }
})

console.log('✅ Build completed successfully!')
console.log('📦 Distribution files are ready in the dist/ directory')
