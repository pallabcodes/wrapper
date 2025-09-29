/**
 * Nest-Zod Custom Types
 * 
 * This module provides proper type definitions that integrate with Zod's native architecture
 * instead of using generic `unknown` or `object` types. These types work seamlessly with
 * Zod's internal type system and provide better type safety.
 */

import { z } from 'zod';

// ============================================================================
// Zod Native Type Extensions
// ============================================================================

/**
 * Extended Zod schema type that includes NestJS-specific metadata
 */
export interface NestZodSchema<T = unknown> extends z.ZodSchema<T> {
  _nest?: {
    name?: string;
    description?: string;
    version?: string;
    metadata?: Record<string, unknown>;
  };
}

/**
 * Zod object shape type that's compatible with NestJS validation
 */
export type ZodObjectShape = Record<string, z.ZodSchema>;

/**
 * Zod object schema with proper typing for NestJS
 */
export type NestZodObject<T extends ZodObjectShape = ZodObjectShape> = z.ZodObject<T>;

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * HTTP Request type compatible with NestJS and Zod validation
 */
export interface NestZodRequest {
  body?: Record<string, unknown>;
  query?: Record<string, string | string[] | unknown>;
  params?: Record<string, string | unknown>;
  headers?: Record<string, string | string[] | unknown>;
  url?: string;
  method?: string;
  ip?: string;
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
    [key: string]: unknown;
  };
}

/**
 * HTTP Response type for validation metadata
 */
export interface NestZodResponse {
  setHeader: (key: string, value: string) => void;
  getHeader: (key: string) => string | string[] | undefined;
  status?: (code: number) => void;
}

// ============================================================================
// Validation Context Types
// ============================================================================

/**
 * Validation context that carries request metadata
 */
export interface NestZodValidationContext {
  request: NestZodRequest;
  response: NestZodResponse;
  user?: {
    id?: string;
    email?: string;
    roles?: string[];
    [key: string]: unknown;
  };
  tenant?: string;
  locale?: string;
  timezone?: string;
  requestId?: string;
}

// ============================================================================
// Validation Result Types
// ============================================================================

/**
 * Validation error with proper typing
 */
export interface NestZodValidationError {
  field: string;
  message: string;
  code: string;
  received?: unknown;
  expected?: unknown;
  path: (string | number)[];
  context?: Record<string, unknown> | undefined;
}

/**
 * Validation result with proper typing
 */
export interface NestZodValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  errors?: NestZodValidationError[] | z.ZodError;
  metadata?: {
    validationTime?: number;
    cacheHit?: boolean;
    schemaVersion?: string;
    timestamp?: string;
  };
}

// ============================================================================
// Schema Composition Types
// ============================================================================

/**
 * Schema composition options
 */
export interface NestZodCompositionOptions {
  name?: string;
  description?: string;
  version?: string;
  errorMap?: z.ZodErrorMap;
  audit?: boolean;
  cache?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Schema transformation function type
 */
export type NestZodTransformFn<TInput, TOutput> = (input: TInput) => TOutput;

/**
 * Schema validation function type
 */
export type NestZodValidationFn<T> = (data: T) => boolean;

/**
 * Schema field dependency type
 */
export type NestZodFieldDependency<T> = (data: T) => z.ZodSchema;

// ============================================================================
// Decorator Types
// ============================================================================

/**
 * Validation decorator options
 */
export interface NestZodValidationOptions {
  schema: NestZodSchema;
  errorFormat?: 'user' | 'api' | 'detailed';
  includePath?: boolean;
  includeContext?: boolean;
  maxIssues?: number;
  enableRecovery?: boolean;
  transformData?: boolean;
  customErrorMap?: z.ZodErrorMap;
  audit?: boolean;
  cache?: boolean;
  skipMissingProperties?: boolean;
  whitelistProperties?: boolean;
  customErrorFactory?: (error: z.ZodError) => Error;
}

/**
 * Schema decorator options
 */
export interface NestZodSchemaOptions {
  name?: string;
  description?: string;
  version?: string;
  errorMap?: z.ZodErrorMap;
  audit?: boolean;
  cache?: boolean;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Validation service interface
 */
export interface NestZodValidationService {
  validate<T>(
    data: unknown,
    options: NestZodValidationOptions,
    context?: NestZodValidationContext
  ): Promise<NestZodValidationResult<T>>;
  
  validateSync<T>(
    data: unknown,
    options: NestZodValidationOptions,
    context?: NestZodValidationContext
  ): NestZodValidationResult<T>;
}

/**
 * Schema registry interface
 */
export interface NestZodSchemaRegistry {
  register<T>(name: string, schema: NestZodSchema<T>): void;
  get<T>(name: string): NestZodSchema<T> | undefined;
  unregister(name: string): boolean;
  list(): string[];
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract keys from a Zod object schema
 */
export type NestZodObjectKeys<T extends NestZodObject> = keyof z.infer<T>;

/**
 * Pick properties from a Zod object schema
 */
export type NestZodPick<T extends NestZodObject, K extends NestZodObjectKeys<T>> = 
  z.ZodObject<Pick<z.infer<T>, K>>;

/**
 * Omit properties from a Zod object schema
 */
export type NestZodOmit<T extends NestZodObject, K extends NestZodObjectKeys<T>> = 
  z.ZodObject<Omit<z.infer<T>, K>>;

/**
 * Make all properties optional in a Zod object schema
 */
export type NestZodPartial<T extends NestZodObject> = 
  z.ZodObject<Partial<z.infer<T>>>;

/**
 * Make all properties required in a Zod object schema
 */
export type NestZodRequired<T extends NestZodObject> = 
  z.ZodObject<Required<z.infer<T>>>;

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Error recovery options
 */
export interface NestZodErrorRecoveryOptions {
  enabled?: boolean;
  fallbackData?: Record<string, unknown>;
  onRecovery?: (recoveredData: Record<string, unknown>) => void;
  maxRecoveryAttempts?: number;
}

/**
 * Error analysis result
 */
export interface NestZodErrorAnalysis {
  summary: {
    totalIssues: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    issueTypes: string[];
  };
  suggestions: string[];
  issues: NestZodValidationError[];
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a value is a NestZodSchema
 */
export function isNestZodSchema(value: unknown): value is NestZodSchema {
  return value instanceof z.ZodSchema;
}

/**
 * Type guard to check if a value is a NestZodObject
 */
export function isNestZodObject(value: unknown): value is NestZodObject {
  return value instanceof z.ZodObject;
}

/**
 * Type guard to check if a value is a valid request object
 */
export function isNestZodRequest(value: unknown): value is NestZodRequest {
  return typeof value === 'object' && value !== null && 'body' in value;
}

/**
 * Type guard to check if a value is a valid response object
 */
export function isNestZodResponse(value: unknown): value is NestZodResponse {
  return typeof value === 'object' && value !== null && 'setHeader' in value;
}

// ============================================================================
// Schema Factory Types
// ============================================================================

/**
 * Schema factory function type
 */
export type NestZodSchemaFactory<T> = (options?: NestZodCompositionOptions) => NestZodSchema<T>;

/**
 * Dynamic schema factory that can create schemas based on context
 */
export type NestZodDynamicSchemaFactory<T> = (
  context: NestZodValidationContext,
  options?: NestZodCompositionOptions
) => NestZodSchema<T>;

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export commonly used Zod types with NestJS naming
  ZodSchema as ZodType,
  ZodObject,
  ZodError,
  ZodErrorMap,
  ZodIssue,
  ZodRawIssue,
} from 'zod';
