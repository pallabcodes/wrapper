import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthContext, AuthUserBase } from '../types/auth.types';

export const ROLES_KEY = 'enterprise_roles';
export const PERMS_KEY = 'enterprise_permissions';

export const RequireRoles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMS_KEY, permissions);

export const CurrentUser = createParamDecorator<keyof AuthUserBase | undefined>(
  (data: keyof AuthUserBase | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthUserBase | undefined;
    if (!user) return undefined;
    return data ? (user as any)[data] : user;
  },
);

export const AuthCtx = createParamDecorator<undefined, ExecutionContext, AuthContext | undefined>(
  (_data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    return request.authContext as AuthContext | undefined;
  },
);

