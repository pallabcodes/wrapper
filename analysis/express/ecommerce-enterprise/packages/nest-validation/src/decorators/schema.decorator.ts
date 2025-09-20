import { SetMetadata } from '@nestjs/common';

export interface SchemaOptions {
  name?: string;
  description?: string;
  version?: string;
  tags?: string[];
  examples?: any[];
  deprecated?: boolean;
}

export const SCHEMA_KEY = 'schema';
export const SCHEMA_OPTIONS = 'schema:options';

export function Schema(options: SchemaOptions = {}) {
  return (target: any, propertyKey?: string, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      // Method decorator
      SetMetadata(SCHEMA_KEY, options)(target, propertyKey, descriptor);
      SetMetadata(SCHEMA_OPTIONS, options)(target, propertyKey, descriptor);
    } else {
      // Class decorator
      SetMetadata(SCHEMA_KEY, options)(target);
      SetMetadata(SCHEMA_OPTIONS, options)(target);
    }
  };
}

export function SchemaName(name: string) {
  return SetMetadata('schema:name', name);
}

export function SchemaDescription(description: string) {
  return SetMetadata('schema:description', description);
}

export function SchemaVersion(version: string) {
  return SetMetadata('schema:version', version);
}

export function SchemaTags(tags: string[]) {
  return SetMetadata('schema:tags', tags);
}

export function SchemaExamples(examples: any[]) {
  return SetMetadata('schema:examples', examples);
}

export function SchemaDeprecated(deprecated: boolean = true) {
  return SetMetadata('schema:deprecated', deprecated);
}

