import { ValidationPipe, ValidationError, BadRequestException } from '@nestjs/common';

/**
 * Custom Validation Pipe
 *
 * Extends base ValidationPipe with custom behavior:
 * - Custom error formatting
 * - Strip unknown properties
 * - Transform payloads to DTO instances
 */
export class CustomValidationPipe extends ValidationPipe {
    constructor() {
        super({
            // Strip properties not defined in DTO
            whitelist: true,

            // Throw error if unknown properties found
            forbidNonWhitelisted: true,

            // Transform plain objects to DTO class instances
            transform: true,

            // Custom error formatting
            exceptionFactory: (errors: ValidationError[]) => {
                const formattedErrors = this.formatValidationErrors(errors);
                return new BadRequestException({
                    statusCode: 400,
                    message: 'Validation failed',
                    errors: formattedErrors,
                });
            },
        });
    }

    private formatValidationErrors(errors: ValidationError[]): any[] {
        return errors.map(error => ({
            field: error.property,
            value: error.value,
            constraints: error.constraints,
        }));
    }
}
