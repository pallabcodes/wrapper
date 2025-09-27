/**
 * Custom types for @nest-zod package
 * These types extend and improve upon Zod's types without conflicting with internal Zod types
 */

import { z } from 'zod';

// ============================================================================
// Enhanced Alert Types (fixes exactOptionalPropertyTypes issues)
// ============================================================================

export interface NestZodAlert {
  id: string;
  ruleId: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  status: 'active' | 'resolved' | 'acknowledged';
  data: any;
  channels: string[];
  tags?: string[]; // Optional with proper undefined handling
}

export interface NestZodAlertRule {
  id: string;
  name: string;
  condition: (data: any) => boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: string[];
  enabled: boolean;
  cooldown?: number; // Optional with proper undefined handling
  tags?: string[]; // Optional with proper undefined handling
}

// ============================================================================
// Enhanced Tracing Types (fixes exactOptionalPropertyTypes issues)
// ============================================================================

export interface NestZodValidationSpan {
  spanId: string;
  traceId: string;
  parentSpanId?: string; // Optional with proper undefined handling
  operationName: string;
  startTime: number;
  endTime?: number; // Optional with proper undefined handling
  tags: Record<string, string>;
  logs: Array<{
    timestamp: number;
    message: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    data?: any; // Optional with proper undefined handling
  }>;
  status: 'started' | 'finished' | 'error';
  error?: {
    message: string;
    stack?: string; // Optional with proper undefined handling
    type: string;
  };
}

export interface NestZodTraceContext {
  spanId: string;
  traceId: string;
  parentSpanId?: string; // Optional with proper undefined handling
  baggage: Record<string, string>;
}

// ============================================================================
// Enhanced Error Types (improves error handling)
// ============================================================================

export interface NestZodValidationError extends Error {
  name: 'NestZodValidationError';
  issues: z.ZodIssue[];
  path: (string | number)[];
  code: 'validation_error';
  context?: {
    schemaName?: string;
    fieldPath?: string;
    userMessage?: string;
  };
}

export interface NestZodErrorContext {
  schema: z.ZodSchema;
  data: unknown;
  path?: (string | number)[];
  userMessage?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Enhanced Performance Types (extends our custom types)
// ============================================================================

export interface NestZodPerformanceMetrics {
  validationTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  schemaComplexity: number;
  validationCount: number;
  errorRate: number;
  averageValidationTime: number;
  totalValidations: number;
  cpuUsage?: number; // Optional with proper undefined handling
}

// ============================================================================
// Enhanced Cache Types (improves caching)
// ============================================================================

export interface NestZodCacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  metadata?: {
    schemaName?: string;
    complexity?: number;
    dependencies?: string[];
  };
}

export interface NestZodCacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
  evictions: number;
  memoryUsage: number;
}

// ============================================================================
// Enhanced Schema Types (extends Zod without conflicts)
// ============================================================================

export interface NestZodSchemaMetadata {
  name: string;
  version: string;
  description?: string;
  complexity: number;
  dependencies: string[];
  usageCount: number;
  lastUsed?: Date;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface NestZodSchemaDefinition<T extends z.ZodSchema = z.ZodSchema> {
  name: string;
  schema: T;
  version: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  usageCount: number;
  lastUsed?: Date;
}

// ============================================================================
// Enhanced Validation Types (improves validation pipeline)
// ============================================================================

export interface NestZodValidationResult<T = any> {
  success: boolean;
  data?: T;
  error?: NestZodValidationError;
  metadata?: {
    validationTime: number;
    cacheHit: boolean;
    schemaName?: string;
  };
}

export interface NestZodValidationOptions {
  strict?: boolean;
  abortEarly?: boolean;
  errorMap?: z.ZodErrorMap;
  cache?: boolean;
  cacheTtl?: number;
  context?: Record<string, any>;
}

// ============================================================================
// Enhanced Pipeline Types (improves validation pipeline)
// ============================================================================

export interface NestZodPipelineStep {
  name: string;
  execute: (data: any, context: any) => Promise<any>;
  condition?: (data: any, context: any) => boolean;
  priority?: number;
}

export interface NestZodPipelineResult {
  success: boolean;
  data?: any;
  errors: Array<{
    step: string;
    error: Error;
    message: string;
  }>;
  metadata: {
    executionTime: number;
    stepsExecuted: string[];
    cacheHits: number;
  };
}

// ============================================================================
// Enhanced Discovery Types (improves schema discovery)
// ============================================================================

export interface NestZodDiscoveredSchema {
  name: string;
  schema: z.ZodSchema;
  filePath: string;
  lineNumber: number;
  metadata: NestZodSchemaMetadata;
}

export interface NestZodSchemaUsage {
  schemaName: string;
  usedIn: {
    decorators: string[];
    controllers: string[];
    services: string[];
  };
  usageCount: number;
  lastUsed: Date;
}

// ============================================================================
// Enhanced Testing Types (improves testing utilities)
// ============================================================================

export interface NestZodTestCase<T = any> {
  name: string;
  data: T;
  expected: 'valid' | 'invalid';
  expectedErrors?: string[];
  description?: string;
}

export interface NestZodTestSuite<T = any> {
  schema: z.ZodSchema<T>;
  name: string;
  description: string;
  testCases: NestZodTestCase<T>[];
  setup?: () => void | Promise<void>;
  teardown?: () => void | Promise<void>;
}

export interface NestZodTestResult {
  testName: string;
  passed: boolean;
  error?: string;
  duration: number;
}

// ============================================================================
// Type Guards (safe type checking)
// ============================================================================

export function isNestZodValidationError(error: unknown): error is NestZodValidationError {
  return (
    error instanceof Error &&
    error.name === 'NestZodValidationError' &&
    'issues' in error &&
    'path' in error &&
    'code' in error
  );
}

export function isNestZodAlert(obj: any): obj is NestZodAlert {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.ruleId === 'string' &&
    typeof obj.message === 'string' &&
    ['low', 'medium', 'high', 'critical'].includes(obj.severity) &&
    obj.timestamp instanceof Date &&
    ['active', 'resolved', 'acknowledged'].includes(obj.status) &&
    Array.isArray(obj.channels)
  );
}

