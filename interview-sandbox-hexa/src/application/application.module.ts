import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Application Services
import { AuthService } from './services/auth.service';

// Use Cases
import { RegisterUserUseCase } from './use-cases/register-user.use-case';
import { LoginUserUseCase } from './use-cases/login-user.use-case';
import { GetUserByIdUseCase } from './use-cases/get-user-by-id.use-case';

// Infrastructure
import { UserRepository } from '../infrastructure/persistence/user.repository';

/**
 * Application Layer Module - Hexagonal Architecture
 *
 * Contains:
 * - Application Services (orchestrate use cases)
 * - Use Cases (application logic)
 * - Application Events
 * - DTOs and Mappers
 *
 * This layer orchestrates domain objects and handles cross-cutting concerns.
 * It depends on domain ports (interfaces) but not on infrastructure implementations.
 */
@Module({
  imports: [
    CqrsModule,
    EventEmitterModule.forRoot(),
  ],
  providers: [
    // Application Services
    AuthService,

    // Use Cases (implement domain input ports)
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserByIdUseCase,

    // Infrastructure Adapters (implement domain output ports)
    {
      provide: 'IUserRepository',
      useClass: UserRepository,
    },
  ],
  exports: [
    // Export application services for presentation layer
    AuthService,

    // Export use cases if needed by other modules
    RegisterUserUseCase,
    LoginUserUseCase,
    GetUserByIdUseCase,
  ],
})
export class ApplicationModule {}
