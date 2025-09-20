import { SetMetadata } from '@nestjs/common';

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
}

export const VALIDATE_KEY = 'validate';
export const VALIDATE_OPTIONS = 'validate:options';

export function Validate(options: ValidationOptions = {}) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(VALIDATE_KEY, true)(target, propertyKey, descriptor);
    SetMetadata(VALIDATE_OPTIONS, options)(target, propertyKey, descriptor);
  };
}

export function ValidationSchema(schema: any) {
  return SetMetadata('validation:schema', schema);
}

export function ValidationTransform(transform: boolean = true) {
  return SetMetadata('validation:transform', transform);
}

export function ValidationWhitelist(whitelist: boolean = true) {
  return SetMetadata('validation:whitelist', whitelist);
}

