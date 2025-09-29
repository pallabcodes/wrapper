/**
 * Enhanced Streams Types
 * 
 * TypeScript definitions for the enhanced Node.js streams module
 * with enterprise features and performance optimizations.
 */

// Import custom types to replace 'any' usage
import type { 
  StreamData, 
  StreamMetadata, 
  StreamContext,
  StreamError,
  ValidationResult,
  OptimizationResult,
  MemoryAnalysis,
  ThroughputAnalysis,
  ErrorAnalysis,
  StreamReport,
  HealthStatus,
  StreamAlert,
  SecurityEvent,
  BaseStream,
  ReadableStream,
  WritableStream,
  TransformStream,
  DuplexStream,
  EncryptedStream,
  CompressedStream,
  MultiplexedStream,
  SplitterStream,
  MergerStream,
  NativeStreamsAddon,
  NestJSDecorator,
  StreamsOperationMetadata,
  StreamOperationOptions
} from './streams-custom.types';

export interface StreamMetrics {
  bytesProcessed: number;
  chunksProcessed: number;
  throughput: number; // bytes per second
  latency: number; // average latency in ms
  memoryUsage: number; // memory usage in bytes
  errorCount: number;
  successRate: number;
  startTime: number;
  endTime?: number;
  duration?: number;
}

export interface StreamConfig {
  highWaterMark?: number;
  encoding?: BufferEncoding;
  objectMode?: boolean;
  allowHalfOpen?: boolean;
  readableObjectMode?: boolean;
  writableObjectMode?: boolean;
  autoDestroy?: boolean;
  emitClose?: boolean;
  // Enhanced options
  enableEncryption: boolean;
  enableCompression: boolean;
  enableMonitoring: boolean;
  enableBackpressure: boolean;
  enableRateLimiting: boolean;
  maxThroughput?: number; // bytes per second
  maxConcurrency?: number;
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface StreamOperation {
  id: string;
  type: 'read' | 'write' | 'transform' | 'end' | 'error';
  timestamp: number;
  data?: StreamData;
  size?: number;
  success: boolean;
  error?: string;
  duration?: number;
}

export interface StreamAuditEntry {
  timestamp: string;
  operation: string;
  streamId: string;
  userId?: string;
  sessionId?: string;
  success: boolean;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  duration: number;
  dataSize: number;
  metrics: StreamMetrics;
}

export interface StreamPerformanceAnalysis {
  slowestOperations: Array<{
    operation: string;
    averageDuration: number;
  }>;
  mostFrequentOperations: Array<{
    operation: string;
    callCount: number;
  }>;
  performanceIssues: Array<{
    operation: string;
    issue: string;
    averageDuration: number;
  }>;
  recommendations: string[];
}

export interface StreamFilter {
  streamId: string;
  userId?: string;
  operation?: string;
  success?: boolean;
  startTime: string;
  endTime: string;
  limit?: number;
  offset?: number;
}

export interface EncryptedStreamConfig extends StreamConfig {
  encryptionKey: Buffer;
  encryptionAlgorithm: 'aes-256-gcm' | 'aes-128-gcm';
  enableIntegrityCheck: boolean;
}

export interface CompressedStreamConfig extends StreamConfig {
  compressionAlgorithm: 'gzip' | 'brotli' | 'lz4' | 'zstd';
  compressionLevel: number;
  enableDictionary: boolean;
}

export interface MultiplexedStreamConfig extends StreamConfig {
  maxStreams?: number;
  enableLoadBalancing?: boolean;
  enableFailover?: boolean;
}

export interface StreamSplitterConfig extends StreamConfig {
  splitStrategy?: 'size' | 'time' | 'pattern' | 'custom';
  splitSize?: number;
  splitInterval?: number;
  splitPattern?: RegExp;
  customSplitter?: (chunk: StreamData) => boolean;
}

export interface StreamMergerConfig extends StreamConfig {
  mergeStrategy?: 'round-robin' | 'priority' | 'custom';
  priorities?: Map<string, number>;
  customMerger?: (streams: BaseStream[]) => BaseStream;
}

export interface StreamCircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  halfOpenMaxCalls: number;
}

export interface StreamRateLimiterConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: StreamContext) => string;
}

export interface StreamBackpressureConfig {
  highWaterMark: number;
  lowWaterMark: number;
  enableAutomaticDrain?: boolean;
  drainStrategy?: 'immediate' | 'gradual' | 'custom';
  customDrainStrategy?: (stream: BaseStream) => void;
}

export interface StreamRetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface StreamTimeoutConfig {
  readTimeout: number;
  writeTimeout: number;
  connectTimeout: number;
  idleTimeout: number;
  enableKeepAlive?: boolean;
  keepAliveInterval?: number;
}

