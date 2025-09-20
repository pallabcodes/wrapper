import { of, throwError } from 'rxjs';
import { ResilienceInterceptor } from './resilience.interceptor';
import { Reflector } from '@nestjs/core';
import type { ExecutionContext, CallHandler } from '@nestjs/common';

function ctxFor(path: string): ExecutionContext {
  return {
    getHandler: () => ({} as any),
    getClass: () => ({} as any),
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: path, route: { path } }),
    }),
  } as any;
}

describe('ResilienceInterceptor', () => {
  it('remains closed on low failure rate', (done) => {
    const reflector = { get: () => ({ enabled: true, windowMs: 1000, minimumRps: 1 }) } as unknown as Reflector;
    const itc = new ResilienceInterceptor(reflector);
    const ctx = ctxFor('/ok');
    const next: CallHandler = { handle: () => of('ok') } as any;
    itc.intercept(ctx, next).subscribe((v) => {
      expect(v).toBe('ok');
      done();
    });
  });

  it('opens circuit on high failure rate and short-circuits', (done) => {
    const reflector = { get: () => ({ enabled: true, windowMs: 200, minimumRps: 1, failureRateThreshold: 0.5, openDurationMs: 500 }) } as unknown as Reflector;
    const itc = new ResilienceInterceptor(reflector);
    const ctx = ctxFor('/flaky');

    const failNext: CallHandler = { handle: () => throwError(() => new Error('downstream')) } as any;
    const okNext: CallHandler = { handle: () => of('ok') } as any;

    // two failures to trip
    itc.intercept(ctx, failNext).subscribe({ error: () => {
      itc.intercept(ctx, failNext).subscribe({ error: () => {
        // now circuit should be open and short-circuit
        itc.intercept(ctx, okNext).subscribe({
          next: () => done.fail('should have short-circuited'),
          error: (err) => {
            expect(String(err)).toContain('CircuitOpen');
            done();
          }
        });
      }});
    }});
  });
});


