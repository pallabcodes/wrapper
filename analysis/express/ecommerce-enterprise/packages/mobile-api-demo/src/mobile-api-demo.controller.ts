import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MobileApiDemoService } from './mobile-api-demo.service';
import { MobileDeviceInfo } from '@ecommerce-enterprise/nest-mobile-apis';
import { MobileApi, MobileOptimization, MobileSecurity, MobileReadHeavy, MobileSecureReadHeavy, RequireRoles, RequirePermissions, RequireOwner } from '@ecommerce-enterprise/nest-mobile-apis';

@Controller('mobile-api-demo')
export class MobileApiDemoController {
  private readonly logger = new Logger(MobileApiDemoController.name);

  constructor(private mobileApiDemoService: MobileApiDemoService) {
    this.logger.log('MobileApiDemoController initialized');
  }

  @Get('health')
  @MobileApi({ compress: true })
  async getHealth() {
    this.logger.log('Health endpoint called');
    this.logger.log('Service instance:', !!this.mobileApiDemoService);
    if (!this.mobileApiDemoService) {
      throw new Error('MobileApiDemoService is not injected properly');
    }
    return this.mobileApiDemoService.getSystemHealth();
  }

  @Get('products')
  @MobileReadHeavy({ cacheKey: 'products:list', ttl: 60 })
  async getProducts(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getProducts(deviceInfo, page, limit);
  }

  @Get('products/:id')
  @MobileReadHeavy({ cacheKey: 'products:detail', ttl: 120 })
  async getProductDetails(
    @Param('id') productId: string,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getProductDetails(productId, deviceInfo);
  }

  @Get('profile/:userId')
  @MobileSecureReadHeavy({ cacheKey: 'profile:read', ttl: 30 })
  @RequireOwner('userId')
  async getUserProfile(
    @Param('userId') userId: string,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getUserProfile(userId, deviceInfo);
  }

  @Get('offline/:userId')
  @MobileSecureReadHeavy({ cacheKey: 'offline:data', ttl: 120 })
  async getOfflineData(
    @Param('userId') userId: string,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getOfflineData(userId, deviceInfo);
  }

  @Post('offline/:userId/sync')
  @HttpCode(HttpStatus.OK)
  @MobileSecurity({ requireAuth: true })
  @RequirePermissions('offline:sync')
  async syncOfflineData(
    @Param('userId') userId: string,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.syncOfflineData(userId, deviceInfo);
  }

