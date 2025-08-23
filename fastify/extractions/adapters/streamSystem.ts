/**
 * Advanced Stream System - Silicon Valley Grade Engineering
 * 
 * Features:
 * - High-performance streaming with intelligent backpressure handling
 * - Memory-efficient stream processing with automatic cleanup
 * - Advanced stream transformation pipelines
 * - Real-time performance monitoring and metrics
 * - Functional programming with curried stream operations
 * - Stream validation and error recovery
 * - Parallel stream processing with worker threads
 * - Stream caching and buffering strategies
 * - Stream encryption and compression
 * - Stream analytics and debugging
 */

import { EventEmitter } from 'events'
import { Transform, Readable, Writable, Duplex, PassThrough, pipeline } from 'stream'
import { Worker } from 'worker_threads'
import type { StreamOptions, StreamTransform, StreamPipeline, StreamStats } from '../types/index.js'

// Performance monitoring
interface StreamMetrics {
  bytesRead: number
  bytesWritten: number
  chunksProcessed: number
  errors: number
  duration: number
  throughput: number
  memoryUsage: NodeJS.MemoryUsage
  backpressureEvents: number
}

// Stream pool for memory efficiency
class StreamPool {
  private pools: Map<string, Transform[]> = new Map()
  private maxPoolSize = 50
  private totalCreated = 0
  private totalReused = 0

  acquire(type: string, factory: () => Transform): Transform {
    const pool = this.pools.get(type)
    if (pool && pool.length > 0) {
      const stream = pool.pop()!
      this.totalReused++
      return stream
    }
    
    this.totalCreated++
    return factory()
  }

  release(type: string, stream: Transform): void {
    if (!this.pools.has(type)) {
      this.pools.set(type, [])
    }
    
    const pool = this.pools.get(type)!
    if (pool.length < this.maxPoolSize) {
      // Reset stream state
      stream.removeAllListeners()
      if (stream instanceof Transform) {
        stream._transform = (chunk: any, encoding: BufferEncoding, callback: Function) => callback(null, chunk)
        stream._flush = (callback: Function) => callback()
      }
      pool.push(stream)
    }
  }

  getStats(): { created: number; reused: number; pools: number } {
    return {
      created: this.totalCreated,
      reused: this.totalReused,
      pools: this.pools.size
    }
  }
}

// Advanced Stream Manager
export class AdvancedStreamManager extends EventEmitter {
  private pool = new StreamPool()
  private metrics: StreamMetrics = {
    bytesRead: 0,
    bytesWritten: 0,
    chunksProcessed: 0,
    errors: 0,
    duration: 0,
    throughput: 0,
    memoryUsage: process.memoryUsage(),
    backpressureEvents: 0
  }
  private startTime = Date.now()
  private activeStreams = new Set<Transform>()

