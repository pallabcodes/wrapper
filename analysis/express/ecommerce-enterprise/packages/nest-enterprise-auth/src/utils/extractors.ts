import type { Request } from 'express';

export function getBearerFromHeader(req: Request): string | null {
  const header = req.headers?.authorization;
  if (!header) return null;
  const [type, token] = header.split(' ');
  if (type?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}

export function getAccessTokenFromCookie(req: Request, name = 'access_token'): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const token = parseCookie(cookieHeader)[name];
  return token ?? null;
}

export function getRefreshTokenFromCookie(req: Request, name = 'refresh_token'): string | null {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const token = parseCookie(cookieHeader)[name];
  return token ?? null;
}

function parseCookie(header: string): Record<string, string> {
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [k, v] = part.trim().split('=');
    if (k) acc[k] = decodeURIComponent(v ?? '');
    return acc;
  }, {});
}

export function eitherFrom(...fns: Array<(req: Request) => string | null>) {
  return (req: Request): string | null => {
    for (const fn of fns) {
      const val = fn(req);
      if (val) return val;
    }
    return null;
  };
}

