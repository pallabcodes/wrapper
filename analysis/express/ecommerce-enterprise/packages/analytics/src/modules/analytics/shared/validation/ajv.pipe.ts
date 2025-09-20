import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import Ajv, { ValidateFunction } from 'ajv';

// Minimal DTO->schema registration: teams can attach schemas on DTOs via static property
export interface JsonSchemaProvider {
  constructor: { jsonSchema?: object };
}

@Injectable()
export class AjvValidationPipe implements PipeTransform {
  private ajv = new Ajv({ coerceTypes: true, removeAdditional: true, useDefaults: true });
  private schemaCache = new WeakMap<object, ValidateFunction>();

  transform(value: any, metadata: ArgumentMetadata) {
    const { metatype, type } = metadata;
    if (!metatype || ['custom'].includes(type)) return value;
    const schema = (metatype as any)?.jsonSchema as object | undefined;
    if (!schema) return value; // fallback: no schema provided => do nothing

    let validator = this.schemaCache.get(metatype);
    if (!validator) {
      validator = this.ajv.compile(schema);
      this.schemaCache.set(metatype, validator);
    }

    const ok = validator(value);
    if (!ok) {
      const msg = this.ajv.errorsText(validator.errors || []);
      throw new BadRequestException(`Validation failed: ${msg}`);
    }
    return value;
  }
}


