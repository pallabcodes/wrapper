/**
 * Fluent Streams API
 * 
 * Provides a chainable, fluent interface for stream operations
 * with enterprise features built-in.
 */

import { StreamsAPI, SimpleStreamResult, StreamStats } from './streams-api';

type StreamAlgorithm = NonNullable<FluentStreamsConfig['algorithm']>;
type StreamTestResult = {
  success: boolean;
  iterations: number;
  averageDuration: number;
  totalDuration: number;
  errors: number;
  throughput: number;
};

export interface FluentStreamsConfig {
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
  compressionLevel?: number;
}

/**
 * Fluent Streams Builder
 * 
 * Provides a chainable interface for stream operations
 */
export class FluentStreams {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(config: FluentStreamsConfig = {}) {
    this.config = {
      algorithm: 'aes-256-gcm',
      enableEncryption: false,
      enableCompression: false,
      enableMonitoring: true,
      enableBackpressure: true,
      enableRateLimiting: false,
      maxThroughput: 0,
      maxConcurrency: 0,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
      compliance: [],
      ...config,
    };

    this.api = new StreamsAPI({
      algorithm: this.config.algorithm,
      enableEncryption: this.config.enableEncryption,
      enableCompression: this.config.enableCompression,
      enableMonitoring: this.config.enableMonitoring,
      enableBackpressure: this.config.enableBackpressure,
      enableRateLimiting: this.config.enableRateLimiting,
      maxThroughput: this.config.maxThroughput,
      maxConcurrency: this.config.maxConcurrency,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout,
      compliance: {
        sox: this.config.compliance?.includes('SOX') || false,
        gdpr: this.config.compliance?.includes('GDPR') || false,
        hipaa: this.config.compliance?.includes('HIPAA') || false,
        pci: this.config.compliance?.includes('PCI') || false,
      },
    });
  }

  /**
   * 🔄 Start readable stream operation
   */
  createReadable(): FluentReadableStream {
    return new FluentReadableStream(this.api, this.config);
  }

  /**
   * ✍️ Start writable stream operation
   */
  createWritable(): FluentWritableStream {
    return new FluentWritableStream(this.api, this.config);
  }

  /**
   * 🔄 Start transform stream operation
   */
  createTransform(): FluentTransformStream {
    return new FluentTransformStream(this.api, this.config);
  }

  /**
   * 🔄 Start duplex stream operation
   */
  createDuplex(): FluentDuplexStream {
    return new FluentDuplexStream(this.api, this.config);
  }

  /**
   * 🔐 Start encrypted stream operation
   */
  createEncrypted(encryptionKey: Buffer): FluentEncryptedStream {
    return new FluentEncryptedStream(this.api, this.config, encryptionKey);
  }

  /**
   * 🗜️ Start compressed stream operation
   */
  createCompressed(): FluentCompressedStream {
    return new FluentCompressedStream(this.api, this.config);
  }

  /**
   * 📊 Get statistics
   */
  async getStats(): Promise<StreamStats> {
    return this.api.getStats();
  }

  /**
   * 🧪 Run performance test
   */
  async test(options: { iterations?: number; dataSize?: number } = {}): Promise<StreamTestResult> {
    return this.api.test(options);
  }
}

/**
 * Fluent Readable Stream Builder
 */
export class FluentReadableStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(api: StreamsAPI, config: FluentStreamsConfig) {
    this.api = api;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentReadableStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Enable encryption
   */
  withEncryption(): FluentReadableStream {
    this.config.enableEncryption = true;
    return this;
  }

