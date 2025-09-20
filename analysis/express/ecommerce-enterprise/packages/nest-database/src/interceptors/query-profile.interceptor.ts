import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { QUERY_PROFILE_KEY, QueryProfileOptions } from '../decorators/query-profile.decorator';
import { QueryProfiler } from '../monitoring/query-profiler';

@Injectable()
export class QueryProfileInterceptor implements NestInterceptor {
  private readonly logger = new Logger(QueryProfileInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly queryProfiler: QueryProfiler,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const profileOptions = this.reflector.get<QueryProfileOptions>(
      QUERY_PROFILE_KEY,
      context.getHandler(),
    );

    if (!profileOptions || !profileOptions.enabled) {
      return next.handle();
    }

    const methodName = context.getHandler().name;
    const profileId = `${methodName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Start profiling
    this.queryProfiler.startQuery(profileId, methodName);

    return next.handle().pipe(
      tap(result => {
        const profile = this.queryProfiler.endQuery(profileId);
        if (profile) {
          this.logger.debug(`Query completed: ${profile.duration}ms`, {
            method: methodName,
            duration: profile.duration,
          });
        }
      }),
      catchError(error => {
        const profile = this.queryProfiler.endQuery(profileId);
        if (profile) {
          this.logger.error(`Query failed: ${profile.duration}ms`, {
            method: methodName,
            duration: profile.duration,
            error: error.message,
          });
        }
        throw error;
      })
    );
  }
}

