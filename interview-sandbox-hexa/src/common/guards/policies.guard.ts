import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { POLICIES_KEY } from '../decorators/policies.decorator';
import { PolicyService } from '../../infrastructure/persistence/auth/policy.service';

/**
 * Policies Guard (Policy-Based Authorization)
 * 
 * Checks if user satisfies required policies to access a route
 * Policies are evaluated by PolicyService
 * Must be used after JwtAuthGuard to ensure user is authenticated
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, PoliciesGuard)
 * @Policies('canEditUser', 'isOwner')
 * @Put('users/:id')
 */
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private policyService: PolicyService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPolicies = this.reflector.getAllAndOverride<string[]>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPolicies || requiredPolicies.length === 0) {
      return true; // No policies required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Evaluate each policy
    for (const policy of requiredPolicies) {
      const handler = this.policyService.getHandler(policy);
      if (!handler) {
        throw new ForbiddenException(`Policy handler not found: ${policy}`);
      }

      const allowed = await handler(user, request);
      if (!allowed) {
        throw new ForbiddenException(
          `Policy check failed: ${policy}. Access denied.`,
        );
      }
    }

    return true;
  }
}

