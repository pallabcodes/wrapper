import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { QUERY_CACHE_KEY, QueryCacheOptions } from '../decorators/query-cache.decorator';

interface QueryCache {
  get<T = unknown>(key: string): Promise<T | undefined>;
  set<T = unknown>(key: string, value: T, ttl?: number, tags?: string[]): Promise<void>;
}

interface QueryCacheRequest {
  method?: string;
  queryCache?: QueryCache;
  body?: Record<string, unknown>;
  query?: Record<string, string | string[] | undefined>;
}

@Injectable()
export class QueryCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueryCacheInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept<T = unknown>(context: ExecutionContext, next: CallHandler): Observable<T> {
    const cacheOptions = this.reflector.get<QueryCacheOptions>(
      QUERY_CACHE_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<QueryCacheRequest>();
    const queryCache = request.queryCache;

    if (!queryCache) {
      this.logger.warn('Query cache not available');
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(context, cacheOptions);
    
    return new Observable<T>(subscriber => {
      queryCache.get<T>(cacheKey)
        .then((cachedResult: T | undefined) => {
          if (cachedResult !== undefined && !cacheOptions.refresh) {
            this.logger.debug(`Cache hit for key: ${cacheKey}`);
            subscriber.next(cachedResult);
            subscriber.complete();
            return;
          }

          next.handle()
            .pipe(
              tap((result: T) => {
                queryCache.set(cacheKey, result, cacheOptions.ttl, cacheOptions.tags)
                  .then(() => {
                    this.logger.debug(`Cached result for key: ${cacheKey}`);
                  })
                  .catch((error: Error) => {
                    this.logger.error('Failed to cache result', error);
                  });
              })
            )
            .subscribe({
              next: (result: T) => {
                subscriber.next(result);
                subscriber.complete();
              },
              error: (error: Error) => {
                subscriber.error(error);
              }
            });
        })
        .catch((error: Error) => {
          this.logger.error('Cache lookup failed', error);
          next.handle().subscribe({
            next: (result: T) => {
              subscriber.next(result);
              subscriber.complete();
            },
            error: (error: Error) => {
              subscriber.error(error);
            }
          });
        });
    });
  }

  private buildCacheKey(context: ExecutionContext, options: QueryCacheOptions): string {
    if (options.key) {
      return options.key;
    }

    const request = context.switchToHttp().getRequest<QueryCacheRequest>();
    const method = context.getHandler().name;
    const args = JSON.stringify(request.body || request.query || {});
    
    return `query:${method}:${Buffer.from(args).toString('base64')}`;
  }
}

