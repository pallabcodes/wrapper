/**
 * Advanced Server Management System
 * Extracted and Enhanced from Fastify Core for Universal Use
 * 
 * Features:
 * - Multi-binding server management (IPv4/IPv6)
 * - HTTP/1.1, HTTP/2, and HTTPS support
 * - Advanced connection management and pooling
 * - Load balancing and traffic distribution
 * - Performance monitoring and metrics
 * - Graceful shutdown and health checks
 * - Clustering and worker management
 */

'use strict'

const http = require('node:http')
const https = require('node:https')
const http2 = require('node:http2')
const dns = require('node:dns')
const os = require('node:os')
const cluster = require('node:cluster')

const { kState, kOptions, kServerBindings } = require('./symbolRegistry')

/**
 * Enhanced Server Factory with Advanced Features
 */
class ServerFactory {
  constructor(options = {}) {
    this.options = {
      enableMetrics: options.enableMetrics !== false,
      enableMultiBinding: options.enableMultiBinding !== false,
      connectionTimeout: options.connectionTimeout || 30000,
      keepAliveTimeout: options.keepAliveTimeout || 5000,
      maxConnections: options.maxConnections || 0,
      enableClustering: options.enableClustering || false,
      clusterWorkers: options.clusterWorkers || os.cpus().length,
      ...options
    }
    
    this.servers = new Map()
    this.bindings = new Map()
    this.metrics = new Map()
    this.connectionPools = new Map()
    this.loadBalancer = null
    
    this.initializeMetrics()
  }

  /**
   * Initialize metrics collection
   */
  initializeMetrics() {
    if (!this.options.enableMetrics) return
    
    this.metrics.set('connections', { active: 0, total: 0, peak: 0 })
    this.metrics.set('requests', { total: 0, active: 0, peak: 0 })
    this.metrics.set('responses', { total: 0, errors: 0, timeouts: 0 })
    this.metrics.set('performance', { totalTime: 0, averageTime: 0 })
  }

  /**
   * Create server instance based on configuration
   */
  createServer(options, handler) {
    const serverConfig = this.normalizeServerOptions(options)
    let server
    
    if (serverConfig.http2) {
      server = this.createHttp2Server(serverConfig, handler)
    } else if (serverConfig.https) {
      server = this.createHttpsServer(serverConfig, handler)
    } else {
      server = this.createHttpServer(serverConfig, handler)
    }
    
    this.enhanceServer(server, serverConfig)
    return server
  }

  /**
   * Normalize server options
   */
  normalizeServerOptions(options) {
    return {
      host: options.host || 'localhost',
      port: options.port || 0,
      http2: options.http2 || false,
      https: options.https || null,
      http: options.http || null,
      serverFactory: options.serverFactory || null,
      ...options
    }
  }

  /**
   * Create HTTP server
   */
  createHttpServer(options, handler) {
    const serverOptions = options.http || {}
    const server = http.createServer(serverOptions, handler)
    
    this.configureHttpServer(server, options)
    return server
  }

  /**
   * Create HTTPS server
   */
  createHttpsServer(options, handler) {
    const httpsOptions = options.https
    if (!httpsOptions) {
      throw new Error('HTTPS options required for HTTPS server')
    }
    
    const server = https.createServer(httpsOptions, handler)
    this.configureHttpServer(server, options)
    return server
  }

  /**
   * Create HTTP/2 server
   */
  createHttp2Server(options, handler) {
    const http2Options = options.https || {}
    
    let server
    if (options.https) {
      server = http2.createSecureServer(http2Options)
    } else {
      server = http2.createServer(http2Options)
    }
    
    server.on('stream', (stream, headers) => {
      const request = this.createHttp2Request(stream, headers)
      const response = this.createHttp2Response(stream)
      handler(request, response)
    })
    
    this.configureHttp2Server(server, options)
    return server
  }

