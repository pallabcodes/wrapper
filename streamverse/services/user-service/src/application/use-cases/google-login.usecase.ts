import { Inject, Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthProvider } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import { IAuthService, AUTH_SERVICE } from '../../domain/ports/auth-service.port';
import { GoogleOAuthUser } from '../../infrastructure/auth/google-oauth.strategy';

/**
 * Application Use Case: Google OAuth Login
 *
 * Handles user authentication via Google OAuth
 * - Finds existing user by Google ID or email
 * - Creates new user if not exists
 * - Links Google identity to existing account (account linking)
 * - Issues JWT tokens
 */
@Injectable()
export class GoogleLoginUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(AUTH_SERVICE)
        private readonly authService: IAuthService,
    ) { }

    async execute(googleUser: GoogleOAuthUser): Promise<GoogleLoginResult> {
        // 1. Try to find user by Google ID (returning user)
        let user = await this.userRepository.findByGoogleId(googleUser.googleId);

        if (user) {
            // Existing Google user - just record login
            user.recordLogin();
            await this.userRepository.update(user);
            return this.issueTokens(user, false);
        }

        // 2. Try to find user by email (account linking)
        const email = Email.create(googleUser.email);
        user = await this.userRepository.findByEmail(email);

        if (user) {
            // Account exists with same email - this is the account linking scenario
            // For now, we reject and ask user to login with password first
            // A production system might send a verification email to confirm linking
            throw new GoogleLoginException(
                'ACCOUNT_EXISTS',
                'An account with this email already exists. Please login with your password to link your Google account.',
            );
        }

        // 3. Create new user from Google profile
        const username = this.generateUniqueUsername(googleUser.displayName);
        user = User.createFromOAuth(
            uuidv4(),
            email,
            Username.create(username),
            AuthProvider.GOOGLE,
            googleUser.googleId,
        );

        await this.userRepository.save(user);
        return this.issueTokens(user, true);
    }

    private async issueTokens(user: User, isNewUser: boolean): Promise<GoogleLoginResult> {
        const accessToken = await this.authService.generateAccessToken(user);
        const refreshToken = await this.authService.generateRefreshToken(user);

        return {
            user: {
                id: user.getId(),
                email: user.getEmail().getValue(),
                username: user.getUsername().getValue(),
                role: user.getRole(),
                status: user.getStatus(),
                authProvider: user.getAuthProvider(),
            },
            accessToken,
            refreshToken,
            expiresIn: 3600, // 1 hour
            isNewUser,
        };
    }

    /**
     * Generate a unique username from display name
     * Adds random suffix to avoid collisions
     */
    private generateUniqueUsername(displayName: string): string {
        const base = displayName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 20);
        const suffix = Math.random().toString(36).slice(2, 6);
        return `${base}_${suffix}`;
    }
}

export interface GoogleLoginResult {
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
        status: string;
        authProvider: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}

export class GoogleLoginException extends Error {
    constructor(
        public readonly code: 'ACCOUNT_EXISTS' | 'INVALID_PROFILE',
        message: string,
    ) {
        super(message);
        this.name = 'GoogleLoginException';
    }
}
