import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { AuthRepository } from '../auth.repository';
import { SocialProvider } from '../../../database/models/social-auth.model';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
    private authRepository: AuthRepository,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || 'your-facebook-app-id',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || 'your-facebook-app-secret',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '/auth/facebook/callback',
      scope: ['email'],
      profileFields: ['emails', 'name'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, name, emails } = profile;
    const email = emails?.[0]?.value;

    if (!email) {
      return done(new Error('Email not provided by Facebook'), undefined);
    }

    try {
      // Check if social auth exists
      let socialAuth = await this.authRepository.findSocialAuth(
        SocialProvider.FACEBOOK,
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
        const fullName = name?.givenName && name?.familyName
          ? `${name.givenName} ${name.familyName}`
          : email.split('@')[0];
          
        user = await this.authRepository.createUser({
          email,
          password: '', // No password for social auth
          name: fullName,
        });
        
        // Mark email as verified (Facebook verified it)
        await this.authRepository.updateUser(user.id, { isEmailVerified: true });
      }

      // Create social auth record
      await this.authRepository.createSocialAuth({
        userId: user.id,
        provider: SocialProvider.FACEBOOK,
        providerId: id,
      });

      return done(null, { id: user.id, email: user.email, name: user.name });
    } catch (error) {
      return done(error, undefined);
    }
  }
}

