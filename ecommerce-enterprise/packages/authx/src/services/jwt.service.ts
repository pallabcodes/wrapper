import { Inject, Injectable } from '@nestjs/common';
import { jwtVerify, SignJWT, JWTPayload, createRemoteJWKSet, importPKCS8, importSPKI, KeyLike, JWTVerifyGetKey } from 'jose';
import { randomUUID } from 'crypto';
import { AuthPrincipal } from '../types/auth.types';

interface VerifyResult {
  ok: boolean;
  principal?: AuthPrincipal;
}

@Injectable()
export class JwtServiceX {
  private accessTtl: number;
  private refreshTtl: number;
  private issuer: string;
  private audience: string;
  private jwks?: ReturnType<typeof createRemoteJWKSet>;
  private privateKeyPem?: string;
  private publicKeyPem?: string;
  private hmacSecret?: Uint8Array;

  constructor(@Inject('AUTHX_OPTIONS') options: any) {
    this.accessTtl = options.jwt?.accessTtlSeconds ?? 900;
    this.refreshTtl = options.jwt?.refreshTtlSeconds ?? 60 * 60 * 24 * 30;
    this.issuer = options.jwt?.issuer ?? 'authx';
    this.audience = options.jwt?.audience ?? 'authx-clients';
    if (options.jwt?.jwksUrl) this.jwks = createRemoteJWKSet(new URL(options.jwt.jwksUrl));
    this.privateKeyPem = options.jwt?.privateKeyPem;
    this.publicKeyPem = options.jwt?.publicKeyPem;
    const secret = options.jwt?.hmacSecret || process.env['JWT_SECRET'];
    if (!this.privateKeyPem && secret) {
      this.hmacSecret = new TextEncoder().encode(secret);
    }
  }

  async signAccess(principal: AuthPrincipal): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const alg = this.hmacSecret ? 'HS256' : 'RS256';
    const jwt = await new SignJWT({ sub: principal.sub, email: principal.email, roles: principal.roles })
      .setProtectedHeader({ alg })
      .setIssuedAt(now)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(now + this.accessTtl)
      .sign(await this.getPrivateKey());
    return jwt;
  }

  async signRefresh(principal: AuthPrincipal): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const alg = this.hmacSecret ? 'HS256' : 'RS256';
    const jwt = await new SignJWT({ sub: principal.sub, jti: randomUUID(), typ: 'refresh' })
      .setProtectedHeader({ alg })
      .setIssuedAt(now)
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(now + this.refreshTtl)
      .sign(await this.getPrivateKey());
    return jwt;
  }

  async verifyAccess(token: string): Promise<VerifyResult> {
    try {
      const keyOrGetKey = await this.getPublicKey();
      const { payload } =
        typeof keyOrGetKey === 'function'
          ? await jwtVerify(token, keyOrGetKey as JWTVerifyGetKey, {
              issuer: this.issuer,
              audience: this.audience,
            })
          : await jwtVerify(token, keyOrGetKey as KeyLike, {
              issuer: this.issuer,
              audience: this.audience,
            });
      return { ok: true, principal: this.toPrincipal(payload) };
    } catch {
      return { ok: false };
    }
  }

  async rotate(refreshToken: string): Promise<{ ok: true; tokens: { accessToken: string; refreshToken: string }; principal: AuthPrincipal } | { ok: false }> {
    try {
      const keyOrGetKey = await this.getPublicKey();
      const { payload } =
        typeof keyOrGetKey === 'function'
          ? await jwtVerify(refreshToken, keyOrGetKey as JWTVerifyGetKey, {
              issuer: this.issuer,
              audience: this.audience,
            })
          : await jwtVerify(refreshToken, keyOrGetKey as KeyLike, {
              issuer: this.issuer,
              audience: this.audience,
            });
      if (payload['typ'] !== 'refresh') return { ok: false };
      const principal = this.toPrincipal(payload);
      const accessToken = await this.signAccess(principal);
      const newRefresh = await this.signRefresh(principal);
      return { ok: true, tokens: { accessToken, refreshToken: newRefresh }, principal };
    } catch {
      return { ok: false };
    }
  }

  private toPrincipal(payload: JWTPayload): AuthPrincipal {
    const base: AuthPrincipal = { sub: String(payload.sub), roles: (payload['roles'] as string[]) || [] };
    const email = payload['email'] as string | undefined;
    if (email !== undefined) (base as any).email = email;
    return base;
  }

  private async getPrivateKey(): Promise<KeyLike | Uint8Array> {
    if (this.hmacSecret) return this.hmacSecret;
    if (!this.privateKeyPem) throw new Error('AuthX: privateKeyPem required for signing');
    return await importPKCS8(this.privateKeyPem, 'RS256');
  }

  private async getPublicKey(): Promise<ReturnType<typeof createRemoteJWKSet> | KeyLike | Uint8Array | JWTVerifyGetKey> {
    if (this.hmacSecret) return this.hmacSecret;
    if (this.jwks) return this.jwks;
    if (!this.publicKeyPem) throw new Error('AuthX: publicKeyPem or jwksUrl required for verification');
    return await importSPKI(this.publicKeyPem, 'RS256');
  }
}

