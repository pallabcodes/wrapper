export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
  constraint: string;
  children?: ValidationError[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: unknown;
}

export interface ValidationOptions {
  /** Skip validation for certain conditions */
  skip?: (req: { method: string; url: string; ip?: string; headers: Record<string, string | string[] | undefined> }) => boolean;
  /** Transform data after validation */
  transform?: (data: unknown) => unknown;
  /** Custom error messages */
  messages?: Record<string, string>;
  /** Whether to strip unknown properties */
  stripUnknown?: boolean;
  /** Whether to abort early on first error */
  abortEarly?: boolean;
  /** Custom validation rules */
  customRules?: ValidationRule[];
}

export interface ValidationRule {
  name: string;
  validate: (value: unknown, context: ValidationContext) => boolean | Promise<boolean>;
  message: (field: string, value: unknown) => string;
}

export interface ValidationContext {
  field: string;
  value: unknown;
  parent?: unknown;
  path: string;
  request: { method: string; url: string; ip?: string; headers: Record<string, string | string[] | undefined> };
}

export interface ValidationSchema {
  [key: string]: ValidationField | ValidationSchema;
}

export interface ValidationField {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date' | 'email' | 'url' | 'uuid';
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  enum?: unknown[];
  items?: ValidationField;
  properties?: ValidationSchema;
  custom?: ValidationRule[];
  message?: string;
}
