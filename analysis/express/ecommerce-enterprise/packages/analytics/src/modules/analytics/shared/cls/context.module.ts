import { Global, Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AsyncLocalStorage } from 'node:async_hooks';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';

export class RequestContext {
  constructor(
    public requestId: string,
    public userId?: string,
    public tenantId?: string,
    public ip?: string,
    public userAgent?: string,
  ) {}
}

export class ContextService {
  constructor(private readonly als: AsyncLocalStorage<RequestContext>) {}
  runWithContext<T>(ctx: RequestContext, fn: () => T): T {
    return this.als.run(ctx, fn);
  }
  get<T extends keyof RequestContext>(key: T): RequestContext[T] | undefined {
    return this.als.getStore()?.[key];
  }
  set<T extends keyof RequestContext>(key: T, value: RequestContext[T]): void {
    const store = this.als.getStore();
    if (store) {
      store[key] = value;
    }
  }
  getAll(): RequestContext | undefined {
    return this.als.getStore();
  }
}

export function contextMiddleware(als: AsyncLocalStorage<RequestContext>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const requestId = (req.headers['x-request-id'] as string) || uuidv4();
    const ctx = new RequestContext(
      requestId,
      undefined, // userId
      undefined, // tenantId
      req.ip || '',
      (req.headers['user-agent'] as string) || '',
    );
    als.run(ctx, next);
  };
}

@Global()
@Module({
  providers: [
    { provide: AsyncLocalStorage, useValue: new AsyncLocalStorage<RequestContext>() },
    { provide: ContextService, useFactory: (als: AsyncLocalStorage<RequestContext>) => new ContextService(als), inject: [AsyncLocalStorage] },
  ],
  exports: [ContextService],
})
export class ContextModule implements NestModule {
  constructor(private readonly als: AsyncLocalStorage<RequestContext>) {}
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(contextMiddleware(this.als)).forRoutes('*');
  }
}


