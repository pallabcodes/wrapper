/**
 * Custom Types for Enhanced Streams
 * 
 * Comprehensive type definitions to replace all 'any' types
 * with proper, type-safe alternatives.
 */

import { Readable, Writable, Transform, Duplex } from 'stream';
import { 
  StreamConfig, 
  StreamMetrics, 
  StreamPerformanceAnalysis, 
  StreamAuditEntry,
  EncryptedStreamConfig,
  CompressedStreamConfig,
  MultiplexedStreamConfig,
  StreamSplitterConfig,
  StreamMergerConfig
} from './streams.types';

// ============================================================================
// CORE STREAM TYPES
// ============================================================================

export interface StreamData {
  readonly buffer: Buffer;
  readonly encoding?: BufferEncoding;
  readonly timestamp: number;
  readonly metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  readonly data: StreamData;
  readonly size: number;
  readonly sequence: number;
  readonly checksum?: string;
}

export interface StreamContext {
  readonly streamId: string;
  readonly userId?: string;
  readonly sessionId?: string;
  readonly tenantId?: string;
  readonly requestId?: string;
  readonly correlationId?: string;
}

export interface StreamMetadata {
  readonly version: string;
  readonly createdAt: number;
  readonly lastModified: number;
  readonly tags: string[];
  readonly properties: Record<string, unknown>;
}

// ============================================================================
// STREAM OPERATION TYPES
// ============================================================================

export interface StreamOperationData {
  readonly type: 'read' | 'write' | 'transform' | 'end' | 'error';
  readonly data?: StreamData;
  readonly size?: number;
  readonly success: boolean;
  readonly error?: StreamError;
  readonly duration?: number;
  readonly context: StreamContext;
}

export interface StreamError {
  readonly code: string;
  readonly message: string;
  readonly streamId: string;
  readonly operation: string;
  readonly timestamp: number;
  readonly retryable: boolean;
  readonly context?: StreamContext;
  readonly stack?: string;
}

export interface StreamEvent {
  readonly type: string;
  readonly streamId: string;
  readonly timestamp: number;
  readonly data?: StreamData;
  readonly metadata?: StreamMetadata;
  readonly context?: StreamContext;
}

// ============================================================================
// STREAM FACTORY TYPES
// ============================================================================

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

// ============================================================================
// STREAM VALIDATOR TYPES
// ============================================================================

export interface StreamValidator {
  validateConfig(config: StreamConfig): ValidationResult;
  validateData(data: StreamData): ValidationResult;
  validateOperation(operation: StreamOperationData): ValidationResult;
  validateMetrics(metrics: StreamMetrics): ValidationResult;
}

export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: ValidationError[];
  readonly warnings: ValidationWarning[];
}

export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
  readonly value?: unknown;
}

export interface ValidationWarning {
  readonly field: string;
  readonly message: string;
  readonly suggestion?: string;
}

// ============================================================================
// STREAM OPTIMIZER TYPES
// ============================================================================

export interface StreamOptimizer {
  optimizeConfig(config: StreamConfig): StreamConfig;
  optimizePerformance(stream: BaseStream): OptimizationResult;
  optimizeMemory(stream: BaseStream): OptimizationResult;
  optimizeThroughput(stream: BaseStream): OptimizationResult;
}

export interface OptimizationResult {
  readonly optimized: boolean;
  readonly improvements: OptimizationImprovement[];
  readonly metrics: StreamMetrics;
  readonly recommendations: string[];
}

export interface OptimizationImprovement {
  readonly type: 'performance' | 'memory' | 'throughput' | 'reliability';
  readonly description: string;
  readonly impact: 'low' | 'medium' | 'high';
  readonly before: number;
  readonly after: number;
}

// ============================================================================
// STREAM ANALYZER TYPES
// ============================================================================

export interface StreamAnalyzer {
  analyzePerformance(stream: BaseStream): StreamPerformanceAnalysis;
  analyzeMemory(stream: BaseStream): MemoryAnalysis;
  analyzeThroughput(stream: BaseStream): ThroughputAnalysis;
  analyzeErrors(stream: BaseStream): ErrorAnalysis;
  generateReport(stream: BaseStream): StreamReport;
}

export interface MemoryAnalysis {
  readonly currentUsage: number;
  readonly peakUsage: number;
  readonly averageUsage: number;
  readonly leaks: MemoryLeak[];
  readonly recommendations: string[];
}

