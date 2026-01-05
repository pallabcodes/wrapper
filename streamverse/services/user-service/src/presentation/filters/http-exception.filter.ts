import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { DomainException } from '../../domain/exceptions/domain.exception';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    constructor(private configService: ConfigService) { }

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();
        const isProduction = this.configService.get('NODE_ENV') === 'production';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let error = 'Internal Server Error';
        let stack: string | undefined;

        // 1. Handle Domain Exceptions (Business Logic Errors)
        if (exception instanceof DomainException) {
            status = this.mapDomainExceptionToStatus(exception);
            message = exception.message;
            error = exception.code || 'Domain Error';
        }
        // 2. Handle Built-in HTTP Exceptions
        else if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            message = typeof exceptionResponse === 'string'
                ? exceptionResponse
                : (exceptionResponse as any).message || exception.message;
            error = (exceptionResponse as any).error || exception.name;
        }
        // 3. Handle Other Errors (e.g., Database, Runtime)
        else if (exception instanceof Error) {
            this.logger.error(`Unhandled Exception: ${exception.message}`, exception.stack);
            // In production, mask internal server errors
            if (isProduction) {
                message = 'Internal server error';
                error = 'Internal Server Error';
            } else {
                message = exception.message;
                error = exception.name;
                stack = exception.stack;
            }
        }

        const responseBody: any = {
            statusCode: status,
            message,
            error,
            timestamp: new Date().toISOString(),
            path: request.url,
        };

        // Add stack trace only in development/test
        if (!isProduction && stack) {
            responseBody.stack = stack;
        }

        response.status(status).json(responseBody);
    }

    private mapDomainExceptionToStatus(exception: DomainException): HttpStatus {
        switch (exception.code) {
            case 'USER_NOT_FOUND':
                return HttpStatus.NOT_FOUND;

            case 'EMAIL_EXISTS':
            case 'USERNAME_EXISTS':
                return HttpStatus.CONFLICT;

            case 'INVALID_CREDENTIALS':
            case 'INVALID_VERIFICATION_TOKEN':
                return HttpStatus.UNAUTHORIZED;

            case 'USER_NOT_VERIFIED':
            case 'ACCOUNT_LOCKED':
                return HttpStatus.FORBIDDEN;

            default:
                // Default to Bad Request for generic domain rule violations
                return HttpStatus.BAD_REQUEST;
        }
    }
}
