import { ExtractJwt, StrategyOptions, Strategy as JwtStrategy } from 'passport-jwt';
import type { Request, Response } from 'express';
import { sign, verify, JwtPayload as RawJwtPayload } from 'jsonwebtoken';

export type SignOptions = {
  secret: string;
  expiresIn?: string | number;
  issuer?: string;
  audience?: string | string[];
  subject?: string;
};

export function signAccessToken<TPayload extends object>(payload: TPayload, opts: SignOptions): string {
  return sign(payload, opts.secret, {
    expiresIn: opts.expiresIn ?? '15m',
    issuer: opts.issuer,
    audience: opts.audience,
    subject: opts.subject,
  });
}

export function signRefreshToken<TPayload extends object>(payload: TPayload, opts: SignOptions): string {
  return sign(payload, opts.secret, {
    expiresIn: opts.expiresIn ?? '7d',
    issuer: opts.issuer,
    audience: opts.audience,
    subject: opts.subject,
  });
}

export function verifyRefreshToken<TPayload extends object>(token: string, secret: string): TPayload & RawJwtPayload {
  return verify(token, secret) as TPayload & RawJwtPayload;
}

export function setAuthCookies(res: Response, tokens: { access: string; refresh: string }, opts?: {
  domain?: string;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
  path?: string;
}) {
  const common = {
    httpOnly: true,
    secure: opts?.secure ?? true,
    sameSite: opts?.sameSite ?? 'lax',
    path: opts?.path ?? '/',
    domain: opts?.domain,
  } as const;
  // naive: consumers can override with their framework cookie lib
  res.setHeader('Set-Cookie', [
    `access_token=${encodeURIComponent(tokens.access)}; HttpOnly; Path=${common.path}; SameSite=${common.sameSite}; ${common.secure ? 'Secure; ' : ''}${common.domain ? `Domain=${common.domain}; ` : ''}`.trim(),
    `refresh_token=${encodeURIComponent(tokens.refresh)}; HttpOnly; Path=${common.path}; SameSite=${common.sameSite}; ${common.secure ? 'Secure; ' : ''}${common.domain ? `Domain=${common.domain}; ` : ''}`.trim(),
  ]);
}

export function RefreshTokenStrategyFactory(opts: {
  name?: string;
  secret: string;
  ignoreExpiration?: boolean;
  fromRequest?: (req: Request) => string | null;
}): { name: string; strategy: new (...args: unknown[]) => JwtStrategy; options: StrategyOptions } {
  const name = opts.name ?? 'jwt-refresh';
  const extractor = (req: Request) => (opts.fromRequest ? opts.fromRequest(req) : ExtractJwt.fromAuthHeaderAsBearerToken()(req));
  const options: StrategyOptions = {
    jwtFromRequest: extractor,
    secretOrKey: opts.secret,
    ignoreExpiration: opts.ignoreExpiration ?? false,
    passReqToCallback: true,
  } as any;
  return { name, strategy: JwtStrategy as any, options };
}

export async function rotateTokens<TPayload extends { jti?: string }>(payload: TPayload, rotate: (oldJti: string | undefined) => Promise<string>, cfg: {
  access: SignOptions;
  refresh: SignOptions;
}): Promise<{ access: string; refresh: string; jti: string }> {
  const newJti = await rotate(payload.jti);
  const base = { ...payload, jti: newJti } as TPayload;
  const access = signAccessToken(base, cfg.access);
  const refresh = signRefreshToken(base, cfg.refresh);
  return { access, refresh, jti: newJti };
}