export interface MemoryLeak {
  readonly type: string;
  readonly description: string;
  readonly severity: 'low' | 'medium' | 'high';
  readonly location: string;
}

export interface ThroughputAnalysis {
  readonly current: number;
  readonly peak: number;
  readonly average: number;
  readonly bottlenecks: Bottleneck[];
  readonly recommendations: string[];
}

export interface Bottleneck {
  readonly type: string;
  readonly description: string;
  readonly impact: number;
  readonly location: string;
}

export interface ErrorAnalysis {
  readonly totalErrors: number;
  readonly errorRate: number;
  readonly errorTypes: ErrorType[];
  readonly trends: ErrorTrend[];
  readonly recommendations: string[];
}

export interface ErrorType {
  readonly type: string;
  readonly count: number;
  readonly percentage: number;
  readonly lastOccurred: number;
}

export interface ErrorTrend {
  readonly period: string;
  readonly count: number;
  readonly trend: 'increasing' | 'decreasing' | 'stable';
}

export interface StreamReport {
  readonly streamId: string;
  readonly generatedAt: number;
  readonly summary: ReportSummary;
  readonly performance: StreamPerformanceAnalysis;
  readonly memory: MemoryAnalysis;
  readonly throughput: ThroughputAnalysis;
  readonly errors: ErrorAnalysis;
  readonly recommendations: string[];
}

export interface ReportSummary {
  readonly status: 'healthy' | 'warning' | 'critical';
  readonly score: number;
  readonly issues: number;
  readonly warnings: number;
}

// ============================================================================
// STREAM IMPORTER/EXPORTER TYPES
// ============================================================================

export interface StreamImporter {
  importConfig(config: string): StreamConfig;
  importData(data: string): StreamData;
  importMetrics(metrics: string): StreamMetrics;
  importAuditLog(auditLog: string): StreamAuditEntry[];
}

export interface StreamExporter {
  exportConfig(config: StreamConfig): string;
  exportData(data: StreamData): string;
  exportMetrics(metrics: StreamMetrics): string;
  exportAuditLog(auditLog: StreamAuditEntry[]): string;
}

// ============================================================================
// STREAM SERIALIZER TYPES
// ============================================================================

export interface StreamSerializer {
  serialize(data: StreamData): Buffer;
  deserialize(buffer: Buffer): StreamData;
  serializeConfig(config: StreamConfig): string;
  deserializeConfig(config: string): StreamConfig;
}

// ============================================================================
// STREAM AUDITOR TYPES
// ============================================================================

export interface StreamAuditor {
  logOperation(operation: StreamOperationData): void;
  logAccess(userId: string, resource: string): void;
  logError(error: StreamError): void;
  logSecurity(event: string, details: SecurityEvent): void;
  getAuditLog(filter?: StreamFilter): StreamAuditEntry[];
}

export interface SecurityEvent {
  readonly type: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly description: string;
  readonly timestamp: number;
  readonly context: StreamContext;
  readonly details: Record<string, unknown>;
}

// ============================================================================
// STREAM MONITOR TYPES
// ============================================================================

export interface StreamMonitor {
  startMonitoring(stream: BaseStream): void;
  stopMonitoring(stream: BaseStream): void;
  getMetrics(): StreamMetrics;
  getPerformanceAnalysis(): StreamPerformanceAnalysis;
  getHealthStatus(): HealthStatus;
  getAlerts(): StreamAlert[];
}

export interface HealthStatus {
  readonly status: 'healthy' | 'degraded' | 'unhealthy';
  readonly score: number;
  readonly checks: HealthCheck[];
  readonly lastChecked: number;
}

export interface HealthCheck {
  readonly name: string;
  readonly status: 'pass' | 'fail' | 'warn';
  readonly message: string;
  readonly duration: number;
}

export interface StreamAlert {
  readonly id: string;
  readonly type: 'error' | 'warning' | 'info';
  readonly message: string;
  readonly timestamp: number;
  readonly streamId: string;
  readonly resolved: boolean;
  readonly resolvedAt?: number;
  readonly context?: StreamContext;
}

// ============================================================================
// STREAM DOCUMENTATION TYPES
// ============================================================================

export interface StreamDocumentation {
  readonly methods: MethodDocumentation[];
  readonly events: EventDocumentation[];
  readonly types: TypeDocumentation[];
}

export interface MethodDocumentation {
  readonly name: string;
  readonly description: string;
  readonly parameters: ParameterDocumentation[];
  readonly returns: ReturnDocumentation;
  readonly examples: string[];
}

