import { z } from 'zod';

export interface SchemaCompositionOptions {
  name?: string;
  description?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface SchemaTransformation {
  name: string;
  transform: (schema: z.ZodSchema) => z.ZodSchema;
  condition?: (schema: z.ZodSchema) => boolean;
  priority?: number;
}

export interface SchemaValidation {
  name: string;
  validation: (schema: z.ZodSchema) => z.ZodSchema;
  condition?: (schema: z.ZodSchema) => boolean;
  priority?: number;
}

/**
 * Enhanced Schema Composer with better DX
 */
export class SchemaComposer<T extends z.ZodSchema = z.ZodSchema> {
  private schema: T;
  private transformations: SchemaTransformation[] = [];
  private validations: SchemaValidation[] = [];
  private options: SchemaCompositionOptions = {};

  constructor(base: T) {
    this.schema = base;
  }

  /**
   * Add a transformation to the schema
   */
  transform(
    name: string,
    transform: (schema: T) => z.ZodSchema,
    options?: {
      condition?: (schema: T) => boolean;
      priority?: number;
    }
  ): this {
    this.transformations.push({
      name,
      transform: transform as (schema: z.ZodSchema) => z.ZodSchema,
      condition: options?.condition as (schema: z.ZodSchema) => boolean,
      priority: options?.priority || 0,
    });
    return this;
  }

  /**
   * Add a validation to the schema
   */
  validate(
    name: string,
    validation: (schema: T) => z.ZodSchema,
    options?: {
      condition?: (schema: T) => boolean;
      priority?: number;
    }
  ): this {
    this.validations.push({
      name,
      validation: validation as (schema: z.ZodSchema) => z.ZodSchema,
      condition: options?.condition as (schema: z.ZodSchema) => boolean,
      priority: options?.priority || 0,
    });
    return this;
  }

  /**
   * Set composition options
   */
  withOptions(options: SchemaCompositionOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  /**
   * Build the final composed schema
   */
  build(): z.ZodSchema {
    let currentSchema = this.schema;

    // Apply transformations in priority order
    const sortedTransformations = this.transformations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const transformation of sortedTransformations) {
      if (!transformation.condition || transformation.condition(currentSchema)) {
        currentSchema = transformation.transform(currentSchema) as any;
      }
    }

    // Apply validations in priority order
    const sortedValidations = this.validations.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    for (const validation of sortedValidations) {
      if (!validation.condition || validation.condition(currentSchema)) {
        currentSchema = validation.validation(currentSchema) as any;
      }
    }

    return currentSchema;
  }

  /**
   * Clone the composer with a new base schema
   */
  clone<U extends z.ZodSchema>(newBase: U): SchemaComposer<U> {
    const composer = new SchemaComposer(newBase);
    composer.transformations = [...this.transformations];
    composer.validations = [...this.validations];
    composer.options = { ...this.options };
    return composer;
  }
}

/**
 * Factory function for creating schema composers
 */
export function createSchemaComposer<T extends z.ZodSchema>(base: T): SchemaComposer<T> {
  return new SchemaComposer(base);
}

/**
 * Enhanced schema composition utilities
 */
export class SchemaCompositionHelper {
  /**
   * Merge multiple schemas into one
   */
  static merge<T extends z.ZodSchema[]>(...schemas: T): z.ZodSchema {
    if (schemas.length === 0) {
      throw new Error('At least one schema is required for merging');
    }

    return schemas.reduce((acc, schema) => {
      if (acc instanceof z.ZodObject && schema instanceof z.ZodObject) {
        return acc.merge(schema);
      }
      return acc.and(schema);
    });
  }

  /**
   * Pick specific fields from a schema
   */
  static pick<T extends z.ZodObject<any>, K extends keyof T['shape']>(
    schema: T,
    keys: K[]
  ): z.ZodObject<any> {
    return schema.pick(keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as any)) as any;
  }

