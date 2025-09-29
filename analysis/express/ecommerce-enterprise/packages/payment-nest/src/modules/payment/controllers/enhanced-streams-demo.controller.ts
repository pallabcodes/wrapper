/**
 * Enhanced Streams Demo Controller
 * 
 * Demonstrates the enhanced streams functionality
 * with enterprise features and performance optimizations.
 */

import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  Query, 
  HttpException, 
  HttpStatus,
  Logger 
} from '@nestjs/common';
import { 
  createStreamsAPI, 
  createFluentStreams, 
  streams,
  CreateReadableStream, 
  CreateWritableStream, 
  CreateTransformStream, 
  CreateEncryptedStream, 
  CreateCompressedStream,
  MonitorStreamPerformance,
  StreamSecurity,
  StreamCompliance,
  StreamFlowControl,
  StreamRetry,
  StreamTimeout,
  Streams
} from '@ecommerce-enterprise/node-streams';
import { z } from 'zod';

// Validation schemas
const StreamConfigSchema = z.object({
  algorithm: z.string().optional(),
  enableEncryption: z.boolean().optional(),
  enableCompression: z.boolean().optional(),
  enableMonitoring: z.boolean().optional(),
  enableBackpressure: z.boolean().optional(),
  enableRateLimiting: z.boolean().optional(),
  maxThroughput: z.number().optional(),
  maxConcurrency: z.number().optional(),
  retryAttempts: z.number().optional(),
  retryDelay: z.number().optional(),
  timeout: z.number().optional(),
  compliance: z.array(z.string()).optional(),
  userId: z.string().optional(),
  sessionId: z.string().optional(),
});

@Controller('enhanced-streams')
export class EnhancedStreamsDemoController {
  private readonly logger = new Logger(EnhancedStreamsDemoController.name);
  
  // Different streams API instances for demonstration
  private simpleStreams = createStreamsAPI({
    algorithm: 'aes-256-gcm',
    enableEncryption: false,
    enableCompression: false,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 0,
    maxConcurrency: 0,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['sox', 'gdpr', 'hipaa', 'pci'],
  });
  
  private fluentStreams = createFluentStreams({
    algorithm: 'aes-256-gcm',
    enableEncryption: false,
    enableCompression: false,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 0,
    maxConcurrency: 0,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: [],
  });

