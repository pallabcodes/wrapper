import { Module, DynamicModule, Provider } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { ConnectionPool } from './utils/connection-pool';
import { QueryCache } from './utils/query-cache';
import { QueryOptimizer } from './utils/query-optimizer';
import { DatabaseMetrics, QueryProfiler, HealthChecker } from './monitoring';
import { HealthController } from './controllers';
import { ConnectionGuard } from './guards';
import { DatabaseOptions } from './interfaces/database-options.interface';

@Module({})
export class DatabaseModule {
  static register(options: DatabaseOptions): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'DATABASE_OPTIONS',
        useValue: options,
      },
      DatabaseService,
      ConnectionPool,
      QueryCache,
      QueryOptimizer,
      DatabaseMetrics,
      QueryProfiler,
      HealthChecker,
      ConnectionGuard,
    ];

    if (options.healthCheck !== false) {
      providers.push(HealthController);
    }

    return {
      module: DatabaseModule,
      providers,
      exports: [
        DatabaseService,
        ConnectionPool,
        QueryCache,
        QueryOptimizer,
        DatabaseMetrics,
        QueryProfiler,
        HealthChecker,
        ConnectionGuard,
      ],
    };
  }

  static registerAsync(options: {
    useFactory: (...args: any[]) => Promise<DatabaseOptions> | DatabaseOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      {
        provide: 'DATABASE_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || [],
      },
      DatabaseService,
      ConnectionPool,
      QueryCache,
      QueryOptimizer,
      DatabaseMetrics,
      QueryProfiler,
      HealthChecker,
      ConnectionGuard,
    ];

    return {
      module: DatabaseModule,
      providers,
      exports: [
        DatabaseService,
        ConnectionPool,
        QueryCache,
        QueryOptimizer,
        DatabaseMetrics,
        QueryProfiler,
        HealthChecker,
        ConnectionGuard,
      ],
    };
  }
}