export interface ParameterDocumentation {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: unknown;
}

export interface ReturnDocumentation {
  readonly type: string;
  readonly description: string;
  readonly properties?: PropertyDocumentation[];
}

export interface EventDocumentation {
  readonly name: string;
  readonly description: string;
  readonly parameters: ParameterDocumentation[];
  readonly examples: string[];
}

export interface TypeDocumentation {
  readonly name: string;
  readonly description: string;
  readonly properties: PropertyDocumentation[];
  readonly examples: string[];
}

export interface PropertyDocumentation {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: unknown;
}

// ============================================================================
// STREAM CONFIGURATION TYPES
// ============================================================================

export interface StreamConfiguration {
  readonly version: string;
  readonly environment: 'development' | 'staging' | 'production';
  readonly features: FeatureConfiguration;
  readonly monitoring: MonitoringConfiguration;
  readonly security: SecurityConfiguration;
  readonly performance: PerformanceConfiguration;
}

export interface FeatureConfiguration {
  readonly encryption: boolean;
  readonly compression: boolean;
  readonly monitoring: boolean;
  readonly auditing: boolean;
  readonly optimization: boolean;
}

export interface MonitoringConfiguration {
  readonly enabled: boolean;
  readonly channels: string[];
  readonly thresholds: ThresholdConfiguration;
  readonly cooldown: number;
}

export interface ThresholdConfiguration {
  readonly errorRate: number;
  readonly latency: number;
  readonly memoryUsage: number;
  readonly throughput: number;
}

export interface SecurityConfiguration {
  readonly encryption: EncryptionConfiguration;
  readonly authentication: AuthenticationConfiguration;
  readonly authorization: AuthorizationConfiguration;
  readonly auditing: AuditingConfiguration;
}

export interface EncryptionConfiguration {
  readonly algorithm: string;
  readonly keySize: number;
  readonly keyRotation: number;
}

export interface AuthenticationConfiguration {
  readonly enabled: boolean;
  readonly methods: string[];
  readonly timeout: number;
}

export interface AuthorizationConfiguration {
  readonly enabled: boolean;
  readonly policies: string[];
  readonly cache: boolean;
}

export interface AuditingConfiguration {
  readonly enabled: boolean;
  readonly retention: number;
  readonly encryption: boolean;
}

export interface PerformanceConfiguration {
  readonly optimization: boolean;
  readonly caching: boolean;
  readonly compression: boolean;
  readonly monitoring: boolean;
}

// ============================================================================
// BASE STREAM TYPES
// ============================================================================

export interface BaseStream {
  readonly id: string;
  readonly type: string;
  readonly config: StreamConfig;
  readonly metrics: StreamMetrics;
  readonly status: StreamStatus;
  readonly createdAt: number;
  readonly lastActivity: number;
}

export interface StreamStatus {
  readonly state: 'idle' | 'active' | 'paused' | 'ended' | 'error';
  readonly health: 'healthy' | 'degraded' | 'unhealthy';
  readonly lastError?: StreamError;
}

// ============================================================================
// SPECIFIC STREAM TYPES
// ============================================================================

export interface ReadableStream extends BaseStream {
  readonly readable: boolean;
  readonly destroyed: boolean;
  readonly readableHighWaterMark: number;
  readonly readableLength: number;
  readonly readableObjectMode: boolean;
}

export interface WritableStream extends BaseStream {
  readonly writable: boolean;
  readonly destroyed: boolean;
  readonly writableHighWaterMark: number;
  readonly writableLength: number;
  readonly writableObjectMode: boolean;
}

export interface TransformStream extends BaseStream {
  readonly readable: boolean;
  readonly writable: boolean;
  readonly destroyed: boolean;
  readonly readableHighWaterMark: number;
  readonly writableHighWaterMark: number;
}

export interface DuplexStream extends BaseStream {
  readonly readable: boolean;
  readonly writable: boolean;
  readonly destroyed: boolean;
  readonly readableHighWaterMark: number;
  readonly writableHighWaterMark: number;
}

export interface EncryptedStream extends BaseStream {
  readonly encryptionConfig: EncryptedStreamConfig;
  readonly keyId: string;
  readonly algorithm: string;
}

export interface CompressedStream extends BaseStream {
  readonly compressionConfig: CompressedStreamConfig;
  readonly algorithm: string;
  readonly level: number;
}

export interface MultiplexedStream extends BaseStream {
  readonly multiplexConfig: MultiplexedStreamConfig;
  readonly subStreams: BaseStream[];
  readonly maxStreams: number;
}

