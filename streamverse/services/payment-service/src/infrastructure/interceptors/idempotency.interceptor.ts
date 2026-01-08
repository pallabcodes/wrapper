import { Injectable, NestInterceptor, ExecutionContext, CallHandler, ConflictException } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
    // In a real distributed system (Google-scale), this would be Redis.
    // For this implementation, we use an in-memory Map.
    private idempotencyCache = new Map<string, { response: any; timestamp: number }>();
    private readonly TTL = 24 * 60 * 60 * 1000; // 24 hours

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const idempotencyKey = request.headers['idempotency-key'];
        const method = request.method;

        // Only apply to state-changing methods
        if (!idempotencyKey || (method === 'GET' || method === 'HEAD')) {
            return next.handle();
        }

        // Check cache
        const cached = this.idempotencyCache.get(idempotencyKey);
        if (cached) {
            if (Date.now() - cached.timestamp < this.TTL) {
                console.log(`[Idempotency] Serving cached response for key: ${idempotencyKey}`);
                return of(cached.response);
            } else {
                this.idempotencyCache.delete(idempotencyKey);
            }
        }

        // Process request and cache response
        return next.handle().pipe(
            tap(response => {
                console.log(`[Idempotency] Caching new response for key: ${idempotencyKey}`);
                this.idempotencyCache.set(idempotencyKey, {
                    response,
                    timestamp: Date.now(),
                });
            }),
        );
    }
}
