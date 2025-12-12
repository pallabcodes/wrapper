import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { MobileSecurityService } from '../services/mobile-security.service';
import { MobileSecurityOptions, MOBILE_SECURITY_METADATA } from '../decorators/mobile-api.decorator';
import { MobileDeviceInfo } from '../interfaces/mobile-api.interface';

interface MobileSecurityRequest extends Request {
  deviceInfo?: MobileDeviceInfo;
  user?: {
    id?: string;
    [key: string]: unknown;
  };
  securityContext?: {
    userId: string | null;
    deviceId?: string;
    platform?: string;
    authenticated: boolean;
    biometricAuthenticated: boolean;
    location: { latitude: number; longitude: number; accuracy?: number } | null;
  };
  headers: {
    authorization?: string;
    'x-auth-token'?: string;
    'x-user-id'?: string;
    'x-biometric-token'?: string;
    'x-latitude'?: string;
    'x-longitude'?: string;
    'x-location-accuracy'?: string;
    [key: string]: string | string[] | undefined;
  };
}

@Injectable()
export class MobileSecurityGuard implements CanActivate {
  private readonly logger = new Logger(MobileSecurityGuard.name);

  constructor(
    private reflector: Reflector,
    private securityService: MobileSecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<MobileSecurityRequest>();
    // const handler = context.getHandler();
    
    const options: MobileSecurityOptions = this.reflector.getAllAndOverride<MobileSecurityOptions>(
      MOBILE_SECURITY_METADATA,
      [context.getHandler(), context.getClass()],
    ) || {};

    // Skip security checks if not configured
    if (!options.requireAuth && !options.requireBiometrics && !options.requireLocation) {
      return true;
    }

    const deviceInfo: MobileDeviceInfo = request.deviceInfo;
    const token = this.extractToken(request);
    const userId = this.extractUserId(request);

    try {
      // Validate device
      const deviceValidation = await this.securityService.validateDevice(deviceInfo);
      if (!deviceValidation.isValid) {
        this.logger.warn(`Device validation failed: ${deviceValidation.issues.join(', ')}`);
        throw new ForbiddenException(`Device not authorized: ${deviceValidation.issues.join(', ')}`);
      }

      // Check platform restrictions
      if (options.allowedPlatforms && !options.allowedPlatforms.includes(deviceInfo.platform)) {
        throw new ForbiddenException(`Platform ${deviceInfo.platform} not allowed`);
      }

      // Check device restrictions
      if (options.allowedDevices && deviceInfo.model && !options.allowedDevices.includes(deviceInfo.model)) {
        throw new ForbiddenException(`Device ${deviceInfo.model || 'unknown'} not allowed`);
      }

      // Authentication check
      if (options.requireAuth) {
        if (!token) {
          throw new UnauthorizedException('Authentication token required');
        }

        const authResult = await this.securityService.validateToken(token, deviceInfo);
        if (!authResult.isValid) {
          throw new UnauthorizedException(`Authentication failed: ${authResult.error || 'Invalid token'}`);
        }

        // Check session limits (simplified for demo)
        if (options.maxConcurrentSessions) {
          // In a real implementation, you would check active sessions
          this.logger.debug(`Session limit check for user ${userId}: ${options.maxConcurrentSessions}`);
        }

        // Check session timeout (simplified for demo)
        if (options.sessionTimeout) {
          // In a real implementation, you would check session age
          this.logger.debug(`Session timeout check for user ${userId}: ${options.sessionTimeout}ms`);
        }
      }

      // Biometric authentication check (simplified for demo)
      if (options.requireBiometrics) {
        const biometricToken = this.extractBiometricToken(request);
        if (!biometricToken) {
          throw new UnauthorizedException('Biometric authentication required');
        }
        // In a real implementation, you would validate the biometric token
        this.logger.debug(`Biometric authentication check for device ${deviceInfo.model}`);
      }

      // Location check (simplified for demo)
      if (options.requireLocation) {
        const location = this.extractLocation(request);
        if (!location) {
          throw new ForbiddenException('Location information required');
        }
        // In a real implementation, you would validate the location
        this.logger.debug(`Location check: ${location.latitude}, ${location.longitude}`);
      }

      // Rate limiting (simplified for demo)
      const clientId = this.generateClientId(deviceInfo);
      // In a real implementation, you would check rate limits
      this.logger.debug(`Rate limit check for client ${clientId}`);

      // Add security context to request
      request.securityContext = {
        userId,
        deviceId: deviceInfo.model,
        platform: deviceInfo.platform,
        authenticated: !!token,
        biometricAuthenticated: !!this.extractBiometricToken(request),
        location: this.extractLocation(request),
      };

      return true;
    } catch (error) {
      this.logger.error('Mobile security check failed:', error);
      
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }
      
      throw new UnauthorizedException('Security validation failed');
    }
  }

  private extractToken(request: MobileSecurityRequest): string | null {
    const authHeader = request.headers.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    const token = request.headers['x-auth-token'];
    return typeof token === 'string' ? token : null;
  }

  private extractUserId(request: MobileSecurityRequest): string | null {
    const userId = request.headers['x-user-id'];
    if (userId && typeof userId === 'string') {
      return userId;
    }
    return request.user?.id || null;
  }

  private extractBiometricToken(request: MobileSecurityRequest): string | null {
    const token = request.headers['x-biometric-token'];
    return typeof token === 'string' ? token : null;
  }

  private extractLocation(request: MobileSecurityRequest): { latitude: number; longitude: number; accuracy?: number } | null {
    const lat = request.headers['x-latitude'];
    const lng = request.headers['x-longitude'];
    const accuracy = request.headers['x-location-accuracy'];
    
    if (lat && lng) {
      return {
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        ...(accuracy && { accuracy: parseFloat(accuracy) }),
      };
    }
    
    return null;
  }

  private generateClientId(deviceInfo: MobileDeviceInfo): string {
    const deviceString = `${deviceInfo.platform}-${deviceInfo.model}-${deviceInfo.version}`;
    return Buffer.from(deviceString).toString('base64');
  }
}
