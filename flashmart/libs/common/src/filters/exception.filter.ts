import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger('ExceptionFilter');

    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const requestId = request.headers['x-request-id'] || 'unknown';

        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let code = 'INTERNAL_ERROR';

        if (exception instanceof HttpException) {
            status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            if (typeof exceptionResponse === 'object') {
                message = (exceptionResponse as any).message || exception.message;
                code = (exceptionResponse as any).code || this.getCodeFromStatus(status);
            } else {
                message = exceptionResponse as string;
            }
        } else if (exception instanceof Error) {
            message = exception.message;

            // Log full stack for internal errors
            this.logger.error({
                requestId,
                path: request.url,
                method: request.method,
                message: exception.message,
                stack: exception.stack,
            });
        }

        response.status(status).json({
            success: false,
            error: {
                code,
                message,
                timestamp: new Date().toISOString(),
                path: request.url,
                requestId,
            },
        });
    }

    private getCodeFromStatus(status: number): string {
        const codes: Record<number, string> = {
            400: 'BAD_REQUEST',
            401: 'UNAUTHORIZED',
            403: 'FORBIDDEN',
            404: 'NOT_FOUND',
            409: 'CONFLICT',
            422: 'UNPROCESSABLE_ENTITY',
            429: 'TOO_MANY_REQUESTS',
            500: 'INTERNAL_ERROR',
            502: 'BAD_GATEWAY',
            503: 'SERVICE_UNAVAILABLE',
        };
        return codes[status] || 'UNKNOWN_ERROR';
    }
}

// GraphQL-specific exception filter
@Catch()
export class GraphQLExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        // For GraphQL, we need to handle errors differently
        // The error will be caught by Apollo's formatError
        throw exception;
    }
}
