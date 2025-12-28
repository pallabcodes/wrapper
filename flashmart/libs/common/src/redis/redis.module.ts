import { Module, DynamicModule, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

@Global()
@Module({})
export class RedisModule {
  static forRootAsync(): DynamicModule {
    return {
      module: RedisModule,
      imports: [ConfigModule],
      providers: [
        {
          provide: REDIS_CLIENT,
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            return new Redis({
              host: config.get('REDIS_HOST', 'localhost'),
              port: config.get('REDIS_PORT', 6379),
              password: config.get('REDIS_PASSWORD', undefined),
              db: config.get('REDIS_DB', 0),
              retryStrategy: (times) => {
                if (times > 10) return null;
                return Math.min(times * 100, 3000);
              },
            });
          },
        },
      ],
      exports: [REDIS_CLIENT],
    };
  }
}