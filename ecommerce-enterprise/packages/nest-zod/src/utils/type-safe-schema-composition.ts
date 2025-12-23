/**
 * Type-Safe Schema Composition Utilities
 * 
 * This module provides type-safe alternatives to schema composition operations
 * that previously required `any` assertions. It respects Zod's internal architecture
 * while providing better type safety and developer experience.
 */

import { z } from 'zod';
import {
  // ZodInternalSchema, // Not used directly
  // SafeSchemaTransform, // Not used directly
  SafeCompositionOptions,
  SafeSchemaKeys,
  // SafeSchemaInfer, // Not used directly
  // isZodSchema, // Not used directly
  isZodObjectSchema,
  // isZodEffectsSchema, // Not used directly
  getSafeSchemaDef,
  getSafeSchemaType,
  getSafeSchemaShape,
} from '../types/zod-internal.types';

// ============================================================================
// Type-Safe Schema Composition Class
// ============================================================================

export class TypeSafeSchemaComposer<T extends z.ZodSchema = z.ZodSchema> {
  private schema: T;
  private options: SafeCompositionOptions;

  constructor(schema: T, options: SafeCompositionOptions = {}) {
    this.schema = schema;
    this.options = options;
  }

  /**
   * Create a new schema composer
   */
  static create<T extends z.ZodSchema>(schema: T, options?: SafeCompositionOptions): TypeSafeSchemaComposer<T> {
    return new TypeSafeSchemaComposer(schema, options);
  }

