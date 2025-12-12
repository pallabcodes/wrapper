import { Injectable, NestMiddleware } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { v4 as uuid } from 'uuid';
import { CustomLoggerService } from '@infrastructure/logging/logger.service';

@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: CustomLoggerService) {}

  use(req: any, res: any, next: () => void) {
    const correlationId = req.headers['x-correlation-id'] || uuid();
    req.correlationId = correlationId;
    res.setHeader('X-Correlation-Id', correlationId);

    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      const activeSpan = trace.getActiveSpan();
      const spanContext = activeSpan?.spanContext();
      const traceId = spanContext?.traceId || req.traceId || correlationId;
      const spanId = spanContext?.spanId || req.spanId;
      this.logger.log('request', 'HTTP', {
        method: req.method,
        path: req.originalUrl || req.url,
        status: res.statusCode,
        duration_ms: duration,
        correlationId,
        traceId,
        spanId,
      });
    });

    next();
  }
}
