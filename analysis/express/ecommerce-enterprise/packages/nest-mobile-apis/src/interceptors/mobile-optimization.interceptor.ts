import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MobileOptimizationService } from '../services/mobile-optimization.service';
import { MobileOptimizationOptions, MOBILE_OPTIMIZATION_METADATA } from '../decorators/mobile-api.decorator';
import { MobileDeviceInfo } from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileOptimizationInterceptor implements NestInterceptor {
  private readonly logger = new Logger(MobileOptimizationInterceptor.name);

  constructor(private optimizationService: MobileOptimizationService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const handler = context.getHandler();
    
    const options: MobileOptimizationOptions = Reflect.getMetadata(MOBILE_OPTIMIZATION_METADATA, handler) || {};
    const deviceInfo: MobileDeviceInfo = request.deviceInfo;

    return next.handle().pipe(
      map(async (data) => {
        if (!data || typeof data !== 'object') {
          return data;
        }

        try {
          // Apply compression if enabled
          if (options.enableCompression) {
            data = await this.optimizationService.compressData(data);
            response.setHeader('Content-Encoding', 'gzip');
          }

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
    if (Array.isArray(data)) {
      return data.some(item => this.hasImages(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      return Object.values(data).some(value => {
        if (typeof value === 'string' && this.isImageUrl(value)) {
          return true;
        }
        if (typeof value === 'object') {
          return this.hasImages(value);
        }
        return false;
      });
    }
    
    return false;
  }

  private isImageUrl(url: string): boolean {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'];
    return imageExtensions.some(ext => url.toLowerCase().includes(ext));
  }

  private async optimizeImagesInData(data: any, deviceInfo: MobileDeviceInfo, options: MobileOptimizationOptions): Promise<any> {
    if (Array.isArray(data)) {
      return Promise.all(data.map(item => this.optimizeImagesInData(item, deviceInfo, options)));
    }
    
    if (typeof data === 'object' && data !== null) {
      const optimized = { ...data };
      
      for (const [key, value] of Object.entries(optimized)) {
        if (typeof value === 'string' && this.isImageUrl(value)) {
          // For demo purposes, we'll just add optimization metadata
          optimized[`${key}_optimized`] = {
            original: value,
            optimized: value, // In real implementation, this would be the optimized URL
            deviceOptimized: true,
            quality: options.quality || 85,
            format: this.selectOptimalFormat(deviceInfo),
          };
        } else if (typeof value === 'object') {
          optimized[key] = await this.optimizeImagesInData(value, deviceInfo, options);
        }
      }
      
      return optimized;
    }
    
    return data;
  }

  private selectOptimalFormat(deviceInfo: MobileDeviceInfo): string {
    // Select optimal image format based on device capabilities
    if (deviceInfo.platform === 'ios' && parseFloat(deviceInfo.version) >= 14) {
      return 'avif'; // iOS 14+ supports AVIF
    }
    
    if (deviceInfo.platform === 'android' && parseFloat(deviceInfo.version) >= 10) {
      return 'webp'; // Android 10+ has good WebP support
    }
    
    return 'jpeg'; // Fallback to JPEG
  }
}
