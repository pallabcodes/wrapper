import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';
import { PolicyService } from './policy.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { SessionStrategy } from './strategies/session.strategy';
import { AuthController } from '../../../presentation/http/auth.controller';
import { ProtectedController } from '../../../presentation/http/protected.controller';
import { GuardsModule } from '../../../common/guards/guards.module';
import { AuthResponseMapper } from '../../../presentation/mappers/auth-response.mapper';
import { ProtectedResponseMapper } from '../../../presentation/mappers/protected-response.mapper';

/**
 * Authentication Module
 * 
 * Provides:
 * - JWT authentication
 * - Google OAuth
 * - Session management
 * - 2FA (placeholder)
 * - RBAC, Claims, Policies
 */
@Module({
  imports: [
    GuardsModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [
    AuthService,
    TwoFactorService,
    PolicyService,
    JwtStrategy,
    GoogleStrategy,
    LocalStrategy,
    SessionStrategy,
    AuthResponseMapper,
    ProtectedResponseMapper,
    {
      provide: 'AUTH_SERVICE',
      useExisting: AuthService,
    },
  ],
  controllers: [AuthController, ProtectedController],
  exports: [AuthService, PolicyService],
})
export class AuthModule {}

