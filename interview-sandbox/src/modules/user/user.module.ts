import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';
import { User } from '../../database/models/user.model';
import { UserResponseMapper } from './mappers/user-response.mapper';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService, UserRepository, UserResponseMapper],
  exports: [UserService],
})
export class UserModule {}