export interface SplitterStream extends BaseStream {
  readonly splitterConfig: StreamSplitterConfig;
  readonly splitCount: number;
  readonly splitPattern?: RegExp;
}

export interface MergerStream extends BaseStream {
  readonly mergerConfig: StreamMergerConfig;
  readonly inputStreams: BaseStream[];
  readonly strategy: string;
}

// ============================================================================
// NATIVE ADDON TYPES
// ============================================================================

export interface NativeStreamsAddon {
  // Core stream operations
  createReadableStream(config: StreamConfig): ReadableStream;
  createWritableStream(config: StreamConfig): WritableStream;
  createTransformStream(config: StreamConfig): TransformStream;
  createDuplexStream(config: StreamConfig): DuplexStream;
  
  // Enhanced stream operations
  createEncryptedStream(config: EncryptedStreamConfig): EncryptedStream;
  createCompressedStream(config: CompressedStreamConfig): CompressedStream;
  createMultiplexedStream(config: MultiplexedStreamConfig): MultiplexedStream;
  createSplitterStream(config: StreamSplitterConfig): SplitterStream;
  createMergerStream(config: StreamMergerConfig): MergerStream;
  
  // Performance operations
  optimizeStream(stream: BaseStream, config: StreamConfig): OptimizationResult;
  monitorStream(stream: BaseStream): StreamMetrics;
  analyzeStream(stream: BaseStream): StreamPerformanceAnalysis;
  
  // Flow control
  enableBackpressure(stream: BaseStream, config: StreamConfig): void;
  enableRateLimiting(stream: BaseStream, config: StreamConfig): void;
  enableCircuitBreaker(stream: BaseStream, config: StreamConfig): void;
  
  // Security operations
  enableEncryption(stream: BaseStream, config: EncryptedStreamConfig): void;
  enableAuthentication(stream: BaseStream, config: AuthenticationConfiguration): void;
  enableAuthorization(stream: BaseStream, config: AuthorizationConfiguration): void;
  
  // Monitoring operations
  startMonitoring(stream: BaseStream): void;
  stopMonitoring(stream: BaseStream): void;
  getMetrics(stream: BaseStream): StreamMetrics;
  getHealthCheck(stream: BaseStream): HealthStatus;
  
  // Utility operations
  validateStream(stream: BaseStream): ValidationResult;
  serializeStream(stream: BaseStream): Buffer;
  deserializeStream(buffer: Buffer): BaseStream;
}

// ============================================================================
// NESTJS DECORATOR TYPES
// ============================================================================

export interface NestJSDecorator {
  (target: unknown, propertyKey?: string | symbol, descriptor?: PropertyDescriptor): unknown;
}

export interface StreamsOperationMetadata {
  readonly operation: string;
  readonly config: StreamConfig;
  readonly options: StreamOperationOptions;
}

export interface StreamOperationOptions {
  readonly enableMonitoring?: boolean;
  readonly enableAuditing?: boolean;
  readonly enableEncryption?: boolean;
  readonly enableCompression?: boolean;
  readonly timeout?: number;
  readonly retries?: number;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type StreamFilter = {
  streamId: string;
  userId?: string;
  operation?: string;
  success?: boolean;
  startTime: string;
  endTime: string;
  limit?: number;
  offset?: number;
};

export type StreamCallback<T = unknown> = (error: Error | null, result?: T) => void;
export type StreamEventHandler<T = unknown> = (data: T) => void;
export type StreamValidatorFunction<T = unknown> = (data: T) => ValidationResult;
export type StreamTransformFunction<T = unknown, U = unknown> = (data: T) => U;
export type StreamFilterFunction<T = unknown> = (data: T) => boolean;
export type StreamMapperFunction<T = unknown, U = unknown> = (data: T) => U;
export type StreamReducerFunction<T = unknown, U = unknown> = (accumulator: U, current: T) => U;

// ============================================================================
// ADDITIONAL TYPE DEFINITIONS
// ============================================================================

export interface ParameterDocumentation {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: unknown;
}

export interface ReturnDocumentation {
  readonly type: string;
  readonly description: string;
  readonly properties?: PropertyDocumentation[];
}

export interface PropertyDocumentation {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly description: string;
  readonly defaultValue?: unknown;
}

export interface ThresholdConfiguration {
  readonly errorRate: number;
  readonly latency: number;
  readonly memoryUsage: number;
  readonly throughput: number;
}