  /**
   * Enable compression
   */
  withCompression(): FluentReadableStream {
    this.config.enableCompression = true;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentReadableStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentReadableStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentReadableStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentReadableStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentReadableStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createReadableStream({
      algorithm: this.config.algorithm,
      enableEncryption: this.config.enableEncryption,
      enableCompression: this.config.enableCompression,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Writable Stream Builder
 */
export class FluentWritableStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(api: StreamsAPI, config: FluentStreamsConfig) {
    this.api = api;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentWritableStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Enable encryption
   */
  withEncryption(): FluentWritableStream {
    this.config.enableEncryption = true;
    return this;
  }

  /**
   * Enable compression
   */
  withCompression(): FluentWritableStream {
    this.config.enableCompression = true;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentWritableStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentWritableStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentWritableStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentWritableStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentWritableStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createWritableStream({
      algorithm: this.config.algorithm,
      enableEncryption: this.config.enableEncryption,
      enableCompression: this.config.enableCompression,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Transform Stream Builder
 */
export class FluentTransformStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(api: StreamsAPI, config: FluentStreamsConfig) {
    this.api = api;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentTransformStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Enable encryption
   */
  withEncryption(): FluentTransformStream {
    this.config.enableEncryption = true;
    return this;
  }

  /**
   * Enable compression
   */
  withCompression(): FluentTransformStream {
    this.config.enableCompression = true;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentTransformStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentTransformStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentTransformStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentTransformStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentTransformStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createTransformStream({
      algorithm: this.config.algorithm,
      enableEncryption: this.config.enableEncryption,
      enableCompression: this.config.enableCompression,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Duplex Stream Builder
 */
export class FluentDuplexStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(api: StreamsAPI, config: FluentStreamsConfig) {
    this.api = api;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentDuplexStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Enable encryption
   */
  withEncryption(): FluentDuplexStream {
    this.config.enableEncryption = true;
    return this;
  }

  /**
   * Enable compression
   */
  withCompression(): FluentDuplexStream {
    this.config.enableCompression = true;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentDuplexStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentDuplexStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentDuplexStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentDuplexStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentDuplexStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createTransformStream({
      algorithm: this.config.algorithm,
      enableEncryption: this.config.enableEncryption,
      enableCompression: this.config.enableCompression,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Encrypted Stream Builder
 */
export class FluentEncryptedStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;
  private encryptionKey: Buffer;

  constructor(api: StreamsAPI, config: FluentStreamsConfig, encryptionKey: Buffer) {
    this.api = api;
    this.config = config;
    this.encryptionKey = encryptionKey;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentEncryptedStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentEncryptedStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentEncryptedStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentEncryptedStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentEncryptedStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentEncryptedStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createEncryptedStream({
      algorithm: this.config.algorithm,
      encryptionKey: this.encryptionKey,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Compressed Stream Builder
 */
export class FluentCompressedStream {
  private api: StreamsAPI;
  private config: FluentStreamsConfig;

  constructor(api: StreamsAPI, config: FluentStreamsConfig) {
    this.api = api;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: StreamAlgorithm): FluentCompressedStream {
    this.config.algorithm = algorithm;
    return this;
  }

  /**
   * Set compression level
   */
  withCompressionLevel(level: number): FluentCompressedStream {
    this.config.compressionLevel = level;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentCompressedStream {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentCompressedStream {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Set performance limits
   */
  withLimits(maxThroughput: number, maxConcurrency: number): FluentCompressedStream {
    this.config.maxThroughput = maxThroughput;
    this.config.maxConcurrency = maxConcurrency;
    return this;
  }

  /**
   * Set retry configuration
   */
  withRetry(maxAttempts: number, baseDelay: number): FluentCompressedStream {
    this.config.retryAttempts = maxAttempts;
    this.config.retryDelay = baseDelay;
    return this;
  }

  /**
   * Set timeout
   */
  withTimeout(timeout: number): FluentCompressedStream {
    this.config.timeout = timeout;
    return this;
  }

  /**
   * Execute stream creation
   */
  async execute(): Promise<SimpleStreamResult> {
    return this.api.createCompressedStream({
      algorithm: this.config.algorithm,
      compressionLevel: this.config.compressionLevel,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * 🚀 Create a fluent streams instance
 */
export function createFluentStreams(config: FluentStreamsConfig = {}): FluentStreams {
  return new FluentStreams(config);
}

/**
 * 🎯 Quick fluent streams operations
 */
export const fluentStreams = {
  /**
   * Start readable stream
   */
  createReadable(): FluentReadableStream {
    const streams = createFluentStreams();
    return streams.createReadable();
  },

  /**
   * Start writable stream
   */
  createWritable(): FluentWritableStream {
    const streams = createFluentStreams();
    return streams.createWritable();
  },

  /**
   * Start transform stream
   */
  createTransform(): FluentTransformStream {
    const streams = createFluentStreams();
    return streams.createTransform();
  },

  /**
   * Start duplex stream
   */
  createDuplex(): FluentDuplexStream {
    const streams = createFluentStreams();
    return streams.createDuplex();
  },

  /**
   * Start encrypted stream
   */
  createEncrypted(encryptionKey: Buffer): FluentEncryptedStream {
    const streams = createFluentStreams();
    return streams.createEncrypted(encryptionKey);
  },

  /**
   * Start compressed stream
   */
  createCompressed(): FluentCompressedStream {
    const streams = createFluentStreams();
    return streams.createCompressed();
  },

  /**
   * Get stats
   */
  async getStats(): Promise<StreamStats> {
    const streams = createFluentStreams();
    return streams.getStats();
  },
};
