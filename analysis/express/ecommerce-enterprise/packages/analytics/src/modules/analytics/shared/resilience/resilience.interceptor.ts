import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, defer, firstValueFrom, from, map, race, throwError } from 'rxjs';
import { RESILIENCE_OPTIONS } from './resilience.decorator';
import type { ResilienceOptions, Circuit, Bucket } from './types';
import { CHAOS_OPTIONS, ChaosOptions } from '@ecommerce-enterprise/authx';

const DEFAULTS: Required<Omit<ResilienceOptions, 'enabled'>> = {
  failureRateThreshold: 0.5,
  minimumRps: 5,
  windowMs: 30_000,
  openDurationMs: 20_000,
  halfOpenMaxCalls: 5,
  hedgeAfterMs: 0,
};

@Injectable()
export class ResilienceInterceptor implements NestInterceptor {
  private circuits = new Map<string, Circuit>();
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const handler = context.getHandler();
    const cls = context.getClass();
    const opts = this.mergeOptions(
      this.reflector.get<ResilienceOptions>(RESILIENCE_OPTIONS, handler),
      this.reflector.get<ResilienceOptions>(RESILIENCE_OPTIONS, cls),
    );
    if (!opts.enabled) return next.handle();

    const key = this.buildKey(context);
    const circuit = this.ensureCircuit(key, opts as Required<Omit<ResilienceOptions, 'enabled'>>);

    // Optional chaos injection for resilience testing
    const chaos = this.reflector.get<ChaosOptions | undefined>(CHAOS_OPTIONS, context.getHandler());
    if (chaos && Math.random() < (chaos.probability ?? 0)) {
      const delay = chaos.delayMs ?? 0;
      const shouldError = Math.random() < (chaos.errorRate ?? 0);
      const simulated$ = defer(async () => {
        if (delay > 0) await new Promise((r) => setTimeout(r, delay));
        if (shouldError) throw new Error('InjectedChaosError');
        return await firstValueFrom(next.handle());
      });
      return simulated$;
    }

    // Check circuit state
    if (circuit.state === 'open') {
      const now = Date.now();
      if (!circuit.lastOpenedAt || now - circuit.lastOpenedAt < (opts.openDurationMs || 0)) {
        return throwError(() => new Error('CircuitOpen'));
      }
      // Move to half-open when window elapsed
      circuit.state = 'half_open';
      circuit.halfOpenInFlight = 0;
    }

    if (circuit.state === 'half_open') {
      if (circuit.halfOpenInFlight >= (opts.halfOpenMaxCalls || 0)) {
        return throwError(() => new Error('CircuitHalfOpenMaxed'));
      }
      circuit.halfOpenInFlight++;
    }

    // const start = Date.now();
    const primary$ = next.handle();

    const maybeHedge = (opts.hedgeAfterMs || 0) > 0
      ? this.withHedging(primary$, next, opts.hedgeAfterMs as number)
      : primary$;

    return defer(() => maybeHedge).pipe(
      map((value) => {
        this.record(key, opts as Required<Omit<ResilienceOptions, 'enabled'>>, false);
        if (circuit.state === 'half_open') {
          circuit.state = 'closed';
          circuit.halfOpenInFlight = 0;
        }
        return value;
      }),
      // On error, update circuit and propagate
      (source) => new Observable((subscriber) => {
        const subscription = source.subscribe({
          next: (v) => subscriber.next(v),
          error: (err) => {
            this.record(key, opts as Required<Omit<ResilienceOptions, 'enabled'>>, true);
            if (circuit.state === 'half_open') {
              circuit.state = 'open';
              circuit.lastOpenedAt = Date.now();
              circuit.halfOpenInFlight = 0;
            }
            subscriber.error(err);
          },
          complete: () => subscriber.complete(),
        });
        return () => subscription.unsubscribe();
      }),
    );
  }

  private withHedging(primary$: Observable<unknown>, next: CallHandler, hedgeAfterMs: number): Observable<unknown> {
    // Race the original with a delayed duplicate subscription after hedgeAfterMs
    const hedged$ = defer(async () => {
      await new Promise((r) => setTimeout(r, hedgeAfterMs));
      return firstValueFrom(next.handle());
    });
    return race(primary$, from(hedged$));
  }

  private buildKey(ctx: ExecutionContext): string {
    const req = ctx.switchToHttp().getRequest();
    const method = req.method;
    const url = req.route?.path || req.url;
    return `${method}:${url}`;
  }

  private ensureCircuit(key: string, opts: Required<Omit<ResilienceOptions, 'enabled'>>): Circuit {
    let circuit = this.circuits.get(key);
    if (!circuit) {
      circuit = { state: 'closed', lastOpenedAt: null, halfOpenInFlight: 0, buckets: [] };
      this.circuits.set(key, circuit);
    }
    // prune old buckets
    const cutoff = Date.now() - opts.windowMs;
    circuit.buckets = circuit.buckets.filter((b) => b.ts >= cutoff);
    return circuit;
  }

  private record(key: string, opts: Required<Omit<ResilienceOptions, 'enabled'>>, failure: boolean) {
    const circuit = this.ensureCircuit(key, opts);
    const now = Date.now();
    const currentBucketTs = now - (now % 1000); // 1s buckets
    let bucket = circuit.buckets.find((b) => b.ts === currentBucketTs);
    if (!bucket) {
      bucket = { ts: currentBucketTs, requests: 0, failures: 0 } as Bucket;
      circuit.buckets.push(bucket);
    }
    bucket.requests++;
    if (failure) bucket.failures++;

    // compute over window
    const totalReq = circuit.buckets.reduce((s, b) => s + b.requests, 0);
    const totalFail = circuit.buckets.reduce((s, b) => s + b.failures, 0);
    const rps = totalReq / (opts.windowMs / 1000);
    const failureRate = totalReq > 0 ? totalFail / totalReq : 0;
    if (rps >= opts.minimumRps && failureRate >= opts.failureRateThreshold) {
      circuit.state = 'open';
      circuit.lastOpenedAt = now;
    }
  }

  private mergeOptions(...levels: Array<ResilienceOptions | undefined>): ResilienceOptions & { enabled: boolean } {
    const merged = Object.assign({}, DEFAULTS, ...levels.filter(Boolean));
    return { ...merged, enabled: levels.some((l) => l && l.enabled !== false) } as ResilienceOptions & { enabled: boolean };
  }
}


