import { Controller, Get, Put, UseGuards, Request, Param, Body } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ClaimsGuard } from '../../common/guards/claims.guard';
import { PoliciesGuard } from '../../common/guards/policies.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Claims } from '../../common/decorators/claims.decorator';
import { Policies } from '../../common/decorators/policies.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ProtectedResponseMapper } from '../mappers/protected-response.mapper';

/**
 * Protected Routes Controller
 * 
 * Demonstrates various authorization patterns:
 * - Public routes
 * - Role-based access control
 * - Claim-based authorization
 * - Policy-based authorization
 */
@Controller('protected')
export class ProtectedController {
  constructor(private readonly responseMapper: ProtectedResponseMapper) {}

  /**
   * Public route - no authentication required
   */
  @Public()
  @Get('public')
  getPublicData(@Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toPublicDataResponse(requestId);
  }

  /**
   * Protected route - requires authentication only
   */
  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUserData(@Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toUserDataResponse(req.user, requestId);
  }

  /**
   * Role-based access control - requires admin role
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get('admin')
  getAdminData(@Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toAdminDataResponse(req.user, requestId);
  }

  /**
   * Role-based access control - requires admin or moderator role
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'moderator')
  @Get('moderator')
  getModeratorData(@Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toModeratorDataResponse(req.user, requestId);
  }

  /**
   * Claim-based authorization - requires specific claims
   */
  @UseGuards(JwtAuthGuard, ClaimsGuard)
  @Claims('users:read')
  @Get('users')
  getUsers(@Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    const users: any[] = [];
    return this.responseMapper.toUserListResponse(users, req.user, requestId);
  }

  /**
   * Claim-based authorization - requires multiple claims
   */
  @UseGuards(JwtAuthGuard, ClaimsGuard)
  @Claims('users:read', 'users:write')
  @Put('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any, @Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toUpdateUserResponse(id, body, req.user, requestId);
  }

  /**
   * Policy-based authorization - uses custom policy
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policies('canEditUser')
  @Put('profile/:id')
  updateProfile(@Param('id') id: string, @Body() body: any, @Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toUpdateProfileResponse(id, body, req.user, requestId);
  }

  /**
   * Multiple policies - all must pass
   */
  @UseGuards(JwtAuthGuard, PoliciesGuard)
  @Policies('isOwner', 'hasClaim')
  @Put('resource/:id')
  updateResource(@Param('id') id: string, @Body() body: any, @Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toUpdateResourceResponse(id, body, req.user, requestId);
  }

  /**
   * Combined: Roles + Claims + Policies
   */
  @UseGuards(JwtAuthGuard, RolesGuard, ClaimsGuard, PoliciesGuard)
  @Roles('admin', 'moderator')
  @Claims('users:write')
  @Policies('canEditUser')
  @Put('advanced/:id')
  advancedUpdate(@Param('id') id: string, @Body() body: any, @Request() req: any): any {
    const requestId = req.headers['x-request-id'] as string | undefined;
    return this.responseMapper.toAdvancedUpdateResponse(id, body, req.user, requestId);
  }
}
