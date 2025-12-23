import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRE_PREDICATE, AbacPredicate } from '../decorators/abac.decorator';
import { PolicyService } from '../services/policy.service';
import { DecisionAuditService } from '../services/decision-audit.service';

@Injectable()
export class AbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly policies: PolicyService, private readonly audit: DecisionAuditService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let predicate = this.reflector.getAllAndOverride<AbacPredicate | string>(REQUIRE_PREDICATE, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!predicate) return true;
    if (typeof predicate === 'string') {
      const named = this.policies.getPredicate(predicate);
      if (!named) return false;
      predicate = named;
    }
    const req = context.switchToHttp().getRequest<any>();
    const principal = req.user || req.auth;
    const ok = await (predicate as AbacPredicate)({ principal, req });
    this.audit.record({
      at: new Date().toISOString(),
      guard: 'AbacGuard',
      principal,
      request: { method: req.method, path: req.url },
      result: ok ? 'allow' : 'deny',
    });
    return ok;
  }
}


