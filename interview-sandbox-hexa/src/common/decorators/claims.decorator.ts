import { SetMetadata } from '@nestjs/common';

/**
 * Claims Decorator
 * 
 * Specifies which claims/permissions are required to access a route
 * 
 * Usage:
 * @Claims('users:read', 'users:write')
 * @Get('users')
 * getUsers() { ... }
 */
export const CLAIMS_KEY = 'claims';
export const Claims = (...claims: string[]) => SetMetadata(CLAIMS_KEY, claims);

