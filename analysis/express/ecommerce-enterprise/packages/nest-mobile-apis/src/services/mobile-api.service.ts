import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { MobileOptimizationService } from './mobile-optimization.service';
import { MobileCachingService } from './mobile-caching.service';
import { MobileSecurityService } from './mobile-security.service';
import {
  MobileDeviceInfo,
  MobileApiConfig,
  MobileApiResponse,
  MobileApiRequest,
  MobileAnalytics,
  PushNotificationPayload,
  ImageOptimizationOptions,
  CacheOptions,
} from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileApiService {
  private readonly logger = new Logger(MobileApiService.name);
  private config: MobileApiConfig;
  private analytics: Map<string, MobileAnalytics> = new Map();

  constructor(
    private configService: ConfigService,
    private optimizationService: MobileOptimizationService,
    private cachingService: MobileCachingService,
    private securityService: MobileSecurityService,
  ) {
    this.config = this.configService.get<MobileApiConfig>('MOBILE_API_CONFIG') || {
      enableCompression: true,
      enableImageOptimization: true,
      enableCaching: true,
      enableOfflineSupport: true,
      enablePushNotifications: true,
      enableBiometrics: true,
      enableLocationServices: true,
      maxImageSize: 5 * 1024 * 1024, // 5MB
      maxFileSize: 10 * 1024 * 1024, // 10MB
      cacheTimeout: 300, // 5 minutes
      compressionLevel: 6,
      imageFormats: ['jpeg', 'png', 'webp', 'avif'],
      supportedResolutions: [
        { width: 150, height: 150, quality: 60 },
        { width: 300, height: 300, quality: 75 },
        { width: 600, height: 600, quality: 85 },
        { width: 1200, height: 1200, quality: 95 },
      ],
    };
  }

  async createMobileResponse<T>(
    data: T,
    request: MobileApiRequest,
    options?: {
      pagination?: {
        page: number;
        limit: number;
        total: number;
      };
      cacheKey?: string;
      compress?: boolean;
    },
  ): Promise<MobileApiResponse<T>> {
    const startTime = Date.now();
    const requestId = uuidv4();

    try {
      // Apply optimizations based on device capabilities
      let optimizedData = data;

      if (this.config.enableCompression && options?.compress) {
        optimizedData = await this.optimizeForDevice(data, request.deviceInfo);
      }

      // Check cache if enabled
      let cacheHit = false;
      if (this.config.enableCaching && options?.cacheKey) {
        const cached = await this.cachingService.get<T>(options.cacheKey);
        if (cached) {
          optimizedData = cached;
          cacheHit = true;
        }
      }

      // Set cache if enabled and not hit
      if (this.config.enableCaching && options?.cacheKey && !cacheHit) {
        await this.cachingService.set(options.cacheKey, optimizedData, {
          ttl: this.config.cacheTimeout,
        });
      }

      const responseTime = Date.now() - startTime;

      const response: MobileApiResponse<T> = {
        success: true,
        data: optimizedData,
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: '1.0.0',
          deviceInfo: request.deviceInfo,
          performance: {
            responseTime,
            memoryUsage: process.memoryUsage().heapUsed,
            cacheHit,
          },
        },
      };

      if (options?.pagination) {
        response.pagination = {
          page: options.pagination.page,
          limit: options.pagination.limit,
          total: options.pagination.total,
          totalPages: Math.ceil(options.pagination.total / options.pagination.limit),
          hasNext: options.pagination.page < Math.ceil(options.pagination.total / options.pagination.limit),
          hasPrev: options.pagination.page > 1,
        };
      }

      // Track analytics
      this.trackApiCall(request, responseTime, true);

      return response;
    } catch (error) {
      this.logger.error('Error creating mobile response:', error);
      
      const responseTime = Date.now() - startTime;
      this.trackApiCall(request, responseTime, false);

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
          details: error.message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          version: '1.0.0',
          deviceInfo: request.deviceInfo,
          performance: {
            responseTime,
            memoryUsage: process.memoryUsage().heapUsed,
            cacheHit: false,
          },
        },
      };
    }
  }

  async optimizeImage(
    imageBuffer: Buffer,
    deviceInfo: MobileDeviceInfo,
    options?: ImageOptimizationOptions,
  ): Promise<Buffer> {
    if (!this.config.enableImageOptimization) {
      return imageBuffer;
    }

    return this.optimizationService.optimizeImage(imageBuffer, options || {}, deviceInfo);
  }

  async generateResponsiveImages(
    imageBuffer: Buffer,
    deviceInfo: MobileDeviceInfo,
  ): Promise<{ [key: string]: Buffer }> {
    return this.optimizationService.generateResponsiveImages(imageBuffer, deviceInfo);
  }

  async getCachedData<T>(key: string): Promise<T | null> {
    if (!this.config.enableCaching) {
      return null;
    }

    return this.cachingService.get<T>(key);
  }

  async setCachedData<T>(key: string, data: T, options?: Partial<CacheOptions>): Promise<void> {
    if (!this.config.enableCaching) {
      return;
    }

    await this.cachingService.set(key, data, options);
  }

  async getOfflineData(userId: string, type?: string) {
    if (!this.config.enableOfflineSupport) {
      return [];
    }

    return this.cachingService.getOfflineData(userId, type);
  }

  async setOfflineData(data: any, userId: string): Promise<void> {
    if (!this.config.enableOfflineSupport) {
      return;
    }

    await this.cachingService.setOfflineData(data, userId);
  }

  async syncOfflineData(userId: string) {
    if (!this.config.enableOfflineSupport) {
      return { synced: 0, conflicts: 0, errors: 0 };
    }

    return this.cachingService.syncOfflineData(userId);
  }

  async sendPushNotification(
    userId: string,
    payload: PushNotificationPayload,
    deviceInfo: MobileDeviceInfo,
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.config.enablePushNotifications) {
      return {
        success: false,
        error: 'Push notifications not enabled',
      };
    }

    try {
      // Simulate push notification sending
      const messageId = uuidv4();
      
      this.logger.log(`Push notification sent to user ${userId}: ${payload.title}`);
      
      return {
        success: true,
        messageId,
      };
    } catch (error) {
      this.logger.error('Push notification error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async validateDevice(deviceInfo: MobileDeviceInfo) {
    return this.securityService.validateDevice(deviceInfo);
  }

  async authenticateUser(
    userId: string,
    credentials: any,
    deviceInfo: MobileDeviceInfo,
  ) {
    return this.securityService.authenticateUser(userId, credentials, deviceInfo);
  }

  async validateToken(token: string, deviceInfo: MobileDeviceInfo) {
    return this.securityService.validateToken(token, deviceInfo);
  }

  async encryptData(data: any, key?: string): Promise<string> {
    return this.securityService.encryptData(data, key);
  }

  async decryptData(encryptedData: string, key?: string): Promise<any> {
    return this.securityService.decryptData(encryptedData, key);
  }

  private async optimizeForDevice<T>(data: T, deviceInfo: MobileDeviceInfo): Promise<T> {
    // Apply device-specific optimizations
    if (deviceInfo.connectionSpeed === 'slow') {
      // Reduce data size for slow connections
      return this.reduceDataSize(data);
    }

    if (deviceInfo.screenSize.density < 2) {
      // Optimize for low-density screens
      return this.optimizeForLowDensity(data);
    }

    return data;
  }

  private reduceDataSize<T>(data: T): T {
    // Remove unnecessary fields for slow connections
    if (typeof data === 'object' && data !== null) {
      const optimized = { ...data };
      
      // Remove large fields that aren't essential
      if ('images' in optimized) {
        delete optimized.images;
      }
      if ('attachments' in optimized) {
        delete optimized.attachments;
      }
      
      return optimized as T;
    }
    
    return data;
  }

  private optimizeForLowDensity<T>(data: T): T {
    // Optimize for low-density screens
    if (typeof data === 'object' && data !== null) {
      const optimized = { ...data };
      
      // Reduce image sizes for low-density screens
      if ('images' in optimized && Array.isArray(optimized.images)) {
        optimized.images = optimized.images.map((img: any) => ({
          ...img,
          width: Math.floor(img.width * 0.5),
          height: Math.floor(img.height * 0.5),
        }));
      }
      
      return optimized as T;
    }
    
    return data;
  }

  private trackApiCall(request: MobileApiRequest, responseTime: number, success: boolean): void {
    const deviceId = this.generateDeviceId(request.deviceInfo);
    let analytics = this.analytics.get(deviceId);

    if (!analytics) {
      analytics = {
        sessionId: uuidv4(),
        deviceId,
        events: [],
        performance: {
          pageLoadTime: 0,
          apiResponseTime: 0,
          memoryUsage: 0,
          networkLatency: 0,
        },
        errors: [],
      };
      this.analytics.set(deviceId, analytics);
    }

    analytics.events.push({
      name: 'api_call',
      timestamp: new Date().toISOString(),
      properties: {
        success,
        responseTime,
        deviceInfo: request.deviceInfo,
      },
    });

    analytics.performance.apiResponseTime = responseTime;
    analytics.performance.memoryUsage = process.memoryUsage().heapUsed;

    if (!success) {
      analytics.errors.push({
        message: 'API call failed',
        timestamp: new Date().toISOString(),
        severity: 'medium',
      });
    }
  }

  private generateDeviceId(deviceInfo: MobileDeviceInfo): string {
    const deviceString = `${deviceInfo.platform}-${deviceInfo.version}-${deviceInfo.model}`;
    return Buffer.from(deviceString).toString('base64');
  }

  async getAnalytics(deviceId?: string): Promise<MobileAnalytics[]> {
    if (deviceId) {
      const analytics = this.analytics.get(deviceId);
      return analytics ? [analytics] : [];
    }

    return Array.from(this.analytics.values());
  }

  async getPerformanceMetrics() {
    return {
      optimization: this.optimizationService.getPerformanceMetrics(),
      cache: await this.cachingService.getCacheStats(),
      security: await this.securityService.getSecurityStats(),
    };
  }

  getConfig(): MobileApiConfig {
    return { ...this.config };
  }
}
