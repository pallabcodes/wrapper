import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { ValidationService } from '../validation.service';

@Injectable()
export class AjvValidationPipe implements PipeTransform {
  constructor(private readonly validationService: ValidationService) {}

  async transform(value: any, metadata: ArgumentMetadata) {
    if (!metadata.metatype) {
      return value;
    }

    try {
      const isValid = await this.validationService.validate(value, metadata.metatype);
      if (!isValid) {
        const errors = this.validationService.getLastErrors();
        throw new BadRequestException({
          message: 'Validation failed',
          errors: errors || ['Invalid data'],
        });
      }
      return value;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Validation failed');
    }
  }
}

