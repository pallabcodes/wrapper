/**
 * Advanced Symbol Registry System - Universally Repurposable
 * Extracted from Fastify Core for customization and extension
 * 
 * This system provides:
 * - Collision-free internal state management
 * - Framework-agnostic symbol creation
 * - Memory-efficient property isolation
 * - C++ addon integration support
 */

'use strict'

// Core Framework Symbols
const kAvvioBoot = Symbol('fastify.avvioBoot')
const kChildren = Symbol('fastify.children')
const kServerBindings = Symbol('fastify.serverBindings')
const kBodyLimit = Symbol('fastify.bodyLimit')
const kSupportedHTTPMethods = Symbol('fastify.acceptedHTTPMethods')
const kRoutePrefix = Symbol('fastify.routePrefix')
const kLogLevel = Symbol('fastify.logLevel')
const kLogSerializers = Symbol('fastify.logSerializers')
const kHooks = Symbol('fastify.hooks')
const kContentTypeParser = Symbol('fastify.contentTypeParser')
const kState = Symbol('fastify.state')
const kOptions = Symbol('fastify.options')
const kDisableRequestLogging = Symbol('fastify.disableRequestLogging')
const kPluginNameChain = Symbol('fastify.pluginNameChain')
const kRouteContext = Symbol('fastify.context')
const kGenReqId = Symbol('fastify.genReqId')

// Schema Management Symbols
const kSchemaController = Symbol('fastify.schemaController')
const kSchemaHeaders = Symbol('headers-schema')
const kSchemaParams = Symbol('params-schema')
const kSchemaQuerystring = Symbol('querystring-schema')
const kSchemaBody = Symbol('body-schema')
const kSchemaResponse = Symbol('response-schema')
const kSchemaErrorFormatter = Symbol('fastify.schemaErrorFormatter')
const kSchemaVisited = Symbol('fastify.schemas.visited')

// Request Management Symbols
const kRequest = Symbol('fastify.Request')
const kRequestPayloadStream = Symbol('fastify.RequestPayloadStream')
const kRequestAcceptVersion = Symbol('fastify.RequestAcceptVersion')
const kRequestCacheValidateFns = Symbol('fastify.request.cache.validateFns')
const kRequestOriginalUrl = Symbol('fastify.request.originalUrl')

// 404 Handling Symbols
const kFourOhFour = Symbol('fastify.404')
const kCanSetNotFoundHandler = Symbol('fastify.canSetNotFoundHandler')
const kFourOhFourLevelInstance = Symbol('fastify.404LogLevelInstance')
const kFourOhFourContext = Symbol('fastify.404ContextKey')
const kDefaultJsonParse = Symbol('fastify.defaultJSONParse')

// Reply Management Symbols
const kReply = Symbol('fastify.Reply')
const kReplySerializer = Symbol('fastify.reply.serializer')
const kReplyIsError = Symbol('fastify.reply.isError')
const kReplyHeaders = Symbol('fastify.reply.headers')
const kReplyTrailers = Symbol('fastify.reply.trailers')
const kReplyHasStatusCode = Symbol('fastify.reply.hasStatusCode')
const kReplyHijacked = Symbol('fastify.reply.hijacked')
const kReplyStartTime = Symbol('fastify.reply.startTime')
const kReplyNextErrorHandler = Symbol('fastify.reply.nextErrorHandler')
const kReplyEndTime = Symbol('fastify.reply.endTime')
const kReplyErrorHandlerCalled = Symbol('fastify.reply.errorHandlerCalled')
const kReplyIsRunningOnErrorHook = Symbol('fastify.reply.isRunningOnErrorHook')
const kReplySerializerDefault = Symbol('fastify.replySerializerDefault')
const kReplyCacheSerializeFns = Symbol('fastify.reply.cache.serializeFns')

// Core System Symbols
const kTestInternals = Symbol('fastify.testInternals')
const kErrorHandler = Symbol('fastify.errorHandler')
const kErrorHandlerAlreadySet = Symbol('fastify.errorHandlerAlreadySet')
const kChildLoggerFactory = Symbol('fastify.childLoggerFactory')
const kHasBeenDecorated = Symbol('fastify.hasBeenDecorated')
const kKeepAliveConnections = Symbol('fastify.keepAliveConnections')
const kRouteByFastify = Symbol('fastify.routeByFastify')

