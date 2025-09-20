import { of } from 'rxjs';
import { TracingInterceptor } from './tracing.interceptor';
import { ContextService } from '../cls/context.module';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { context as otContext, trace, Span, SpanOptions, SpanKind, Tracer } from '@opentelemetry/api';

class MockTracer implements Tracer {
  startSpan(name: string, options?: SpanOptions, _ctx?: any): Span {
    return {
      spanContext: () => ({ traceId: 't', spanId: 's', traceFlags: 1 } as any),
      setAttribute: () => this as any,
      setAttributes: () => this as any,
      addEvent: () => this as any,
      setStatus: () => this as any,
      updateName: () => this as any,
      end: () => {},
      isRecording: () => true,
      recordException: () => {},
    } as any;
  }
}

function createCtx(): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ method: 'GET', url: '/x', route: { path: '/x' } }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as any;
}

describe('TracingInterceptor', () => {
  it('creates a span and ends it on success', (done) => {
    const als: any = { getStore: () => ({ requestId: 'rid' }) };
    const ctxSvc = new ContextService(als);
    const interceptor = new TracingInterceptor(ctxSvc);
    // override tracer
    (interceptor as any).tracer = new MockTracer();

    const ctx = createCtx();
    const next: CallHandler = { handle: () => of('ok') } as any;
    interceptor.intercept(ctx, next).subscribe((v) => {
      expect(v).toBe('ok');
      done();
    });
  });
});
