import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.orm-entity';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('JWT_SECRET', 'flashmart-dev-secret'),
                signOptions: {
                    expiresIn: config.get('JWT_EXPIRES_IN', '7d'),
                },
            }),
        }),
        TypeOrmModule.forFeature([UserEntity]),
    ],
    providers: [JwtStrategy, AuthService, AuthResolver],
    exports: [AuthService, JwtModule],
})
export class AuthModule { }
