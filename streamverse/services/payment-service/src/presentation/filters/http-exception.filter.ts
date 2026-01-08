import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    constructor(private readonly configService: ConfigService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_SERVER_ERROR';

        if (exception instanceof DomainException) {
            status = HttpStatus.BAD_REQUEST; // Default for domain exceptions
            message = exception.message;
            code = exception.code;
            // details = exception.details; // details property does not exist on DomainException

            // Map specific domain error codes to HTTP status codes
            switch (exception.code) {
                case 'NOT_FOUND':
                case 'USER_NOT_FOUND':
                case 'PAYMENT_NOT_FOUND':
                case 'SUBSCRIPTION_NOT_FOUND':
                    status = HttpStatus.NOT_FOUND;
                    break;
                case 'UNAUTHORIZED':
                case 'INVALID_CREDENTIALS':
                case 'INVALID_TOKEN':
                    status = HttpStatus.UNAUTHORIZED;
                    break;
                case 'FORBIDDEN':
                    status = HttpStatus.FORBIDDEN;
                    break;
                case 'VALIDATION_ERROR':
                case 'INVALID_INPUT':
                case 'PAYMENT_FAILED':
                case 'STRIPE_ERROR':
                    status = HttpStatus.BAD_REQUEST;
                    break;
                case 'CONFLICT':
                case 'USER_ALREADY_EXISTS':
                    status = HttpStatus.CONFLICT;
                    break;
            }
        } else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = (exceptionResponse as any).message || exception.message;
            code = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
        } else if (exception instanceof Error) {
            message = exception.message;
        }

        // Log the error
        const isProduction = this.configService.get('NODE_ENV') === 'production';
        if (status >= 500) {
            this.logger.error(
                `${request.method} ${request.url}`,
                exception instanceof Error ? exception.stack : JSON.stringify(exception),
            );
        } else {
            this.logger.warn(
                `${request.method} ${request.url} - ${status} - ${message}`,
            );
        }

        response.status(status).json({
            statusCode: status,
            code,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
            ...(!isProduction && exception instanceof Error && { stack: exception.stack }),
        });
    }
}
