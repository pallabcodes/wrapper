import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, PERMS_KEY } from '../decorators/auth.decorators';

@Injectable()
export class RolesPermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredPerms = this.reflector.getAllAndOverride<string[]>(PERMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const req = context.switchToHttp().getRequest();
    const user = req.user as { roles?: string[]; permissions?: string[] } | undefined;
    if (!user) return false;

    if (requiredRoles && requiredRoles.length > 0) {
      const roles = new Set(user.roles ?? []);
      for (const r of requiredRoles) if (!roles.has(r)) return false;
    }
    if (requiredPerms && requiredPerms.length > 0) {
      const perms = new Set(user.permissions ?? []);
      for (const p of requiredPerms) if (!perms.has(p)) return false;
    }
    return true;
  }
}

