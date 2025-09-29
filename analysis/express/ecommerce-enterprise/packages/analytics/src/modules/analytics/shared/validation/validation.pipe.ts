import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException, Logger } from '@nestjs/common';
import { ValidationService } from './validation.service';
import { ValidationSchema, ValidationOptions } from './validation.types';

@Injectable()
export class ValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ValidationPipe.name);

  constructor(private readonly validationService: ValidationService) {}

  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    const { metatype } = metadata;
    
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Get schema from metadata or use default
    const schema = this.getSchema(metatype);
    if (!schema) {
      return value;
    }

    const options: ValidationOptions = {
      stripUnknown: true,
      abortEarly: false,
    };

    const result = await this.validationService.validate(value, schema, options);

    if (!result.isValid) {
      this.logger.warn('Validation failed', {
        errors: result.errors,
        value,
        type: metatype.name,
      });

      throw new BadRequestException({
        message: 'Validation failed',
        statusCode: 400,
        errors: result.errors,
      });
    }

    return result.data;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private getSchema(_metatype: Function): ValidationSchema | null {
    // This would typically use reflection to get schema from decorators
    // For now, return null to use default validation
    return null;
  }
}

// Custom validation pipe for specific schemas
export class SchemaValidationPipe implements PipeTransform {
  private readonly logger = new Logger(SchemaValidationPipe.name);

  constructor(
    private readonly validationService: ValidationService,
    private readonly schema: ValidationSchema,
    private readonly options: ValidationOptions = {},
  ) {}

  async transform(value: unknown, _metadata: ArgumentMetadata): Promise<unknown> {
    const result = await this.validationService.validate(value, this.schema, this.options);

    if (!result.isValid) {
      this.logger.warn('Schema validation failed', {
        errors: result.errors,
        value,
        schema: this.schema,
      });

      throw new BadRequestException({
        message: 'Schema validation failed',
        statusCode: 400,
        errors: result.errors,
      });
    }

    return result.data;
  }
}
