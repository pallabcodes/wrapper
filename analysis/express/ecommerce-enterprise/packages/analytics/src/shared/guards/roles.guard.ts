import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger('RolesGuard');

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No role restrictions
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      this.logger.warn('No user found in request for role-based access', {
        url: request.originalUrl,
        method: request.method,
        ip: request.ip,
      });
      return false;
    }

    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRequiredRole) {
      this.logger.warn('User does not have required roles', {
        userId: user.id,
        userRoles,
        requiredRoles,
        url: request.originalUrl,
        method: request.method,
      });
    } else {
      this.logger.debug('Role-based access granted', {
        userId: user.id,
        requiredRoles,
        url: request.originalUrl,
      });
    }

    return hasRequiredRole;
  }
}
