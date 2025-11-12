import { CanActivate, ExecutionContext, Injectable, applyDecorators, UseGuards, ForbiddenException, Inject, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBAC_POLICY_KEY } from './decorators';
import { evaluatePolicy, type RbacPolicy, mergePolicy, type RbacUserLike } from './types';
import { RBAC_USER_SELECTOR, type RbacUserSelector, RBAC_ON_DENY, type RbacOnDeny } from './tokens';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional() @Inject(RBAC_USER_SELECTOR) private readonly userSelector?: RbacUserSelector,
    @Optional() @Inject(RBAC_ON_DENY) private readonly onDeny?: RbacOnDeny,
  ) {}

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
    const user = (this.userSelector?.(req) ?? req.user ?? req.authContext?.user) as RbacUserLike | undefined;
    if (!user) {
      this.onDeny?.({ handler: context.getHandler().name, path: req?.route?.path, user });
      throw new ForbiddenException('RBAC: user not found');
    }
    const ok = evaluatePolicy(user, merged);
    if (!ok) {
      this.onDeny?.({ handler: context.getHandler().name, path: req?.route?.path, user });
      throw new ForbiddenException('RBAC policy denied');
    }
    return true;
  }
}

export function UseRbacGuard() {
  return applyDecorators(UseGuards(RbacGuard));
}

