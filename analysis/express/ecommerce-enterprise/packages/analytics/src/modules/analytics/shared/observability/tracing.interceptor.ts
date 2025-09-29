import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ContextService } from '../cls/context.module';

@Injectable()
export class TracingInterceptor implements NestInterceptor {
  private tracer = trace.getTracer('analytics-http');
  constructor(private readonly ctx: ContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const name = `${req.method} ${req.route?.path || req.url}`;

    const requestId = this.ctx.get('requestId');
    const userId = this.ctx.get('userId');
    const tenantId = this.ctx.get('tenantId');

    const span = this.tracer.startSpan(name);
    span.setAttribute('http.method', req.method);
    span.setAttribute('http.route', req.route?.path || req.url);
    span.setAttribute('http.target', req.url);
    if (requestId) span.setAttribute('request.id', requestId);
    if (userId) span.setAttribute('user.id', userId);
    if (tenantId) span.setAttribute('tenant.id', tenantId);

    return next.handle().pipe(
      tap({
        next: () => {
          span.setAttribute('http.status_code', res.statusCode);
          span.end();
        },
        error: (err) => {
          span.recordException(err as Error);
          span.setAttribute('http.status_code', res.statusCode);
          span.end();
        },
      }),
    );
  }
}


