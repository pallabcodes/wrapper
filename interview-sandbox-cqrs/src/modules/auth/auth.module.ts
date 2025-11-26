import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { WRITE_REPOSITORY_TOKEN, READ_REPOSITORY_TOKEN, EVENT_BUS_TOKEN } from '../../common/di/tokens';
import { AuthController } from './presentation/http/auth.controller';
import { SequelizeUserWriteRepository, RegisterUserCommandHandler } from './infrastructure/write/persistence/user-write.repository';
import { RegisterUserHandler } from './commands/register-user/register-user.handler';
import { GetUserByIdHandler } from './queries/get-user-by-id/get-user-by-id.handler';

/**
 * Auth Module - CQRS Architecture
 *
 * Demonstrates Command Query Responsibility Segregation with:
 * - Write side: Commands, Aggregates, Event Sourcing
 * - Read side: Queries, Projections, Optimized reads
 * - Symbol-based DI tokens for clean separation
 */
@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    // CQRS Command Handlers
    RegisterUserHandler,
    GetUserByIdHandler,

    // Write Repository (Event-sourced aggregates)
    {
      provide: WRITE_REPOSITORY_TOKEN,
      useClass: SequelizeUserWriteRepository,
    },

    // Read Repository (Optimized for queries)
    {
      provide: READ_REPOSITORY_TOKEN,
      useFactory: () => {
        return {
          findById: async (id: string) => {
            // In real implementation, this would query read database/projection
            console.log('Querying read model for user:', id);
            return {
              id,
              email: 'user@example.com',
              name: 'John Doe',
              role: 'USER',
              isEmailVerified: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            };
          },
          findAll: async () => {
            // In real implementation, this would query read database
            return [];
          },
        };
      },
    },

    // Event Bus for publishing domain events
    {
      provide: EVENT_BUS_TOKEN,
      useFactory: () => {
        return {
          publish: async (event: any) => {
            console.log('Publishing event:', event.eventType, event);
            // In real implementation, this would publish to event bus/message queue
          },
        };
      },
    },

    // Legacy command handler (keeping for compatibility)
    RegisterUserCommandHandler,
  ],
  exports: [WRITE_REPOSITORY_TOKEN, READ_REPOSITORY_TOKEN, EVENT_BUS_TOKEN],
})
export class AuthModule {}

