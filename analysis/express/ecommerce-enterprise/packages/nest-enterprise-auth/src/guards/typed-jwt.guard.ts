import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { AuthUserBase, AuthContext } from '../types/auth.types';

@Injectable()
export class TypedJwtAuthGuard extends AuthGuard('jwt') {
  override canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const activate = super.canActivate(context);
    const req = context.switchToHttp().getRequest();
    const token = req.headers?.authorization as string | undefined;
    const requestId = req.headers?.['x-request-id'] as string | undefined;
    const authContext: AuthContext<AuthUserBase> = {
      user: req.user as AuthUserBase,
      ...(token !== undefined ? { token } : {}),
      ...(requestId !== undefined ? { requestId } : {}),
    };
    req.authContext = authContext;
    return activate as boolean | Promise<boolean>;
  }
}

