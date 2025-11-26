import { ConfigService } from '@nestjs/config';

export interface AuthConfig {
  JWT: {
    SECRET: string;
    ACCESS_TOKEN_EXPIRATION: string;
    REFRESH_TOKEN_EXPIRATION: string;
  };
  BCRYPT: {
    SALT_ROUNDS: number;
  };
  PASSWORD: {
    MIN_LENGTH: number;
    REQUIRE_UPPERCASE: boolean;
    REQUIRE_LOWERCASE: boolean;
    REQUIRE_NUMBER: boolean;
  };
}

export function createAuthConfig(configService: ConfigService): AuthConfig {
  const jwtSecret = configService.get<string>('JWT_SECRET');
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return {
    JWT: {
      SECRET: jwtSecret,
      ACCESS_TOKEN_EXPIRATION: configService.get<string>('JWT_ACCESS_EXPIRATION', '15m'),
      REFRESH_TOKEN_EXPIRATION: configService.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
    },
    BCRYPT: {
      SALT_ROUNDS: configService.get<number>('BCRYPT_SALT_ROUNDS', 12),
    },
    PASSWORD: {
      MIN_LENGTH: configService.get<number>('PASSWORD_MIN_LENGTH', 8),
      REQUIRE_UPPERCASE: configService.get<boolean>('PASSWORD_REQUIRE_UPPERCASE', true),
      REQUIRE_LOWERCASE: configService.get<boolean>('PASSWORD_REQUIRE_LOWERCASE', true),
      REQUIRE_NUMBER: configService.get<boolean>('PASSWORD_REQUIRE_NUMBER', true),
    },
  };
}
