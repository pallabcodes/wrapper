import { Injectable, Logger } from '@nestjs/common';
// import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
// import * as Jimp from 'jimp';
const { LRUCache } = require('lru-cache');
import {
  MobileDeviceInfo,
  ImageOptimizationOptions,
  // CacheOptions,
  MobilePerformanceMetrics,
} from '../interfaces/mobile-api.interface';

@Injectable()
export class MobileOptimizationService {
  private readonly logger = new Logger(MobileOptimizationService.name);
  private imageCache: any;
  private performanceMetrics: MobilePerformanceMetrics;

  constructor(/* private configService: ConfigService */) {
    this.imageCache = new LRUCache({
      max: 1000,
      ttl: 1000 * 60 * 60, // 1 hour
    });

    this.performanceMetrics = {
      apiCalls: {
        total: 0,
        successful: 0,
        failed: 0,
        averageResponseTime: 0,
        slowestEndpoint: '',
        fastestEndpoint: '',
      },
      cache: {
        hitRate: 0,
        missRate: 0,
        evictions: 0,
        memoryUsage: 0,
      },
      images: {
        totalProcessed: 0,
        totalSize: 0,
        averageSize: 0,
        compressionRatio: 0,
      },
      network: {
        totalRequests: 0,
        totalBytes: 0,
        averageLatency: 0,
        slowestRequest: '',
      },
    };
  }

  async optimizeImage(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions,
    deviceInfo: MobileDeviceInfo,
  ): Promise<Buffer> {
    const startTime = Date.now();
    const originalSize = imageBuffer.length;

    try {
      // Determine optimal format based on device capabilities
      const format = this.getOptimalFormat(deviceInfo, options.format);
      const quality = this.getOptimalQuality(deviceInfo, options.quality);
      const dimensions = this.getOptimalDimensions(deviceInfo, options);

      let sharpInstance = sharp(imageBuffer);

      // Apply transformations
      if (dimensions.width || dimensions.height) {
        sharpInstance = sharpInstance.resize(dimensions.width, dimensions.height, {
          fit: 'inside',
          withoutEnlargement: true,
        });
      }

      if (options.grayscale) {
        sharpInstance = sharpInstance.grayscale();
      }

      if (options.blur && options.blur > 0) {
        sharpInstance = sharpInstance.blur(options.blur);
      }

      if (options.sharpen && options.sharpen > 0) {
        sharpInstance = sharpInstance.sharpen(options.sharpen);
      }

      if (options.crop) {
        sharpInstance = sharpInstance.extract({
          left: options.crop.x,
          top: options.crop.y,
          width: options.crop.width,
          height: options.crop.height,
        });
      }

      // Convert to optimal format
      const optimizedBuffer = await sharpInstance
        .toFormat(format, { quality, progressive: options.progressive })
        .toBuffer();

      const processingTime = Date.now() - startTime;
      const compressionRatio = originalSize / optimizedBuffer.length;

      // Update metrics
      this.updateImageMetrics(originalSize, optimizedBuffer.length, processingTime);

      this.logger.debug(
        `Image optimized: ${originalSize} -> ${optimizedBuffer.length} bytes (${compressionRatio.toFixed(2)}x compression)`,
      );

      return optimizedBuffer;
    } catch (error) {
      this.logger.error('Image optimization failed:', error);
      throw new Error(`Image optimization failed: ${(error as Error).message}`);
    }
  }

  async getCachedImage(cacheKey: string): Promise<Buffer | null> {
    const cached = this.imageCache.get(cacheKey);
    if (cached) {
      this.updateCacheMetrics('hit');
      return cached;
    }
    this.updateCacheMetrics('miss');
    return null;
  }

  async setCachedImage(cacheKey: string, imageBuffer: Buffer): Promise<void> {
    this.imageCache.set(cacheKey, imageBuffer);
  }

  private getOptimalFormat(deviceInfo: MobileDeviceInfo, requestedFormat?: string): 'jpeg' | 'png' | 'webp' | 'avif' {
    // WebP is supported on most modern devices
    if (deviceInfo.platform === 'android' && parseFloat(deviceInfo.version) >= 4.0) {
      return 'webp';
    }
    if (deviceInfo.platform === 'ios' && parseFloat(deviceInfo.version) >= 14.0) {
      return 'avif';
    }
    if (deviceInfo.platform === 'ios' && parseFloat(deviceInfo.version) >= 10.0) {
      return 'webp';
    }
    
    // Validate requested format
    const validFormats = ['jpeg', 'png', 'webp', 'avif'];
    if (requestedFormat && validFormats.includes(requestedFormat)) {
      return requestedFormat as 'jpeg' | 'png' | 'webp' | 'avif';
    }
    
    return 'jpeg';
  }

