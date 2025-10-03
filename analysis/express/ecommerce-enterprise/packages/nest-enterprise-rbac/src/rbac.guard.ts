import { CanActivate, ExecutionContext, Injectable, applyDecorators, UseGuards } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC_POLICY_KEY } from './decorators';
import { evaluatePolicy, type RbacPolicy, mergePolicy, type RbacUserLike } from './types';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const policies = this.reflector.getAllAndOverride<RbacPolicy | RbacPolicy[]>(RBAC_POLICY_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    let merged: RbacPolicy | undefined;
    if (Array.isArray(policies)) {
      for (const p of policies) merged = mergePolicy(merged, p);
    } else if (policies) {
      merged = mergePolicy(undefined, policies);
    }
    if (!merged) return true;

    const req = context.switchToHttp().getRequest();
    const user = (req.user ?? req.authContext?.user) as RbacUserLike | undefined;
    if (!user) return false;
    return evaluatePolicy(user, merged);
  }
}

export function UseRbacGuard() {
  return applyDecorators(UseGuards(RbacGuard));
}

