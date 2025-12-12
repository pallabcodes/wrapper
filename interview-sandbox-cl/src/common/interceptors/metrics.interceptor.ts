import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MetricsService } from '@infrastructure/monitoring/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const stopTimer = this.metrics.startTimer();
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const route = request?.route?.path || request?.url || 'unknown';
    const method = request?.method || 'UNKNOWN';

    return next.handle().pipe(
      tap(() => {
        const duration = stopTimer();
        const status = response?.statusCode ?? 200;
        this.metrics.recordRequest(duration, { method, route, status: String(status) });
      }),
      catchError((err) => {
        const duration = stopTimer();
        const status = err?.status || err?.statusCode || response?.statusCode || 500;
        this.metrics.recordRequest(duration, { method, route, status: String(status) });
        throw err;
      }),
    );
  }
}