  /**
   * 🎯 Simple API Example
   * 
   * One-line stream creation with enterprise features
   */
  @Post('simple/readable')
  async simpleCreateReadable(@Body() config: Record<string, unknown>) {
    this.logger.log('Simple API readable stream creation example');
    
    try {
      // ✅ One line with all enterprise features
      const stream = await this.simpleStreams.createReadable({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableEncryption: (config as any).enableEncryption || false,
        enableCompression: (config as any).enableCompression || false,
        enableMonitoring: (config as any).enableMonitoring !== false,
        enableBackpressure: (config as any).enableBackpressure !== false,
        enableRateLimiting: (config as any).enableRateLimiting || false,
        maxThroughput: (config as any).maxThroughput || 0,
        maxConcurrency: (config as any).maxConcurrency || 0,
        retryAttempts: (config as any).retryAttempts || 3,
        retryDelay: (config as any).retryDelay || 1000,
        timeout: (config as any).timeout || 30000,
        userId: (config as any).userId,
        compliance: (config as any).compliance || [],
      });
      
      return {
        success: true,
        message: 'Readable stream created with Simple API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple readable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Readable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('simple/writable')
  async simpleCreateWritable(@Body() config: Record<string, unknown>) {
    this.logger.log('Simple API writable stream creation example');
    
    try {
      // ✅ One line with all enterprise features
      const stream = await this.simpleStreams.createWritable({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableEncryption: (config as any).enableEncryption || false,
        enableCompression: (config as any).enableCompression || false,
        enableMonitoring: (config as any).enableMonitoring !== false,
        enableBackpressure: (config as any).enableBackpressure !== false,
        enableRateLimiting: (config as any).enableRateLimiting || false,
        maxThroughput: (config as any).maxThroughput || 0,
        maxConcurrency: (config as any).maxConcurrency || 0,
        retryAttempts: (config as any).retryAttempts || 3,
        retryDelay: (config as any).retryDelay || 1000,
        timeout: (config as any).timeout || 30000,
        userId: (config as any).userId,
        compliance: (config as any).compliance || [],
      });
      
      return {
        success: true,
        message: 'Writable stream created with Simple API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple writable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Writable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('simple/transform')
  async simpleCreateTransform(@Body() config: Record<string, unknown>) {
    this.logger.log('Simple API transform stream creation example');
    
    try {
      // ✅ One line with all enterprise features
      const stream = await this.simpleStreams.createTransform({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableEncryption: (config as any).enableEncryption || false,
        enableCompression: (config as any).enableCompression || false,
        enableMonitoring: (config as any).enableMonitoring !== false,
        enableBackpressure: (config as any).enableBackpressure !== false,
        enableRateLimiting: (config as any).enableRateLimiting || false,
        maxThroughput: (config as any).maxThroughput || 0,
        maxConcurrency: (config as any).maxConcurrency || 0,
        retryAttempts: (config as any).retryAttempts || 3,
        retryDelay: (config as any).retryDelay || 1000,
        timeout: (config as any).timeout || 30000,
        userId: (config as any).userId,
        compliance: (config as any).compliance || [],
      });
      
      return {
        success: true,
        message: 'Transform stream created with Simple API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple transform stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Transform stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('simple/encrypted')
  async simpleCreateEncrypted(@Body() config: Record<string, unknown>) {
    this.logger.log('Simple API encrypted stream creation example');
    
    try {
      // ✅ One line with encryption
      const stream = await this.simpleStreams.createEncrypted({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        encryptionKey: Buffer.from((config as any).encryptionKey || 'default-key-32-characters-long'),
        enableIntegrityCheck: (config as any).enableIntegrityCheck !== false,
        enableEncryption: true,
        enableMonitoring: (config as any).enableMonitoring !== false,
        enableBackpressure: (config as any).enableBackpressure !== false,
        enableRateLimiting: (config as any).enableRateLimiting || false,
        maxThroughput: (config as any).maxThroughput || 0,
        maxConcurrency: (config as any).maxConcurrency || 0,
        retryAttempts: (config as any).retryAttempts || 3,
        retryDelay: (config as any).retryDelay || 1000,
        timeout: (config as any).timeout || 30000,
        userId: (config as any).userId,
        compliance: (config as any).compliance || [],
      });
      
      return {
        success: true,
        message: 'Encrypted stream created with Simple API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          encryptionEnabled: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple encrypted stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Encrypted stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('simple/compressed')
  async simpleCreateCompressed(@Body() config: Record<string, unknown>) {
    this.logger.log('Simple API compressed stream creation example');
    
    try {
      // ✅ One line with compression
      const stream = await this.simpleStreams.createCompressed({
        algorithm: (config as any).algorithm || 'gzip',
        compressionLevel: (config as any).compressionLevel || 6,
        enableDictionary: (config as any).enableDictionary !== false,
        enableCompression: true,
        enableMonitoring: (config as any).enableMonitoring !== false,
        enableBackpressure: (config as any).enableBackpressure !== false,
        enableRateLimiting: (config as any).enableRateLimiting || false,
        maxThroughput: (config as any).maxThroughput || 0,
        maxConcurrency: (config as any).maxConcurrency || 0,
        retryAttempts: (config as any).retryAttempts || 3,
        retryDelay: (config as any).retryDelay || 1000,
        timeout: (config as any).timeout || 30000,
        userId: (config as any).userId,
        compliance: (config as any).compliance || [],
      });
      
      return {
        success: true,
        message: 'Compressed stream created with Simple API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          compressionEnabled: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple compressed stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Compressed stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🚀 Fluent API Example
   * 
   * Chainable operations with self-documenting code
   */
  @Post('fluent/readable')
  async fluentCreateReadable(@Body() config: Record<string, unknown>) {
    this.logger.log('Fluent API readable stream creation example');
    
    try {
      // ✅ Fluent, chainable API
      const stream = await this.fluentStreams
        .createReadable()
        .withAlgorithm((config as any).algorithm || 'aes-256-gcm')
        .withEncryption((config as any).algorithm || 'aes-256-gcm')
        .withCompression((config as any).compressionAlgorithm || 'gzip', (config as any).compressionLevel || 6)
        .forUser((config as any).userId || 'system')
        .withCompliance((config as any).compliance || ['SOX', 'GDPR'])
        .withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurrency || 100)
        .withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 1000)
        .withTimeout((config as any).timeout || 30000)
        .execute();
      
      return {
        success: true,
        message: 'Readable stream created with Fluent API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          fluent: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent readable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Readable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/writable')
  async fluentCreateWritable(@Body() config: Record<string, unknown>) {
    this.logger.log('Fluent API writable stream creation example');
    
    try {
      // ✅ Fluent, chainable API
      const stream = await this.fluentStreams
        .createWritable()
        .withAlgorithm((config as any).algorithm || 'aes-256-gcm')
        .withEncryption((config as any).algorithm || 'aes-256-gcm')
        .withCompression((config as any).compressionAlgorithm || 'gzip', (config as any).compressionLevel || 6)
        .forUser((config as any).userId || 'system')
        .withCompliance((config as any).compliance || ['SOX', 'GDPR'])
        .withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurrency || 100)
        .withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 1000)
        .withTimeout((config as any).timeout || 30000)
        .execute();
      
      return {
        success: true,
        message: 'Writable stream created with Fluent API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          fluent: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent writable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Writable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/transform')
  async fluentCreateTransform(@Body() config: Record<string, unknown>) {
    this.logger.log('Fluent API transform stream creation example');
    
    try {
      // ✅ Fluent, chainable API
      const stream = await this.fluentStreams
        .createTransform()
        .withAlgorithm((config as any).algorithm || 'aes-256-gcm')
        .withEncryption((config as any).algorithm || 'aes-256-gcm')
        .withCompression((config as any).compressionAlgorithm || 'gzip', (config as any).compressionLevel || 6)
        .forUser((config as any).userId || 'system')
        .withCompliance((config as any).compliance || ['SOX', 'GDPR'])
        .withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurrency || 100)
        .withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 1000)
        .withTimeout((config as any).timeout || 30000)
        .execute();
      
      return {
        success: true,
        message: 'Transform stream created with Fluent API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          fluent: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent transform stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Transform stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/encrypted')
  async fluentCreateEncrypted(@Body() config: Record<string, unknown>) {
    this.logger.log('Fluent API encrypted stream creation example');
    
    try {
      // ✅ Fluent, chainable API
      const stream = await this.fluentStreams
        .createEncrypted()
        .withEncryption((config as any).algorithm || 'aes-256-gcm', Buffer.from((config as any).encryptionKey || 'default-key-32-characters-long'))
        .forUser((config as any).userId || 'system')
        .withCompliance((config as any).compliance || ['SOX', 'GDPR'])
        .withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurrency || 100)
        .withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 1000)
        .withTimeout((config as any).timeout || 30000)
        .execute();
      
      return {
        success: true,
        message: 'Encrypted stream created with Fluent API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          fluent: true,
          encryptionEnabled: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent encrypted stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Encrypted stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/compressed')
  async fluentCreateCompressed(@Body() config: Record<string, unknown>) {
    this.logger.log('Fluent API compressed stream creation example');
    
    try {
      // ✅ Fluent, chainable API
      const stream = await this.fluentStreams
        .createCompressed()
        .withAlgorithm((config as any).algorithm || 'gzip')
        .withCompressionLevel((config as any).compressionLevel || 6)
        .forUser((config as any).userId || 'system')
        .withCompliance((config as any).compliance || ['SOX', 'GDPR'])
        .withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurrency || 100)
        .withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 1000)
        .withTimeout((config as any).timeout || 30000)
        .execute();
      
      return {
        success: true,
        message: 'Compressed stream created with Fluent API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          fluent: true,
          compressionEnabled: true,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent compressed stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Compressed stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🎯 Decorator API Example
   * 
   * Automatic operations with zero boilerplate
   */
  @Post('decorator/readable')
  @CreateReadableStream({
    algorithm: 'aes-256-gcm',
    enableEncryption: true,
    enableCompression: true,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 1000000,
    maxConcurrency: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['SOX', 'GDPR'],
    userId: 'system',
  })
  @MonitorStreamPerformance({ 
    operation: 'decorator_readable', 
    threshold: 1000,
    enableAlerting: true 
  })
  @StreamSecurity('high')
  @StreamCompliance(['SOX', 'GDPR'])
  @StreamFlowControl({ level: 'medium' })
  @StreamRetry({ maxAttempts: 3 })
  @StreamTimeout(30000)
  async decoratorCreateReadable(@Body() config: Record<string, unknown>) {
    this.logger.log('Decorator API readable stream creation example');
    
    // ✅ Method automatically creates the stream
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Flow control is automatic
    // ✅ Retry logic is automatic
    // ✅ Timeout control is automatic
    
    return {
      success: true,
      message: 'Readable stream created with Decorator API',
      data: config, // This will be automatically processed
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
        compliance: true,
        flowControl: true,
        retryLogic: true,
        timeoutControl: true,
      },
    };
  }

  @Post('decorator/writable')
  @CreateWritableStream({
    algorithm: 'aes-256-gcm',
    enableEncryption: true,
    enableCompression: true,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 1000000,
    maxConcurrency: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['SOX', 'GDPR'],
    userId: 'system',
  })
  @MonitorStreamPerformance({ 
    operation: 'decorator_writable', 
    threshold: 1000,
    enableAlerting: true 
  })
  @StreamSecurity('high')
  @StreamCompliance(['SOX', 'GDPR'])
  @StreamFlowControl({ level: 'medium' })
  @StreamRetry({ maxAttempts: 3 })
  @StreamTimeout(30000)
  async decoratorCreateWritable(@Body() config: Record<string, unknown>) {
    this.logger.log('Decorator API writable stream creation example');
    
    // ✅ Method automatically creates the stream
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Flow control is automatic
    // ✅ Retry logic is automatic
    // ✅ Timeout control is automatic
    
    return {
      success: true,
      message: 'Writable stream created with Decorator API',
      data: config, // This will be automatically processed
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
        compliance: true,
        flowControl: true,
        retryLogic: true,
        timeoutControl: true,
      },
    };
  }

  @Post('decorator/transform')
  @CreateTransformStream({
    algorithm: 'aes-256-gcm',
    enableEncryption: true,
    enableCompression: true,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 1000000,
    maxConcurrency: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['SOX', 'GDPR'],
    userId: 'system',
  })
  @MonitorStreamPerformance({ 
    operation: 'decorator_transform', 
    threshold: 1000,
    enableAlerting: true 
  })
  @StreamSecurity('high')
  @StreamCompliance(['SOX', 'GDPR'])
  @StreamFlowControl({ level: 'medium' })
  @StreamRetry({ maxAttempts: 3 })
  @StreamTimeout(30000)
  async decoratorCreateTransform(@Body() config: Record<string, unknown>) {
    this.logger.log('Decorator API transform stream creation example');
    
    // ✅ Method automatically creates the stream
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Flow control is automatic
    // ✅ Retry logic is automatic
    // ✅ Timeout control is automatic
    
    return {
      success: true,
      message: 'Transform stream created with Decorator API',
      data: config, // This will be automatically processed
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
        compliance: true,
        flowControl: true,
        retryLogic: true,
        timeoutControl: true,
      },
    };
  }

  @Post('decorator/encrypted')
  @CreateEncryptedStream({
    algorithm: 'aes-256-gcm',
    enableEncryption: true,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 1000000,
    maxConcurrency: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['SOX', 'GDPR'],
    userId: 'system',
  })
  @MonitorStreamPerformance({ 
    operation: 'decorator_encrypted', 
    threshold: 1000,
    enableAlerting: true 
  })
  @StreamSecurity('high')
  @StreamCompliance(['SOX', 'GDPR'])
  @StreamFlowControl({ level: 'medium' })
  @StreamRetry({ maxAttempts: 3 })
  @StreamTimeout(30000)
  async decoratorCreateEncrypted(@Body() config: Record<string, unknown>) {
    this.logger.log('Decorator API encrypted stream creation example');
    
    // ✅ Method automatically creates the stream
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Flow control is automatic
    // ✅ Retry logic is automatic
    // ✅ Timeout control is automatic
    
    return {
      success: true,
      message: 'Encrypted stream created with Decorator API',
      data: config, // This will be automatically processed
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
        compliance: true,
        flowControl: true,
        retryLogic: true,
        timeoutControl: true,
        encryptionEnabled: true,
      },
    };
  }

  @Post('decorator/compressed')
  @CreateCompressedStream({
    algorithm: 'gzip',
    enableCompression: true,
    enableMonitoring: true,
    enableBackpressure: true,
    enableRateLimiting: false,
    maxThroughput: 1000000,
    maxConcurrency: 100,
    retryAttempts: 3,
    retryDelay: 1000,
    timeout: 30000,
    compliance: ['SOX', 'GDPR'],
    userId: 'system',
  })
  @MonitorStreamPerformance({ 
    operation: 'decorator_compressed', 
    threshold: 1000,
    enableAlerting: true 
  })
  @StreamSecurity('low')
  @StreamCompliance(['SOX', 'GDPR'])
  @StreamFlowControl({ level: 'medium' })
  @StreamRetry({ maxAttempts: 3 })
  @StreamTimeout(30000)
  async decoratorCreateCompressed(@Body() config: Record<string, unknown>) {
    this.logger.log('Decorator API compressed stream creation example');
    
    // ✅ Method automatically creates the stream
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Flow control is automatic
    // ✅ Retry logic is automatic
    // ✅ Timeout control is automatic
    
    return {
      success: true,
      message: 'Compressed stream created with Decorator API',
      data: config, // This will be automatically processed
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
        compliance: true,
        flowControl: true,
        retryLogic: true,
        timeoutControl: true,
        compressionEnabled: true,
      },
    };
  }

  /**
   * 🎯 Quick API Example
   * 
   * Global functions for maximum simplicity
   */
  @Post('quick/readable')
  async quickCreateReadable(@Body() config: Record<string, unknown>) {
    this.logger.log('Quick API readable stream creation example');
    
    try {
      // ✅ Global streams functions
      const stream = await streams.createReadable({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableEncryption: (config as any).enableEncryption || false,
      });
      
      return {
        success: true,
        message: 'Readable stream created with Quick API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          simplicity: 'Maximum',
        },
      };
      
    } catch (error) {
      this.logger.error(`Quick readable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Readable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('quick/writable')
  async quickCreateWritable(@Body() config: Record<string, unknown>) {
    this.logger.log('Quick API writable stream creation example');
    
    try {
      // ✅ Global streams functions
      const stream = await streams.createWritable({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableCompression: (config as any).enableCompression || false,
      });
      
      return {
        success: true,
        message: 'Writable stream created with Quick API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          simplicity: 'Maximum',
        },
      };
      
    } catch (error) {
      this.logger.error(`Quick writable stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Writable stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('quick/transform')
  async quickCreateTransform(@Body() config: Record<string, unknown>) {
    this.logger.log('Quick API transform stream creation example');
    
    try {
      // ✅ Global streams functions
      const stream = await streams.createTransform({
        algorithm: (config as any).algorithm || 'aes-256-gcm',
        enableEncryption: (config as any).enableEncryption || false,
      });
      
      return {
        success: true,
        message: 'Transform stream created with Quick API',
        data: stream,
        features: {
          algorithm: stream.algorithm,
          streamId: stream.streamId,
          type: stream.type,
          status: stream.status,
          createdAt: stream.createdAt,
          simplicity: 'Maximum',
        },
      };
      
    } catch (error) {
      this.logger.error(`Quick transform stream creation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Transform stream creation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📊 Statistics and Monitoring
   */
  @Get('stats')
  async getStats() {
    this.logger.log('Getting streams statistics');
    
    try {
      const stats = await this.simpleStreams.getStats();
      
      return {
        success: true,
        message: 'Streams statistics retrieved',
        data: stats,
        features: {
          totalStreams: stats.totalStreams,
          activeStreams: stats.activeStreams,
          totalBytesProcessed: stats.totalBytesProcessed,
          averageThroughput: stats.averageThroughput,
          averageLatency: stats.averageLatency,
          errorRate: stats.errorRate,
          lastActivity: stats.lastActivity,
        },
      };
      
    } catch (error) {
      this.logger.error(`Failed to get stats: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Failed to get stats', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('streamId') streamId?: string,
    @Query('userId') userId?: string,
    @Query('operation') operation?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting audit log');
    
    try {
      const auditLog = await this.simpleStreams.getAuditLog({
        streamId,
        userId,
        operation,
        startDate,
        endDate,
        limit: limit ? parseInt(limit.toString()) : undefined,
      });
      
      return {
        success: true,
        message: 'Audit log retrieved',
        data: {
          entries: auditLog,
          totalCount: auditLog.length,
          filters: { streamId, userId, operation, startDate, endDate, limit },
        },
      };
      
    } catch (error) {
      this.logger.error(`Failed to get audit log: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Failed to get audit log', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🧪 Performance Testing
   */
  @Post('test')
  async runPerformanceTest(
    @Body() options: { iterations?: number; dataSize?: number } = {}
  ) {
    this.logger.log('Running performance test');
    
    try {
      const testResult = await this.simpleStreams.test({
        iterations: options.iterations || 100,
        dataSize: options.dataSize || 1024,
        algorithm: 'aes-256-gcm',
      });
      
      return {
        success: true,
        message: 'Performance test completed',
        data: testResult,
        features: {
          iterations: testResult.iterations,
          averageDuration: testResult.averageDuration,
          totalDuration: testResult.totalDuration,
          errors: testResult.errors,
          throughput: testResult.throughput,
          success: testResult.success,
        },
      };
      
    } catch (error) {
      this.logger.error(`Performance test failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Performance test failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🔄 Stream Optimization
   */
  @Post('optimize/:streamId')
  async optimizeStream(@Param('streamId') streamId: string) {
    this.logger.log(`Optimizing stream: ${streamId}`);
    
    try {
      const optimizationResult = await this.simpleStreams.optimize(streamId);
      
      return {
        success: true,
        message: 'Stream optimization completed',
        data: optimizationResult,
        features: {
          success: optimizationResult.success,
          optimizations: optimizationResult.optimizations,
          performanceGain: optimizationResult.performanceGain,
        },
      };
      
    } catch (error) {
      this.logger.error(`Stream optimization failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Stream optimization failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🛡️ Stream Validation
   */
  @Post('validate/:streamId')
  async validateStream(@Param('streamId') streamId: string) {
    this.logger.log(`Validating stream: ${streamId}`);
    
    try {
      const validationResult = await this.simpleStreams.validate(streamId);
      
      return {
        success: true,
        message: 'Stream validation completed',
        data: validationResult,
        features: {
          valid: validationResult.valid,
          algorithm: validationResult.algorithm,
          streamId: validationResult.streamId,
          validatedAt: validationResult.validatedAt,
          issues: validationResult.issues,
        },
      };
      
    } catch (error) {
      this.logger.error(`Stream validation failed: ${(error as Error).message}`);
      throw new HttpException(
        { success: false, message: 'Stream validation failed', error: (error as Error).message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
