import { CallHandler, ExecutionContext, Inject, Injectable, NestInterceptor, BadRequestException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of, tap } from 'rxjs';
import { IDEMPOTENCY } from './idempotency.decorator';
import { CACHE_STORE } from '../cache/cache.module';
import type { CacheStore, CacheEntry } from '../cache/cache.types';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector, @Inject(CACHE_STORE) private readonly store: CacheStore) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const enabled = this.reflector.get<boolean | undefined>(IDEMPOTENCY, handler);
    if (!enabled) return next.handle();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    const method = req.method.toUpperCase();
    if (method !== 'POST' && method !== 'PUT' && method !== 'PATCH') return next.handle();

    const key = req.headers['idempotency-key'] as string | undefined;
    if (!key) throw new BadRequestException('Idempotency-Key header required');
    const cacheKey = `idem:${method}:${req.route?.path || req.url}:${key}`;

    const existing = this.store.get(cacheKey) as CacheEntry<{ statusCode: number; body: unknown }> | undefined;
    if (existing && Date.now() < existing.expireAt) {
      // replay stored response
      res.statusCode = (existing.value?.statusCode as number) || res.statusCode;
      return of(existing.value?.body);
    }

    return next.handle().pipe(
      tap((body) => {
        const ttlMs = 60_000; // 1 minute default replay window
        const now = Date.now();
        const entry: CacheEntry<{ statusCode: number; body: unknown }> = {
          value: { statusCode: res.statusCode, body },
          cachedAt: now,
          staleAt: now + ttlMs,
          expireAt: now + ttlMs,
        };
        this.store.set(cacheKey, entry);
      }),
    );
  }
}


