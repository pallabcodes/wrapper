import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';

/**
 * Infrastructure: Google OAuth 2.0 Strategy
 *
 * Passport.js strategy for Google authentication
 * Handles OAuth flow and profile extraction
 */
@Injectable()
export class GoogleOAuthStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly configService: ConfigService) {
        super({
            clientID: configService.get<string>('GOOGLE_CLIENT_ID'),
            clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET'),
            callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL'),
            scope: ['email', 'profile'],
        });
    }

    /**
     * Validates the Google user profile after successful OAuth
     * Returns a normalized user object for use in the callback handler
     */
    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ): Promise<void> {
        const { id, emails, displayName, photos } = profile;

        // Extract email (Google always provides at least one verified email)
        const email = emails?.[0]?.value;
        if (!email) {
            return done(new Error('No email found in Google profile'), undefined);
        }

        // Create normalized user object
        const user = {
            googleId: id,
            email,
            displayName: displayName || email.split('@')[0],
            avatar: photos?.[0]?.value,
            accessToken, // In case you need to call Google APIs
        };

        done(null, user);
    }
}

/**
 * Type for the validated Google OAuth user
 */
export interface GoogleOAuthUser {
    googleId: string;
    email: string;
    displayName: string;
    avatar?: string;
    accessToken: string;
}