  /**
   * Omit specific fields from a schema
   */
  static omit<T extends z.ZodObject<any>, K extends keyof T['shape']>(
    schema: T,
    keys: K[]
  ): z.ZodObject<any> {
    return schema.omit(keys.reduce((acc, key) => ({ ...acc, [key]: true }), {} as any)) as any;
  }

  /**
   * Create a partial schema
   */
  static partial<T extends z.ZodObject<any>>(schema: T): z.ZodObject<any> {
    return schema.partial() as any;
  }

  /**
   * Create a required schema
   */
  static required<T extends z.ZodObject<any>>(schema: T): z.ZodObject<any> {
    return schema.required() as any;
  }

  /**
   * Create a schema with conditional fields
   */
  static conditional<T extends z.ZodObject<any>>(
    schema: T,
    condition: (data: z.infer<T>) => boolean,
    trueSchema: Partial<z.infer<T>>,
    falseSchema: Partial<z.infer<T>>
  ): z.ZodSchema {
    return schema.refine((data) => {
      const conditionalData = condition(data) ? trueSchema : falseSchema;
      return Object.keys(conditionalData).every(key => 
        (conditionalData as any)[key] === (data as any)[key]
      );
    }) as any;
  }

  /**
   * Create a schema with dependent fields
   */
  static dependent<T extends z.ZodObject<any>>(
    schema: T,
    dependencies: Record<string, (data: z.infer<T>) => z.ZodSchema>
  ): z.ZodSchema {
    return schema.refine((data) => {
      for (const [field, schemaFactory] of Object.entries(dependencies)) {
        if ((data as any)[field] !== undefined) {
          const dependentSchema = schemaFactory(data);
          try {
            dependentSchema.parse(data);
          } catch {
            return false;
          }
        }
      }
      return true;
    }) as any;
  }

  /**
   * Create a schema with cross-field validation
   */
  static crossField<T extends z.ZodObject<any>>(
    schema: T,
    validators: Array<{
      fields: (keyof z.infer<T>)[];
      validator: (data: z.infer<T>) => boolean;
      message: string;
    }>
  ): z.ZodSchema {
    return schema.refine((data) => {
      for (const { fields: _fields, validator, message: _message } of validators) {
        if (!validator(data)) {
          return false;
        }
      }
      return true;
    }) as any;
  }

  /**
   * Create a schema with array validation
   */
  static arrayValidation<T extends z.ZodSchema>(
    schema: T,
    validators: Array<{
      name: string;
      validator: (items: z.infer<T>[]) => boolean;
      message: string;
    }>
  ): z.ZodArray<any> {
    return z.array(schema).refine((items) => {
      for (const { validator } of validators) {
        if (!validator(items)) {
          return false;
        }
      }
      return true;
    }) as any;
  }

  /**
   * Create a schema with object validation
   */
  static objectValidation<T extends z.ZodObject<any>>(
    schema: T,
    validators: Array<{
      name: string;
      validator: (data: z.infer<T>) => boolean;
      message: string;
    }>
  ): z.ZodSchema {
    return schema.refine((data) => {
      for (const { validator } of validators) {
        if (!validator(data)) {
          return false;
        }
      }
      return true;
    }) as any;
  }

  /**
   * Create a schema with transformation
   */
  static transform<T extends z.ZodSchema, U>(
    schema: T,
    transform: (data: z.infer<T>) => U
  ): z.ZodSchema<any, any, U> {
    return schema.transform(transform) as any;
  }

  /**
   * Create a schema with preprocessing
   */
  static preprocess<T extends z.ZodSchema>(
    schema: T,
    preprocess: (data: unknown) => unknown
  ): z.ZodSchema<any, any, z.infer<T>> {
    return z.preprocess(preprocess, schema) as any;
  }

