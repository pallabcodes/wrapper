import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { SocialProvider } from '../../../database/models/social-auth.model';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private authRepository: AuthRepository,
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID') || 'your-google-client-id',
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET') || 'your-google-client-secret',
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL') || '/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const email = emails[0]?.value;

    if (!email) {
      return done(new Error('Email not provided by Google'), undefined);
    }

    try {
      // Check if social auth exists
      let socialAuth = await this.authRepository.findSocialAuth(
        SocialProvider.GOOGLE,
        id,
      );

      if (socialAuth) {
        // User exists, return user
        const user = await this.authRepository.findUserById(socialAuth.userId);
        if (!user) {
          return done(new Error('User not found'), undefined);
        }
        return done(null, { id: user.id, email: user.email, name: user.name });
      }

      // Check if user exists by email
      let user = await this.authRepository.findUserByEmail(email);
      
      if (!user) {
        // Create new user
        user = await this.authRepository.createUser({
          email,
          password: '', // No password for social auth
          name: name?.givenName + ' ' + name?.familyName || email.split('@')[0],
        });
        
        // Mark email as verified (Google verified it)
        await this.authRepository.updateUser(user.id, { isEmailVerified: true });
      }

      // Create social auth record
      await this.authRepository.createSocialAuth({
        userId: user.id,
        provider: SocialProvider.GOOGLE,
        providerId: id,
      });

      return done(null, { id: user.id, email: user.email, name: user.name });
    } catch (error) {
      return done(error, undefined);
    }
  }
}

