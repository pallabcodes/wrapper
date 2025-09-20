import { Controller, Get, Logger } from '@nestjs/common';

@Controller('mobile-api-demo')
export class SimpleMobileApiDemoController {
  private readonly logger = new Logger(SimpleMobileApiDemoController.name);

  constructor() {
    this.logger.log('SimpleMobileApiDemoController initialized');
  }

  @Get('health')
  async getHealth() {
    this.logger.log('Health endpoint called');
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

  @Get('products')
  async getProducts() {
    this.logger.log('Products endpoint called');
    const products = Array.from({ length: 10 }, (_, i) => ({
      id: `product-${i + 1}`,
      name: `Product ${i + 1}`,
      price: Math.floor(Math.random() * 1000) + 10,
      description: `This is a great product for mobile users.`,
      images: [
        {
          url: `https://example.com/images/product-${i + 1}-1.jpg`,
          alt: `Product ${i + 1} Image 1`,
          width: 400,
          height: 400,
        },
      ],
      category: ['Electronics', 'Mobile', 'Accessories'][Math.floor(Math.random() * 3)],
      rating: Math.floor(Math.random() * 5) + 1,
      reviews: Math.floor(Math.random() * 100),
      inStock: Math.random() > 0.1,
      tags: ['mobile', 'optimized', 'fast'],
    }));

    return {
      success: true,
      data: products,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `products-${Date.now()}`,
        version: '1.0.0',
        performance: {
          responseTime: Math.random() * 50 + 10,
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024),
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

  @Get('test')
  async testEndpoint() {
    this.logger.log('Test endpoint called');
    return {
      success: true,
      data: {
        message: 'Mobile API test endpoint working',
        timestamp: new Date().toISOString(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: `test-${Date.now()}`,
        version: '1.0.0',
        performance: {
          responseTime: Math.random() * 10 + 5,
          memoryUsage: process.memoryUsage().heapUsed / (1024 * 1024),
          cacheHit: false,
        },
      },
    };
  }
}
