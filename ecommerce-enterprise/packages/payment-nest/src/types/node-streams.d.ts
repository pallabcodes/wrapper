declare module '@ecommerce-enterprise/node-streams' {
  export interface StreamConfig {
    source?: string;
    encoding?: BufferEncoding;
    highWaterMark?: number;
    enableEncryption?: boolean;
    encryptionAlgorithm?: string;
    encryptionKey?: Buffer;
    enableIntegrityCheck?: boolean;
    enableCompression?: boolean;
    compressionAlgorithm?: string;
    compressionLevel?: number;
    enableDictionary?: boolean;
    enableMonitoring?: boolean;
    enableBackpressure?: boolean;
    enableRateLimiting?: boolean;
    rateLimit?: number;
    algorithm?: string;
    maxThroughput?: number;
    maxConcurrency?: number;
    retryAttempts?: number;
    retryDelay?: number;
    timeout?: number;
    userId?: string;
    iterations?: number;
    dataSize?: number;
    compliance?: string[];
    auditConfig?: {
      enableAudit?: boolean;
      auditLevel?: string;
    };
    complianceConfig?: {
      enableCompliance?: boolean;
      complianceStandards?: string[];
    };
  }

  export interface StreamData {
    id: string;
    type: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Record<string, unknown>;
    algorithm?: string;
    streamId?: string;
  }

  export interface StreamMetadata {
    source: string;
    encoding: BufferEncoding;
    highWaterMark: number;
    enableEncryption: boolean;
    encryptionAlgorithm: string;
    enableCompression: boolean;
    compressionAlgorithm: string;
    enableMonitoring: boolean;
    enableBackpressure: boolean;
    enableRateLimiting: boolean;
    rateLimit: number;
    auditConfig: {
      enableAudit: boolean;
      auditLevel: string;
    };
    complianceConfig: {
      enableCompliance: boolean;
      complianceStandards: string[];
    };
  }

  export interface StreamContext {
    userId: string;
    tenantId?: string;
    sessionId?: string;
    requestId?: string;
    correlationId?: string;
    deviceId?: string;
    ipAddress?: string;
    userAgent?: string;
  }

  export interface StreamStats {
    bytesProcessed: number;
    bytesPerSecond: number;
    errors: number;
    warnings: number;
    lastActivity: Date;
  }

  export interface StreamAuditEntry {
    id: string;
    streamId: string;
    operation: string;
    timestamp: Date;
    userId?: string;
    details: Record<string, unknown>;
  }

  export interface StreamPerformanceMetrics {
    operation: string;
    duration: number;
    memoryUsage: number;
    timestamp: Date;
  }

  export class SimpleStreamsService {
    constructor(config?: StreamConfig);
    createReadableStream(config: StreamConfig): Promise<StreamData>;
    createWritableStream(config: StreamConfig): Promise<StreamData>;
    createTransformStream(config: StreamConfig): Promise<StreamData>;
    createEncryptedStream(config: StreamConfig): Promise<StreamData>;
    createCompressedStream(config: StreamConfig): Promise<StreamData>;
    getStats(): Promise<StreamPerformanceMetrics[]>;
    getAuditLog(filter?: Record<string, unknown>): Promise<StreamAuditEntry[]>;
    test(config: StreamConfig): Promise<{ success: boolean; metrics: StreamPerformanceMetrics }>;
    optimize(config: StreamConfig): Promise<{ optimized: boolean; recommendations: string[] }>;
    validate(config: StreamConfig): Promise<{ valid: boolean; errors: string[] }>;
  }

  export class FluentStreamsService {
    constructor(config?: StreamConfig);
    createReadable(): FluentStreamsService;
    createWritable(): FluentStreamsService;
    createTransform(): FluentStreamsService;
    createEncrypted(): FluentStreamsService;
    createCompressed(): FluentStreamsService;
    withAlgorithm(algorithm: string): FluentStreamsService;
    withCompressionLevel(level: number): FluentStreamsService;
    withCompression(algorithm: string, level?: number): FluentStreamsService;
    withEncryption(algorithm: string, key?: Buffer): FluentStreamsService;
    forUser(userId: string): FluentStreamsService;
    withCompliance(standards: string[]): FluentStreamsService;
    withLimits(throughput: number, concurrency: number): FluentStreamsService;
    withRetry(attempts: number, delay: number): FluentStreamsService;
    withTimeout(timeout: number): FluentStreamsService;
    execute(): Promise<StreamData>;
  }

  export class QuickStreamsService {
    static createReadable(config: StreamConfig): Promise<StreamData>;
    static createWritable(config: StreamConfig): Promise<StreamData>;
    static createTransform(config: StreamConfig): Promise<StreamData>;
    static createEncrypted(config: StreamConfig): Promise<StreamData>;
    static createCompressed(config: StreamConfig): Promise<StreamData>;
  }

  export const streams: {
    createReadable: (config: StreamConfig) => Promise<StreamData>;
    createWritable: (config: StreamConfig) => Promise<StreamData>;
    createTransform: (config: StreamConfig) => Promise<StreamData>;
    createEncrypted: (config: StreamConfig) => Promise<StreamData>;
    createCompressed: (config: StreamConfig) => Promise<StreamData>;
    createReadableStream: (config: StreamConfig) => Promise<StreamData>;
    createWritableStream: (config: StreamConfig) => Promise<StreamData>;
    createTransformStream: (config: StreamConfig) => Promise<StreamData>;
    createEncryptedStream: (config: StreamConfig) => Promise<StreamData>;
    createCompressedStream: (config: StreamConfig) => Promise<StreamData>;
    getStats: () => Promise<{
      totalStreams: number;
      activeStreams: number;
      totalBytesProcessed: number;
      averageThroughput: number;
      averageLatency: number;
      errorRate: number;
      lastActivity: Date;
    }>;
    getAuditLog: (filter?: Record<string, unknown>) => Promise<StreamAuditEntry[]>;
    test: (config: StreamConfig) => Promise<{ 
      success: boolean; 
      metrics: StreamPerformanceMetrics;
      iterations: number;
      averageDuration: number;
      totalDuration: number;
      errors: number;
      throughput: number;
    }>;
    optimize: (streamId: string) => Promise<{ 
      optimized: boolean; 
      recommendations: string[];
      success: boolean;
      optimizations: string[];
      performanceGain: number;
    }>;
    validate: (streamId: string) => Promise<{ 
      valid: boolean; 
      errors: string[];
      algorithm: string;
      status: string;
      streamId: string;
      validatedAt: Date;
      issues: string[];
    }>;
  };

  export const Streams = streams;

  export const simple: SimpleStreamsService;
  export const fluent: FluentStreamsService;
  export const quick: typeof QuickStreamsService;

  // Additional exports for API creation
  export function createStreamsAPI(config?: StreamConfig): {
    createReadable: (config: StreamConfig) => Promise<StreamData>;
    createWritable: (config: StreamConfig) => Promise<StreamData>;
    createTransform: (config: StreamConfig) => Promise<StreamData>;
    createEncrypted: (config: StreamConfig) => Promise<StreamData>;
    createCompressed: (config: StreamConfig) => Promise<StreamData>;
    getStats: () => Promise<{
      totalStreams: number;
      activeStreams: number;
      totalBytesProcessed: number;
      averageThroughput: number;
      averageLatency: number;
      errorRate: number;
      lastActivity: Date;
    }>;
    getAuditLog: (filter?: Record<string, unknown>) => Promise<StreamAuditEntry[]>;
    test: (config: StreamConfig) => Promise<{ 
      success: boolean; 
      metrics: StreamPerformanceMetrics;
      iterations: number;
      averageDuration: number;
      totalDuration: number;
      errors: number;
      throughput: number;
    }>;
    optimize: (streamId: string) => Promise<{ 
      optimized: boolean; 
      recommendations: string[];
      success: boolean;
      optimizations: string[];
      performanceGain: number;
    }>;
    validate: (streamId: string) => Promise<{ 
      valid: boolean; 
      errors: string[];
      algorithm: string;
      status: string;
      streamId: string;
      validatedAt: Date;
      issues: string[];
    }>;
  };

  export function createFluentStreams(config?: StreamConfig): FluentStreamsService;
  export function createSimpleStreams(config?: StreamConfig): SimpleStreamsService;

  // Decorator types
  export function CreateReadableStream(config?: StreamConfig): MethodDecorator;
  export function CreateWritableStream(config?: StreamConfig): MethodDecorator;
  export function CreateTransformStream(config?: StreamConfig): MethodDecorator;
  export function CreateEncryptedStream(config?: StreamConfig): MethodDecorator;
  export function CreateCompressedStream(config?: StreamConfig): MethodDecorator;

  // Additional decorators
  export function MonitorStreamPerformance(options?: Record<string, unknown>): MethodDecorator;
  export function StreamSecurity(level: string): MethodDecorator;
  export function StreamCompliance(standards: string[]): MethodDecorator;
  export function StreamFlowControl(options?: Record<string, unknown>): MethodDecorator;
  export function StreamRetry(options?: Record<string, unknown>): MethodDecorator;
  export function StreamTimeout(timeout: number): MethodDecorator;
}
