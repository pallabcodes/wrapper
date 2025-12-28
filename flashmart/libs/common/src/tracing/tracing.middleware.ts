import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { trace, Span, SpanStatusCode, context } from '@opentelemetry/api';

@Injectable()
export class TracingMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tracer = trace.getTracer('flashmart-tracer');
    const spanName = `${req.method} ${req.path}`;

    const span = tracer.startSpan(spanName, {
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.target': req.path,
        'http.scheme': req.protocol,
        'http.host': req.hostname,
        'http.user_agent': req.get('User-Agent'),
        'net.peer.ip': req.ip,
        'correlation.id': req.headers['x-correlation-id'] || req.headers['x-request-id'],
        'user.id': (req as any).user?.sub,
      },
    });

    // Set span in context for child spans
    context.with(trace.setSpan(context.active(), span), () => {
      // Add trace headers for downstream services
      const traceId = span.spanContext().traceId;
      const spanId = span.spanContext().spanId;

      res.setHeader('x-trace-id', traceId);
      res.setHeader('x-span-id', spanId);

      // Track response
      const originalEnd = res.end;
      res.end = function(...args: any[]) {
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_length': res.getHeader('content-length'),
        });

        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          });
        }

        span.end();
        originalEnd.apply(this, args);
      };

      // Handle errors
      const originalOnError = req.on.bind(req);
      req.on('error', (error) => {
        span.recordException(error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      });

      next();
    });
  }
}

// Helper function to create child spans
export function createChildSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  const tracer = trace.getTracer('flashmart-tracer');
  const span = tracer.startSpan(name);

  if (attributes) {
    span.setAttributes(attributes);
  }

  return span;
}

// Helper function to add event to active span
export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = trace.getSpan(context.active());
  if (span) {
    span.addEvent(name, attributes);
  }
}

// Helper function to set span attributes
export function setSpanAttributes(attributes: Record<string, string | number | boolean>) {
  const span = trace.getSpan(context.active());
  if (span) {
    span.setAttributes(attributes);
  }
}

// Helper function to record exception on active span
export function recordSpanException(error: Error) {
  const span = trace.getSpan(context.active());
  if (span) {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
  }
}
