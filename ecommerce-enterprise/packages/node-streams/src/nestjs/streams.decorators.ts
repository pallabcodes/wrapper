/**
 * Enhanced Streams Decorators
 * 
 * NestJS decorators for automatic stream operations
 * with enterprise features and performance monitoring.
 */

import type { NestJSDecorator, StreamsOperationMetadata, StreamOperationOptions } from '../types/streams-custom.types';

// Optional NestJS imports - will work even if NestJS is not installed
let SetMetadata: NestJSDecorator;
let applyDecorators: NestJSDecorator;

try {
  const nestjs = require('@nestjs/common');
  SetMetadata = nestjs.SetMetadata;
  applyDecorators = nestjs.applyDecorators;
} catch (error) {
  // Fallback implementations for when NestJS is not available
  SetMetadata = function(_key: string, _value: unknown) { return function(target: unknown) { return target; }; };
  applyDecorators = function(..._decorators: NestJSDecorator[]) { return function(target: unknown) { return target; }; };
}

// Type definition for CustomDecorator
type CustomDecorator = NestJSDecorator;

export const STREAMS_OPERATION_METADATA = 'streams_operation_metadata';
export const STREAMS_MONITORING_METADATA = 'streams_monitoring_metadata';
export const STREAMS_SECURITY_METADATA = 'streams_security_metadata';
export const STREAMS_COMPLIANCE_METADATA = 'streams_compliance_metadata';

export interface StreamsDecoratorOptions {
  algorithm?: 'aes-256-gcm' | 'aes-128-gcm' | 'gzip' | 'brotli' | 'lz4' | 'zstd';
  enableEncryption?: boolean;
  enableCompression?: boolean;
  enableMonitoring?: boolean;
  enableBackpressure?: boolean;
  enableRateLimiting?: boolean;
  maxThroughput?: number;
  maxConcurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  compliance?: string[];
  userId?: string;
  sessionId?: string;
}

/**
 * 🔄 Create a readable stream automatically
 * 
 * @param options - Stream configuration options
 * @returns Method decorator
 */
export function CreateReadableStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'readable', 
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * ✍️ Create a writable stream automatically
 * 
 * @param options - Stream configuration options
 * @returns Method decorator
 */
export function CreateWritableStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'writable', 
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🔄 Create a transform stream automatically
 * 
 * @param options - Stream configuration options
 * @returns Method decorator
 */
export function CreateTransformStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'transform', 
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🔄 Create a duplex stream automatically
 * 
 * @param options - Stream configuration options
 * @returns Method decorator
 */
export function CreateDuplexStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'duplex', 
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🔐 Create an encrypted stream automatically
 * 
 * @param options - Encryption configuration options
 * @returns Method decorator
 */
export function CreateEncryptedStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'encrypted', 
      enableEncryption: true,
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🗜️ Create a compressed stream automatically
 * 
 * @param options - Compression configuration options
 * @returns Method decorator
 */