  /**
   * Create a schema with custom error messages
   */
  static withMessages<T extends z.ZodSchema>(
    schema: T,
    messages: Record<string, string>
  ): z.ZodSchema {
    return schema.superRefine((data, ctx) => {
      try {
        schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          for (const issue of error.issues) {
            const key = `${issue.code}_${issue.path.map(p => String(p)).join('.')}`;
            const message = messages[key] || messages[issue.code] || issue.message;
            ctx.addIssue({
              code: issue.code as any,
              message,
              path: issue.path,
            } as any);
          }
        }
      }
    }) as any;
  }

  /**
   * Create a schema with async validation
   */
  static async<T extends z.ZodSchema>(
    schema: T,
    asyncValidator: (data: z.infer<T>) => Promise<boolean>,
    errorMessage?: string
  ): z.ZodSchema {
    return schema.refine(asyncValidator, errorMessage) as any;
  }

  /**
   * Create a schema with caching
   */
  static cached<T extends z.ZodSchema>(
    schema: T,
    cacheKey?: (data: z.infer<T>) => string,
    ttl = 60000
  ): z.ZodSchema {
    const cache = new Map<string, { result: z.infer<T>; timestamp: number }>();
    
    return schema.transform((data) => {
      const key = cacheKey ? cacheKey(data) : JSON.stringify(data);
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < ttl) {
        return cached.result;
      }
      
      const result = schema.parse(data);
      cache.set(key, { result, timestamp: Date.now() });
      return result;
    }) as any;
  }

  /**
   * Create a schema with performance monitoring
   */
  static monitored<T extends z.ZodSchema>(
    schema: T,
    onValidation?: (duration: number, success: boolean) => void
  ): z.ZodSchema {
    const originalParse = schema.parse.bind(schema);
    const originalParseAsync = schema.parseAsync?.bind(schema);

    (schema as any).parse = (data: unknown) => {
      const startTime = performance.now();
      try {
        const result = originalParse(data);
        onValidation?.(performance.now() - startTime, true);
        return result;
      } catch (error) {
        onValidation?.(performance.now() - startTime, false);
        throw error;
      }
    };

    if (originalParseAsync) {
      (schema as any).parseAsync = async (data: unknown) => {
        const startTime = performance.now();
        try {
          const result = await originalParseAsync(data);
          onValidation?.(performance.now() - startTime, true);
          return result;
        } catch (error) {
          onValidation?.(performance.now() - startTime, false);
          throw error;
        }
      };
    }

    return schema as any;
  }
}

/**
 * Common schema patterns
 */
export const CommonPatterns = {
  /**
   * Email with domain validation
   */
  emailWithDomain: (allowedDomains: string[]) => 
    z.string().email().refine(
      (email) => allowedDomains.some(domain => email.endsWith(`@${domain}`)),
      `Email must be from one of: ${allowedDomains.join(', ')}`
    ),

  /**
   * Password with strength requirements
   */
  strongPassword: (minLength = 8) =>
    z.string()
      .min(minLength, `Password must be at least ${minLength} characters`)
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain uppercase, lowercase, number, and special character'),

  /**
   * Phone number with country code
   */
  phoneWithCountryCode: () =>
    z.string().regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format'),

  /**
   * URL with protocol validation
   */
  urlWithProtocol: (allowedProtocols = ['http', 'https']) =>
    z.string().url().refine(
      (url) => allowedProtocols.some(protocol => url.startsWith(`${protocol}://`)),
      `URL must start with one of: ${allowedProtocols.join(', ')}`
    ),

  /**
   * Date range validation
   */
  dateRange: (startDate: Date, endDate: Date) =>
    z.date().refine(
      (date) => date >= startDate && date <= endDate,
      `Date must be between ${startDate.toISOString()} and ${endDate.toISOString()}`
    ),

  /**
   * Array with unique items
   */
  uniqueArray: <T extends z.ZodSchema>(schema: T) =>
    z.array(schema).refine(
      (items) => new Set(items).size === items.length,
      'Array items must be unique'
    ),

  /**
   * Object with required fields based on condition
   */
  conditionalRequired: <T extends z.ZodObject<any>>(
    schema: T,
    condition: (data: z.infer<T>) => boolean,
    requiredFields: (keyof z.infer<T>)[]
  ) =>
    schema.refine((data) => {
      if (condition(data)) {
        return requiredFields.every(field => data[field] !== undefined);
      }
      return true;
    }),
};
