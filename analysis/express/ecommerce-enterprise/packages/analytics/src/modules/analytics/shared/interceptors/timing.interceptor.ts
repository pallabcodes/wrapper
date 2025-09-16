import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

type Stat = { count: number; totalMs: number; samples: number[] };

@Injectable()
export class TimingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Timing');
  private readonly routeToStats = new Map<string, Stat>();

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req: any = context.switchToHttp().getRequest();
    const route = `${req.method} ${req.originalUrl || req.url}`;
    const start = Date.now();
    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        const stat = this.routeToStats.get(route) || { count: 0, totalMs: 0, samples: [] };
        stat.count += 1;
        stat.totalMs += ms;
        stat.samples.push(ms);
        if (stat.samples.length > 200) stat.samples.shift();
        this.routeToStats.set(route, stat);
        if (stat.count % 50 === 0) {
          const sorted = [...stat.samples].sort((a, b) => a - b);
          const p = (q: number) => sorted[Math.min(sorted.length - 1, Math.floor((q / 100) * sorted.length))] || 0;
          const p50 = p(50);
          const p95 = p(95);
          const avg = Math.round((stat.totalMs / stat.count) * 100) / 100;
          this.logger.log(`${route} avg=${avg}ms p50=${p50}ms p95=${p95}ms samples=${sorted.length}`);
        }
      }),
    );
  }
}