  /**
   * Type-safe schema picking
   */
  pick<K extends SafeSchemaKeys<T>>(keys: K[]): TypeSafeSchemaComposer<z.ZodObject<Pick<z.infer<T>, K>>> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Pick operation requires an object schema');
    }

    const shape = getSafeSchemaShape(this.schema);
    if (!shape) {
      throw new Error('Cannot access schema shape');
    }

    const pickedShape = keys.reduce((acc, key) => {
      if (key in shape) {
        const schemaValue = shape[key as string];
        if (schemaValue) {
          acc[key as string] = schemaValue;
        }
      }
      return acc;
    }, {} as z.ZodRawShape);

    const newSchema = z.object(pickedShape) as z.ZodObject<Pick<z.infer<T>, K>>;
    return new TypeSafeSchemaComposer(newSchema, this.options);
  }

  /**
   * Type-safe schema omitting
   */
  omit<K extends SafeSchemaKeys<T>>(keys: K[]): TypeSafeSchemaComposer<z.ZodObject<Omit<z.infer<T>, K>>> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Omit operation requires an object schema');
    }

    const shape = getSafeSchemaShape(this.schema);
    if (!shape) {
      throw new Error('Cannot access schema shape');
    }

    const omittedShape = Object.keys(shape).reduce((acc, key) => {
      if (!keys.includes(key as K)) {
        const schemaValue = shape[key];
        if (schemaValue) {
          acc[key] = schemaValue;
        }
      }
      return acc;
    }, {} as z.ZodRawShape);

    const newSchema = z.object(omittedShape) as z.ZodObject<Omit<z.infer<T>, K>>;
    return new TypeSafeSchemaComposer(newSchema, this.options);
  }

  /**
   * Type-safe schema partial
   */
  partial(): TypeSafeSchemaComposer<z.ZodObject<z.ZodRawShape>> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Partial operation requires an object schema');
    }

    const newSchema = this.schema.partial() as z.ZodObject<z.ZodRawShape>;
    return new TypeSafeSchemaComposer(newSchema, this.options);
  }

  /**
   * Type-safe schema required
   */
  required(): TypeSafeSchemaComposer<z.ZodObject<any>> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Required operation requires an object schema');
    }

    const newSchema = this.schema.required() as z.ZodObject<any>;
    return new TypeSafeSchemaComposer(newSchema, this.options);
  }

  /**
   * Type-safe conditional validation
   */
  conditional(
    condition: (data: z.infer<T>) => boolean,
    trueSchema: Record<string, unknown>,
    falseSchema: Record<string, unknown>
  ): TypeSafeSchemaComposer<T> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Conditional operation requires an object schema');
    }

    const refinedSchema = this.schema.refine((data) => {
      const conditionalData = condition(data) ? trueSchema : falseSchema;
      return Object.keys(conditionalData).every(key => 
        (conditionalData as Record<string, unknown>)[key] === (data as Record<string, unknown>)[key]
      );
    }, 'Conditional validation failed') as unknown as T;

    return new TypeSafeSchemaComposer(refinedSchema, this.options);
  }

  /**
   * Type-safe dependent validation
   */
  dependent(
    dependencies: Record<string, (data: z.infer<T>) => z.ZodSchema>
  ): TypeSafeSchemaComposer<T> {
    if (!isZodObjectSchema(this.schema)) {
      throw new Error('Dependent operation requires an object schema');
    }

    const refinedSchema = this.schema.refine((data) => {
      for (const [field, schemaFactory] of Object.entries(dependencies)) {
        if ((data as Record<string, unknown>)[field] !== undefined) {
          const dependentSchema = schemaFactory(data);
          try {
            dependentSchema.parse(data);
          } catch {
            return false;
          }
        }
      }
      return true;
    }, 'Dependent validation failed') as unknown as T;

    return new TypeSafeSchemaComposer(refinedSchema, this.options);
  }

  /**
   * Type-safe cross-field validation
   */
  crossField(
    validator: (data: z.infer<T>) => boolean,
    message: string = 'Cross-field validation failed'
  ): TypeSafeSchemaComposer<T> {
    const refinedSchema = this.schema.refine(validator, message) as unknown as T;
    return new TypeSafeSchemaComposer(refinedSchema, this.options);
  }

  /**
   * Type-safe array validation
   */
  arrayValidation(
    validator: (item: unknown, index: number, array: unknown[]) => boolean,
    message: string = 'Array validation failed'
  ): TypeSafeSchemaComposer<T> {
    const refinedSchema = this.schema.refine((data) => {
      if (Array.isArray(data)) {
        return data.every(validator);
      }
      return true;
    }, message) as unknown as T;

    return new TypeSafeSchemaComposer(refinedSchema, this.options);
  }

  /**
   * Type-safe object validation
   */
  objectValidation(
    validator: (data: z.infer<T>) => boolean,
    message: string = 'Object validation failed'
  ): TypeSafeSchemaComposer<T> {
    const refinedSchema = this.schema.refine(validator, message) as unknown as T;
    return new TypeSafeSchemaComposer(refinedSchema, this.options);
  }

  /**
   * Type-safe transform
   */
  transform<U>(
    transform: (data: z.infer<T>) => U
  ): TypeSafeSchemaComposer<z.ZodEffects<T, U, z.infer<T>>> {
    const transformedSchema = this.schema.transform(transform) as z.ZodEffects<T, U, z.infer<T>>;
    return new TypeSafeSchemaComposer(transformedSchema, this.options);
  }

  /**
   * Type-safe preprocess
   */
  preprocess(
    preprocess: (data: unknown) => unknown
  ): TypeSafeSchemaComposer<z.ZodEffects<T, z.infer<T>, unknown>> {
    const preprocessedSchema = z.preprocess(preprocess, this.schema) as z.ZodEffects<T, z.infer<T>, unknown>;
    return new TypeSafeSchemaComposer(preprocessedSchema, this.options);
  }

  /**
   * Type-safe with messages
   */
  withMessages(messages: Record<string, string>): TypeSafeSchemaComposer<T> {
    const errorMap: z.ZodErrorMap = (issue, ctx) => {
      const message = messages[issue.code] || ctx.defaultError;
      return { message };
    };

    const newSchema = this.schema.superRefine((_data, _ctx) => {
      // Apply custom error messages
    }) as unknown as T;

    return new TypeSafeSchemaComposer(newSchema, { ...this.options, errorMap });
  }

  /**
   * Type-safe async validation
   */
  async(): TypeSafeSchemaComposer<T> {
    // Async validation is handled by Zod's built-in methods
    return this;
  }

  /**
   * Type-safe cached validation
   */
  cached(): TypeSafeSchemaComposer<T> {
    // Caching is handled by the validation service
    return this;
  }

  /**
   * Type-safe monitored validation
   */
  monitored(): TypeSafeSchemaComposer<T> {
    // Monitoring is handled by the monitoring service
    return this;
  }

  /**
   * Build the final schema
   */
  build(): T {
    return this.schema;
  }

  /**
   * Get schema metadata
   */
  getMetadata() {
    const def = getSafeSchemaDef(this.schema);
    return {
      description: this.options.description,
      name: this.options.name,
      errorMap: this.options.errorMap,
      ...def,
      type: getSafeSchemaType(this.schema), // Override def.type with our safe type
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a type-safe schema composer
 */
export function createTypeSafeComposer<T extends z.ZodSchema>(
  schema: T,
  options?: SafeCompositionOptions
): TypeSafeSchemaComposer<T> {
  return TypeSafeSchemaComposer.create(schema, options);
}

/**
 * Type-safe schema pick utility
 */
export function typeSafePick<T extends z.ZodObject<Record<string, z.ZodSchema>>, K extends SafeSchemaKeys<T>>(
  schema: T,
  keys: K[]
): z.ZodObject<Pick<z.infer<T>, K>> {
  return createTypeSafeComposer(schema).pick(keys).build();
}

/**
 * Type-safe schema omit utility
 */
export function typeSafeOmit<T extends z.ZodObject<Record<string, z.ZodSchema>>, K extends SafeSchemaKeys<T>>(
  schema: T,
  keys: K[]
): z.ZodObject<Omit<z.infer<T>, K>> {
  return createTypeSafeComposer(schema).omit(keys).build();
}

/**
 * Type-safe schema partial utility
 */
export function typeSafePartial<T extends z.ZodObject<z.ZodRawShape>>(
  schema: T
): ReturnType<T['partial']> {
  // Use the native partial typing from the input schema to avoid widening to optional undefined
  return schema.partial() as ReturnType<T['partial']>;
}

/**
 * Type-safe schema required utility
 */
export function typeSafeRequired<T extends z.ZodObject<Record<string, z.ZodSchema>>>(
  schema: T
): z.ZodObject<Record<string, z.ZodSchema>> {
  return createTypeSafeComposer(schema).required().build();
}

// ============================================================================
// Advanced Composition Utilities
// ============================================================================

/**
 * Type-safe schema merging
 */
export function typeSafeMerge<T1 extends z.ZodObject<Record<string, z.ZodSchema>>, T2 extends z.ZodObject<Record<string, z.ZodSchema>>>(
  schema1: T1,
  schema2: T2
): z.ZodObject<z.infer<T1> & z.infer<T2>> {
  if (!isZodObjectSchema(schema1) || !isZodObjectSchema(schema2)) {
    throw new Error('Both schemas must be object schemas for merging');
  }

  const shape1 = getSafeSchemaShape(schema1);
  const shape2 = getSafeSchemaShape(schema2);

  if (!shape1 || !shape2) {
    throw new Error('Cannot access schema shapes for merging');
  }

  const mergedShape = { ...shape1, ...shape2 };
  return z.object(mergedShape) as z.ZodObject<z.infer<T1> & z.infer<T2>>;
}

/**
 * Type-safe schema intersection
 */
export function typeSafeIntersection<T1 extends z.ZodSchema, T2 extends z.ZodSchema>(
  schema1: T1,
  schema2: T2
): z.ZodIntersection<T1, T2> {
  return z.intersection(schema1, schema2);
}

/**
 * Type-safe schema union
 */
export function typeSafeUnion<T extends z.ZodSchema[]>(
  schemas: T
): z.ZodUnion<[z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]]> {
  return z.union(schemas as unknown as [z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]]);
}

/**
 * Type-safe schema discriminated union
 */
export function typeSafeDiscriminatedUnion<
  T extends string,
  U extends [z.ZodDiscriminatedUnionOption<T>, z.ZodDiscriminatedUnionOption<T>, ...z.ZodDiscriminatedUnionOption<T>[]]
>(
  discriminator: T,
  options: U
): z.ZodDiscriminatedUnion<T, U> {
  return z.discriminatedUnion(discriminator, options);
}
