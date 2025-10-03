import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, catchError, retry, throwError, timeout } from 'rxjs';

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  constructor(private readonly ms = 3000) {}
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(timeout(this.ms));
  }
}

@Injectable()
export class RetryInterceptor implements NestInterceptor {
  constructor(private readonly attempts = 2) {}
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      retry({ count: this.attempts }),
      catchError((err: Error) => throwError(() => err)),
    );
  }
}
