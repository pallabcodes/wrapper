import { Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, AuthProvider, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import { IAuthService, AUTH_SERVICE } from '../../domain/ports/auth-service.port';
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

/**
 * Application Use Case: Verify Magic Link
 *
 * Verifies a magic link token and authenticates the user
 * - Validates token against Redis (checks existence and expiry)
 * - Finds existing user by email
 * - Creates new user if not exists (account provisioning)
 * - Issues access and refresh tokens
 * - Deletes magic link token (one-time use)
 */
@Injectable()
export class VerifyMagicLinkUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(AUTH_SERVICE)
        private readonly authService: IAuthService,
        private readonly redisTokenService: RedisTokenService,
    ) { }

    async execute(request: VerifyMagicLinkRequest): Promise<VerifyMagicLinkResponse> {
        // 1. Validate token with Redis
        const emailStr = await this.redisTokenService.getMagicLinkEmail(request.token);

        if (!emailStr) {
            throw new UnauthorizedException('Invalid or expired magic link');
        }

        // 2. Validate extracted email
        const email = Email.create(emailStr);

        // 3. Find or create user
        let user = await this.userRepository.findByEmail(email);
        let isNewUser = false;

        if (user) {
            // Existing user: Verify status and record login
            if (!user.isActive()) {
                // If user was pending email verification, verify them now since they proved email ownership
                if (user.getStatus() === 'pending') {
                    user.markEmailAsVerified();
                } else if (user.getStatus() === 'suspended' || user.getStatus() === 'deleted') {
                    throw new UnauthorizedException(`Account is ${user.getStatus()}`);
                }
            }

            user.recordLogin();
            await this.userRepository.update(user);
        } else {
            // New user: Create account
            isNewUser = true;
            const username = await this.generateUniqueUsername(email);

            // Magic link users don't have a password
            const dummyPassword = Password.fromHash('$magic$no-password-login');

            // Currently using User constructor or create() method. 
            // We might want to use createFromOAuth or similar factory, 
            // or just create() with a specific provider if we had one for magic link.
            // For now, let's treat them kind of like local users but with no password capability yet,
            // OR we could reuse createFromOAuth if we consider 'magic-link' a provider.
            // But we defined AuthProvider as LOCAL/GOOGLE. 
            // Let's use LOCAL as they *can* set a password later, effectively becoming a local user.

            user = User.create(
                uuidv4(),
                email,
                Username.create(username),
                dummyPassword,
                UserRole.VIEWER
            );

            // Auto-verify email since they just clicked a link sent to it
            user.markEmailAsVerified();
            user.recordLogin();

            await this.userRepository.save(user);
        }

        // 4. Invalidate magic link token (one-time use)
        await this.redisTokenService.deleteMagicLinkToken(request.token);

        // 5. Issue JWT tokens
        const accessToken = await this.authService.generateAccessToken(user);
        const refreshToken = await this.authService.generateRefreshToken(user);

        return {
            user: {
                id: user.getId(),
                email: user.getEmail().getValue(),
                username: user.getUsername().getValue(),
                role: user.getRole(),
                status: user.getStatus(),
            },
            accessToken,
            refreshToken,
            expiresIn: 3600, // 1 hour
            isNewUser,
        };
    }

    /**
     * Generates a unique username based on email
     */
    private async generateUniqueUsername(email: Email): Promise<string> {
        const base = email.getValue().split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
        let username = base;
        let counter = 1;

        // Simple retry logic for uniqueness
        while (await this.userRepository.usernameExists(Username.create(username))) {
            const suffix = Math.floor(Math.random() * 10000).toString();
            username = `${base}${suffix}`;
            counter++;
            if (counter > 10) {
                // Fallback if super unlucky
                username = `${base}${uuidv4().slice(0, 8)}`;
            }
        }

        return username;
    }
}

export interface VerifyMagicLinkRequest {
    token: string;
}

export interface VerifyMagicLinkResponse {
    user: {
        id: string;
        email: string;
        username: string;
        role: string;
        status: string;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}