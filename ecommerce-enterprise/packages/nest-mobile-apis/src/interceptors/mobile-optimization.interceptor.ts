import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  MOBILE_OPTIMIZATION_METADATA,
  MobileOptimizationOptions,
} from '../decorators/mobile-api.decorator';
// import { MobileOptimizationService } from '../services/mobile-optimization.service';
import { MobileDeviceInfo, MobileApiRequest } from '../interfaces/mobile-api.interface';
import { Request } from 'express';

@Injectable()
export class MobileOptimizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MobileOptimizationInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    // private readonly optimizationService: MobileOptimizationService,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const isHttp = context.getType() === 'http';
    if (!isHttp) {
      return next.handle();
    }

    const ctx = context.switchToHttp();
    const request = ctx.getRequest<MobileApiRequest & Request>();
    const handler = context.getHandler();

    const options =
      this.reflector.get<MobileOptimizationOptions>(
        MOBILE_OPTIMIZATION_METADATA,
        handler,
      ) || {};

    const deviceInfo: MobileDeviceInfo = request.deviceInfo || this.buildDeviceInfoFromHeaders(request);

    return next.handle().pipe(
      map(async (data) => {
        try {
          // Apply compression if enabled (handled by MobileApiInterceptor or a dedicated compression interceptor)
          // This interceptor focuses on data structure and content optimization

          // Apply image optimization if enabled
          if (options.enableImageOptimization && this.hasImages(data)) {
            data = await this.optimizeImagesInData(data, deviceInfo, options);
          }

          // Apply minification if enabled (simplified for demo)
          if (options.enableMinification) {
            // In a real implementation, you would minify the data
            this.logger.debug('Data minification applied');
          }

          // Apply lazy loading if enabled (simplified for demo)
          if (options.enableLazyLoading) {
            // In a real implementation, you would enable lazy loading
            this.logger.debug('Lazy loading enabled');
          }

          return data;
        } catch (error) {
          this.logger.error('Error applying mobile optimizations:', error);
          return data; // Return original data if optimization fails
        }
      }),
    );
  }

  private hasImages(data: any): boolean {
    // Simple check if data might contain image URLs
    return JSON.stringify(data).includes('http') && (JSON.stringify(data).includes('.jpg') || JSON.stringify(data).includes('.png'));
  }

  private async optimizeImagesInData(
    data: any,
    deviceInfo: MobileDeviceInfo,
    options: MobileOptimizationOptions,
  ): Promise<any> {
    // This is a simplified example. In a real application, you'd traverse the data
    // structure to find image URLs and replace them with optimized versions.
    this.logger.debug(`Optimizing images for device: ${deviceInfo.model}`);
    // Simulate image optimization by modifying a placeholder image URL
    if (data && typeof data === 'object' && data.imageUrl) {
      data.imageUrl = `optimized-${options.quality || 'auto'}-${data.imageUrl}`;
    }
    return data;
  }

  private buildDeviceInfoFromHeaders(request: Request): MobileDeviceInfo {
    const userAgent = (request.headers['user-agent'] as string | undefined) || '';
    const rawPlatform = (request.headers['x-device-platform'] as string | undefined) || this.detectPlatform(userAgent);
    const platform: 'ios' | 'android' | 'web' | 'unknown' = ['ios', 'android', 'web'].includes(rawPlatform) ? rawPlatform as 'ios' | 'android' | 'web' : 'unknown';
    const version = (request.headers['x-device-version'] as string | undefined) || this.detectVersion(userAgent);
    const model = (request.headers['x-device-model'] as string | undefined) || 'Unknown';
    const screenHeader = request.headers['x-screen-size'] as string | undefined;
    const screenSize = this.parseScreenSize(screenHeader);
    const rawSpeed = (request.headers['x-connection-speed'] as string | undefined) || 'unknown';
    const connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown' = ['slow', 'medium', 'fast'].includes(rawSpeed) ? rawSpeed as 'slow' | 'medium' | 'fast' : 'unknown';
    const appVersion = (request.headers['x-app-version'] as string | undefined) || '1.0.0';
    const language = ((request.headers['accept-language'] as string | undefined)?.split(',')[0]) || 'en-US';
    const timezone = (request.headers['x-timezone'] as string | undefined) || 'UTC';

    return {
      platform,
      version,
      model,
      screenSize,
      connectionSpeed,
      appVersion,
      language,
      timezone,
      userAgent,
      capabilities: {
        camera: true,
        gps: true,
        pushNotifications: true,
        biometrics: true,
        nfc: false,
      },
      networkType: 'wifi',
    };
  }

  private detectPlatform(userAgent: string): 'ios' | 'android' | 'web' | 'unknown' {
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return 'ios';
    }
    if (/Android/.test(userAgent)) {
      return 'android';
    }
    if (/Windows|Mac|Linux/.test(userAgent)) {
      return 'web';
    }
    return 'unknown';
  }

  private detectVersion(userAgent: string): string {
    const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      return `${iosMatch[1]}.${iosMatch[2]}`;
    }
    const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
    if (androidMatch && androidMatch[1]) {
      return androidMatch[1];
    }
    return 'unknown';
  }

  private parseScreenSize(screenSizeHeader?: string): MobileDeviceInfo['screenSize'] {
    if (typeof screenSizeHeader === 'string') {
      const parts = screenSizeHeader.split('x');
      if (parts.length === 3) {
        return {
          width: parseInt(parts[0] || '375'),
          height: parseInt(parts[1] || '667'),
          density: parseFloat(parts[2] || '2'),
        };
      }
    }
    return { width: 375, height: 667, density: 2 };
  }
}
