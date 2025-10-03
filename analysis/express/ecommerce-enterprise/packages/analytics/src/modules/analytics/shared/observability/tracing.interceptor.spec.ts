import { of } from 'rxjs';
import { TracingInterceptor } from './tracing.interceptor';
import { ContextService } from '../cls/context.module';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { context as otContext, trace, Span, SpanOptions, SpanKind, Tracer } from '@opentelemetry/api';

class MockTracer implements Tracer {
  startSpan(name: string, options?: SpanOptions, _ctx?: unknown): Span {
    return {
      spanContext: () => ({ traceId: 't', spanId: 's', traceFlags: 1 }),
      setAttribute: () => this,
      setAttributes: () => this,
      addEvent: () => this,
      setStatus: () => this,
      updateName: () => this,
      end: () => {},
      isRecording: () => true,
      recordException: () => {},
    } as Span;
  }
}

function createCtx(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/x', route: { path: '/x' } }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as ExecutionContext;
}

describe('TracingInterceptor', () => {
  it('creates a span and ends it on success', (done) => {
    const als = { getStore: () => ({ requestId: 'rid' }) };
    const ctxSvc = new ContextService(als);
    const interceptor = new TracingInterceptor(ctxSvc);
    // override tracer
    (interceptor as { tracer: Tracer }).tracer = new MockTracer();

    const ctx = createCtx();
    const next: CallHandler = { handle: () => of('ok') };
    interceptor.intercept(ctx, next).subscribe((v) => {
      expect(v).toBe('ok');
      done();
    });
  });
});
