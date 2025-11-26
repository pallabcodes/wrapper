import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthController } from './presentation/http/auth.controller';
import { CreateUserHandler } from './application/commands/create-user/create-user.handler';

@Module({
  imports: [CqrsModule],
  controllers: [AuthController],
  providers: [
    // Command Handlers
    CreateUserHandler,

    // Add other providers as needed
  ],
  exports: [],
})
export class AuthModule {}
