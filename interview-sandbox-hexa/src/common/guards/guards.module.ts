import { Module, Global } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { ClaimsGuard } from './claims.guard';
import { PoliciesGuard } from './policies.guard';
import { PolicyService } from '../../infrastructure/persistence/auth/policy.service';

/**
 * Guards Module
 * 
 * Exports all guards for use across the application
 */
@Global()
@Module({
  providers: [JwtAuthGuard, RolesGuard, ClaimsGuard, PolicyService, PoliciesGuard],
  exports: [JwtAuthGuard, RolesGuard, ClaimsGuard, PoliciesGuard],
})
export class GuardsModule {}

