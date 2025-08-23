'use strict';

/**
 * Advanced Content Type Parser - Silicon Valley Engineering Standards
 * Extracted and enhanced from Fastify's content type parser
 */

const { SymbolRegistry } = require('./symbolRegistry');
const { AsyncResource } = require('async_hooks');

// High-performance symbols for internal state
const kCustomParsers = SymbolRegistry.create('parser.custom');
const kParserCache = SymbolRegistry.create('parser.cache');
const kParserMetrics = SymbolRegistry.create('parser.metrics');

/**
 * Enterprise Content Type Parser with Silicon Valley Standards
 */
export class EnterpriseContentTypeParser {
  constructor(options = {}) {
    this[kCustomParsers] = new Map();
    this[kParserCache] = new Map();
    this[kParserMetrics] = new Map();
    
    this.options = {
      bodyLimit: options.bodyLimit || 1048576, // 1MB default
      enableCache: options.enableCache !== false,
      enableMetrics: options.enableMetrics !== false,
      cacheSize: options.cacheSize || 1000,
      enableSecurity: options.enableSecurity !== false,
      ...options
    };

    // Initialize default parsers
    this._initializeDefaultParsers();
  }

  /**
   * Add a custom content type parser
   */
  addParser(contentType, options = {}, parserFn = null) {
    // Handle function overload
    if (typeof options === 'function') {
      parserFn = options;
      options = {};
    }

    this._validateContentType(contentType);
    this._validateParserFunction(parserFn);

    const parser = this._createParser(contentType, options, parserFn);
    
    // Register parser
    const key = this._normalizeContentType(contentType);
    this[kCustomParsers].set(key, parser);
    
    // Clear cache when parsers change
    this._clearCache();
    
    // Initialize metrics
    if (this.options.enableMetrics) {
      this._initializeMetrics(key);
    }

    return this;
  }

  /**
   * Parse content with automatic type detection
   */
  async parseContent(request, payload) {
    const contentType = this._extractContentType(request);
    const parser = this._selectParser(contentType);
    
    if (!parser) {
      throw this._createError('NO_PARSER', `No parser found for content type: ${contentType}`);
    }

    const startTime = this.options.enableMetrics ? process.hrtime.bigint() : null;
    
    try {
      // Size validation
      this._validatePayloadSize(request, payload, parser);
      
      // Parse content
      const result = await this._executeParser(parser, request, payload);
      
      // Record metrics
      if (startTime) {
        this._recordMetrics(contentType, startTime, true);
      }
      
      return result;
      
    } catch (error) {
      if (startTime) {
        this._recordMetrics(contentType, startTime, false);
      }
      
      error.contentType = contentType;
      error.parser = parser.name;
      throw error;
    }
  }

  /**
   * Get parser for a specific content type
   */
  getParser(contentType) {
    const normalizedType = this._normalizeContentType(contentType);
    return this[kCustomParsers].get(normalizedType);
  }

  /**
   * Check if parser exists for content type
   */
  hasParser(contentType) {
    const normalizedType = this._normalizeContentType(contentType);
    return this[kCustomParsers].has(normalizedType);
  }

  /**
   * Get comprehensive parser statistics
   */
  getParserStats() {
    const stats = {
      parsers: {},
      cache: {
        size: this[kParserCache].size,
        maxSize: this.options.cacheSize
      },
      performance: {}
    };

    // Parser information
    for (const [contentType, parser] of this[kCustomParsers]) {
      stats.parsers[contentType] = {
        name: parser.name,
        isAsync: parser.isAsync,
        bodyLimit: parser.bodyLimit,
        parseAs: parser.parseAs
      };
    }

    // Performance metrics
    if (this.options.enableMetrics) {
      for (const [contentType, metrics] of this[kParserMetrics]) {
        stats.performance[contentType] = { ...metrics };
      }
    }

    return stats;
  }

  // Internal helper methods

  _initializeDefaultParsers() {
    // JSON parser with security features
    this.addParser('application/json', {
      parseAs: 'string',
      bodyLimit: this.options.bodyLimit
    }, this._createSecureJsonParser());

    // Plain text parser
    this.addParser('text/plain', {
      parseAs: 'string',
      bodyLimit: this.options.bodyLimit
    }, this._createPlainTextParser());

    // URL encoded parser
    this.addParser('application/x-www-form-urlencoded', {
      parseAs: 'string',
      bodyLimit: this.options.bodyLimit
    }, this._createUrlEncodedParser());
  }

  _validateContentType(contentType) {
    if (typeof contentType !== 'string' && !(contentType instanceof RegExp)) {
      throw new TypeError('Content type must be a string or RegExp');
    }
    
    if (typeof contentType === 'string' && contentType.trim().length === 0) {
      throw new Error('Content type cannot be empty');
    }
  }

  _validateParserFunction(parserFn) {
    if (typeof parserFn !== 'function') {
      throw new TypeError('Parser must be a function');
    }
  }

  _createParser(contentType, options, parserFn) {
    return {
      name: parserFn.name || 'anonymous',
      contentType,
      fn: parserFn,
      isAsync: parserFn.constructor.name === 'AsyncFunction',
      parseAs: options.parseAs || 'string',
      bodyLimit: options.bodyLimit || this.options.bodyLimit,
      enabled: options.enabled !== false,
      createdAt: new Date().toISOString()
    };
  }

  _normalizeContentType(contentType) {
    if (contentType instanceof RegExp) {
      return contentType.toString();
    }
    
    return contentType.trim().toLowerCase();
  }

