import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class AuthContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<any>();
    if (!request.user) {
      const headers = request.headers || {};
      request.user = {
        id: headers['x-user-id'],
        tenantId: headers['x-tenant-id'],
        roles: (typeof headers['x-roles'] === 'string' ? headers['x-roles'] : '').split(',').map((s: string) => s.trim()).filter(Boolean),
        permissions: (typeof headers['x-permissions'] === 'string' ? headers['x-permissions'] : '').split(',').map((s: string) => s.trim()).filter(Boolean),
      };
    }
    return next.handle();
  }
}


