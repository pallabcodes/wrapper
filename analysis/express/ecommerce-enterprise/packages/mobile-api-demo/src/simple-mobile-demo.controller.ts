import { Controller, Get, Headers } from '@nestjs/common';

@Controller('mobile-api-demo')
export class SimpleMobileDemoController {
  @Get('health')
  async getHealth() {
    return {
      success: true,
      results: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          mobileApi: 'operational',
        },
        uptime: '99.9%',
        lastCheck: new Date().toISOString(),
      },
      message: 'Mobile API system health check passed',
    };
  }

  @Get('test')
  async getTest(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    
    return {
      success: true,
      data: {
        message: 'Mobile API test endpoint working',
        deviceInfo,
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: 'test-123',
        version: '1.0.0',
        deviceInfo,
        performance: {
          responseTime: 10,
          memoryUsage: process.memoryUsage().heapUsed,
          cacheHit: false,
        },
      },
    };
  }

  @Get('products')
  async getProducts(@Headers() headers: any) {
    const deviceInfo = this.extractDeviceInfo(headers);
    
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 10,
      description: `This is a great product for mobile users.`,
      images: [
        {
          url: `https://example.com/images/product-${i + 1}.jpg`,
          alt: `Product ${i + 1} Image`,
          width: 400,
          height: 400,
        },
      ],
      category: ['Electronics', 'Mobile', 'Accessories'][Math.floor(Math.random() * 3)],
      rating: Math.floor(Math.random() * 5) + 1,
      reviews: Math.floor(Math.random() * 100),
      inStock: Math.random() > 0.1,
    }));

    return {
      success: true,
      data: products,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: 'products-123',
        version: '1.0.0',
        deviceInfo,
        performance: {
          responseTime: 15,
          memoryUsage: process.memoryUsage().heapUsed,
          cacheHit: false,
        },
      },
      pagination: {
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10,
        hasNext: true,
        hasPrev: false,
      },
    };
  }

  private extractDeviceInfo(headers: any) {
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
