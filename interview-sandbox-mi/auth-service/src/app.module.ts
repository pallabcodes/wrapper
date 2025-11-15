/**
 * Application Module
 * 
 * Wires together all layers:
 * - Domain: Entities, Ports
 * - Application: Services, DTOs
 * - Infrastructure: Adapters (Repository, Event Publisher)
 * - Presentation: Controllers
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './presentation/controllers/auth.controller';
import { AuthService } from './application/services/auth.service';
import { UserRepositoryAdapter } from './infrastructure/persistence/user.repository.adapter';
import { RedisEventPublisherAdapter } from './infrastructure/messaging/redis.event.publisher.adapter';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { EventPublisherPort, EVENT_PUBLISHER_PORT } from './domain/ports/event.publisher.port';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AuthController],
  providers: [
    AuthService,
    // Wire Ports to Adapters (Dependency Inversion)
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: EVENT_PUBLISHER_PORT,
      useClass: RedisEventPublisherAdapter,
    },
  ],
})
export class AppModule {}

