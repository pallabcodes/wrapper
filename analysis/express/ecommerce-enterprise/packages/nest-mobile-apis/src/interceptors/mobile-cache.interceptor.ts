import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MobileCachingService } from '../services/mobile-caching.service';
import { MobileCacheOptions, MOBILE_CACHE_METADATA } from '../decorators/mobile-api.decorator';

@Injectable()
export class MobileCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MobileCacheInterceptor.name);

  constructor(private cachingService: MobileCachingService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    
    const options: MobileCacheOptions = Reflect.getMetadata(MOBILE_CACHE_METADATA, handler) || {};

    // Skip caching if not configured
    if (!options.key && !options.strategy) {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request, options);
    const strategy = options.strategy || 'cache-first';

    // Check cache first for cache-first and cache-only strategies
    if (strategy === 'cache-first' || strategy === 'cache-only') {
      const cached = await this.cachingService.get(cacheKey);
      if (cached) {
        this.logger.debug(`Cache hit for key: ${cacheKey}`);
        return of(cached);
      }

      // If cache-only and no cache, return error
      if (strategy === 'cache-only') {
        this.logger.warn(`Cache miss for cache-only strategy: ${cacheKey}`);
        return of({
          success: false,
          error: {
            code: 'CACHE_MISS',
            message: 'Data not available in cache',
          },
        });
      }
    }

    // Execute the handler
    return next.handle().pipe(
      tap(async (data) => {
        // Cache the result for cache-first and network-first strategies
        if (strategy === 'cache-first' || strategy === 'network-first') {
          try {
            await this.cachingService.set(cacheKey, data, {
              ttl: options.ttl,
              tags: options.tags,
            });
            this.logger.debug(`Cached data for key: ${cacheKey}`);
          } catch (error) {
            this.logger.error(`Failed to cache data for key ${cacheKey}:`, error);
          }
        }
      }),
    );
  }

  private generateCacheKey(request: any, options: MobileCacheOptions): string {
    if (options.key) {
      return options.key;
    }

    // Generate cache key based on request
    const method = request.method;
    const url = request.url;
    const query = JSON.stringify(request.query);
    const deviceInfo = request.deviceInfo;
    
    const deviceKey = deviceInfo ? `${deviceInfo.platform}-${deviceInfo.version}` : 'unknown';
    
    return `mobile-api:${method}:${url}:${deviceKey}:${Buffer.from(query).toString('base64')}`;
  }
}
