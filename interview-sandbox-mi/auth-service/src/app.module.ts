/**
 * Application Module - Production Ready
 *
 * Enterprise-grade microservice with:
 * - Hexagonal Architecture (Ports & Adapters)
 * - Health checks and monitoring
 * - CQRS for complex operations
 * - Event-driven communication
 * - Comprehensive logging
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { CqrsModule } from '@nestjs/cqrs';

// Presentation Layer
import { AuthController } from './presentation/controllers/auth.controller';
import { HealthController } from './presentation/controllers/health.controller';

// Application Layer
import { AuthService } from './application/services/auth.service';

// Infrastructure Layer
import { UserRepositoryAdapter } from './infrastructure/persistence/user.repository.adapter';
import { RedisEventPublisherAdapter } from './infrastructure/messaging/redis.event.publisher.adapter';

// Domain Layer Ports
import { UserRepositoryPort, USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { EventPublisherPort, EVENT_PUBLISHER_PORT } from './domain/ports/event.publisher.port';

@Module({
  imports: [
    // Configuration with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV || 'development'}`, '.env'],
    }),

    // Health checks
    TerminusModule,

    // CQRS for command/query separation
    CqrsModule,
  ],
  controllers: [
    AuthController,
    HealthController,
  ],
  providers: [
    // Application Services
    AuthService,

    // Infrastructure Adapters (implement domain ports)
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: RedisEventPublisherAdapter,
    },
  ],
  exports: [
    AuthService,
    USER_REPOSITORY_PORT,
    EVENT_PUBLISHER_PORT,
  ],
})
export class AppModule {}

