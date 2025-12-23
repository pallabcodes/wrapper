import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ContextService } from '../cls/context.module';

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  constructor(private readonly ctx: ContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const start = Date.now();
    const requestId = this.ctx.get('requestId') || 'unknown';
    res.setHeader('x-request-id', requestId);

    const method = req.method;
    const path = req.route?.path || req.url;
    const ip = this.ctx.get('ip') || req.ip;

    this.logger.log(`→ ${method} ${path}`, { requestId, ip });

    return next.handle().pipe(
      tap({
        next: () => {
          const ms = Date.now() - start;
          this.logger.log(`← ${method} ${path} ${res.statusCode} ${ms}ms`, {
            requestId,
            ip,
            statusCode: res.statusCode,
            durationMs: ms,
          });
        },
        error: (err) => {
          const ms = Date.now() - start;
          this.logger.error(`× ${method} ${path} ${res.statusCode} ${ms}ms`, err instanceof Error ? err.stack : String(err));
        },
      }),
    );
  }
}


