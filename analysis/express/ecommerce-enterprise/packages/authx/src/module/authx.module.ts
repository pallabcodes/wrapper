import { DynamicModule, Module, Provider } from '@nestjs/common';
import { JwtServiceX } from '../services/jwt.service';
import { OidcService } from '../services/oidc.service';
import { SessionStore } from '../services/session.store';
import { WebAuthnService } from '../services/webauthn.service';

export interface AuthXModuleOptions {
  session?: { redisUrl?: string; ttlSeconds?: number; rolling?: boolean };
  jwt?: {
    accessTtlSeconds: number;
    refreshTtlSeconds: number;
    issuer: string;
    audience: string;
    jwksUrl?: string;
    privateKeyPem?: string;
    publicKeyPem?: string;
  };
  oidc?: { issuer: string; clientId: string; clientSecret?: string; redirectUri: string };
  webauthn?: { rpName: string; rpID: string; origin: string };
}

export interface AuthXModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => Promise<AuthXModuleOptions> | AuthXModuleOptions;
}

@Module({})
export class AuthXModule {
  static register(options: AuthXModuleOptions): DynamicModule {
    return {
      module: AuthXModule,
      global: true,
      providers: [
        { provide: 'AUTHX_OPTIONS', useValue: options },
        SessionStore,
        JwtServiceX,
        OidcService,
        WebAuthnService,
      ],
      exports: [SessionStore, JwtServiceX, OidcService, WebAuthnService],
    };
  }

  static registerAsync(options: AuthXModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: 'AUTHX_OPTIONS',
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
    return {
      module: AuthXModule,
      global: true,
      imports: options.imports ?? [],
      providers: [optionsProvider, SessionStore, JwtServiceX, OidcService, WebAuthnService],
      exports: [SessionStore, JwtServiceX, OidcService, WebAuthnService],
    };
  }
}