export interface StreamSecurityConfig {
  enableAuthentication: boolean;
  enableAuthorization: boolean;
  enableEncryption: boolean;
  enableIntegrityCheck: boolean;
  enableRateLimiting: boolean;
  enableAuditLogging: boolean;
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  maxRequestSize?: number;
  maxResponseSize?: number;
}

export interface StreamMonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableProfiling: boolean;
  enableAlerting: boolean;
  metricsInterval: number;
  tracingSampleRate: number;
  profilingSampleRate: number;
  alertThresholds: {
    highLatency: number;
    highErrorRate: number;
    highMemoryUsage: number;
    lowThroughput: number;
  };
}

export interface StreamComplianceConfig {
  enableSOX: boolean;
  enableGDPR: boolean;
  enableHIPAA: boolean;
  enablePCI: boolean;
  dataRetentionDays: number;
  auditLogRetentionDays: number;
  enableDataAnonymization: boolean;
  enableDataEncryption: boolean;
  enableAccessLogging: boolean;
  enableDataClassification: boolean;
}

export interface StreamError extends Error {
  code: string;
  streamId: string;
  operation: string;
  timestamp: number;
  retryable: boolean;
  context?: StreamContext;
}

export interface StreamEvent {
  type: string;
  streamId: string;
  timestamp: number;
  data?: StreamData;
  metadata?: StreamMetadata;
}

export interface StreamSubscription {
  id: string;
  streamId: string;
  userId: string;
  eventTypes: string[];
  callback: (event: StreamEvent) => void;
  createdAt: number;
  active: boolean;
}

export interface StreamPool {
  id: string;
  name: string;
  maxSize: number;
  currentSize: number;
  streams: Map<string, any>;
  metrics: StreamMetrics;
  config: StreamConfig;
}

export interface StreamManager {
  pools: Map<string, StreamPool>;
  subscriptions: Map<string, StreamSubscription>;
  metrics: StreamMetrics;
  config: StreamConfig;
}

export interface StreamFactory {
  createReadableStream(config?: StreamConfig): ReadableStream;
  createWritableStream(config?: StreamConfig): WritableStream;
  createTransformStream(config?: StreamConfig): TransformStream;
  createDuplexStream(config?: StreamConfig): DuplexStream;
  createEncryptedStream(config: EncryptedStreamConfig): EncryptedStream;
  createCompressedStream(config: CompressedStreamConfig): CompressedStream;
  createMultiplexedStream(config: MultiplexedStreamConfig): MultiplexedStream;
  createSplitterStream(config: StreamSplitterConfig): SplitterStream;
  createMergerStream(config: StreamMergerConfig): MergerStream;
}

export interface StreamValidator {
  validateConfig(config: StreamConfig): ValidationResult;
  validateData(data: StreamData): ValidationResult;
  validateOperation(operation: StreamOperation): ValidationResult;
  validateMetrics(metrics: StreamMetrics): ValidationResult;
}

export interface StreamOptimizer {
  optimizeConfig(config: StreamConfig): StreamConfig;
  optimizePerformance(stream: BaseStream): OptimizationResult;
  optimizeMemory(stream: BaseStream): OptimizationResult;
  optimizeThroughput(stream: BaseStream): OptimizationResult;
}

export interface StreamAnalyzer {
  analyzePerformance(stream: BaseStream): StreamPerformanceAnalysis;
  analyzeMemory(stream: BaseStream): MemoryAnalysis;
  analyzeThroughput(stream: BaseStream): ThroughputAnalysis;
  analyzeErrors(stream: BaseStream): ErrorAnalysis;
  generateReport(stream: BaseStream): StreamReport;
}

export interface StreamReporter {
  reportMetrics(metrics: StreamMetrics): void;
  reportErrors(errors: StreamError[]): void;
  reportPerformance(analysis: StreamPerformanceAnalysis): void;
  reportCompliance(auditEntries: StreamAuditEntry[]): void;
}

export interface StreamExporter {
  exportMetrics(format: 'json' | 'csv' | 'xml'): string;
  exportAuditLog(format: 'json' | 'csv' | 'xml'): string;
  exportPerformanceReport(format: 'json' | 'pdf' | 'html'): string;
  exportComplianceReport(format: 'json' | 'pdf' | 'html'): string;
}

export interface StreamImporter {
  importConfig(config: string): StreamConfig;
  importData(data: string): StreamData;
  importMetrics(metrics: string): StreamMetrics;
  importAuditLog(auditLog: string): StreamAuditEntry[];
}

export interface StreamSerializer {
  serialize(data: StreamData): Buffer;
  deserialize(buffer: Buffer): StreamData;
  serializeConfig(config: StreamConfig): string;
  deserializeConfig(config: string): StreamConfig;
}

