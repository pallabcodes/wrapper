import { SetMetadata, applyDecorators } from '@nestjs/common';
// import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ValidationSchema, ValidationField, ValidationRule } from './validation.types';
// import { SchemaValidationPipe } from './validation.pipe';

export const VALIDATION_SCHEMA_KEY = 'validation_schema';
export const VALIDATION_OPTIONS_KEY = 'validation_options';

export const Validate = (schema: ValidationSchema, options?: Record<string, unknown>) =>
  applyDecorators(
    SetMetadata(VALIDATION_SCHEMA_KEY, schema),
    SetMetadata(VALIDATION_OPTIONS_KEY, options),
  );

// Common validation schemas
export const StringField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'string',
  ...options,
});

export const NumberField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'number',
  ...options,
});

export const BooleanField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'boolean',
  ...options,
});

export const ArrayField = (itemType: ValidationField, options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'array',
  items: itemType,
  ...options,
});

export const ObjectField = (properties: ValidationSchema, options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'object',
  properties,
  ...options,
});

export const EmailField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'email',
  ...options,
});

export const UrlField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'url',
  ...options,
});

export const UuidField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'uuid',
  ...options,
});

export const DateField = (options: Partial<ValidationField> = {}): ValidationField => ({
  type: 'date',
  ...options,
});

// Common validation rules
export const Required = (message?: string): ValidationRule => ({
  name: 'required',
  validate: (value) => value !== undefined && value !== null && value !== '',
  message: (field) => message || `${field} is required`,
});

export const MinLength = (min: number, message?: string): ValidationRule => ({
  name: 'minLength',
  validate: (value) => typeof value === 'string' && value.length >= min,
  message: (field) => message || `${field} must be at least ${min} characters long`,
});

export const MaxLength = (max: number, message?: string): ValidationRule => ({
  name: 'maxLength',
  validate: (value) => typeof value === 'string' && value.length <= max,
  message: (field) => message || `${field} must be at most ${max} characters long`,
});

export const Min = (min: number, message?: string): ValidationRule => ({
  name: 'min',
  validate: (value) => typeof value === 'number' && value >= min,
  message: (field) => message || `${field} must be at least ${min}`,
});

export const Max = (max: number, message?: string): ValidationRule => ({
  name: 'max',
  validate: (value) => typeof value === 'number' && value <= max,
  message: (field) => message || `${field} must be at most ${max}`,
});

export const Pattern = (pattern: RegExp, message?: string): ValidationRule => ({
  name: 'pattern',
  validate: (value) => typeof value === 'string' && pattern.test(value),
  message: (field) => message || `${field} format is invalid`,
});

export const Enum = (values: unknown[], message?: string): ValidationRule => ({
  name: 'enum',
  validate: (value) => values.includes(value),
  message: (field) => message || `${field} must be one of: ${values.join(', ')}`,
});

// Convenience decorators for common patterns
export const ValidateEmail = (options: Partial<ValidationField> = {}) =>
  Validate({
    email: EmailField({ required: true, ...options }),
  });

export const ValidateUuid = (options: Partial<ValidationField> = {}) =>
  Validate({
    id: UuidField({ required: true, ...options }),
  });

export const ValidatePagination = () =>
  Validate({
    page: NumberField({ min: 1, required: false }),
    limit: NumberField({ min: 1, max: 100, required: false }),
    sort: StringField({ required: false }),
    order: StringField({ enum: ['asc', 'desc'], required: false }),
  });
