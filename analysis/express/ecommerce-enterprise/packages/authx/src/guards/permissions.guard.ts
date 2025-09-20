import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PERMISSIONS } from '../decorators/permissions.decorator';
import { PolicyService } from '../services/policy.service';
import { DecisionAuditService } from '../services/decision-audit.service';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly policies: PolicyService, private readonly audit: DecisionAuditService, private readonly tenants: TenantService) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRE_PERMISSIONS, [handler, context.getClass()]) || [];
    if (required.length === 0) return true;

    const req = context.switchToHttp().getRequest<any>();
    const principal = req.user as { permissions?: string[]; roles?: string[] } | undefined;
    const tenant = this.tenants.resolve(req);
    const combined = new Set(
      [
        ...(principal?.permissions || []),
        ...this.policies.getPermissionsForRoles(principal?.roles || [], tenant),
      ].map((p) => p.toLowerCase()),
    );
    const allow = required.every((p) => combined.has(p.toLowerCase()));
    this.audit.record({
      at: new Date().toISOString(),
      guard: 'PermissionsGuard',
      principal,
      request: { method: req.method, path: req.url },
      required,
      result: allow ? 'allow' : 'deny',
    });
    return allow;
  }
}


