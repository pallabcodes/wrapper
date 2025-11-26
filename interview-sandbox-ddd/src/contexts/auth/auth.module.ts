import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Application Layer
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { VerifyUserEmailUseCase } from './application/use-cases/verify-user-email.use-case';
import { GetUserByIdUseCase } from './application/use-cases/get-user-by-id.use-case';

// Domain Layer
import { UserRegistrationDomainService } from './domain/domain-services/user-registration.service';

// Infrastructure Layer
import { UserRepositoryImpl } from './infrastructure/persistence/user.repository.impl';

// Presentation Layer
import { AuthController } from './presentation/http/auth.controller';

/**
 * Auth Bounded Context Module - Domain-Driven Design
 *
 * This module implements the Authentication bounded context using DDD principles:
 * - Domain Layer: Entities, Value Objects, Aggregates, Domain Services, Domain Events
 * - Application Layer: Use Cases, Application Services, DTOs
 * - Infrastructure Layer: Repositories, External Services, Persistence
 * - Presentation Layer: HTTP Controllers, DTOs, Mappers
 */
@Module({
  imports: [
    // CQRS for command/query separation
    CqrsModule,

    // Event Emitter for domain events
    EventEmitterModule.forRoot(),
  ],
  controllers: [AuthController],
  providers: [
    // Application Layer - Use Cases
    RegisterUserUseCase,
    VerifyUserEmailUseCase,
    GetUserByIdUseCase,

    // Domain Layer - Domain Services
    UserRegistrationDomainService,

    // Infrastructure Layer - Repository Implementations
    {
      provide: 'IUserRepository',
      useClass: UserRepositoryImpl,
    },
  ],
  exports: [
    // Export use cases for other bounded contexts if needed
    RegisterUserUseCase,
    GetUserByIdUseCase,

    // Export repository interface for dependency injection
    'IUserRepository',
  ],
})
export class AuthModule {}