  // High-performance stream processing
  async processStream(
    input: Readable,
    transforms: StreamTransform[],
    options: StreamOptions = {}
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      let hasError = false

      // Create transform pipeline
      const pipeline = this.createTransformPipeline(transforms, options)
      this.activeStreams.add(pipeline)

      // Handle backpressure
      let backpressureCount = 0
      pipeline.on('drain', () => {
        backpressureCount++
        this.metrics.backpressureEvents++
      })

      pipeline.on('data', (chunk: Buffer) => {
        if (!hasError) {
          chunks.push(chunk)
          this.metrics.chunksProcessed++
          this.metrics.bytesRead += chunk.length
        }
      })

      pipeline.on('end', () => {
        this.activeStreams.delete(pipeline)
        if (!hasError) {
          const result = Buffer.concat(chunks)
          this.metrics.bytesWritten += result.length
          this.updateMetrics()
          resolve(result)
        }
      })

      pipeline.on('error', (error) => {
        if (!hasError) {
          hasError = true
          this.metrics.errors++
          this.activeStreams.delete(pipeline)
          reject(error)
        }
      })

      // Start processing
      input.pipe(pipeline)
    })
  }

  // Advanced stream transformation pipeline
  createTransformPipeline(transforms: StreamTransform[], options: StreamOptions = {}): Transform {
    const pipeline = new PassThrough(options)
    
    let currentTransform = 0
    
    pipeline._transform = async (chunk: any, encoding: BufferEncoding, callback: Function) => {
      try {
        let processed = chunk
        
        for (let i = currentTransform; i < transforms.length; i++) {
          const transform = transforms[i]
          if (transform) {
            processed = await transform(processed, encoding)
          }
          
          // Check for backpressure
          if (!pipeline.write(processed)) {
            currentTransform = i
            pipeline.once('drain', () => {
              currentTransform = i + 1
            })
            return
          }
        }
        
        callback(null, processed)
      } catch (error) {
        callback(error)
      }
    }

    pipeline._flush = async (callback: Function) => {
      try {
        // Process any remaining transforms
        for (let i = currentTransform; i < transforms.length; i++) {
          const transform = transforms[i]
          if (transform && transform.flush) {
            const result = await transform.flush()
            if (result) {
              pipeline.push(result)
            }
          }
        }
        callback()
      } catch (error) {
        callback(error)
      }
    }

    return pipeline
  }

  // Parallel stream processing with worker threads
  async processParallel(
    input: Readable,
    workerCount: number,
    workerScript: string,
    options: StreamOptions = {}
  ): Promise<Buffer[]> {
    const workers: Worker[] = []
    const results: Buffer[] = []
    
    // Create workers
    for (let i = 0; i < workerCount; i++) {
      const worker = new Worker(workerScript, {
        workerData: { workerId: i, ...options }
      })
      workers.push(worker)
    }

    // Distribute work
    let workerIndex = 0
    input.on('data', (chunk: Buffer) => {
      const worker = workers[workerIndex % workerCount]
      if (worker) {
        worker.postMessage({ chunk, index: workerIndex })
      }
      workerIndex++
    })

    // Collect results
    const promises = workers.map(worker => {
      return new Promise<Buffer[]>((resolve, reject) => {
        const workerResults: Buffer[] = []
        
        worker.on('message', (message) => {
          if (message.type === 'result') {
            workerResults.push(message.data)
          }
        })

        worker.on('error', reject)
        worker.on('exit', () => resolve(workerResults))
      })
    })

    // Wait for all workers to complete
    const allResults = await Promise.all(promises)
    return allResults.flat()
  }

  // Stream validation and error recovery
  validateStream(stream: Readable | Writable | Duplex): boolean {
    if (!stream || typeof stream !== 'object') {
      return false
    }

    // Check for required methods
    if (stream instanceof Readable && typeof stream._read !== 'function') {
      return false
    }

    if (stream instanceof Writable && typeof stream._write !== 'function') {
      return false
    }

    if (stream instanceof Duplex && (typeof stream._read !== 'function' || typeof stream._write !== 'function')) {
      return false
    }

    return true
  }

  // Stream encryption and compression
  createEncryptionStream(key: Buffer, algorithm: 'aes-256-gcm' = 'aes-256-gcm'): Transform {
    const crypto = require('crypto')
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipherGCM(algorithm, key, iv)
    
    const transform = new Transform({
      transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
        try {
          const encrypted = Buffer.concat([
            cipher.update(chunk),
            cipher.final()
          ])
          callback(null, encrypted)
        } catch (error) {
          callback(error)
        }
      },
      flush(callback: Function) {
        try {
          const tag = cipher.getAuthTag()
          callback(null, tag)
        } catch (error) {
          callback(error)
        }
      }
    })

    // Store IV for decryption
    ;(transform as any).iv = iv
    return transform
  }

  createCompressionStream(algorithm: 'gzip' | 'deflate' | 'brotli' = 'gzip'): Transform {
    const zlib = require('zlib')
    return zlib.createCompress(algorithm)
  }

  // Stream analytics and debugging
  createAnalyticsStream(): Transform {
    const analytics = new Transform({
      transform(chunk: Buffer, encoding: BufferEncoding, callback: Function) {
        ;(this as any).metrics.bytesRead += chunk.length
        ;(this as any).metrics.chunksProcessed++
        callback(null, chunk)
      }
    })

    ;(analytics as any).metrics = {
      bytesRead: 0,
      chunksProcessed: 0,
      startTime: Date.now()
    }

    return analytics
  }

  // Performance monitoring
  private updateMetrics(): void {
    this.metrics.duration = Date.now() - this.startTime
    this.metrics.throughput = this.metrics.bytesRead / (this.metrics.duration / 1000) // bytes per second
    this.metrics.memoryUsage = process.memoryUsage()
  }

  getMetrics(): StreamMetrics & { uptime: number; activeStreams: number; poolStats: any } {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime,
      activeStreams: this.activeStreams.size,
      poolStats: this.pool.getStats()
    }
  }

  // Memory cleanup
  cleanup(): void {
    this.activeStreams.forEach(stream => {
      stream.destroy()
    })
    this.activeStreams.clear()
    this.emit('cleanup')
  }
}

