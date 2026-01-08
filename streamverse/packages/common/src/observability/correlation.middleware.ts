import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { correlationStorage, CorrelationContext } from './logger.service';

/**
 * Header names for correlation ID propagation
 */
export const CORRELATION_ID_HEADER = 'x-correlation-id';
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Middleware to extract or generate correlation IDs
 * and propagate them through AsyncLocalStorage
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
    use(req: Request, res: Response, next: NextFunction) {
        // Extract or generate correlation ID
        const correlationId =
            (req.headers[CORRELATION_ID_HEADER] as string) || uuidv4();

        // Generate unique request ID
        const requestId = (req.headers[REQUEST_ID_HEADER] as string) || uuidv4();

        // Extract user ID if available (from JWT or session)
        const userId = (req as any).user?.id || (req as any).userId;

        // Create correlation context
        const context: CorrelationContext = {
            correlationId,
            requestId,
            userId,
        };

        // Set response headers for client tracing
        res.setHeader(CORRELATION_ID_HEADER, correlationId);
        res.setHeader(REQUEST_ID_HEADER, requestId);

        // Run the rest of the request in the correlation context
        correlationStorage.run(context, () => {
            next();
        });
    }
}

/**
 * Utility to run code within a correlation context
 */
export function withCorrelation<T>(
    context: Partial<CorrelationContext>,
    fn: () => T,
): T {
    const fullContext: CorrelationContext = {
        correlationId: context.correlationId || uuidv4(),
        requestId: context.requestId,
        userId: context.userId,
        traceId: context.traceId,
        spanId: context.spanId,
    };

    return correlationStorage.run(fullContext, fn);
}
