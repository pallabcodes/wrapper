import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { VersioningOptions, VersionInfo } from './versioning.types';

@Injectable()
export class VersioningService {
  private readonly logger = new Logger(VersioningService.name);

  constructor(private readonly options: VersioningOptions) {}

  extractVersion(request: Request): VersionInfo {
    const { headerName = 'API-Version', queryParamName = 'version', defaultVersion = '1' } = this.options;
    
    // Try header first
    let version = request.headers[headerName.toLowerCase()] as string | undefined;
    
    // Try query parameter
    if (!version) {
      version = request.query[queryParamName] as string | undefined;
    }
    
    // Try Accept header
    if (!version) {
      version = this.extractVersionFromAcceptHeader(request) || undefined;
    }
    
    // Use default if no version found
    if (!version) {
      version = defaultVersion;
    }

    const isSupported = this.isVersionSupported(version);
    const isDefault = version === defaultVersion;

    if (!isSupported) {
      this.logger.warn(`Unsupported API version requested: ${version}`, {
        version,
        supportedVersions: this.options.supportedVersions,
        userAgent: request.headers['user-agent'],
        ip: request.ip,
      });
    }

    return {
      version,
      isDefault,
      isSupported,
    };
  }

  private extractVersionFromAcceptHeader(request: Request): string | null {
    const acceptHeader = request.headers.accept;
    if (!acceptHeader) {
      return null;
    }

    const { acceptHeaderPattern = 'application/vnd.api+json;version={version}' } = this.options;
    const pattern = acceptHeaderPattern.replace('{version}', '([0-9.]+)');
    const regex = new RegExp(pattern);
    const match = acceptHeader.match(regex);
    
    return match && match[1] ? match[1] : null;
  }

  private isVersionSupported(version: string): boolean {
    if (this.options.validateVersion) {
      return this.options.validateVersion(version);
    }
    
    return this.options.supportedVersions.includes(version);
  }

  getSupportedVersions(): string[] {
    return [...this.options.supportedVersions];
  }

  getDefaultVersion(): string {
    return this.options.defaultVersion || '1';
  }

  isVersionDeprecated(version: string): boolean {
    // Simple deprecation logic - can be enhanced
    const supportedVersions = this.options.supportedVersions;
    const versionIndex = supportedVersions.indexOf(version);
    const latestIndex = supportedVersions.length - 1;
    
    return versionIndex >= 0 && versionIndex < latestIndex - 1; // Deprecated if not latest or second-to-latest
  }

  getDeprecationInfo(version: string): { isDeprecated: boolean; sunsetDate?: string | undefined; alternativeVersion?: string | undefined } {
    const isDeprecated = this.isVersionDeprecated(version);
    const supportedVersions = this.options.supportedVersions;
    const latestVersion = supportedVersions[supportedVersions.length - 1];
    
    return {
      isDeprecated,
      alternativeVersion: isDeprecated ? latestVersion : undefined,
      sunsetDate: isDeprecated ? (this.calculateSunsetDate(version) as string) : undefined,
    };
  }

  private calculateSunsetDate(_version: string): string | undefined {
    // Simple sunset calculation - 6 months from now
    const sunsetDate = new Date();
    sunsetDate.setMonth(sunsetDate.getMonth() + 6);
    return sunsetDate.toISOString().split('T')[0];
  }
}
