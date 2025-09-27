import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationService } from '../services/zod-validation.service';
import { ZodValidationOptions } from '../interfaces/zod-validation.interface';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  private readonly logger = new Logger(ZodValidationPipe.name);

  constructor(private readonly validationService: ZodValidationService) {}

  async transform(value: any, metadata: ArgumentMetadata): Promise<any> {
    if (!metadata.metatype) {
      return value;
    }

    // Get schema from metadata or create a basic one
    const schema = this.getSchemaFromMetadata(metadata);
    if (!schema) {
      return value;
    }

    const options: ZodValidationOptions = {
      schema,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      audit: true,
      metrics: true,
    };

    try {
      const result = await this.validationService.validate(value, options);
      
      if (!result.success) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: this.formatErrors(result.errors!),
        });
      }

      return result.data || value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Validation pipe error: ${errorMessage}`, errorStack);
      throw new BadRequestException('Validation failed');
    }
  }

  private getSchemaFromMetadata(_metadata: ArgumentMetadata): z.ZodSchema | null {
    // This is a simplified implementation
    // In a real implementation, you'd extract the schema from the metadata
    // or use reflection to get it from the class/parameter
    
    // For now, return null to skip validation
    // In a real implementation, you'd have a registry of schemas
    return null;
  }

  private formatErrors(errors: z.ZodError): any {
    return errors.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
      received: (error as any).received,
      expected: (error as any).expected,
    }));
  }
}

/**
 * Custom pipe for specific schema validation
 */
export class ZodSchemaPipe<T extends z.ZodSchema> implements PipeTransform {
  private readonly logger = new Logger(ZodSchemaPipe.name);

  constructor(
    private readonly schema: T,
    private readonly validationService: ZodValidationService,
    private readonly options?: Partial<ZodValidationOptions>,
  ) {}

  async transform(value: any): Promise<z.infer<T>> {
    const validationOptions: ZodValidationOptions = {
      schema: this.schema,
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      audit: true,
      metrics: true,
      ...this.options,
    };

    try {
      const result = await this.validationService.validate(value, validationOptions);
      
      if (!result.success) {
        throw new BadRequestException({
          message: 'Validation failed',
          errors: this.formatErrors(result.errors!),
        });
      }

      return result.data!;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Schema validation error: ${errorMessage}`, errorStack);
      throw new BadRequestException('Validation failed');
    }
  }

  private formatErrors(errors: z.ZodError): any {
    return errors.errors.map(error => ({
      field: error.path.join('.'),
      message: error.message,
      code: error.code,
      received: (error as any).received,
      expected: (error as any).expected,
    }));
  }
}

/**
 * Factory function to create schema-specific pipes
 */
export function createZodSchemaPipe<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>,
) {
  return (validationService: ZodValidationService) => 
    new ZodSchemaPipe(schema, validationService, options);
}
