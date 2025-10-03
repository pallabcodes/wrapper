import type { Response } from 'express';

export type CookiePreset = 'lax' | 'strict' | 'none-cross-site';

export function cookiePresetOptions(preset: CookiePreset) {
  if (preset === 'lax') return { httpOnly: true, sameSite: 'lax' as const, secure: true, path: '/' };
  if (preset === 'strict') return { httpOnly: true, sameSite: 'strict' as const, secure: true, path: '/' };
  // cross-site must be SameSite=None; Secure
  return { httpOnly: true, sameSite: 'none' as const, secure: true, path: '/' };
}

export function setCookie(res: Response, name: string, value: string, opts: Partial<{ domain: string; path: string; sameSite: 'lax' | 'strict' | 'none'; secure: boolean; httpOnly: boolean; maxAge: number; }>) {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`];
  parts.push(`Path=${opts.path ?? '/'}`);
  if (opts.sameSite) parts.push(`SameSite=${opts.sameSite}`);
  if (opts.secure ?? true) parts.push('Secure');
  if (opts.httpOnly ?? true) parts.push('HttpOnly');
  if (opts.domain) parts.push(`Domain=${opts.domain}`);
  if (typeof opts.maxAge === 'number') parts.push(`Max-Age=${opts.maxAge}`);
  const header = parts.join('; ');
  const existing = res.getHeader('Set-Cookie');
  if (Array.isArray(existing)) res.setHeader('Set-Cookie', [...existing, header]);
  else if (typeof existing === 'string' && existing.length > 0) res.setHeader('Set-Cookie', [existing, header]);
  else res.setHeader('Set-Cookie', header);
}

