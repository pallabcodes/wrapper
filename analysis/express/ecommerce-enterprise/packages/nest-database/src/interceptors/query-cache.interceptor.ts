import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { QUERY_CACHE_KEY, QueryCacheOptions } from '../decorators/query-cache.decorator';

@Injectable()
export class QueryCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueryCacheInterceptor.name);

  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const cacheOptions = this.reflector.get<QueryCacheOptions>(
      QUERY_CACHE_KEY,
      context.getHandler(),
    );

    if (!cacheOptions) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const queryCache = request.queryCache; // Assuming this is injected

    if (!queryCache) {
      this.logger.warn('Query cache not available');
      return next.handle();
    }

    const cacheKey = this.buildCacheKey(context, cacheOptions);
    
    return new Observable(subscriber => {
      queryCache.get(cacheKey)
        .then(cachedResult => {
          if (cachedResult && !cacheOptions.refresh) {
            this.logger.debug(`Cache hit for key: ${cacheKey}`);
            subscriber.next(cachedResult);
            subscriber.complete();
            return;
          }

          next.handle()
            .pipe(
              tap(result => {
                queryCache.set(cacheKey, result, cacheOptions.ttl, cacheOptions.tags)
                  .then(() => {
                    this.logger.debug(`Cached result for key: ${cacheKey}`);
                  })
                  .catch(error => {
                    this.logger.error('Failed to cache result', error);
                  });
              })
            )
            .subscribe({
              next: result => {
                subscriber.next(result);
                subscriber.complete();
              },
              error: error => {
                subscriber.error(error);
              }
            });
        })
        .catch(error => {
          this.logger.error('Cache lookup failed', error);
          next.handle().subscribe({
            next: result => {
              subscriber.next(result);
              subscriber.complete();
            },
            error: error => {
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

    const request = context.switchToHttp().getRequest();
    const method = context.getHandler().name;
    const args = JSON.stringify(request.body || request.query || {});
    
    return `query:${method}:${Buffer.from(args).toString('base64')}`;
  }
}

