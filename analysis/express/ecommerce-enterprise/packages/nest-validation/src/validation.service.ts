import { Injectable, Inject, Logger } from '@nestjs/common';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import addErrors from 'ajv-errors';
import addKeywords from 'ajv-keywords';
import { ValidationOptions } from './interfaces/validation-options.interface';
import { SchemaRegistry } from './schemas/schema-registry';
import { ValidationCache } from './utils/validation-cache';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly ajv: any;
  private metrics = {
    validations: 0,
    errors: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  constructor(
    @Inject('VALIDATION_OPTIONS') private readonly options: ValidationOptions,
    private readonly schemaRegistry: SchemaRegistry,
    private readonly validationCache: ValidationCache,
  ) {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      validateFormats: true,
      ...options.ajv,
    });

    // Add formats, errors, and keywords
    addFormats(this.ajv);
    addErrors(this.ajv);
    addKeywords(this.ajv);

    // Register custom keywords if provided
    if (options.customKeywords) {
      for (const [name, keyword] of Object.entries(options.customKeywords)) {
        this.ajv.addKeyword(name, keyword);
      }
    }
  }

  async validate<T>(
    data: any,
    schema: any,
    options?: {
      schemaId?: string;
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T; errors?: any[] }> {
    try {
      this.metrics.validations++;

      const schemaId = options?.schemaId || this.generateSchemaId(schema);
      const useCache = options?.useCache !== false;

      let validate: Ajv.ValidateFunction;

      if (useCache) {
        validate = await this.validationCache.get(schemaId, () => {
          return this.ajv.compile(schema);
        });
        this.metrics.cacheHits++;
      } else {
        validate = this.ajv.compile(schema);
        this.metrics.cacheMisses++;
      }

      const valid = validate(data);

      if (!valid) {
        this.metrics.errors++;
        return {
          valid: false,
          errors: validate.errors,
        };
      }

      let result = data;

      if (options?.transform) {
        result = this.transformData(data, schema);
      }

      return {
        valid: true,
        data: result,
      };
    } catch (error) {
      this.metrics.errors++;
      this.logger.error(`Validation error: ${error instanceof Error ? error.message : String(error)}`, error instanceof Error ? error.stack : undefined);
      return {
        valid: false,
        errors: [{ message: 'Internal validation error', dataPath: '' }] as any,
      };
    }
  }

  async validateAsync<T>(
    data: any,
    schema: any,
    options?: {
      schemaId?: string;
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T; errors?: any[] }> {
    // For async validation (e.g., database lookups)
    return this.validate(data, schema, options);
  }

  async validatePartial<T>(
    data: any,
    schema: any,
    options?: {
      schemaId?: string;
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T; errors?: any[] }> {
    // Create a partial schema that only validates provided fields
    const partialSchema = this.createPartialSchema(schema, data);
    return this.validate(data, partialSchema, options);
  }

  async validateArray<T>(
    data: any[],
    schema: any,
    options?: {
      schemaId?: string;
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T[]; errors?: any[] }> {
    const arraySchema = {
      type: 'array',
      items: schema,
      ...options,
    };

    return this.validate(data, arraySchema, options);
  }

  async validateObject<T>(
    data: any,
    schema: any,
    options?: {
      schemaId?: string;
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T; errors?: any[] }> {
    const objectSchema = {
      type: 'object',
      properties: schema,
      required: Object.keys(schema),
      additionalProperties: false,
      ...options,
    };

    return this.validate(data, objectSchema, options);
  }

  registerSchema(id: string, schema: any): void {
    this.schemaRegistry.register(id, schema);
  }

  getSchema(id: string): any {
    return this.schemaRegistry.get(id);
  }

  async validateWithSchema<T>(
    data: any,
    schemaId: string,
    options?: {
      useCache?: boolean;
      transform?: boolean;
    },
  ): Promise<{ valid: boolean; data?: T; errors?: any[] }> {
    const schema = this.schemaRegistry.get(schemaId);
    if (!schema) {
      throw new Error(`Schema not found: ${schemaId}`);
    }

    return this.validate(data, schema, { ...options, schemaId });
  }

  private generateSchemaId(schema: any): string {
    return JSON.stringify(schema);
  }

  private createPartialSchema(schema: any, data: any): any {
    if (schema.type === 'object' && schema.properties) {
      const partialProperties: any = {};
      const required: string[] = [];

      for (const key of Object.keys(data)) {
        if (schema.properties[key]) {
          partialProperties[key] = schema.properties[key];
          if (schema.required?.includes(key)) {
            required.push(key);
          }
        }
      }

      return {
        ...schema,
        properties: partialProperties,
        required,
      };
    }

    return schema;
  }

  private transformData(data: any, schema: any): any {
    // Basic transformation based on schema
    if (schema.type === 'object' && schema.properties) {
      const transformed: any = {};

      for (const [key, value] of Object.entries(data)) {
        const propertySchema = schema.properties[key];
        if (propertySchema) {
          transformed[key] = this.transformValue(value, propertySchema);
        }
      }

      return transformed;
    }

    return data;
  }

  private transformValue(value: any, propertySchema: any): any {
    if (propertySchema.type === 'string' && typeof value === 'number') {
      return value.toString();
    }

    if (propertySchema.type === 'number' && typeof value === 'string') {
      const num = Number(value);
      return isNaN(num) ? value : num;
    }

    if (propertySchema.type === 'boolean' && typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    if (propertySchema.type === 'array' && !Array.isArray(value)) {
      return [value];
    }

    return value;
  }

  getMetrics() {
    const total = this.metrics.validations;
    const errorRate = total > 0 ? (this.metrics.errors / total) * 100 : 0;
    const cacheHitRate = total > 0 ? (this.metrics.cacheHits / total) * 100 : 0;

    return {
      ...this.metrics,
      errorRate: Math.round(errorRate * 100) / 100,
      cacheHitRate: Math.round(cacheHitRate * 100) / 100,
      total,
    };
  }

  resetMetrics() {
    this.metrics = {
      validations: 0,
      errors: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}
