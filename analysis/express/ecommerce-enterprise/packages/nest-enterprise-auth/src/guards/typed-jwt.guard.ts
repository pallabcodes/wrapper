import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUserBase, AuthContext } from '../types/auth.types';

@Injectable()
export class TypedJwtAuthGuard<TUser extends AuthUserBase = AuthUserBase> extends AuthGuard('jwt') {
  override handleRequest(err: any, user: any, info: any, context: ExecutionContext, _status?: any): any {
    if (err || !user) {
      throw err || info || new Error('Unauthorized');
    }
    return user;
  }

  override canActivate(context: ExecutionContext) {
    const activate = super.canActivate(context);
    const req = context.switchToHttp().getRequest();
    const token = req.headers?.authorization as string | undefined;
    const requestId = req.headers?.['x-request-id'] as string | undefined;
    const authContext: AuthContext<TUser> = { user: (req.user as TUser), token } as AuthContext<TUser>;
    if (requestId !== undefined) {
      (authContext as any).requestId = requestId;
    }
    req.authContext = authContext;
    return activate as any;
  }
}

