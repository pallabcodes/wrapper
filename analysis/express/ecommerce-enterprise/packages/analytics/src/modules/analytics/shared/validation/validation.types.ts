export interface ValidationError {
  field: string;
  message: string;
  value: any;
  constraint: string;
  children?: ValidationError[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  data?: any;
}

export interface ValidationOptions {
  /** Skip validation for certain conditions */
  skip?: (req: any) => boolean;
  /** Transform data after validation */
  transform?: (data: any) => any;
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
  validate: (value: any, context: ValidationContext) => boolean | Promise<boolean>;
  message: (field: string, value: any) => string;
}

export interface ValidationContext {
  field: string;
  value: any;
  parent?: any;
  path: string;
  request: any;
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
  enum?: any[];
  items?: ValidationField;
  properties?: ValidationSchema;
  custom?: ValidationRule[];
  message?: string;
}
