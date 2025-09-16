import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICIES_KEY, PolicyHandler } from '../decorators/policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const handlers = this.reflector.getAllAndOverride<PolicyHandler[]>(POLICIES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!handlers || handlers.length === 0) return true;
    const req: any = ctx.switchToHttp().getRequest();
    const principal = req.auth || {};
    return handlers.every((h) => {
      try {
        return h(principal);
      } catch {
        return false;
      }
    });
  }
}

