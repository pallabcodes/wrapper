import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { User } from '../../database/models/user.model';
import { Otp } from '../../database/models/otp.model';
import { SocialAuth } from '../../database/models/social-auth.model';
import { createAuthModules } from '@common/utils/module-helpers';
import { AuthResponseMapper } from './mappers/auth-response.mapper';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    SequelizeModule.forFeature([User, Otp, SocialAuth]),
    ...createAuthModules(), // JWT + Passport in one line
    NotificationsModule, // For real-time notifications
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthRepository, AuthResponseMapper, JwtStrategy, GoogleStrategy, FacebookStrategy],
  exports: [AuthService],
})
export class AuthModule {}