  @Post('notifications/:userId')
  @HttpCode(HttpStatus.OK)
  @MobileSecurity({ requireAuth: true })
  @RequireRoles('admin', 'support')
  async sendPushNotification(
    @Param('userId') userId: string,
    @Headers() headers: any,
  ) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.sendPushNotification(userId, deviceInfo);
  }

  @Get('analytics')
  @MobileApi({ compress: true })
  async getAnalytics(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getAnalytics(deviceInfo);
  }

  @Get('performance')
  @MobileReadHeavy({ cacheKey: 'metrics', ttl: 30 })
  async getPerformanceMetrics(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    return this.mobileApiDemoService.getPerformanceMetrics(deviceInfo);
  }

  @Get('test/optimization')
  @MobileOptimization({ enableImageOptimization: true, enableMinification: true, quality: 75 })
  async testOptimization(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    
    // Test data with various optimization opportunities
    const testData = {
      products: Array.from({ length: 10 }, (_, i) => ({
        id: `test-product-${i + 1}`,
        name: `Test Product ${i + 1}`,
        description: `This is a test product with a very long description that can be optimized for mobile devices. It includes multiple paragraphs of text that can be compressed and optimized for better performance on mobile networks.`,
        price: Math.floor(Math.random() * 1000) + 10,
        images: [
          {
            url: `https://example.com/images/test-product-${i + 1}-1.jpg`,
            alt: `Test Product ${i + 1} Image 1`,
            width: 1200,
            height: 1200,
          },
          {
            url: `https://example.com/images/test-product-${i + 1}-2.jpg`,
            alt: `Test Product ${i + 1} Image 2`,
            width: 1200,
            height: 1200,
          },
        ],
        specifications: {
          brand: 'TestBrand',
          model: `Test-Model-${i + 1}`,
          weight: '0.5kg',
          dimensions: '10x5x2cm',
          color: 'Black',
          material: 'Premium Plastic',
          warranty: '2 years',
          features: [
            'Feature 1: High-quality materials',
            'Feature 2: Advanced technology',
            'Feature 3: Mobile-optimized design',
            'Feature 4: Easy to use',
            'Feature 5: Long-lasting durability',
          ],
        },
        reviews: Array.from({ length: 5 }, (_, j) => ({
          id: `review-${i}-${j + 1}`,
          userId: `user-${j + 1}`,
          userName: `User ${j + 1}`,
          rating: Math.floor(Math.random() * 5) + 1,
          title: `Great test product! ${j + 1}`,
          comment: `This test product exceeded my expectations. The quality is excellent and it works perfectly on my mobile device. I would definitely recommend it to others.`,
          date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          helpful: Math.floor(Math.random() * 20),
          verified: Math.random() > 0.3,
        })),
        tags: ['test', 'mobile', 'optimized', 'premium', 'fast', 'reliable'],
      })),
      metadata: {
        totalProducts: 10,
        page: 1,
        limit: 10,
        hasMore: false,
        lastUpdated: new Date().toISOString(),
      },
    };

    return {
      success: true,
      data: testData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `test-optimization-${Date.now()}`,
        version: deviceInfo.appVersion || '1.0.0',
        deviceInfo,
        performance: {
          responseTime: Math.random() * 30 + 10,
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024),
          cacheHit: false,
        },
      },
    };
  }

  @Get('test/caching')
  @MobileReadHeavy({ cacheKey: 'test:caching', ttl: 45 })
  async testCaching(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    
    const testData = {
      message: 'This is a test for caching functionality',
      timestamp: new Date().toISOString(),
      deviceInfo,
      randomValue: Math.random(),
    };

    return {
      success: true,
      data: testData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `test-caching-${Date.now()}`,
        version: deviceInfo.appVersion || '1.0.0',
        deviceInfo,
        performance: {
          responseTime: Math.random() * 20 + 5,
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024),
          cacheHit: false,
        },
      },
    };
  }

  @Get('test/security')
  @MobileSecurity({ requireAuth: true, allowedPlatforms: ['ios', 'android', 'web'] })
  async testSecurity(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    
    const testData = {
      message: 'Security test passed',
      timestamp: new Date().toISOString(),
      deviceInfo,
      securityContext: {
        authenticated: true,
        deviceValidated: true,
        platform: deviceInfo.platform,
        version: deviceInfo.version,
      },
    };

    return {
      success: true,
      data: testData,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `test-security-${Date.now()}`,
        version: deviceInfo.appVersion || '1.0.0',
        deviceInfo,
        performance: {
          responseTime: Math.random() * 15 + 5,
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024),
          cacheHit: false,
        },
      },
    };
  }

  private extractDeviceInfo(headers: any): MobileDeviceInfo {
    const userAgent = (headers['user-agent'] as string | undefined) ?? '';
    const rawPlatform = (headers['x-device-platform'] as string | undefined) ?? this.detectPlatform(userAgent);
    const platform = (['ios', 'android', 'web', 'unknown'] as const).includes(rawPlatform as any)
      ? (rawPlatform as 'ios' | 'android' | 'web' | 'unknown')
      : 'unknown';
    const version = (headers['x-device-version'] as string | undefined) ?? this.detectVersion(userAgent);
    const model = (headers['x-device-model'] as string | undefined) ?? 'Unknown';
    const screenSize = this.parseScreenSize(headers['x-screen-size'] as string | undefined);
    const rawSpeed = (headers['x-connection-speed'] as string | undefined) ?? 'unknown';
    const connectionSpeed = (['slow', 'medium', 'fast', 'unknown'] as const).includes(rawSpeed as any)
      ? (rawSpeed as 'slow' | 'medium' | 'fast' | 'unknown')
      : 'unknown';
    const appVersion = (headers['x-app-version'] as string | undefined) ?? '1.0.0';
    const language = ((headers['accept-language'] as string | undefined)?.split(',')[0]) ?? 'en-US';
    const timezone = (headers['x-timezone'] as string | undefined) ?? 'UTC';

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