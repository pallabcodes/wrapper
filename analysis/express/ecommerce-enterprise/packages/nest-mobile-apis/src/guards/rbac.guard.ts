import { CanActivate, ExecutionContext, Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC_METADATA_KEY } from '../decorators/mobile-api.decorator';
import { RbacRequirement, RbacContext } from '../interfaces/mobile-api.interface';

function getTracer() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const api = require('@opentelemetry/api');
    return api.trace.getTracer('@ecommerce-enterprise/nest-mobile-apis');
  } catch {
    return undefined;
  }
}

@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const tracer = getTracer();
    const span = tracer?.startSpan('mobile.rbac');
    const requirement = this.reflector.getAllAndOverride<RbacRequirement | undefined>(RBAC_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requirement) {
      span?.end();
      return true;
    }

    const request = context.switchToHttp().getRequest<any>();
    const rbac: RbacContext = this.extractRbacContext(request);

    const isOwnerOk = this.checkOwner(requirement, request, rbac);
    const rolesOk = this.checkRoles(requirement, rbac);
    const permsOk = this.checkPermissions(requirement, rbac);

    const ok = isOwnerOk && rolesOk && permsOk;
    if (!ok) {
      this.logger.debug(`RBAC denied: owner=${isOwnerOk} roles=${rolesOk} perms=${permsOk}`);
      try {
        span?.setAttribute('rbac.owner', isOwnerOk);
        span?.setAttribute('rbac.roles', rolesOk);
        span?.setAttribute('rbac.permissions', permsOk);
        span?.setAttribute('error', true);
      } catch {}
      throw new ForbiddenException({
        code: 'RBAC_DENIED',
        message: 'Access denied by RBAC policy',
        details: {
          owner: isOwnerOk,
          roles: rolesOk,
          permissions: permsOk,
        },
      });
    }
    try {
      span?.setAttribute('rbac.owner', isOwnerOk);
      span?.setAttribute('rbac.roles', rolesOk);
      span?.setAttribute('rbac.permissions', permsOk);
    } finally {
      span?.end();
    }
    return true;
  }

  private extractRbacContext(request: any): RbacContext {
    // Try common locations in real apps: request.user from auth guard, custom headers for demo
    const user = request.user || {};
    const roles: string[] = user.roles || this.headerList(request.headers['x-roles']);
    const permissions: string[] = user.permissions || this.headerList(request.headers['x-permissions']);
    const userId: string | undefined = user.id || request.headers['x-user-id'];
    const tenantId: string | undefined = user.tenantId || request.headers['x-tenant-id'];
    return { userId, tenantId, roles, permissions };
  }

  private headerList(value: unknown): string[] {
    if (!value || typeof value !== 'string') return [];
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  private checkOwner(req: RbacRequirement, request: any, ctx: RbacContext): boolean {
    if (!req.allowIfOwner) return true;
    const param = req.resourceParam || 'userId';
    const resourceId = request.params?.[param] || request.query?.[param] || request.body?.[param];
    return !!ctx.userId && !!resourceId && String(ctx.userId) === String(resourceId);
  }

  private checkRoles(req: RbacRequirement, ctx: RbacContext): boolean {
    const roles = new Set(ctx.roles || []);
    if (req.allRoles && req.allRoles.length > 0) {
      for (const r of req.allRoles) if (!roles.has(r)) return false;
    }
    if (req.anyRole && req.anyRole.length > 0) {
      for (const r of req.anyRole) if (roles.has(r)) return true;
      return false;
    }
    return true;
  }

  private checkPermissions(req: RbacRequirement, ctx: RbacContext): boolean {
    const perms = new Set(ctx.permissions || []);
    if (req.allPermissions && req.allPermissions.length > 0) {
      for (const p of req.allPermissions) if (!perms.has(p)) return false;
    }
    if (req.anyPermission && req.anyPermission.length > 0) {
      for (const p of req.anyPermission) if (perms.has(p)) return true;
      return false;
    }
    return true;
  }
}


