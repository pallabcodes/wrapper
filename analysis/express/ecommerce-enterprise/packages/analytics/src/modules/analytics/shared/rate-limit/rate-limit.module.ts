import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { IORedisModule } from '@nestjs-modules/ioredis';
// import type { RateLimitStorage } from './rate-limit.types';
import { RedisRateLimitStorage } from './redis-rate-limit.storage';
import { MemoryRateLimitStorage } from './memory-rate-limit.storage';
import { RateLimitGuard } from './rate-limit.guard';

@Module({
  imports: [
    ConfigModule,
    IORedisModule.forRootAsync({
      config: {
        host: 'localhost',
        port: 6379,
        retryDelayOnFailover: 100,
        enableReadyCheck: false,
        maxRetriesPerRequest: 3,
      },
    }),
  ],
  providers: [
    {
      provide: 'RateLimitStorage',
      useFactory: (configService: ConfigService) => {
        const useRedis = configService.get('REDIS_HOST');
        if (useRedis) {
          return new RedisRateLimitStorage(configService.get('redis') as any);
        }
        return new MemoryRateLimitStorage();
      },
      inject: [ConfigService],
    },
    RateLimitGuard,
  ],
  exports: ['RateLimitStorage', RateLimitGuard],
})
export class RateLimitModule {}
