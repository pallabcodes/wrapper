import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { Username } from '../../domain/value-objects/username.vo';
import { Password } from '../../domain/value-objects/password.vo';
import { PhoneNumber } from '../../domain/value-objects/phone-number.vo';
import { IUserRepository, USER_REPOSITORY } from '../../domain/ports/user-repository.port';
import { IAuthService, AUTH_SERVICE } from '../../domain/ports/auth-service.port';
import { RedisTokenService } from '../../infrastructure/cache/redis-token.service';

/**
 * Application Use Case: Verify OTP
 *
 * Verifies OTP code and authenticates the user
 * - Validates code against Redis
 * - Finds existing user by email/phone
 * - Creates new user if not exists
 * - Issues access and refresh tokens
 * - Deletes OTP (one-time use)
 */
@Injectable()
export class VerifyOtpUseCase {
    constructor(
        @Inject(USER_REPOSITORY)
        private readonly userRepository: IUserRepository,
        @Inject(AUTH_SERVICE)
        private readonly authService: IAuthService,
        private readonly redisTokenService: RedisTokenService,
    ) { }

    async execute(request: VerifyOtpRequest): Promise<VerifyOtpResponse> {
        const { identifier, code } = request;

        // 1. Verify OTP with Redis
        const storedCode = await this.redisTokenService.getOtp(identifier);

        if (!storedCode || storedCode !== code) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        // 2. Identify User (Logic differs for Email vs Phone)
        let user: User | null = null;
        let isNewUser = false;

        // Detect if identifier is email
        const isEmail = identifier.includes('@');

        if (isEmail) {
            const email = Email.create(identifier);
            user = await this.userRepository.findByEmail(email);

            if (!user) {
                // Create new user (Email OTP sign up)
                isNewUser = true;
                const username = await this.generateUniqueUsername(identifier);

                user = User.create(
                    uuidv4(),
                    email,
                    Username.create(username),
                    Password.fromHash('$otp$no-password'),
                    UserRole.VIEWER
                );
                user.markEmailAsVerified(); // OTP proves ownership
                await this.userRepository.save(user);
            }
        } else {
            // Phone OTP (SMS) - Native Support
            const phoneNumber = PhoneNumber.create(identifier);

            // Try to find user by phone number (Native lookup)
            user = await this.userRepository.findByPhoneNumber(phoneNumber);

            if (!user) {
                // Create new user for this Phone Number
                isNewUser = true;

                // Generate username from phone number (last 4 digits)
                // Remove + for cleaner username generation
                const rawPhone = identifier.replace('+', '');
                const baseUsername = `user${rawPhone.slice(-4)}`;
                const username = await this.generateUniqueUsername(baseUsername);

                // Use placeholder email until email is made optional in domain
                // We use a distinct domain to avoid conflicts with real emails
                const placeholderEmail = Email.create(`${rawPhone}@phone.streamverse.local`);

                user = User.create(
                    uuidv4(),
                    placeholderEmail,
                    Username.create(username),
                    Password.fromHash('$sms$no-password'),
                    UserRole.VIEWER,
                    phoneNumber
                );
                user.markEmailAsVerified(); // Phone OTP proves ownership
                await this.userRepository.save(user);
            }
        }

        if (user) {
            user.recordLogin();
            await this.userRepository.update(user);
        }

        // 3. Delete OTP (one-time use)
        await this.redisTokenService.deleteOtp(identifier);

        // 4. Issue Tokens
        const accessToken = await this.authService.generateAccessToken(user);
        const refreshToken = await this.authService.generateRefreshToken(user);

        return {
            user: {
                id: user.getId(),
                email: user.getEmail().getValue(),
                username: user.getUsername().getValue(),
                role: user.getRole(),
                status: user.getStatus(),
                createdAt: user.getCreatedAt(),
                updatedAt: user.getUpdatedAt(),
            },
            accessToken,
            refreshToken,
            expiresIn: 3600,
            isNewUser,
        };
    }

    private async generateUniqueUsername(baseStr: string): Promise<string> {
        const base = baseStr.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 15);
        let username = base;
        let counter = 1;
        while (await this.userRepository.usernameExists(Username.create(username))) {
            const suffix = Math.floor(Math.random() * 10000).toString();
            username = `${base}${suffix}`;
            counter++;
            if (counter > 10) username = `${base}${uuidv4().slice(0, 8)}`;
        }
        return username;
    }
}

export interface VerifyOtpRequest {
    identifier: string;
    code: string;
}

export interface VerifyOtpResponse {
    user: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
        status: UserStatus;
        createdAt: Date;
        updatedAt: Date;
    };
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    isNewUser: boolean;
}