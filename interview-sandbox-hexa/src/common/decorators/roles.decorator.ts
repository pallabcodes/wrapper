import { SetMetadata } from '@nestjs/common';

/**
 * Roles Decorator
 * 
 * Specifies which roles are required to access a route
 * 
 * Usage:
 * @Roles('admin', 'moderator')
 * @Get('admin-only')
 * getAdminData() { ... }
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