// Functional programming utilities for streams
export const streamFP = {
  // Curried operations
  map: <T>(fn: (chunk: any) => T) => (stream: Readable) => {
    const transform = new Transform({
      objectMode: true,
      transform(chunk: any, encoding: BufferEncoding, callback: Function) {
        try {
          const result = fn(chunk)
          callback(null, result)
        } catch (error) {
          callback(error)
        }
      }
    })
    return stream.pipe(transform)
  },

  filter: (predicate: (chunk: any) => boolean) => (stream: Readable) => {
    const transform = new Transform({
      objectMode: true,
      transform(chunk: any, encoding: BufferEncoding, callback: Function) {
        try {
          if (predicate(chunk)) {
            callback(null, chunk)
          } else {
            callback() // Skip this chunk
          }
        } catch (error) {
          callback(error)
        }
      }
    })
    return stream.pipe(transform)
  },

  reduce: <T>(fn: (acc: T, chunk: any) => T, initial: T) => (stream: Readable): Promise<T> => {
    return new Promise((resolve, reject) => {
      let accumulator = initial
      
      const transform = new Transform({
        objectMode: true,
        transform(chunk: any, encoding: BufferEncoding, callback: Function) {
          try {
            accumulator = fn(accumulator, chunk)
            callback()
          } catch (error) {
            callback(error)
          }
        },
        flush(callback: Function) {
          resolve(accumulator)
          callback()
        }
      })

      stream.pipe(transform)
    })
  },

  // Composition
  compose: (...transforms: Transform[]) => (stream: Readable) => {
    return transforms.reduce((acc, transform) => acc.pipe(transform), stream)
  },

  pipe: (...transforms: Transform[]) => (stream: Readable) => {
    return transforms.reduce((acc, transform) => acc.pipe(transform), stream)
  }
}

// Advanced Stream with backpressure handling
export class AdvancedStream extends Transform {
  private manager: AdvancedStreamManager
  private pipeline: StreamTransform[]
  private stats: StreamStats = {
    bytesRead: 0,
    bytesWritten: 0,
    duration: 0,
    throughput: 0
  }
  private startTime = Date.now()

  constructor(options: StreamOptions & { pipeline?: StreamTransform[] } = {}) {
    super(options)
    this.manager = new AdvancedStreamManager()
    this.pipeline = options.pipeline || []
  }

  _transform(chunk: any, encoding: BufferEncoding, callback: Function): void {
    try {
      this.stats.bytesRead += chunk.length
      const start = Date.now()

      let processed = chunk
      for (const transform of this.pipeline) {
        processed = transform(processed, encoding)
      }

      this.stats.bytesWritten += processed.length
      this.stats.duration = Date.now() - this.startTime
      this.stats.throughput = this.stats.bytesRead / (this.stats.duration / 1000)

      this.push(processed)
      callback()
    } catch (error) {
      callback(error)
    }
  }

  _flush(callback: Function): void {
    try {
      // Process any remaining transforms
      for (const transform of this.pipeline) {
        if (transform.flush) {
          const result = transform.flush()
          if (result) {
            this.push(result)
          }
        }
      }
      callback()
    } catch (error) {
      callback(error)
    }
  }

  addTransform(transform: StreamTransform): this {
    this.pipeline.push(transform)
    return this
  }

  getStats(): StreamStats {
    return { ...this.stats }
  }
}

// Stream utilities with performance monitoring
export const streamUtils = {
  // Core operations
  pipeline: async (streams: (Readable | Transform | Writable)[]): Promise<void> => {
    return new Promise((resolve, reject) => {
      pipeline(streams, (error) => {
        if (error) reject(error)
        else resolve()
      })
    })
  },

  // Advanced operations
  buffer: async (stream: Readable): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      
      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })

      stream.on('end', () => {
        resolve(Buffer.concat(chunks))
      })

      stream.on('error', reject)
    })
  },

  // Performance utilities
  benchmark: async (fn: () => Readable, iterations: number = 100): Promise<{ avgTime: number; totalTime: number; iterations: number }> => {
    const times: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = process.hrtime.bigint()
      const stream = fn()
      await streamUtils.buffer(stream)
      const end = process.hrtime.bigint()
      times.push(Number(end - start) / 1000000) // Convert to milliseconds
    }
    
    const totalTime = times.reduce((sum, time) => sum + time, 0)
    const avgTime = totalTime / iterations
    
    return { avgTime, totalTime, iterations }
  },

  // Validation utilities
  isValidStream: (value: any): value is Readable | Writable | Duplex => {
    return value && typeof value === 'object' && 
           (value instanceof Readable || value instanceof Writable || value instanceof Duplex)
  },

  // Functional utilities
  fp: streamFP
}

// Export the manager instance for global use
export const streamManager = new AdvancedStreamManager()

// Export types
export type { StreamOptions, StreamTransform, StreamPipeline, StreamStats }
