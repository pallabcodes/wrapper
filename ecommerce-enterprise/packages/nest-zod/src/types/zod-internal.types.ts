/**
 * Internal Zod Type Definitions for @nest-zod
 * 
 * These types provide safe access to Zod's internal structures without
 * using `any` assertions. They are designed to work with Zod's actual
 * internal architecture while maintaining type safety.
 */

import type { z } from 'zod';

// ============================================================================
// Zod Internal Type Definitions
// ============================================================================

/**
 * Safe access to Zod's internal definition structure
 * Based on Zod's actual internal types from v4
 */
export interface ZodInternalDef {
  type: string;
  error?: z.ZodErrorMap | undefined;
  checks?: Array<{
    kind: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

/**
 * Safe access to Zod's internal schema structure
 */
export interface ZodInternalSchema {
  _def: ZodInternalDef;
  _cached?: unknown;
  _getCached?: () => unknown;
  shape?: Record<string, z.ZodSchema>;
  strict?: boolean;
  [key: string]: unknown;
}

/**
 * Type guard to check if a schema has internal structure
 */
export function hasInternalStructure(schema: unknown): schema is ZodInternalSchema {
  return Boolean(schema && typeof schema === 'object' && '_def' in schema);
}

/**
 * Safe access to Zod error issue properties
 */
export interface ZodIssueInternal {
  code: z.ZodIssueCode;
  path: (string | number)[];
  message: string;
  expected?: string | number | string[] | number[];
  received?: string | number | string[] | number[];
  validation?: string;
  options?: string[];
  minimum?: number;
  maximum?: number;
  type?: string;
  context?: Record<string, unknown>;
  data?: unknown;
}

/**
 * Type guard for Zod error issues
 */
export function isZodIssueInternal(issue: unknown): issue is ZodIssueInternal {
  return Boolean(issue && typeof issue === 'object' && 'code' in issue && 'path' in issue);
}

// ============================================================================
// Schema Composition Types
// ============================================================================

/**
 * Safe schema transformation result
 */
export type SafeSchemaTransform<T extends z.ZodSchema> = T extends z.ZodEffects<infer U, unknown, unknown>
  ? U
  : T;

/**
 * Safe schema composition options
 */
export interface SafeCompositionOptions {
  name?: string;
  description?: string;
  errorMap?: z.ZodErrorMap;
  [key: string]: unknown;
}

/**
 * Safe schema pick/omit keys
 */
export type SafeSchemaKeys<T extends z.ZodSchema> = T extends z.ZodObject<infer Shape>
  ? keyof Shape
  : never;

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Safe error context extraction
 */
export interface SafeErrorContext {
  expected?: string | undefined;
  received?: string | undefined;
  validation?: string | undefined;
  options?: string[] | undefined;
  minimum?: number | undefined;
  maximum?: number | undefined;
  type?: string | undefined;
  context?: Record<string, unknown> | undefined;
}

/**
 * Safe error message generation
 */
export interface SafeErrorMessage {
  message: string;
  suggestion?: string;
  context: SafeErrorContext;
}

// ============================================================================
// Validation Pipeline Types
// ============================================================================

/**
 * Safe validation context
 */
export interface SafeValidationContext {
  requestId?: string;
  userId?: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Safe validation result
 */
export interface SafeValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: SafeErrorMessage;
  context?: SafeValidationContext;
}

// ============================================================================
// Schema Registry Types
// ============================================================================

/**
 * Safe schema metadata
 */
export interface SafeSchemaMetadata {
  name: string;
  version: string;
  description?: string;
  tags: string[];
  type: string;
  complexity: number;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
  usageCount: number;
  isActive: boolean;
}

/**
 * Safe schema definition
 */
export interface SafeSchemaDefinition<T extends z.ZodSchema = z.ZodSchema> {
  name: string;
  schema: T;
  metadata: SafeSchemaMetadata;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Safe property access helper
 */
export type SafePropertyAccess<T, K extends string> = T extends Record<string, unknown>
  ? (K extends keyof T ? T[K] : never)
  : never;

/**
 * Safe object key iteration
 */
export type SafeObjectKeys<T> = T extends Record<string, unknown>
  ? Array<keyof T>
  : never;

/**
 * Safe schema inference
 */
export type SafeSchemaInfer<T> = T extends z.ZodSchema<infer U>
  ? U
  : unknown;

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if value is a Zod schema
 */
export function isZodSchema(value: unknown): value is z.ZodSchema {
  return Boolean(value && typeof value === 'object' && '_def' in value && 'parse' in value);
}

/**
 * Check if value is a Zod object schema
 */
export function isZodObjectSchema(value: unknown): value is z.ZodObject<z.ZodRawShape> {
  return isZodSchema(value) && hasInternalStructure(value) && value._def.type === 'object';
}

/**
 * Check if value is a Zod array schema
 */
export function isZodArraySchema(value: unknown): value is z.ZodArray<z.ZodTypeAny> {
  return isZodSchema(value) && hasInternalStructure(value) && value._def.type === 'array';
}

/**
 * Check if value is a Zod union schema
 */
export function isZodUnionSchema(value: unknown): value is z.ZodUnion<z.ZodUnionOptions> {
  return isZodSchema(value) && hasInternalStructure(value) && value._def.type === 'union';
}

/**
 * Check if value is a Zod effects schema
 */
export function isZodEffectsSchema(value: unknown): value is z.ZodEffects<z.ZodTypeAny, unknown, unknown> {
  return isZodSchema(value) && hasInternalStructure(value) && value._def.type === 'transform';
}

// ============================================================================
// Safe Access Helpers
// ============================================================================

/**
 * Safely access Zod schema definition
 */
export function getSafeSchemaDef(schema: z.ZodSchema): ZodInternalDef {
  if (!hasInternalStructure(schema)) {
    throw new Error('Invalid Zod schema: missing internal structure');
  }
  return schema._def;
}

/**
 * Safely access Zod schema type
 */
export function getSafeSchemaType(schema: z.ZodSchema): string {
  const def = getSafeSchemaDef(schema);
  return def.type || 'unknown';
}

/**
 * Safely access Zod schema shape
 */
export function getSafeSchemaShape(schema: z.ZodSchema): Record<string, z.ZodSchema> | undefined {
  if (isZodObjectSchema(schema)) {
    return schema.shape;
  }
  return undefined;
}

/**
 * Safely extract error context from Zod issue
 */
export function getSafeErrorContext(issue: z.ZodIssue): SafeErrorContext {
  if (!isZodIssueInternal(issue)) {
    return {};
  }

  return {
    expected: issue.expected as string | undefined,
    received: issue.received as string | undefined,
    validation: issue.validation,
    options: issue.options,
    minimum: issue.minimum,
    maximum: issue.maximum,
    type: issue.type,
    context: issue.context,
  };
}

/**
 * Safely create error message
 */
export function createSafeErrorMessage(issue: z.ZodIssue): SafeErrorMessage {
  const context = getSafeErrorContext(issue);
  
  return {
    message: issue.message,
    suggestion: generateSuggestion(issue, context),
    context,
  };
}

/**
 * Generate suggestion based on error context
 */
function generateSuggestion(issue: z.ZodIssue, context: SafeErrorContext): string {
  switch (issue.code) {
    case 'invalid_type':
      return `Expected ${context.expected}, received ${context.received}`;
    case 'too_small':
      return context.type === 'string' 
        ? `String must be at least ${context.minimum} characters`
        : `Value must be at least ${context.minimum}`;
    case 'too_big':
      return context.type === 'string'
        ? `String must be at most ${context.maximum} characters`
        : `Value must be at most ${context.maximum}`;
    case 'invalid_enum_value':
      return `Use one of: ${context.options?.join(', ') || 'allowed values'}`;
    case 'invalid_string':
      return `Invalid ${context.validation || 'string format'}`;
    default:
      return 'Please check the input and try again';
  }
}
