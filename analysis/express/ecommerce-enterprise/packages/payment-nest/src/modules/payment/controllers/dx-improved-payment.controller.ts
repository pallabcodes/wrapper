/**
 * DX Improved Payment Controller
 * 
 * Demonstrates the dramatic improvement in Developer Experience
 * using the new high-level crypto APIs.
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
  createCryptoAPI, 
  createFluentCrypto, 
  crypto,
  EncryptResult,
  EncryptionResult,
  DecryptParam, 
  MonitorPerformance, 
  Compliance, 
  SecurityValidation 
} from '@ecommerce-enterprise/node-crypto';
import { z } from 'zod';

// Validation schemas
const PaymentDataSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  cardNumber: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvv: z.string().regex(/^\d{3,4}$/),
  cardholderName: z.string().min(2).max(50),
  billingAddress: z.object({
    street: z.string().min(1).max(100),
    city: z.string().min(1).max(50),
    state: z.string().min(1).max(50),
    zipCode: z.string().min(1).max(20),
    country: z.string().length(2),
  }),
  metadata: z.record(z.any()).optional(),
});

@Controller('dx-improved-payments')
export class DXImprovedPaymentController {
  private readonly logger = new Logger(DXImprovedPaymentController.name);
  
  // Different crypto API instances for demonstration
  private simpleCrypto = createCryptoAPI({
    algorithm: 'aes-256-gcm',
    enableAudit: true,
    enablePerformanceMonitoring: true,
    compliance: { sox: true, gdpr: true, pciDss: true },
  });
  
  private fluentCrypto = createFluentCrypto({
    algorithm: 'aes-256-gcm',
    enableAudit: true,
    enablePerformanceMonitoring: true,
  });

  /**
   * 🎯 Simple API Example
   * 
   * One-line encryption with enterprise features
   */
  @Post('simple/encrypt')
  async simpleEncrypt(@Body() paymentData: Record<string, unknown>) {
    this.logger.log('Simple API encryption example');
    
    try {
      // ✅ One line with all enterprise features
      const encrypted = await this.simpleCrypto.encrypt(paymentData, {
        algorithm: 'aes-256-gcm',
        expiresIn: 24, // hours
        userId: 'system',
        compliance: ['SOX', 'GDPR', 'PCI-DSS'],
      });
      
      return {
        success: true,
        message: 'Payment data encrypted with Simple API',
        data: encrypted,
        features: {
          algorithm: encrypted.algorithm,
          keyId: encrypted.keyId,
          expiresAt: encrypted.expiresAt,
          compliance: ['SOX', 'GDPR', 'PCI-DSS'],
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple encryption failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Encryption failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🚀 Fluent API Example
   * 
   * Chainable operations with self-documenting code
   */
  @Post('fluent/encrypt')
  async fluentEncrypt(@Body() paymentData: Record<string, unknown>) {
    this.logger.log('Fluent API encryption example');
    
    try {
      // ✅ Fluent, chainable API
      const encrypted = await this.fluentCrypto
        .encrypt(paymentData)
        .withAlgorithm('aes-256-gcm')
        .expiresIn(24)
        .forUser('system')
        .withCompliance(['SOX', 'GDPR', 'PCI-DSS'])
        .execute();
      
      return {
        success: true,
        message: 'Payment data encrypted with Fluent API',
        data: encrypted,
        features: {
          algorithm: encrypted.algorithm,
          keyId: encrypted.keyId,
          expiresAt: encrypted.expiresAt,
          compliance: ['SOX', 'GDPR', 'PCI-DSS'],
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent encryption failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Encryption failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🎯 Decorator API Example
   * 
   * Automatic operations with zero boilerplate
   */
  @Post('decorator/encrypt')
  @EncryptResult({
    algorithm: 'aes-256-gcm',
    expiresIn: 24,
    userId: 'system',
    compliance: ['SOX', 'GDPR', 'PCI-DSS'],
  })
  @MonitorPerformance({ operation: 'decorator_encrypt', threshold: 100 })
  @Compliance(['SOX', 'GDPR', 'PCI-DSS'])
  @SecurityValidation({ validateInput: true, sanitizeInput: true })
  async decoratorEncrypt(@Body() paymentData: Record<string, unknown>) {
    this.logger.log('Decorator API encryption example');
    
    // ✅ Method automatically encrypts the result
    // ✅ Performance monitoring is automatic
    // ✅ Compliance tracking is automatic
    // ✅ Security validation is automatic
    
    return {
      success: true,
      message: 'Payment data encrypted with Decorator API',
      data: paymentData, // This will be automatically encrypted
      features: {
        automatic: true,
        performanceMonitoring: true,
        compliance: true,
        securityValidation: true,
      },
    };
  }

  /**
   * 🎯 Quick API Example
   * 
   * Global functions for maximum simplicity
   */
  @Post('quick/encrypt')
  async quickEncrypt(@Body() paymentData: Record<string, unknown>) {
    this.logger.log('Quick API encryption example');
    
    try {
      // ✅ Global crypto functions
      const encrypted = await crypto.encrypt(paymentData, {
        algorithm: 'aes-256-gcm',
        expiresIn: 24,
      });
      
      return {
        success: true,
        message: 'Payment data encrypted with Quick API',
        data: encrypted,
        features: {
          algorithm: encrypted.algorithm,
          keyId: encrypted.keyId,
          expiresAt: encrypted.expiresAt,
          simplicity: 'Maximum',
        },
      };
      
    } catch (error) {
      this.logger.error(`Quick encryption failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Encryption failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🔓 Decryption Examples
   */
  @Post('simple/decrypt')
  async simpleDecrypt(@Body() encryptedData: Record<string, unknown>) {
    this.logger.log('Simple API decryption example');
    
    try {
      // ✅ One line decryption with validation
      const decrypted = await (this.simpleCrypto as any).decrypt(
        (encryptedData as any).data, 
        (encryptedData as any).keyId, 
        {
          userId: 'system',
          validateExpiration: true,
        }
      );
      
      return {
        success: true,
        message: 'Payment data decrypted with Simple API',
        data: decrypted.data,
        features: {
          algorithm: decrypted.algorithm,
          keyId: decrypted.keyId,
          decryptedAt: decrypted.decryptedAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple decryption failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Decryption failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/decrypt')
  async fluentDecrypt(@Body() encryptedData: Record<string, unknown>) {
    this.logger.log('Fluent API decryption example');
    
    try {
      // ✅ Fluent decryption with validation
      const decrypted = await this.fluentCrypto
        .decrypt((encryptedData as any).data as Record<string, unknown>, (encryptedData as any).keyId as string)
        .forUser('system')
        .validateExpiration()
        .execute();
      
      return {
        success: true,
        message: 'Payment data decrypted with Fluent API',
        data: decrypted.data,
        features: {
          algorithm: decrypted.algorithm,
          keyId: decrypted.keyId,
          decryptedAt: decrypted.decryptedAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent decryption failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Decryption failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('decorator/decrypt')
  @DecryptParam({ keyId: 'payment-key', userId: 'system' })
  @MonitorPerformance({ operation: 'decorator_decrypt', threshold: 100 })
  @SecurityValidation({ validateOutput: true, sanitizeOutput: true })
  async decoratorDecrypt(@Body() encryptedData: string) {
    this.logger.log('Decorator API decryption example');
    
    // ✅ Method automatically decrypts the parameter
    // ✅ Performance monitoring is automatic
    // ✅ Security validation is automatic
    
    return {
      success: true,
      message: 'Payment data decrypted with Decorator API',
      data: encryptedData, // This is now the decrypted data
      features: {
        automatic: true,
        performanceMonitoring: true,
        securityValidation: true,
      },
    };
  }

  /**
   * 🔑 Key Generation Examples
   */
  @Post('simple/generate-key')
  async simpleGenerateKey() {
    this.logger.log('Simple API key generation example');
    
    try {
      // ✅ One line key generation
      const key = await this.simpleCrypto.generateKey('aes-256-gcm');
      
      return {
        success: true,
        message: 'Key generated with Simple API',
        data: key,
        features: {
          algorithm: key.algorithm,
          keySize: key.keySize,
          expiresAt: key.expiresAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Simple key generation failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Key generation failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('fluent/generate-key')
  async fluentGenerateKey() {
    this.logger.log('Fluent API key generation example');
    
    try {
      // ✅ Fluent key generation
      const key = await this.fluentCrypto
        .generateKey('secret')
        .withAlgorithm('aes-256-gcm')
        .withKeySize(256)
        .expiresIn(7) // days
        .execute();
      
      return {
        success: true,
        message: 'Key generated with Fluent API',
        data: key,
        features: {
          algorithm: key.algorithm,
          keySize: key.keySize,
          expiresAt: key.expiresAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Fluent key generation failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Key generation failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('quick/generate-key')
  async quickGenerateKey() {
    this.logger.log('Quick API key generation example');
    
    try {
      // ✅ Global crypto functions
      const key = await crypto.generateKey('secret');
      
      return {
        success: true,
        message: 'Key generated with Quick API',
        data: key,
        features: {
          algorithm: key.algorithm,
          keySize: key.keySize,
          simplicity: 'Maximum',
        },
      };
      
    } catch (error) {
      this.logger.error(`Quick key generation failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Key generation failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 📊 Statistics and Monitoring
   */
  @Get('stats')
  async getStats() {
    this.logger.log('Getting crypto statistics');
    
    try {
      const stats = await this.simpleCrypto.getStats();
      
      return {
        success: true,
        message: 'Crypto statistics retrieved',
        data: stats,
        features: {
          totalOperations: stats.totalOperations,
          successRate: stats.successRate,
          averageDuration: stats.averageDuration,
          lastOperation: stats.lastOperation,
          activeKeys: stats.activeKeys,
        },
      };
      
    } catch (error) {
      this.logger.error(`Failed to get stats: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Failed to get stats', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('audit-log')
  async getAuditLog(
    @Query('operation') operation?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('limit') limit?: number,
  ) {
    this.logger.log('Getting audit log');
    
    try {
      const auditLog = await this.simpleCrypto.getAuditLog({
        operation,
        userId,
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
          filters: { operation, userId, startDate, endDate, limit },
        },
      };
      
    } catch (error) {
      this.logger.error(`Failed to get audit log: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Failed to get audit log', error: error.message },
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
      const testResult = await this.simpleCrypto.test({
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
          success: testResult.success,
        },
      };
      
    } catch (error) {
      this.logger.error(`Performance test failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Performance test failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * 🔄 Key Rotation
   */
  @Post('rotate-keys')
  async rotateKeys() {
    this.logger.log('Rotating encryption keys');
    
    try {
      const rotationResult = await this.simpleCrypto.rotateKeys({
        algorithm: 'aes-256-gcm',
        keepOldKeys: false,
        notifyUsers: true,
      });
      
      return {
        success: true,
        message: 'Keys rotated successfully',
        data: rotationResult,
        features: {
          success: rotationResult.success,
          newKeyId: rotationResult.newKeyId,
          rotatedAt: rotationResult.rotatedAt,
        },
      };
      
    } catch (error) {
      this.logger.error(`Key rotation failed: ${error.message}`);
      throw new HttpException(
        { success: false, message: 'Key rotation failed', error: error.message },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
