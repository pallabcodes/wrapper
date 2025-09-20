import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MobileApiService } from '../services/mobile-api.service';
import { MOBILE_API_METADATA } from '../decorators/mobile-api.decorator';
import { MobileDeviceInfo, MobileApiOptions } from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileApiInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MobileApiInterceptor.name);

  constructor(private mobileApiService: MobileApiService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    
    const options: MobileApiOptions = Reflect.getMetadata(MOBILE_API_METADATA, handler) || {};

    // Extract device information from request headers
    const deviceInfo = this.extractDeviceInfo(request);
    
    // Add device info to request for use in controllers
    request.deviceInfo = deviceInfo;

    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (data) => {
        const responseTime = Date.now() - startTime;
        
        // Apply mobile optimizations
        if (options.enableCompression || options.compress) {
          response.setHeader('Content-Encoding', 'gzip');
        }

        // Add mobile-specific headers
        response.setHeader('X-Mobile-API', 'true');
        response.setHeader('X-Response-Time', `${responseTime}ms`);
        response.setHeader('X-Device-Platform', deviceInfo.platform);
        response.setHeader('X-Device-Version', deviceInfo.version);

        // Log performance metrics
        this.logger.debug(`Mobile API call completed in ${responseTime}ms for ${deviceInfo.platform} ${deviceInfo.version}`);
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        
        this.logger.error(`Mobile API error after ${responseTime}ms:`, error);
        
        // Add error headers
        response.setHeader('X-Mobile-API-Error', 'true');
        response.setHeader('X-Error-Code', error.code || 'UNKNOWN_ERROR');
        
        throw error;
      }),
    );
  }

  private extractDeviceInfo(request: any): MobileDeviceInfo {
    const userAgent = request.headers['user-agent'] || '';
    const platform = request.headers['x-device-platform'] || this.detectPlatform(userAgent);
    const version = request.headers['x-device-version'] || this.detectVersion(userAgent);
    const model = request.headers['x-device-model'] || 'Unknown';
    const screenSize = this.parseScreenSize(request.headers['x-screen-size']);
    const connectionSpeed = request.headers['x-connection-speed'] || 'unknown';
    const appVersion = request.headers['x-app-version'] || '1.0.0';
    const language = request.headers['accept-language']?.split(',')[0] || 'en-US';
    const timezone = request.headers['x-timezone'] || 'UTC';

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

  private detectPlatform(userAgent: string): string {
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      return 'ios';
    }
    if (/Android/.test(userAgent)) {
      return 'android';
    }
    if (/Windows Phone/.test(userAgent)) {
      return 'windows-phone';
    }
    return 'unknown';
  }

  private detectVersion(userAgent: string): string {
    const iosMatch = userAgent.match(/OS (\d+)_(\d+)/);
    if (iosMatch) {
      return `${iosMatch[1]}.${iosMatch[2]}`;
    }

    const androidMatch = userAgent.match(/Android (\d+\.?\d*)/);
    if (androidMatch) {
      return androidMatch[1];
    }

    return 'unknown';
  }

  private parseScreenSize(screenSizeHeader?: string): { width: number; height: number; density: number } {
    if (!screenSizeHeader) {
      return { width: 375, height: 667, density: 2 }; // Default iPhone size
    }

    const [width, height, density] = screenSizeHeader.split('x').map(Number);
    return {
      width: width || 375,
      height: height || 667,
      density: density || 2,
    };
  }
}