  private getOptimalQuality(deviceInfo: MobileDeviceInfo, requestedQuality?: number): number {
    if (requestedQuality) {
      return Math.min(100, Math.max(10, requestedQuality));
    }

    // Adjust quality based on device capabilities and network
    if (deviceInfo.connectionSpeed === 'slow') {
      return 60;
    }
    if (deviceInfo.connectionSpeed === 'medium') {
      return 75;
    }
    return 85;
  }

  private getOptimalDimensions(
    deviceInfo: MobileDeviceInfo,
    options: ImageOptimizationOptions,
  ): { width?: number; height?: number } {
    if (options.width && options.height) {
      return { width: options.width, height: options.height };
    }

    // Calculate optimal dimensions based on device screen
    const { width: screenWidth, height: screenHeight, density } = deviceInfo.screenSize;
    const maxWidth = Math.min(screenWidth * density, 2048);
    const maxHeight = Math.min(screenHeight * density, 2048);

    if (options.width) {
      return { width: Math.min(options.width, maxWidth) };
    }
    if (options.height) {
      return { height: Math.min(options.height, maxHeight) };
    }

    return { width: maxWidth, height: maxHeight };
  }

  private updateImageMetrics(originalSize: number, optimizedSize: number, _processingTime: number): void {
    this.performanceMetrics.images.totalProcessed++;
    this.performanceMetrics.images.totalSize += optimizedSize;
    this.performanceMetrics.images.averageSize = 
      this.performanceMetrics.images.totalSize / this.performanceMetrics.images.totalProcessed;
    this.performanceMetrics.images.compressionRatio = 
      this.performanceMetrics.images.totalSize / originalSize;
  }

  private updateCacheMetrics(type: 'hit' | 'miss'): void {
    const total = this.performanceMetrics.cache.hitRate + this.performanceMetrics.cache.missRate + 1;
    
    if (type === 'hit') {
      this.performanceMetrics.cache.hitRate++;
    } else {
      this.performanceMetrics.cache.missRate++;
    }

    this.performanceMetrics.cache.hitRate = this.performanceMetrics.cache.hitRate / total;
    this.performanceMetrics.cache.missRate = this.performanceMetrics.cache.missRate / total;
  }

  async generateResponsiveImages(
    imageBuffer: Buffer,
    deviceInfo: MobileDeviceInfo,
  ): Promise<{ [key: string]: Buffer }> {
    const sizes = [
      { name: 'thumbnail', width: 150, height: 150 },
      { name: 'small', width: 300, height: 300 },
      { name: 'medium', width: 600, height: 600 },
      { name: 'large', width: 1200, height: 1200 },
    ];

    const responsiveImages: { [key: string]: Buffer } = {};

    for (const size of sizes) {
      const optimized = await this.optimizeImage(imageBuffer, {
        width: size.width,
        height: size.height,
        quality: 80,
      }, deviceInfo);
      
      responsiveImages[size.name] = optimized;
    }

    return responsiveImages;
  }

  async compressData(data: any): Promise<Buffer> {
    const jsonString = JSON.stringify(data);
    const buffer = Buffer.from(jsonString, 'utf8');
    
    // Simple compression using gzip
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gzip(buffer, (err: any, compressed: Buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(compressed);
        }
      });
    });
  }

  async decompressData(compressedBuffer: Buffer): Promise<any> {
    const zlib = require('zlib');
    return new Promise((resolve, reject) => {
      zlib.gunzip(compressedBuffer, (err: any, decompressed: Buffer) => {
        if (err) {
          reject(err);
        } else {
          try {
            const jsonString = decompressed.toString('utf8');
            resolve(JSON.parse(jsonString));
          } catch (parseError) {
            reject(parseError);
          }
        }
      });
    });
  }

  getPerformanceMetrics(): MobilePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  async clearCache(): Promise<void> {
    this.imageCache.clear();
    this.logger.log('Image cache cleared');
  }

  async getCacheStats(): Promise<{
    size: number;
    maxSize: number;
    hitRate: number;
    missRate: number;
  }> {
    return {
      size: this.imageCache.size,
      maxSize: this.imageCache.max,
      hitRate: this.performanceMetrics.cache.hitRate,
      missRate: this.performanceMetrics.cache.missRate,
    };
  }
}
