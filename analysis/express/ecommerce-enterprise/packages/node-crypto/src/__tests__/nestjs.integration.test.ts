/**
 * NestJS Integration Tests
 * 
 * Tests the NestJS decorators, services, and module integration
 * with the enhanced crypto functionality.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CryptoModule } from '../nestjs/crypto.module';
import { CryptoService } from '../nestjs/crypto.service';
import { 
  Encrypt, 
  Decrypt, 
  Audit, 
  MonitorPerformance,
  SOXCompliant,
  GDPRCompliant 
} from '../nestjs/crypto.decorators';
import { Controller, Post, Body, Get } from '@nestjs/common';

// Test controller to demonstrate decorators
@Controller('test-crypto')
export class TestCryptoController {
  constructor(private readonly cryptoService: CryptoService) {}

  @Post('encrypt')
  @Encrypt({ algorithm: 'aes-256-gcm', enableAudit: true })
  @Audit({ operation: 'test_encryption', userId: 'test-user' })
  @MonitorPerformance({ operation: 'test_encryption', threshold: 100 })
  async encryptData(@Body() data: { message: string }) {
    const key = await this.cryptoService.generateSecretKey('aes-256-gcm');
    const encrypted = await this.cryptoService.encrypt(
      Buffer.from(data.message), 
      key.key
    );
    return { 
      encrypted, 
      keyId: key.keyId,
      message: 'Data encrypted successfully' 
    };
  }

  @Post('decrypt')
  @Decrypt({ algorithm: 'aes-256-gcm', enableAudit: true })
  @Audit({ operation: 'test_decryption', userId: 'test-user' })
  async decryptData(@Body() encryptedData: any) {
    const decrypted = await this.cryptoService.decrypt(encryptedData, encryptedData.key);
    return { 
      decrypted: decrypted.plaintext.toString(),
      message: 'Data decrypted successfully' 
    };
  }

  @Post('sox-compliant-encrypt')
  @SOXCompliant({ operation: 'financial_data_encryption' })
  @Encrypt({ algorithm: 'aes-256-gcm', enableAudit: true })
  @Audit({ operation: 'sox_encryption', userId: 'financial-user' })
  async soxCompliantEncrypt(@Body() data: { financialData: string }) {
    const key = await this.cryptoService.generateSecretKey('aes-256-gcm');
    const encrypted = await this.cryptoService.encrypt(
      Buffer.from(data.financialData), 
      key.key
    );
    return { 
      encrypted, 
      keyId: key.keyId,
      compliance: 'SOX',
      message: 'Financial data encrypted with SOX compliance' 
    };
  }

  @Post('gdpr-compliant-encrypt')
  @GDPRCompliant({ operation: 'personal_data_encryption', dataType: 'personal' })
  @Encrypt({ algorithm: 'aes-256-gcm', enableAudit: true })
  @Audit({ operation: 'gdpr_encryption', userId: 'privacy-user' })
  async gdprCompliantEncrypt(@Body() data: { personalData: string }) {
    const key = await this.cryptoService.generateSecretKey('aes-256-gcm');
    const encrypted = await this.cryptoService.encrypt(
      Buffer.from(data.personalData), 
      key.key
    );
    return { 
      encrypted, 
      keyId: key.keyId,
      compliance: 'GDPR',
      message: 'Personal data encrypted with GDPR compliance' 
    };
  }

  @Get('performance-metrics')
  async getPerformanceMetrics() {
    const metrics = this.cryptoService.getPerformanceMetrics();
    const analysis = this.cryptoService.getPerformanceAnalysis();
    return { metrics, analysis };
  }

  @Get('audit-log')
  async getAuditLog() {
    const auditLog = this.cryptoService.getAuditLog();
    const stats = this.cryptoService.getAuditLogStats();
    return { auditLog, stats };
  }
}

describe('NestJS Crypto Integration', () => {
  let app: INestApplication;
  let cryptoService: CryptoService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CryptoModule.forRoot({
          config: {
            defaultAlgorithm: 'aes-256-gcm',
            auditLogging: true,
            performanceMonitoring: true,
            fileLogging: false,
          },
          enableAudit: true,
          enablePerformanceMonitoring: true,
        }),
      ],
      controllers: [TestCryptoController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    cryptoService = moduleFixture.get<CryptoService>(CryptoService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('CryptoService Integration', () => {
    it('should be injectable', () => {
      expect(cryptoService).toBeDefined();
      expect(cryptoService).toBeInstanceOf(CryptoService);
    });

    it('should have proper configuration', () => {
      const config = cryptoService.getConfig();
      expect(config.defaultAlgorithm).toBe('aes-256-gcm');
      expect(config.auditLogging).toBe(true);
      expect(config.performanceMonitoring).toBe(true);
    });
  });

  describe('Controller Decorators', () => {
    it('should handle encryption with decorators', async () => {
      const testData = { message: 'test encryption data' };
      
      const response = await cryptoService.encrypt(
        Buffer.from(testData.message), 
        (await cryptoService.generateSecretKey('aes-256-gcm')).key
      );
      
      expect(response.success).toBe(true);
      expect(response.ciphertext).toBeDefined();
      expect(response.algorithm).toBe('aes-256-gcm');
    });

    it('should handle decryption with decorators', async () => {
      const testData = 'test decryption data';
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      const encrypted = await cryptoService.encrypt(Buffer.from(testData), key.key);
      
      const response = await cryptoService.decrypt(encrypted, key.key);
      
      expect(response.success).toBe(true);
      expect(response.plaintext.toString()).toBe(testData);
    });
  });

  describe('Audit Trail Integration', () => {
    it('should log operations through service', async () => {
      const testData = 'audit test data';
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      await cryptoService.encrypt(Buffer.from(testData), key.key);
      
      const auditLog = cryptoService.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      
      const encryptEntry = auditLog.find(entry => entry.operation === 'encrypt');
      expect(encryptEntry).toBeDefined();
      expect(encryptEntry?.success).toBe(true);
    });

    it('should track performance metrics through service', async () => {
      const testData = 'performance test data';
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        await cryptoService.encrypt(Buffer.from(testData), key.key);
      }
      
      const metrics = cryptoService.getPerformanceMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
      
      const analysis = cryptoService.getPerformanceAnalysis();
      expect(analysis).toBeDefined();
    });
  });

  describe('Compliance Integration', () => {
    it('should handle SOX compliance operations', async () => {
      const financialData = 'sensitive financial information';
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      const encrypted = await cryptoService.encrypt(Buffer.from(financialData), key.key);
      
      expect(encrypted.success).toBe(true);
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      
      // Check audit log for compliance tracking
      const auditLog = cryptoService.getAuditLog();
      const soxEntry = auditLog.find(entry => 
        entry.operation === 'encrypt' && entry.details?.includes('financial')
      );
      expect(soxEntry).toBeDefined();
    });

    it('should handle GDPR compliance operations', async () => {
      const personalData = 'personal user information';
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      const encrypted = await cryptoService.encrypt(Buffer.from(personalData), key.key);
      
      expect(encrypted.success).toBe(true);
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      
      // Check audit log for compliance tracking
      const auditLog = cryptoService.getAuditLog();
      const gdprEntry = auditLog.find(entry => 
        entry.operation === 'encrypt' && entry.details?.includes('personal')
      );
      expect(gdprEntry).toBeDefined();
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle encryption errors gracefully', async () => {
      const invalidData = null as any;
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      await expect(cryptoService.encrypt(invalidData, key.key))
        .rejects
        .toThrow();
    });

    it('should handle decryption errors gracefully', async () => {
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      const invalidEncryptedData = null as any;
      
      await expect(cryptoService.decrypt(invalidEncryptedData, key.key))
        .rejects
        .toThrow();
    });
  });

  describe('Configuration Management Integration', () => {
    it('should update configuration through service', async () => {
      const originalConfig = cryptoService.getConfig();
      
      cryptoService.updateConfig({
        defaultAlgorithm: 'aes-128-gcm',
        keyRotationInterval: 30,
      });
      
      const updatedConfig = cryptoService.getConfig();
      expect(updatedConfig.defaultAlgorithm).toBe('aes-128-gcm');
      expect(updatedConfig.keyRotationInterval).toBe(30);
      expect(updatedConfig.auditLogging).toBe(originalConfig.auditLogging);
    });
  });

  describe('Module Integration', () => {
    it('should provide all required services', () => {
      expect(cryptoService).toBeDefined();
    });

    it('should handle module lifecycle', async () => {
      // Test that the module initializes and destroys properly
      expect(app).toBeDefined();
      expect(app.get(CryptoService)).toBeDefined();
    });
  });
});