export function isNestZodValidationSpan(obj: any): obj is NestZodValidationSpan {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.spanId === 'string' &&
    typeof obj.traceId === 'string' &&
    typeof obj.operationName === 'string' &&
    typeof obj.startTime === 'number' &&
    typeof obj.tags === 'object' &&
    Array.isArray(obj.logs) &&
    ['started', 'finished', 'error'].includes(obj.status)
  );
}

// ============================================================================
// Utility Types (helper types for better DX)
// ============================================================================

export type NestZodSchemaType<T> = T extends z.ZodSchema<infer U> ? U : never;

export type NestZodOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type NestZodRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type NestZodPartial<T> = {
  [P in keyof T]?: T[P] | undefined;
};

// ============================================================================
// Configuration Types (improves configuration handling)
// ============================================================================

export interface NestZodConfig {
  validation: {
    strict: boolean;
    abortEarly: boolean;
    cache: boolean;
    cacheTtl: number;
  };
  performance: {
    monitoring: boolean;
    metrics: boolean;
    optimization: boolean;
  };
  discovery: {
    autoDiscover: boolean;
    watchFiles: boolean;
    generateTypes: boolean;
  };
  testing: {
    generateTests: boolean;
    runBenchmarks: boolean;
    coverage: boolean;
  };
}

// ============================================================================
// Enhanced Parallel Validation Types (fixes exactOptionalPropertyTypes issues)
// ============================================================================

export interface NestZodValidationResult<T = any> {
  index: number;
  success: boolean;
  data?: T | undefined;
  error?: NestZodValidationError | undefined;
}

export interface NestZodBatchValidationOptions {
  concurrency?: number;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTtl?: number;
}

// ============================================================================
// Enhanced Performance Monitoring Types
// ============================================================================

export interface NestZodPerformanceConfig {
  enableMonitoring: boolean;
  enableMetrics: boolean;
  enableOptimization: boolean;
  sampleRate: number;
  maxMetrics: number;
  cleanupInterval: number;
}

export interface NestZodMetricsConfig {
  enableMetrics: boolean;
  enableDashboard: boolean;
  enableWebSocket: boolean;
  updateInterval: number;
  maxDataPoints: number;
}

// ============================================================================
// Enhanced Dashboard Types
// ============================================================================

export interface NestZodDashboardConfig {
  enableWebSocket: boolean;
  updateInterval: number;
  maxDataPoints: number;
  enableRealTime: boolean;
  refreshRate: number;
}

export interface NestZodWebSocketConfig {
  namespace: string;
  cors: boolean | object;
  transports: string[];
}

// ============================================================================
// Type Guards for Better Type Safety
// ============================================================================

export function isNestZodValidationResult<T>(obj: any): obj is NestZodValidationResult<T> {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.index === 'number' &&
    typeof obj.success === 'boolean' &&
    (obj.data === undefined || true) &&
    (obj.error === undefined || obj.error instanceof Error)
  );
}

export function isNestZodPerformanceConfig(obj: any): obj is NestZodPerformanceConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.enableMonitoring === 'boolean' &&
    typeof obj.enableMetrics === 'boolean' &&
    typeof obj.enableOptimization === 'boolean' &&
    typeof obj.sampleRate === 'number' &&
    typeof obj.maxMetrics === 'number' &&
    typeof obj.cleanupInterval === 'number'
  );
}

// ============================================================================
// Utility Types for Better DX
// ============================================================================

// These types are already defined above, removing duplicates

export type NestZodNonNullable<T> = {
  [P in keyof T]-?: NonNullable<T[P]>;
};

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export Zod types for convenience
  z,
  ZodSchema,
  ZodType,
  ZodError,
  ZodIssue,
} from 'zod';
