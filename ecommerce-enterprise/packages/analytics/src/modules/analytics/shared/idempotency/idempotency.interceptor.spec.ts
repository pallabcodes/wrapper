import { of, firstValueFrom } from 'rxjs';
import { IdempotencyInterceptor } from './idempotency.interceptor';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { InMemoryCacheStore } from '../cache/memory.store';

function ctxWithKey(method = 'POST', key = 'k1'): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ method, url: '/write', route: { path: '/write' }, headers: { 'idempotency-key': key } }),
      getResponse: () => ({ statusCode: 201 }),
    }),
  } as ExecutionContext;
}

describe('IdempotencyInterceptor', () => {
  it('replays cached response on duplicate key', async () => {
    const reflector = { get: () => true } as unknown as Reflector;
    const store = new InMemoryCacheStore();
    const interceptor = new IdempotencyInterceptor(reflector, store);
    const ctx = ctxWithKey();

    const next: CallHandler = { handle: () => of({ ok: 1 }) };
    const v1 = await firstValueFrom(interceptor.intercept(ctx, next));
    expect(v1).toEqual({ ok: 1 });
    // second call should replay
    const v2 = await firstValueFrom(interceptor.intercept(ctx, { handle: () => of({ ok: 2 }) }));
    expect(v2).toEqual({ ok: 1 });
  });
});


