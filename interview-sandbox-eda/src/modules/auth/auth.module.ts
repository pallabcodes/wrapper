import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AuthController } from './presentation/http/auth.controller';
import { AuthService } from './application/services/auth.service';
import { UserRegistrationService } from './domain/services/user-registration.service';
import { UserRepositoryImpl } from './infrastructure/persistence/user.repository.impl';
import { UserRegisteredHandler } from './infrastructure/event-handlers/user-registered.handler';
import { UserEmailVerifiedHandler } from './infrastructure/event-handlers/user-email-verified.handler';

/**
 * Auth Module - Event-Driven Architecture
 *
 * Demonstrates Event-Driven Architecture patterns:
 * - Domain Events: UserRegisteredEvent, UserEmailVerifiedEvent
 * - Event Handlers: React to domain events asynchronously
 * - Event Bus: Publish/subscribe pattern for loose coupling
 * - Aggregate Root: Publishes domain events
 * - Application Services: Orchestrate domain operations
 */
@Module({
  imports: [
    // Event Emitter for domain events
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    // Application Services
    AuthService,

    // Domain Services
    UserRegistrationService,

    // Infrastructure - Repositories
    {
      provide: 'USER_REPOSITORY',
      useClass: UserRepositoryImpl,
    },

    // Event Handlers - React to domain events
    UserRegisteredHandler,
    UserEmailVerifiedHandler,
  ],
  exports: [
    AuthService,
    'USER_REPOSITORY',
  ],
})
export class AuthModule {}
