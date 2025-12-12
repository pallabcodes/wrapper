import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { context as otelContext, SpanStatusCode, trace } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { getTracer } from '@infrastructure/observability/tracing';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const tracer = getTracer();
    const request = context.switchToHttp().getRequest();
    const route = request?.route?.path || request?.url || 'unknown';
    const method = request?.method || 'UNKNOWN';

    const span = tracer.startSpan(`HTTP ${method} ${route}`, {
      attributes: {
        'http.method': method,
        'http.route': route,
        'http.url': request?.url,
        'http.host': request?.headers?.host,
      },
    });

    const spanCtx = span.spanContext();
    request.traceId = spanCtx.traceId;
    request.spanId = spanCtx.spanId;

    const activeContext = trace.setSpan(otelContext.active(), span);
    let errored = false;

    const stream = next.handle().pipe(
      tap(() => {
        if (!errored) {
          span.setStatus({ code: SpanStatusCode.OK });
        }
      }),
      catchError((err) => {
        errored = true;
        span.setStatus({ code: SpanStatusCode.ERROR, message: err?.message });
        span.recordException(err);
        throw err;
      }),
      finalize(() => {
        span.end();
      }),
    );

    return otelContext.with(activeContext, () => stream) as unknown as Observable<any>;
  }
}
