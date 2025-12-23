import { Injectable, Logger } from '@nestjs/common';
import { ValidationError, ValidationResult, ValidationOptions, ValidationContext, ValidationSchema, ValidationField } from './validation.types';

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  async validate(data: unknown, schema: ValidationSchema, options: ValidationOptions = {}): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    
    try {
      const validatedData = await this.validateObject(data, schema, '', options, errors);
      
      if (errors.length > 0) {
        return {
          isValid: false,
          errors,
        };
      }

      return {
        isValid: true,
        data: options.transform ? options.transform(validatedData) : validatedData,
        errors: [],
      };
    } catch (error) {
      this.logger.error('Validation error', error);
      return {
        isValid: false,
        errors: [{
          field: 'root',
          message: 'Validation failed due to internal error',
          value: data,
          constraint: 'internal_error',
        }],
      };
    }
  }

  private async validateObject(
    data: unknown,
    schema: ValidationSchema,
    path: string,
    options: ValidationOptions,
    errors: ValidationError[],
  ): Promise<unknown> {
    if (data === null || data === undefined) {
      return data;
    }

    const result: Record<string, unknown> = {};

    for (const [key, fieldSchema] of Object.entries(schema)) {
      const fieldPath = path ? `${path}.${key}` : key;
      const value = (data as Record<string, unknown>)[key];

      if (this.isValidationField(fieldSchema)) {
        const fieldResult = await this.validateField(value, fieldSchema, fieldPath, options, errors);
        if (fieldResult !== undefined) {
          result[key] = fieldResult;
        }
      } else {
        // Nested object validation
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          result[key] = await this.validateObject(value, fieldSchema as ValidationSchema, fieldPath, options, errors);
        } else {
          result[key] = value;
        }
      }
    }

    // Strip unknown properties if requested
    if (options.stripUnknown) {
      const knownKeys = new Set(Object.keys(schema));
      for (const key of Object.keys(data)) {
        if (!knownKeys.has(key)) {
          delete result[key];
        }
      }
    }

    return result;
  }

  private async validateField(
    value: unknown,
    field: ValidationField,
    path: string,
    options: ValidationOptions,
    errors: ValidationError[],
  ): Promise<unknown> {
    const context: ValidationContext = {
      field: path,
      value,
      path,
      request: { method: 'GET', url: '/', headers: {} }, // This would be the actual request in real usage
    };

    // Check if field is required
    if (field.required && (value === undefined || value === null)) {
      errors.push({
        field: path,
        message: field.message || `${path} is required`,
        value,
        constraint: 'required',
      });
      return undefined;
    }

    // Skip validation if value is null/undefined and not required
    if (value === null || value === undefined) {
      return value;
    }

    // Type validation
    if (!this.validateType(value, field.type)) {
      errors.push({
        field: path,
        message: field.message || `${path} must be of type ${field.type}`,
        value,
        constraint: 'type',
      });
      return undefined;
    }

    // String validations
    if (field.type === 'string' && typeof value === 'string') {
      if (field.min !== undefined && value.length < field.min) {
        errors.push({
          field: path,
          message: field.message || `${path} must be at least ${field.min} characters long`,
          value,
          constraint: 'minLength',
        });
      }

      if (field.max !== undefined && value.length > field.max) {
        errors.push({
          field: path,
          message: field.message || `${path} must be at most ${field.max} characters long`,
          value,
          constraint: 'maxLength',
        });
      }

      if (field.pattern && !field.pattern.test(value)) {
        errors.push({
          field: path,
          message: field.message || `${path} format is invalid`,
          value,
          constraint: 'pattern',
        });
      }

      if (field.enum && !field.enum.includes(value)) {
        errors.push({
          field: path,
          message: field.message || `${path} must be one of: ${field.enum.join(', ')}`,
          value,
          constraint: 'enum',
        });
      }
    }

    // Number validations
    if (field.type === 'number' && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        errors.push({
          field: path,
          message: field.message || `${path} must be at least ${field.min}`,
          value,
          constraint: 'min',
        });
      }

      if (field.max !== undefined && value > field.max) {
        errors.push({
          field: path,
          message: field.message || `${path} must be at most ${field.max}`,
          value,
          constraint: 'max',
        });
      }
    }

    // Array validations
    if (field.type === 'array' && Array.isArray(value)) {
      if (field.min !== undefined && value.length < field.min) {
        errors.push({
          field: path,
          message: field.message || `${path} must contain at least ${field.min} items`,
          value,
          constraint: 'minItems',
        });
      }

      if (field.max !== undefined && value.length > field.max) {
        errors.push({
          field: path,
          message: field.message || `${path} must contain at most ${field.max} items`,
          value,
          constraint: 'maxItems',
        });
      }

      // Validate array items
      if (field.items) {
        const itemErrors: ValidationError[] = [];
        const validatedItems = await Promise.all(
          value.map(async (item, index) => {
            const itemPath = `${path}[${index}]`;
            return this.validateField(item, field.items!, itemPath, options, itemErrors);
          })
        );

        if (itemErrors.length > 0) {
          errors.push({
            field: path,
            message: field.message || `${path} contains invalid items`,
            value,
            constraint: 'items',
            children: itemErrors,
          });
        }

        return validatedItems;
      }
    }

    // Custom validations
    if (field.custom) {
      for (const rule of field.custom) {
        try {
          const isValid = await rule.validate(value, context);
          if (!isValid) {
            errors.push({
              field: path,
              message: rule.message(path, value),
              value,
              constraint: rule.name,
            });
          }
        } catch (error) {
          this.logger.error(`Custom validation rule ${rule.name} failed`, error);
          errors.push({
            field: path,
            message: field.message || `${path} validation failed`,
            value,
            constraint: rule.name,
          });
        }
      }
    }

    return value;
  }

  private validateType(value: unknown, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      case 'email':
        return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        return typeof value === 'string' && /^https?:\/\/.+/.test(value);
      case 'uuid':
        return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
      default:
        return true;
    }
  }

  private isValidationField(schema: unknown): schema is ValidationField {
    if (schema === null || typeof schema !== 'object') {
      return false;
    }
    
    const obj = schema as Record<string, unknown>;
    const hasType = 'type' in obj;
    const typeValue = obj['type'];
    const typeIsString = typeof typeValue === 'string';
    
    return (hasType && typeIsString) as boolean;
  }
}
