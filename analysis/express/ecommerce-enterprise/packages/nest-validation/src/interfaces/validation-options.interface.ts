export interface ValidationOptions {
  schema?: any;
  transform?: boolean;
  whitelist?: boolean;
  forbidNonWhitelisted?: boolean;
  skipMissingProperties?: boolean;
  skipNullProperties?: boolean;
  skipUndefinedProperties?: boolean;
  validationError?: {
    target?: boolean;
    value?: boolean;
  };
  exceptionFactory?: (errors: any[]) => any;
  cache?: boolean;
  cacheSize?: number;
  cacheTtl?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  data?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
  constraint?: string;
}