  _extractContentType(request) {
    const contentType = request.headers['content-type'];
    
    if (!contentType) {
      return 'application/octet-stream'; // Default binary type
    }
    
    // Extract main type, ignore parameters
    return contentType.split(';')[0].trim().toLowerCase();
  }

  _selectParser(contentType) {
    // Check cache first
    if (this.options.enableCache) {
      const cached = this[kParserCache].get(contentType);
      if (cached) return cached;
    }
    
    // Exact match
    const exactParser = this[kCustomParsers].get(contentType);
    if (exactParser && exactParser.enabled) {
      this._setCacheEntry(contentType, exactParser);
      return exactParser;
    }
    
    // RegExp match
    for (const [key, parser] of this[kCustomParsers]) {
      if (parser.enabled && key.startsWith('/') && key.endsWith('/')) {
        try {
          const regex = new RegExp(key.slice(1, -1));
          if (regex.test(contentType)) {
            this._setCacheEntry(contentType, parser);
            return parser;
          }
        } catch (error) {
          // Invalid regex, skip
        }
      }
    }
    
    return null;
  }

  _validatePayloadSize(request, payload, parser) {
    const limit = parser?.bodyLimit || this.options.bodyLimit;
    
    if (payload && payload.length > limit) {
      throw this._createError('PAYLOAD_TOO_LARGE', 
        `Payload size ${payload.length} exceeds limit ${limit}`);
    }
  }

  async _executeParser(parser, request, payload) {
    // Create async context for better error tracking
    const asyncResource = new AsyncResource('ContentTypeParser');
    
    return asyncResource.runInAsyncScope(async () => {
      try {
        // Prepare payload based on parseAs option
        const preparedPayload = this._preparePayload(payload, parser.parseAs);
        
        // Execute parser
        if (parser.isAsync) {
          return await parser.fn(request, preparedPayload);
        } else {
          return parser.fn(request, preparedPayload);
        }
        
      } catch (error) {
        // Enhanced error with context
        error.parser = parser.name;
        error.contentType = parser.contentType;
        error.parseAs = parser.parseAs;
        throw error;
      }
    });
  }

  _preparePayload(payload, parseAs) {
    if (!payload) return payload;
    
    if (parseAs === 'string' && Buffer.isBuffer(payload)) {
      return payload.toString('utf8');
    } else if (parseAs === 'buffer' && typeof payload === 'string') {
      return Buffer.from(payload, 'utf8');
    }
    
    return payload;
  }

  _createSecureJsonParser() {
    const secureJsonParse = require('secure-json-parse');
    
    return (request, body) => {
      if (body === '' || body == null) {
        throw this._createError('EMPTY_JSON_BODY', 'Empty JSON body');
      }
      
      try {
        const options = {
          protoAction: 'error',
          constructorAction: 'error'
        };
        
        return secureJsonParse.parse(body, options);
      } catch (error) {
        throw this._createError('INVALID_JSON', `Invalid JSON: ${error.message}`);
      }
    };
  }

  _createPlainTextParser() {
    return (request, body) => {
      if (typeof body === 'string') return body;
      if (Buffer.isBuffer(body)) return body.toString('utf8');
      return String(body);
    };
  }

  _createUrlEncodedParser() {
    const querystring = require('querystring');
    
    return (request, body) => {
      try {
        const str = typeof body === 'string' ? body : body.toString('utf8');
        return querystring.parse(str);
      } catch (error) {
        throw this._createError('INVALID_URL_ENCODED', `Invalid URL encoded data: ${error.message}`);
      }
    };
  }

  _initializeMetrics(contentType) {
    this[kParserMetrics].set(contentType, {
      parseCount: 0,
      successCount: 0,
      errorCount: 0,
      totalTime: 0,
      avgTime: 0,
      lastUsed: null
    });
  }

  _recordMetrics(contentType, startTime, success) {
    if (!this.options.enableMetrics) return;

    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1e6; // Convert to milliseconds

    let metrics = this[kParserMetrics].get(contentType);
    if (!metrics) {
      this._initializeMetrics(contentType);
      metrics = this[kParserMetrics].get(contentType);
    }

    metrics.parseCount++;
    if (success) {
      metrics.successCount++;
    } else {
      metrics.errorCount++;
    }
    
    metrics.totalTime += duration;
    metrics.avgTime = metrics.totalTime / metrics.parseCount;
    metrics.lastUsed = new Date().toISOString();
  }

  _setCacheEntry(key, value) {
    if (!this.options.enableCache) return;
    
    if (this[kParserCache].size >= this.options.cacheSize) {
      // LRU eviction - remove oldest entry
      const firstKey = this[kParserCache].keys().next().value;
      this[kParserCache].delete(firstKey);
    }
    
    this[kParserCache].set(key, value);
  }

  _clearCache() {
    this[kParserCache].clear();
  }

  _createError(code, message) {
    const error = new Error(message);
    error.code = code;
    error.statusCode = this._getStatusCodeForError(code);
    return error;
  }

  _getStatusCodeForError(code) {
    const statusCodes = {
      'NO_PARSER': 415, // Unsupported Media Type
      'PAYLOAD_TOO_LARGE': 413,
      'INVALID_JSON': 400,
      'EMPTY_JSON_BODY': 400,
      'INVALID_URL_ENCODED': 400
    };
    
    return statusCodes[code] || 500;
  }
}

module.exports = {
  EnterpriseContentTypeParser
};