export interface StreamCompressor {
  compress(data: Buffer, algorithm?: string): Buffer;
  decompress(data: Buffer, algorithm?: string): Buffer;
  getCompressionRatio(original: Buffer, compressed: Buffer): number;
  getCompressionSpeed(data: Buffer): number;
}

export interface StreamEncryptor {
  encrypt(data: Buffer, key: Buffer): Buffer;
  decrypt(data: Buffer, key: Buffer): Buffer;
  generateKey(algorithm?: string): Buffer;
  validateKey(key: Buffer): boolean;
}

export interface StreamAuthenticator {
  authenticate(token: string): boolean;
  authorize(userId: string, resource: string): boolean;
  generateToken(userId: string): string;
  validateToken(token: string): boolean;
}

export interface StreamAuthorizer {
  checkPermission(userId: string, action: string, resource: string): boolean;
  grantPermission(userId: string, action: string, resource: string): void;
  revokePermission(userId: string, action: string, resource: string): void;
  listPermissions(userId: string): string[];
}

export interface StreamAuditor {
  logOperation(operation: StreamOperation): void;
  logAccess(userId: string, resource: string): void;
  logError(error: StreamError): void;
  logSecurity(event: string, details: SecurityEvent): void;
  getAuditLog(filter?: StreamFilter): StreamAuditEntry[];
}

export interface StreamMonitor {
  startMonitoring(): void;
  stopMonitoring(): void;
  getMetrics(): StreamMetrics;
  getPerformanceAnalysis(): StreamPerformanceAnalysis;
  getHealthStatus(): HealthStatus;
  getAlerts(): StreamAlert[];
}

export interface StreamAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  streamId: string;
  timestamp: number;
  resolved: boolean;
  resolvedAt?: number;
  context?: StreamContext;
}

export interface StreamHealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: Array<{
    name: string;
    status: 'pass' | 'fail' | 'warn';
    message: string;
    duration: number;
  }>;
  timestamp: number;
  uptime: number;
  version: string;
}

export interface StreamDiagnostics {
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: {
    usage: number;
    load: number[];
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    connections: number;
  };
  streams: {
    active: number;
    total: number;
    errors: number;
  };
  performance: {
    throughput: number;
    latency: number;
    errorRate: number;
  };
}

export interface StreamBenchmark {
  name: string;
  description: string;
  iterations: number;
  duration: number;
  throughput: number;
  latency: number;
  memoryUsage: number;
  cpuUsage: number;
  errors: number;
  successRate: number;
  results: Array<{
    iteration: number;
    duration: number;
    throughput: number;
    latency: number;
    memoryUsage: number;
    cpuUsage: number;
    errors: number;
  }>;
}

export interface StreamTestSuite {
  name: string;
  description: string;
  tests: Array<{
    name: string;
    description: string;
    test: () => Promise<void>;
    timeout?: number;
    retries?: number;
  }>;
  setup?: () => Promise<void>;
  teardown?: () => Promise<void>;
  beforeEach?: () => Promise<void>;
  afterEach?: () => Promise<void>;
}

export interface StreamTestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
  metrics?: StreamMetrics;
  assertions: Array<{
    name: string;
    passed: boolean;
    message: string;
  }>;
}

export interface StreamTestReport {
  suite: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  skippedTests: number;
  duration: number;
  results: StreamTestResult[];
  summary: {
    successRate: number;
    averageDuration: number;
    totalDuration: number;
  };
}

export interface StreamDocumentation {
  api: {
    methods: Array<{
      name: string;
      description: string;
      parameters: ParameterDocumentation[];
      returns: ReturnDocumentation;
      examples: string[];
    }>;
    events: Array<{
      name: string;
      description: string;
      parameters: ParameterDocumentation[];
      examples: string[];
    }>;
    types: Array<{
      name: string;
      description: string;
      properties: PropertyDocumentation[];
      examples: string[];
    }>;
  };
  guides: Array<{
    title: string;
    content: string;
    examples: string[];
  }>;
  examples: Array<{
    title: string;
    description: string;
    code: string;
    output?: string;
  }>;
}

export interface StreamConfiguration {
  global: StreamConfig;
  security: StreamSecurityConfig;
  monitoring: StreamMonitoringConfig;
  compliance: StreamComplianceConfig;
  performance: {
    enableOptimization: boolean;
    enableCaching: boolean;
    enableCompression: boolean;
    enableEncryption: boolean;
  };
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text' | 'xml';
    destination: 'console' | 'file' | 'remote';
    rotation: boolean;
    maxSize: number;
    maxFiles: number;
  };
  alerting: {
    enabled: boolean;
    channels: string[];
    thresholds: ThresholdConfiguration;
    cooldown: number;
  };
}
