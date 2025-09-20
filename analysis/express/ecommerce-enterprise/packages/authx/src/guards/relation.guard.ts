import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RELATION_CHECK, RelationCheckSpec } from '../decorators/relation-check.decorator';
import { RebacService } from '../services/rebac.service';
import { DecisionAuditService } from '../services/decision-audit.service';
import { TenantService } from '../services/tenant.service';

@Injectable()
export class RelationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly rebac: RebacService, private readonly audit: DecisionAuditService, private readonly tenants: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const spec = this.reflector.getAllAndOverride<RelationCheckSpec>(RELATION_CHECK, [context.getHandler(), context.getClass()]);
    if (!spec) return true;

    const req = context.switchToHttp().getRequest<any>();
    const object = req.params?.[spec.objectParam];
    if (!object) return false;
    const subject = spec.subjectFrom === 'param' && spec.subjectParam
      ? req.params?.[spec.subjectParam]
      : (req.user?.sub || req.auth?.sub);
    if (!subject) return false;

    const tenant = this.tenants.resolve(req);
    const ok = await this.rebac.check(String(subject), spec.relation, String(object), tenant);
    this.audit.record({
      at: new Date().toISOString(),
      guard: 'RelationGuard',
      principal: req.user || req.auth,
      request: { method: req.method, path: req.url },
      resource: { relation: spec.relation, object: String(object) },
      result: ok ? 'allow' : 'deny',
    });
    return ok;
  }
}


