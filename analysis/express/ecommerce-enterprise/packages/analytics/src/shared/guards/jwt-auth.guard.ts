import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  CanActivate,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Allow access to public routes
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      this.logger.warn('No JWT token provided for protected route', {
        url: request.url,
        method: request.method,
        ip: request.ip,
      });
      throw new UnauthorizedException('No JWT token provided');
    }

    try {
      // Verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret',
      });

      // Attach user information to request object
      request.user = payload;

      // Check role-based access if roles are specified
      const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredRoles && requiredRoles.length > 0) {
        const userRoles = payload.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));

        if (!hasRequiredRole) {
          this.logger.warn('User does not have required roles', {
            userId: payload.sub,
            userRoles,
            requiredRoles,
            url: request.url,
          });
          throw new UnauthorizedException('Insufficient permissions');
        }
      }

      // Check permission-based access if permissions are specified
      const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
        context.getHandler(),
        context.getClass(),
      ]);

      if (requiredPermissions && requiredPermissions.length > 0) {
        const userPermissions = payload.permissions || [];
        const hasRequiredPermissions = requiredPermissions.every(permission =>
          userPermissions.includes(permission)
        );

        if (!hasRequiredPermissions) {
          this.logger.warn('User does not have required permissions', {
            userId: payload.sub,
            userPermissions,
            requiredPermissions,
            url: request.url,
          });
          throw new UnauthorizedException('Insufficient permissions');
        }
      }

      this.logger.debug('JWT authentication successful', {
        userId: payload.sub,
        url: request.url,
      });

      return true;
    } catch (error) {
      this.logger.error('JWT authentication failed', {
        error: error instanceof Error ? error.message : String(error),
        url: request.url,
        method: request.method,
        ip: request.ip,
      });

      if (error instanceof Error && error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('JWT token has expired');
      }

      if (error instanceof Error && error.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid JWT token');
      }

      throw new UnauthorizedException('Authentication failed');
    }
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
