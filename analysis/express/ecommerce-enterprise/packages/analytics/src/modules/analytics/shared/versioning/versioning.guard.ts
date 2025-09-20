import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { VersioningService } from './versioning.service';
// import { VersioningOptions } from './versioning.types';

@Injectable()
export class VersioningGuard implements CanActivate {
  private readonly logger = new Logger(VersioningGuard.name);

  constructor(private readonly versioningService: VersioningService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    const versionInfo = this.versioningService.extractVersion(request);
    
    // Add version info to request for use in controllers
    (request as any).versionInfo = versionInfo;

    // Set version headers in response
    response.setHeader('API-Version', versionInfo.version);
    response.setHeader('API-Supported-Versions', this.versioningService.getSupportedVersions().join(', '));

    // Handle unsupported versions
    if (!versionInfo.isSupported) {
      const supportedVersions = this.versioningService.getSupportedVersions();
      const defaultVersion = this.versioningService.getDefaultVersion();
      
      this.logger.warn(`Unsupported API version requested: ${versionInfo.version}`, {
        requestedVersion: versionInfo.version,
        supportedVersions,
        defaultVersion,
        path: request.path,
        method: request.method,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });

      throw new HttpException(
        {
          message: `Unsupported API version: ${versionInfo.version}`,
          statusCode: HttpStatus.BAD_REQUEST,
          supportedVersions,
          defaultVersion,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    // Handle deprecated versions
    const deprecationInfo = this.versioningService.getDeprecationInfo(versionInfo.version);
    if (deprecationInfo.isDeprecated) {
      response.setHeader('API-Deprecated', 'true');
      response.setHeader('API-Sunset-Date', deprecationInfo.sunsetDate || '');
      response.setHeader('API-Alternative-Version', deprecationInfo.alternativeVersion || '');
      
      this.logger.warn(`Deprecated API version used: ${versionInfo.version}`, {
        version: versionInfo.version,
        sunsetDate: deprecationInfo.sunsetDate,
        alternativeVersion: deprecationInfo.alternativeVersion,
        path: request.path,
        method: request.method,
      });
    }

    return true;
  }
}
