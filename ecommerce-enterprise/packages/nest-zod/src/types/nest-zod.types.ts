/**
 * Custom types for @nest-zod package
 * These types extend and improve upon Zod's types without conflicting with internal Zod types
 */

import { z } from 'zod';

// ============================================================================
// Enhanced Alert Types (fixes exactOptionalPropertyTypes issues)
// ============================================================================

export interface NestZodAlert<TData = Record<string, unknown>> {
	id: string;
	ruleId: string;
	message: string;
	severity: 'low' | 'medium' | 'high' | 'critical';
	timestamp: Date;
	status: 'active' | 'resolved' | 'acknowledged';
	data: TData;
	channels: string[];
	tags?: string[]; // Optional with proper undefined handling
}

export interface NestZodAlertRule<TInput = Record<string, unknown>> {
	id: string;
	name: string;
	condition: (data: TInput) => boolean;
	severity: 'low' | 'medium' | 'high' | 'critical';
	channels: string[];
	enabled: boolean;
	cooldown?: number; // Optional with proper undefined handling
	tags?: string[]; // Optional with proper undefined handling
}

// ============================================================================
// Enhanced Tracing Types (fixes exactOptionalPropertyTypes issues)
// ============================================================================

export interface NestZodValidationSpan<TLogData = Record<string, unknown>> {
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
		data?: TLogData; // Optional with proper undefined handling
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

export interface NestZodErrorContext<T = Record<string, unknown>> {
	schema: z.ZodSchema;
	data: T;
	path?: (string | number)[];
	userMessage?: string;
	metadata?: Record<string, unknown>;
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

export interface NestZodCacheEntry<T = Record<string, unknown>> {
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
	metadata?: Record<string, unknown>;
	createdAt: Date;
	updatedAt: Date;
	isActive: boolean;
	usageCount: number;
	lastUsed?: Date;
}

// ============================================================================
// Enhanced Validation Types (improves validation pipeline)
// ============================================================================

export interface NestZodValidationResult<T = unknown> {
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
	context?: Record<string, unknown>;
}

// ============================================================================
// Enhanced Pipeline Types (improves validation pipeline)
// ============================================================================

export interface NestZodPipelineStep<TInput = Record<string, unknown>, TContext = Record<string, unknown>, TOutput = unknown> {
	name: string;
	execute: (data: TInput, context: TContext) => Promise<TOutput>;
	condition?: (data: TInput, context: TContext) => boolean;
	priority?: number;
}

export interface NestZodPipelineResult<T = Record<string, unknown>> {
	success: boolean;
	data?: T;
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

export interface NestZodTestCase<T = Record<string, unknown>> {
	name: string;
	data: T;
	expected: 'valid' | 'invalid';
	expectedErrors?: string[];
	description?: string;
}

export interface NestZodTestSuite<T = Record<string, unknown>> {
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

export function isNestZodAlert(obj: unknown): obj is NestZodAlert {
	// Narrow unknown object via runtime checks
	const o = obj as Record<string, unknown>;
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof o["id"] === 'string' &&
		typeof o["ruleId"] === 'string' &&
		typeof o["message"] === 'string' &&
		['low', 'medium', 'high', 'critical'].includes(o["severity"] as string) &&
		o["timestamp"] instanceof Date &&
		['active', 'resolved', 'acknowledged'].includes(o["status"] as string) &&
		Array.isArray(o["channels"]) 
	);
}

export function isNestZodValidationSpan(obj: unknown): obj is NestZodValidationSpan {
	// Narrow unknown object via runtime checks
	const o = obj as Record<string, unknown>;
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof o["spanId"] === 'string' &&
		typeof o["traceId"] === 'string' &&
		typeof o["operationName"] === 'string' &&
		typeof o["startTime"] === 'number' &&
		typeof o["tags"] === 'object' &&
		Array.isArray(o["logs"]) &&
		['started', 'finished', 'error'].includes(o["status"] as string)
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

export interface NestZodValidationResult<T = unknown> {
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

export function isNestZodValidationResult<T>(obj: unknown): obj is NestZodValidationResult<T> {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof (obj as Record<string, unknown>)["index"] === 'number' &&
		typeof (obj as Record<string, unknown>)["success"] === 'boolean'
	);
}

export function isNestZodPerformanceConfig(obj: unknown): obj is NestZodPerformanceConfig {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		typeof (obj as Record<string, unknown>)["enableMonitoring"] === 'boolean' &&
		typeof (obj as Record<string, unknown>)["enableMetrics"] === 'boolean' &&
		typeof (obj as Record<string, unknown>)["enableOptimization"] === 'boolean' &&
		typeof (obj as Record<string, unknown>)["sampleRate"] === 'number' &&
		typeof (obj as Record<string, unknown>)["maxMetrics"] === 'number' &&
		typeof (obj as Record<string, unknown>)["cleanupInterval"] === 'number'
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