// Custom Extension Symbols for Advanced Use Cases
const kCustomMetrics = Symbol('fastify.customMetrics')
const kPerformanceHooks = Symbol('fastify.performanceHooks')
const kResourcePooling = Symbol('fastify.resourcePooling')
const kCircuitBreaker = Symbol('fastify.circuitBreaker')
const kLoadBalancer = Symbol('fastify.loadBalancer')
const kCacheStrategy = Symbol('fastify.cacheStrategy')
const kCompressionState = Symbol('fastify.compressionState')
const kSecurityContext = Symbol('fastify.securityContext')

/**
 * Symbol Registry Factory - Creates isolated symbol namespaces
 * Useful for creating custom frameworks or plugins with symbol isolation
 */
function createSymbolRegistry(namespace = 'custom') {
  const symbolCache = new Map()
  
  return {
    create: (name) => {
      const key = `${namespace}.${name}`
      if (!symbolCache.has(key)) {
        symbolCache.set(key, Symbol(key))
      }
      return symbolCache.get(key)
    },
    
    has: (name) => symbolCache.has(`${namespace}.${name}`),
    
    get: (name) => symbolCache.get(`${namespace}.${name}`),
    
    clear: () => symbolCache.clear(),
    
    size: () => symbolCache.size,
    
    // For debugging and introspection
    getAllSymbols: () => Array.from(symbolCache.entries()),
    
    // Create a child registry with inherited symbols
    createChild: (childNamespace) => {
      const child = createSymbolRegistry(`${namespace}.${childNamespace}`)
      // Inherit parent symbols
      for (const [key, symbol] of symbolCache) {
        child.symbolCache.set(key, symbol)
      }
      return child
    }
  }
}

/**
 * Advanced Symbol Utilities for Performance and Memory Management
 */
const SymbolUtils = {
  // Check if an object uses specific symbols (for performance profiling)
  hasSymbolProperty: (obj, symbol) => {
    return Object.getOwnPropertySymbols(obj).includes(symbol)
  },
  
  // Get all symbol properties from an object
  getSymbolProperties: (obj) => {
    return Object.getOwnPropertySymbols(obj).reduce((acc, symbol) => {
      acc[symbol] = obj[symbol]
      return acc
    }, {})
  },
  
  // Clone object with symbol properties
  cloneWithSymbols: (obj) => {
    const clone = Object.assign({}, obj)
    Object.getOwnPropertySymbols(obj).forEach(symbol => {
      clone[symbol] = obj[symbol]
    })
    return clone
  },
  
  // Memory efficient symbol comparison
  compareSymbolStates: (obj1, obj2, symbols) => {
    return symbols.every(symbol => obj1[symbol] === obj2[symbol])
  }
}

module.exports = {
  // Core symbols
  kAvvioBoot,
  kChildren,
  kServerBindings,
  kBodyLimit,
  kSupportedHTTPMethods,
  kRoutePrefix,
  kLogLevel,
  kLogSerializers,
  kHooks,
  kContentTypeParser,
  kState,
  kOptions,
  kDisableRequestLogging,
  kPluginNameChain,
  kRouteContext,
  kGenReqId,
  
  // Schema symbols
  kSchemaController,
  kSchemaHeaders,
  kSchemaParams,
  kSchemaQuerystring,
  kSchemaBody,
  kSchemaResponse,
  kSchemaErrorFormatter,
  kSchemaVisited,
  
  // Request symbols
  kRequest,
  kRequestPayloadStream,
  kRequestAcceptVersion,
  kRequestCacheValidateFns,
  kRequestOriginalUrl,
  
  // 404 symbols
  kFourOhFour,
  kCanSetNotFoundHandler,
  kFourOhFourLevelInstance,
  kFourOhFourContext,
  kDefaultJsonParse,
  
  // Reply symbols
  kReply,
  kReplySerializer,
  kReplyIsError,
  kReplyHeaders,
  kReplyTrailers,
  kReplyHasStatusCode,
  kReplyHijacked,
  kReplyStartTime,
  kReplyNextErrorHandler,
  kReplyEndTime,
  kReplyErrorHandlerCalled,
  kReplyIsRunningOnErrorHook,
  kReplySerializerDefault,
  kReplyCacheSerializeFns,
  
  // System symbols
  kTestInternals,
  kErrorHandler,
  kErrorHandlerAlreadySet,
  kChildLoggerFactory,
  kHasBeenDecorated,
  kKeepAliveConnections,
  kRouteByFastify,
  
  // Custom extension symbols
  kCustomMetrics,
  kPerformanceHooks,
  kResourcePooling,
  kCircuitBreaker,
  kLoadBalancer,
  kCacheStrategy,
  kCompressionState,
  kSecurityContext,
  
  // Utilities
  createSymbolRegistry,
  SymbolUtils
}
