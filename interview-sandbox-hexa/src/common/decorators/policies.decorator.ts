import { SetMetadata } from '@nestjs/common';

/**
 * Policies Decorator
 * 
 * Specifies which policies must be satisfied to access a route
 * 
 * Usage:
 * @Policies('canEditUser', 'isOwner')
 * @Put('users/:id')
 * updateUser() { ... }
 */
export const POLICIES_KEY = 'policies';
export const Policies = (...policies: string[]) => SetMetadata(POLICIES_KEY, policies);

