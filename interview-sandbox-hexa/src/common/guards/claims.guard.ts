import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CLAIMS_KEY } from '../decorators/claims.decorator';

/**
 * Claims Guard (Claim-Based Authorization)
 * 
 * Checks if user has required claims/permissions to access a route
 * Must be used after JwtAuthGuard to ensure user is authenticated
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, ClaimsGuard)
 * @Claims('users:read', 'users:write')
 * @Get('users')
 */
@Injectable()
export class ClaimsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredClaims = this.reflector.getAllAndOverride<string[]>(CLAIMS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredClaims) {
      return true; // No claims required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const userClaims = user.claims || [];
    const hasAllClaims = requiredClaims.every((claim) => userClaims.includes(claim));

    if (!hasAllClaims) {
      const missingClaims = requiredClaims.filter((claim) => !userClaims.includes(claim));
      throw new ForbiddenException(
        `Missing required claims: ${missingClaims.join(', ')}`,
      );
    }

    return true;
  }
}

