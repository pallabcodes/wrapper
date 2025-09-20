import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiOrmService } from './services/multi-orm.service';
import { PrismaService } from './services/prisma.service';
import { DrizzleService } from './services/drizzle.service';
import { TypeOrmService } from './services/typeorm.service';
import { CacheService } from './services/cache.service';
import { PerformanceService } from './services/performance.service';
import { ORMOptions } from './interfaces/orm-options.interface';

@Module({})
export class NestOrmModule {
  static forRoot(options: ORMOptions): DynamicModule {
    const providers: Provider[] = [
      MultiOrmService,
      PrismaService,
      DrizzleService,
      TypeOrmService,
      CacheService,
      PerformanceService,
      {
        provide: 'ORM_OPTIONS',
        useValue: options
      }
    ];

    return {
      module: NestOrmModule,
      imports: [ConfigModule],
      providers,
      exports: [
        MultiOrmService,
        PrismaService,
        DrizzleService,
        TypeOrmService,
        CacheService,
        PerformanceService
      ],
      global: true
    };
  }

  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<ORMOptions> | ORMOptions;
    inject?: any[];
  }): DynamicModule {
    const providers: Provider[] = [
      MultiOrmService,
      PrismaService,
      DrizzleService,
      TypeOrmService,
      CacheService,
      PerformanceService,
      {
        provide: 'ORM_OPTIONS',
        useFactory: options.useFactory,
        inject: options.inject || []
      }
    ];

    return {
      module: NestOrmModule,
      imports: [ConfigModule, ...(options.imports || [])],
      providers,
      exports: [
        MultiOrmService,
        PrismaService,
        DrizzleService,
        TypeOrmService,
        CacheService,
        PerformanceService
      ],
      global: true
    };
  }
}