  /**
   * Configure HTTP/1.1 and HTTPS servers
   */
  configureHttpServer(server, options) {
    // Connection timeout
    if (this.options.connectionTimeout) {
      server.timeout = this.options.connectionTimeout
    }
    
    // Keep-alive timeout
    if (this.options.keepAliveTimeout) {
      server.keepAliveTimeout = this.options.keepAliveTimeout
    }
    
    // Max connections
    if (this.options.maxConnections > 0) {
      server.maxConnections = this.options.maxConnections
    }
    
    // Request timeout
    if (options.requestTimeout) {
      server.requestTimeout = options.requestTimeout
    }
    
    // Headers timeout
    if (options.headersTimeout) {
      server.headersTimeout = options.headersTimeout
    }
  }

  /**
   * Configure HTTP/2 server
   */
  configureHttp2Server(server, options) {
    // Session timeout
    if (options.http2SessionTimeout) {
      server.setTimeout(options.http2SessionTimeout)
    }
    
    // Settings
    if (options.http2Settings) {
      server.updateSettings(options.http2Settings)
    }
  }

  /**
   * Enhance server with additional features
   */
  enhanceServer(server, options) {
    // Add metrics collection
    if (this.options.enableMetrics) {
      this.addMetricsToServer(server)
    }
    
    // Add connection tracking
    this.addConnectionTracking(server)
    
    // Add graceful shutdown
    this.addGracefulShutdown(server)
    
    // Add health checks
    this.addHealthChecks(server, options)
  }

  /**
   * Add metrics collection to server
   */
  addMetricsToServer(server) {
    const connectionMetrics = this.metrics.get('connections')
    const requestMetrics = this.metrics.get('requests')
    const responseMetrics = this.metrics.get('responses')
    
    server.on('connection', (socket) => {
      connectionMetrics.active++
      connectionMetrics.total++
      connectionMetrics.peak = Math.max(connectionMetrics.peak, connectionMetrics.active)
      
      socket.on('close', () => {
        connectionMetrics.active--
      })
    })
    
    server.on('request', (req, res) => {
      const startTime = process.hrtime.bigint()
      requestMetrics.active++
      requestMetrics.total++
      requestMetrics.peak = Math.max(requestMetrics.peak, requestMetrics.active)
      
      res.on('finish', () => {
        const endTime = process.hrtime.bigint()
        const duration = Number(endTime - startTime) / 1e6
        
        requestMetrics.active--
        responseMetrics.total++
        
        const perfMetrics = this.metrics.get('performance')
        perfMetrics.totalTime += duration
        perfMetrics.averageTime = perfMetrics.totalTime / responseMetrics.total
        
        if (res.statusCode >= 400) {
          responseMetrics.errors++
        }
      })
      
      res.on('timeout', () => {
        responseMetrics.timeouts++
      })
    })
  }

  /**
   * Add connection tracking and management
   */
  addConnectionTracking(server) {
    const connections = new Set()
    
    server.on('connection', (socket) => {
      connections.add(socket)
      
      socket.on('close', () => {
        connections.delete(socket)
      })
    })
    
    // Add method to close all connections
    server.closeAllConnections = () => {
      for (const socket of connections) {
        socket.destroy()
      }
      connections.clear()
    }
    
    // Add method to get connection count
    server.getConnectionCount = () => connections.size
    
    this.connectionPools.set(server, connections)
  }

  /**
   * Add graceful shutdown capabilities
   */
  addGracefulShutdown(server) {
    server.gracefulShutdown = async (timeout = 30000) => {
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          reject(new Error('Graceful shutdown timeout'))
        }, timeout)
        
        server.close((error) => {
          clearTimeout(timer)
          if (error) {
            reject(error)
          } else {
            resolve()
          }
        })
        
