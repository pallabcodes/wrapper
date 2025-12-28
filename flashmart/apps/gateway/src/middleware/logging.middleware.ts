import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
    private readonly logger = new Logger('Gateway');

    use(req: Request, res: Response, next: NextFunction) {
        const startTime = Date.now();
        const requestId = req.headers['x-request-id'] as string || 'unknown';

        // Log request
        this.logger.log({
            type: 'request',
            requestId,
            method: req.method,
            path: req.path,
            query: Object.keys(req.query).length > 0 ? req.query : undefined,
            userAgent: req.headers['user-agent'],
            ip: req.ip,
            userId: (req as any).user?.sub,
        });

        // Capture response
        const originalSend = res.send.bind(res);
        res.send = (body: any) => {
            const duration = Date.now() - startTime;

            // Log response
            this.logger.log({
                type: 'response',
                requestId,
                method: req.method,
                path: req.path,
                statusCode: res.statusCode,
                duration,
                contentLength: body?.length || 0,
            });

            // Add timing header
            res.setHeader('X-Response-Time', `${duration}ms`);

            return originalSend(body);
        };

        next();
    }
}

// Structured log format for production (JSON)
export interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error';
    type: 'request' | 'response' | 'error';
    requestId: string;
    method?: string;
    path?: string;
    statusCode?: number;
    duration?: number;
    userId?: string;
    error?: {
        message: string;
        stack?: string;
    };
    [key: string]: any;
}
