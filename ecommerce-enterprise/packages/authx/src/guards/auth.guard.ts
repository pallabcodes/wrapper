import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { JwtServiceX } from '../services/jwt.service';
import { SessionStore } from '../services/session.store';

@Injectable()
export class AuthGuardSmart implements CanActivate {
  constructor(private readonly sessions: SessionStore, private readonly jwt: JwtServiceX, private readonly reflector: Reflector) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;
    const req: any = ctx.switchToHttp().getRequest();
    // 1) Session first
    const sid = req.cookies?.sid || req.headers['x-session-id'];
    if (sid) {
      const principal = await this.sessions.getPrincipalBySessionId(sid);
      if (principal) {
        req.auth = principal;
        return true;
      }
    }
    // 2) Bearer access token
    const authz = req.headers['authorization'] as string | undefined;
    const token = authz?.startsWith('Bearer ') ? authz.slice(7) : undefined;
    if (token) {
      const verify = await this.jwt.verifyAccess(token).catch(() => undefined);
      if (verify?.ok) {
        req.auth = verify.principal;
        return true;
      }
      // 3) Attempt refresh rotation
      const refresh = req.cookies?.refresh_token || req.headers['x-refresh-token'];
      if (refresh) {
        const rotated = await this.jwt.rotate(refresh).catch(() => undefined);
        if (rotated?.ok) {
          // expose new tokens via headers for demo; in apps you'd set cookies
          req.res?.setHeader('x-access-token', rotated.tokens.accessToken);
          req.res?.setHeader('x-refresh-token', rotated.tokens.refreshToken);
          req.auth = rotated.principal;
          return true;
        }
      }
    }
    return false;
  }
}