        // Stop accepting new connections
        server.listening && server.close()
      })
    }
  }

  /**
   * Add health check endpoints
   */
  addHealthChecks(server, options) {
    if (!options.enableHealthChecks) return
    
    server.healthChecks = {
      alive: () => server.listening,
      ready: () => server.listening && server.getConnectionCount() < (this.options.maxConnections || Infinity),
      metrics: () => this.getServerMetrics(server)
    }
  }

  /**
   * Create HTTP/2 request object
   */
  createHttp2Request(stream, headers) {
    return {
      httpVersion: '2.0',
      httpVersionMajor: 2,
      httpVersionMinor: 0,
      headers,
      method: headers[':method'],
      url: headers[':path'],
      stream,
      on: stream.on.bind(stream),
      once: stream.once.bind(stream),
      emit: stream.emit.bind(stream)
    }
  }

  /**
   * Create HTTP/2 response object
   */
  createHttp2Response(stream) {
    return {
      statusCode: 200,
      headers: {},
      stream,
      
      writeHead(statusCode, headers) {
        this.statusCode = statusCode
        if (headers) {
          Object.assign(this.headers, headers)
        }
        stream.respond({
          ':status': statusCode,
          ...this.headers
        })
      },
      
      write(chunk) {
        stream.write(chunk)
      },
      
      end(chunk) {
        if (chunk) {
          stream.write(chunk)
        }
        stream.end()
      },
      
      on: stream.on.bind(stream),
      once: stream.once.bind(stream),
      emit: stream.emit.bind(stream)
    }
  }

  /**
   * Listen on multiple addresses
   */
  async listenMultiple(server, options, fastifyInstance) {
    if (!this.options.enableMultiBinding) {
      return this.listenSingle(server, options)
    }
    
    const { host, port } = options
    const addresses = await this.resolveAddresses(host)
    const bindings = []
    
    // Start main server
    const mainAddress = await this.listenSingle(server, options)
    bindings.push({ server, address: mainAddress, primary: true })
    
    // Start secondary servers for additional addresses
    if (addresses.length > 1) {
      const mainAddr = server.address()
      
      for (const addr of addresses) {
        if (addr.address !== mainAddr.address) {
          try {
            const secondaryServer = this.createServer(options, server.requestHandler)
            const secondaryAddress = await this.listenSingle(secondaryServer, {
              ...options,
              host: addr.address,
              port: mainAddr.port
            })
            
            bindings.push({ server: secondaryServer, address: secondaryAddress, primary: false })
            this.setupSecondaryServer(secondaryServer, server, fastifyInstance)
          } catch (error) {
            console.warn(`Failed to bind to ${addr.address}:${mainAddr.port}`, error.message)
          }
        }
      }
    }
    
    this.bindings.set(server, bindings)
    return mainAddress
  }

  /**
   * Listen on single address
   */
  async listenSingle(server, options) {
    return new Promise((resolve, reject) => {
      const { host, port, path, backlog, signal } = options
      
      const listenOptions = {}
      if (path) {
        listenOptions.path = path
      } else {
        listenOptions.host = host
        listenOptions.port = port
      }
      
      if (backlog !== undefined) {
        listenOptions.backlog = backlog
      }
      
      server.listen(listenOptions, (error) => {
        if (error) {
          reject(error)
        } else {
          const address = server.address()
          resolve(this.formatAddress(address))
        }
      })
      
      // Handle abort signal
      if (signal) {
        const onAbort = () => {
          server.close()
          reject(new Error('Listen operation aborted'))
        }
        
        if (signal.aborted) {
          onAbort()
        } else {
          signal.addEventListener('abort', onAbort, { once: true })
        }
      }
    })
  }

  /**
   * Resolve DNS addresses for host
   */
  async resolveAddresses(host) {
    if (host !== 'localhost') {
      return [{ address: host }]
    }
    
    return new Promise((resolve, reject) => {
      dns.lookup(host, { all: true }, (error, addresses) => {
        if (error) {
          resolve([{ address: host }]) // Fallback to original host
        } else {
          resolve(addresses)
        }
      })
    })
  }

  /**
   * Setup secondary server with event forwarding
   */
  setupSecondaryServer(secondary, primary, fastifyInstance) {
    // Forward upgrade events
    secondary.on('upgrade', primary.emit.bind(primary, 'upgrade'))
    
    // Handle primary server events
    primary.on('unref', () => secondary.close())
    primary.on('close', () => secondary.close())
    primary.on('error', () => secondary.close())
    
    // Store reference for cleanup
    if (fastifyInstance && fastifyInstance[kServerBindings]) {
      fastifyInstance[kServerBindings].push(secondary)
    }
  }

  /**
   * Format server address for display
   */
  formatAddress(address) {
    if (typeof address === 'string') {
      return address // Unix socket
    }
    
    const { address: addr, port, family } = address
    if (family === 'IPv6') {
      return `http://[${addr}]:${port}`
    }
    return `http://${addr}:${port}`
  }

  /**
   * Create server cluster
   */
  createCluster(options, handler) {
    if (!this.options.enableClustering || !cluster.isPrimary) {
      return this.createServer(options, handler)
    }
    
    const workers = this.options.clusterWorkers
    const clusterInfo = {
      workers: new Map(),
      loadBalancer: this.createLoadBalancer(),
      metrics: new Map()
    }
    
    for (let i = 0; i < workers; i++) {
      const worker = cluster.fork()
      clusterInfo.workers.set(worker.id, {
        worker,
        requests: 0,
        connections: 0,
        status: 'starting'
      })
      
      worker.on('online', () => {
        clusterInfo.workers.get(worker.id).status = 'online'
      })
      
      worker.on('exit', (code, signal) => {
        clusterInfo.workers.delete(worker.id)
        // Restart worker if unexpected exit
        if (code !== 0 && signal !== 'SIGTERM') {
          const newWorker = cluster.fork()
          clusterInfo.workers.set(newWorker.id, {
            worker: newWorker,
            requests: 0,
            connections: 0,
            status: 'starting'
          })
        }
      })
    }
    
    this.clusters.set('primary', clusterInfo)
    return this.createClusterProxy(clusterInfo)
  }

  /**
   * Create load balancer for cluster
   */
  createLoadBalancer() {
    return {
      algorithm: 'round-robin',
      current: 0,
      
      selectWorker(workers) {
        const activeWorkers = Array.from(workers.values()).filter(w => w.status === 'online')
        if (activeWorkers.length === 0) return null
        
        switch (this.algorithm) {
          case 'round-robin':
            const worker = activeWorkers[this.current % activeWorkers.length]
            this.current++
            return worker
            
          case 'least-connections':
            return activeWorkers.reduce((min, current) => 
              current.connections < min.connections ? current : min
            )
            
          default:
            return activeWorkers[0]
        }
      }
    }
  }

  /**
   * Create cluster proxy server
   */
  createClusterProxy(clusterInfo) {
    const proxy = http.createServer((req, res) => {
      const worker = clusterInfo.loadBalancer.selectWorker(clusterInfo.workers)
      if (!worker) {
        res.statusCode = 503
        res.end('Service Unavailable')
        return
      }
      
      worker.requests++
      worker.worker.send({ type: 'request', req, res })
    })
    
    proxy.cluster = clusterInfo
    return proxy
  }

  /**
   * Get server metrics
   */
  getServerMetrics(server) {
    const baseMetrics = Object.fromEntries(this.metrics)
    const connections = this.connectionPools.get(server)
    
    return {
      ...baseMetrics,
      connections: {
        ...baseMetrics.connections,
        current: connections ? connections.size : 0
      },
      server: {
        listening: server.listening,
        address: server.address(),
        maxConnections: server.maxConnections,
        timeout: server.timeout
      }
    }
  }

  /**
   * Get all server statistics
   */
  getStats() {
    const stats = {
      servers: this.servers.size,
      bindings: this.bindings.size,
      connectionPools: this.connectionPools.size,
      totalConnections: 0,
      metrics: Object.fromEntries(this.metrics)
    }
    
    for (const connections of this.connectionPools.values()) {
      stats.totalConnections += connections.size
    }
    
    return stats
  }

  /**
   * Shutdown all servers gracefully
   */
  async shutdownAll(timeout = 30000) {
    const shutdownPromises = []
    
    for (const [server, bindings] of this.bindings.entries()) {
      for (const binding of bindings) {
        if (binding.server.gracefulShutdown) {
          shutdownPromises.push(binding.server.gracefulShutdown(timeout))
        }
      }
    }
    
    return Promise.allSettled(shutdownPromises)
  }
}

/**
 * Factory function for creating server management systems
 */
function createServerManager(options = {}) {
  return new ServerFactory(options)
}

/**
 * Default server resolver for listening on localhost
 */
function defaultResolveServerListeningText(address) {
  return `Server listening at ${address}`
}

module.exports = {
  ServerFactory,
  createServerManager,
  defaultResolveServerListeningText
}