export function CreateCompressedStream(options: StreamsDecoratorOptions = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, { 
      type: 'compressed', 
      enableCompression: true,
      ...options 
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 📊 Monitor stream performance automatically
 * 
 * @param options - Performance monitoring options
 * @returns Method decorator
 */
export function MonitorStreamPerformance(options: { 
  operation?: string; 
  threshold?: number; 
  enableAlerting?: boolean;
} = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_MONITORING_METADATA, { 
      operation: options.operation || 'stream_operation',
      threshold: options.threshold || 1000, // 1 second
      enableAlerting: options.enableAlerting !== false,
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🔒 Add security requirements
 * 
 * @param options - Security configuration options
 * @returns Method decorator
 */
export function StreamSecurity(options: {
  enableEncryption?: boolean;
  enableAuthentication?: boolean;
  enableAuthorization?: boolean;
  enableIntegrityCheck?: boolean;
  enableRateLimiting?: boolean;
  maxRequestSize?: number;
  maxResponseSize?: number;
} = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_SECURITY_METADATA, {
      enableEncryption: options.enableEncryption || false,
      enableAuthentication: options.enableAuthentication || false,
      enableAuthorization: options.enableAuthorization || false,
      enableIntegrityCheck: options.enableIntegrityCheck || false,
      enableRateLimiting: options.enableRateLimiting || false,
      maxRequestSize: options.maxRequestSize || 1024 * 1024, // 1MB
      maxResponseSize: options.maxResponseSize || 1024 * 1024, // 1MB
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 📋 Add compliance requirements
 * 
 * @param compliance - Compliance requirements
 * @returns Method decorator
 */
export function StreamCompliance(compliance: string[]): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_COMPLIANCE_METADATA, { 
      compliance,
      enableSOX: compliance.includes('SOX'),
      enableGDPR: compliance.includes('GDPR'),
      enableHIPAA: compliance.includes('HIPAA'),
      enablePCI: compliance.includes('PCI'),
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🛡️ Add flow control
 * 
 * @param options - Flow control options
 * @returns Method decorator
 */
export function StreamFlowControl(options: {
  enableBackpressure?: boolean;
  enableRateLimiting?: boolean;
  enableCircuitBreaker?: boolean;
  highWaterMark?: number;
  lowWaterMark?: number;
  maxThroughput?: number;
  maxConcurrency?: number;
} = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, {
      enableBackpressure: options.enableBackpressure !== false,
      enableRateLimiting: options.enableRateLimiting || false,
      enableCircuitBreaker: options.enableCircuitBreaker || false,
      highWaterMark: options.highWaterMark || 16384,
      lowWaterMark: options.lowWaterMark || 8192,
      maxThroughput: options.maxThroughput || 0,
      maxConcurrency: options.maxConcurrency || 0,
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🔄 Add retry logic
 * 
 * @param options - Retry configuration options
 * @returns Method decorator
 */
export function StreamRetry(options: {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
} = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, {
      retryAttempts: options.maxAttempts || 3,
      retryDelay: options.baseDelay || 1000,
      maxRetryDelay: options.maxDelay || 10000,
      backoffMultiplier: options.backoffMultiplier || 2,
      jitter: options.jitter !== false,
      retryCondition: options.retryCondition,
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * ⏱️ Add timeout control
 * 
 * @param options - Timeout configuration options
 * @returns Method decorator
 */
export function StreamTimeout(options: {
  readTimeout?: number;
  writeTimeout?: number;
  connectTimeout?: number;
  idleTimeout?: number;
  enableKeepAlive?: boolean;
  keepAliveInterval?: number;
} = {}): CustomDecorator {
  return applyDecorators(
    SetMetadata(STREAMS_OPERATION_METADATA, {
      readTimeout: options.readTimeout || 30000,
      writeTimeout: options.writeTimeout || 30000,
      connectTimeout: options.connectTimeout || 10000,
      idleTimeout: options.idleTimeout || 60000,
      enableKeepAlive: options.enableKeepAlive !== false,
      keepAliveInterval: options.keepAliveInterval || 30000,
    }),
    // UseInterceptors(StreamsInterceptor) // Interceptor to be implemented
  );
}

/**
 * 🎯 Combine multiple stream decorators
 * 
 * @param decorators - Array of stream decorators
 * @returns Combined decorator
 */
export function CombineStreamDecorators(...decorators: NestJSDecorator[]): CustomDecorator {
  return applyDecorators(...decorators);
}

/**
 * 🚀 Quick stream decorators for common use cases
 */
export const Streams = {
  /**
   * Create a basic readable stream
   */
  Readable: (options?: StreamsDecoratorOptions) => CreateReadableStream(options),
  
  /**
   * Create a basic writable stream
   */
  Writable: (options?: StreamsDecoratorOptions) => CreateWritableStream(options),
  
  /**
   * Create a basic transform stream
   */
  Transform: (options?: StreamsDecoratorOptions) => CreateTransformStream(options),
  
  /**
   * Create a basic duplex stream
   */
  Duplex: (options?: StreamsDecoratorOptions) => CreateDuplexStream(options),
  
  /**
   * Create an encrypted stream
   */
  Encrypted: (options?: StreamsDecoratorOptions) => CreateEncryptedStream(options),
  
  /**
   * Create a compressed stream
   */
  Compressed: (options?: StreamsDecoratorOptions) => CreateCompressedStream(options),
  
  /**
   * Monitor performance
   */
  Monitor: (options?: { operation?: string; threshold?: number; enableAlerting?: boolean }) => 
    MonitorStreamPerformance(options),
  
  /**
   * Add security
   */
  Secure: (options?: { enableEncryption?: boolean; enableAuthentication?: boolean; enableAuthorization?: boolean }) => 
    StreamSecurity(options),
  
  /**
   * Add compliance
   */
  Compliant: (compliance: string[]) => StreamCompliance(compliance),
  
  /**
   * Add flow control
   */
  FlowControl: (options?: { enableBackpressure?: boolean; enableRateLimiting?: boolean; maxThroughput?: number }) => 
    StreamFlowControl(options),
  
  /**
   * Add retry logic
   */
  Retry: (options?: { maxAttempts?: number; baseDelay?: number; maxDelay?: number }) => 
    StreamRetry(options),
  
  /**
   * Add timeout control
   */
  Timeout: (options?: { readTimeout?: number; writeTimeout?: number; connectTimeout?: number }) => 
    StreamTimeout(options),
};
