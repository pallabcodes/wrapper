import { Module } from '@nestjs/common';
import { WRITE_REPOSITORY_TOKEN, READ_REPOSITORY_TOKEN } from '../../common/di/tokens';
import { 
  SequelizeUserWriteRepository, 
  RegisterUserCommandHandler 
} from './infrastructure/write/persistence/user-write.repository';

/**
 * Auth Module demonstrating Symbol token registration
 */
@Module({
  providers: [
    // Register write repository with Symbol token
    {
      provide: WRITE_REPOSITORY_TOKEN,
      useClass: SequelizeUserWriteRepository,
    },
    // Register read repository with Symbol token (using useFactory)
    {
      provide: READ_REPOSITORY_TOKEN,
      useFactory: () => {
        return {
          findById: async (id: string) => {
            // Optimized read query
            return { id, email: 'user@example.com', name: 'John Doe' };
          },
          findAll: async () => {
            return [];
          },
        };
      },
    },
    // Command handler that uses Symbol-injected repository
    RegisterUserCommandHandler,
  ],
  exports: [WRITE_REPOSITORY_TOKEN, READ_REPOSITORY_TOKEN],
})
export class AuthModule {}

