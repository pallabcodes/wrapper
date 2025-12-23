import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { HTTP_REQUESTS_TOTAL, HTTP_REQUEST_DURATION } from './metrics.module';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @Inject(HTTP_REQUESTS_TOTAL) private readonly reqTotal: { labels: (method: string, route: string, status: string) => { inc: () => void } },
    @Inject(HTTP_REQUEST_DURATION) private readonly reqDuration: { labels: (method: string, route: string, status: string) => { observe: (value: number) => void } },
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const start = Date.now();
    const method = req.method;
    const route = req.route?.path || req.url;
    return next.handle().pipe(
      tap({
        next: () => {
          const status = String(res.statusCode);
          this.reqTotal.labels(method, route, status).inc();
          this.reqDuration.labels(method, route, status).observe(Date.now() - start);
        },
        error: () => {
          const status = String(res.statusCode || 500);
          this.reqTotal.labels(method, route, status).inc();
          this.reqDuration.labels(method, route, status).observe(Date.now() - start);
        },
      }),
    );
  }
}


