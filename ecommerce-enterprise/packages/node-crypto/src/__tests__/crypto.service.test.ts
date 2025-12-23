/**
 * Comprehensive Test Suite for Enhanced Crypto Service
 * 
 * Tests all functionality including encryption, decryption, key management,
 * audit trails, performance monitoring, and error handling.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { EnhancedCryptoService } from '../index';
import { CryptoService } from '../nestjs/crypto.service';
import { CryptoModule } from '../nestjs/crypto.module';
import { 
  EncryptionError, 
  DecryptionError, 
  KeyError,
  SymmetricAlgorithm,
  AsymmetricAlgorithm 
} from '../types/crypto.types';

describe('EnhancedCryptoService', () => {
  let cryptoService: EnhancedCryptoService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        CryptoModule.forRoot({
          config: {
            defaultAlgorithm: 'aes-256-gcm',
            auditLogging: true,
            performanceMonitoring: true,
            fileLogging: false, // Disable file logging for tests
          },
          enableAudit: true,
          enablePerformanceMonitoring: true,
        }),
      ],
    }).compile();

    cryptoService = module.get<EnhancedCryptoService>(EnhancedCryptoService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Basic Encryption/Decryption', () => {
    it('should encrypt and decrypt data successfully', async () => {
      const data = Buffer.from('sensitive payment information');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      const encrypted = await cryptoService.encrypt(data, key.key);
      expect(encrypted.success).toBe(true);
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.tag).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = await cryptoService.decrypt(encrypted, key.key);
      expect(decrypted.success).toBe(true);
      expect(decrypted.plaintext).toEqual(data);
    });

    it('should handle different data types', async () => {
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      // Test with string
      const stringData = 'test string data';
      const encryptedString = await cryptoService.encrypt(stringData, key.key);
      const decryptedString = await cryptoService.decrypt(encryptedString, key.key);
      expect(decryptedString.plaintext.toString()).toBe(stringData);

      // Test with Uint8Array
      const uint8Data = new Uint8Array([1, 2, 3, 4, 5]);
      const encryptedUint8 = await cryptoService.encrypt(uint8Data, key.key);
      const decryptedUint8 = await cryptoService.decrypt(encryptedUint8, key.key);
      expect(decryptedUint8.plaintext).toEqual(Buffer.from(uint8Data));

      // Test with ArrayBuffer
      const arrayBufferData = new ArrayBuffer(8);
      const view = new Uint8Array(arrayBufferData);
      view.set([1, 2, 3, 4, 5, 6, 7, 8]);
      const encryptedArrayBuffer = await cryptoService.encrypt(arrayBufferData, key.key);
      const decryptedArrayBuffer = await cryptoService.decrypt(encryptedArrayBuffer, key.key);
      expect(decryptedArrayBuffer.plaintext).toEqual(Buffer.from(arrayBufferData));
    });

    it('should fail decryption with wrong key', async () => {
      const data = Buffer.from('test data');
      const key1 = await cryptoService.generateSecretKey('aes-256-gcm');
      const key2 = await cryptoService.generateSecretKey('aes-256-gcm');

      const encrypted = await cryptoService.encrypt(data, key1.key);
      
      await expect(cryptoService.decrypt(encrypted, key2.key))
        .rejects
        .toThrow(DecryptionError);
    });

    it('should fail decryption with corrupted data', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      const encrypted = await cryptoService.encrypt(data, key.key);

      // Corrupt the ciphertext
      const corruptedEncrypted = { ...encrypted };
      corruptedEncrypted.ciphertext[0] = 0xFF;

      await expect(cryptoService.decrypt(corruptedEncrypted, key.key))
        .rejects
        .toThrow(DecryptionError);
    });
  });

  describe('Key Management', () => {
    it('should generate RSA key pairs', async () => {
      const keyPair = await cryptoService.generateKeyPair('rsa-2048');
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.keyId).toBeDefined();
      expect(keyPair.algorithm).toBe('rsa-2048');
      expect(keyPair.keySize).toBe(2048);
      expect(keyPair.createdAt).toBeDefined();
    });

    it('should generate ECDSA key pairs', async () => {
      const keyPair = await cryptoService.generateKeyPair('ec-p256');
      
      expect(keyPair.publicKey).toBeDefined();
      expect(keyPair.privateKey).toBeDefined();
      expect(keyPair.keyId).toBeDefined();
      expect(keyPair.algorithm).toBe('ec-p256');
      expect(keyPair.keySize).toBe(256);
    });

    it('should generate secret keys', async () => {
      const secretKey = await cryptoService.generateSecretKey('aes-256-gcm');
      
      expect(secretKey.key).toBeDefined();
      expect(secretKey.keyId).toBeDefined();
      expect(secretKey.algorithm).toBe('aes-256-gcm');
      expect(secretKey.keySize).toBe(256);
      expect(secretKey.createdAt).toBeDefined();
    });

    it('should generate different key IDs', async () => {
      const key1 = await cryptoService.generateSecretKey('aes-256-gcm');
      const key2 = await cryptoService.generateSecretKey('aes-256-gcm');
      
      expect(key1.keyId).not.toBe(key2.keyId);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        const encrypted = await cryptoService.encrypt(data, key.key);
        await cryptoService.decrypt(encrypted, key.key);
      }

      const metrics = cryptoService.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);
    });

    it('should provide performance analysis', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      // Perform operations to generate metrics
      for (let i = 0; i < 10; i++) {
        const encrypted = await cryptoService.encrypt(data, key.key);
        await cryptoService.decrypt(encrypted, key.key);
      }

      const analysis = cryptoService.getPerformanceAnalysis();
      expect(analysis).toBeDefined();
      expect(analysis.slowestOperations).toBeDefined();
      expect(analysis.mostFrequentOperations).toBeDefined();
      expect(analysis.performanceIssues).toBeDefined();
    });

    it('should reset metrics', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      // Perform some operations
      await cryptoService.encrypt(data, key.key);

      let metrics = cryptoService.getPerformanceMetrics();
      expect(Object.keys(metrics).length).toBeGreaterThan(0);

      // Reset metrics
      cryptoService.resetMetrics();
      
      metrics = cryptoService.getPerformanceMetrics();
      expect(Object.keys(metrics).length).toBe(0);
    });
  });

  describe('Audit Trail', () => {
    it('should log operations to audit trail', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      await cryptoService.encrypt(data, key.key);

      const auditLog = cryptoService.getAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      
      const encryptEntry = auditLog.find(entry => entry.operation === 'encrypt');
      expect(encryptEntry).toBeDefined();
      expect(encryptEntry?.success).toBe(true);
      expect(encryptEntry?.keyId).toBe(key.keyId);
    });

    it('should filter audit log by operation', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      await cryptoService.encrypt(data, key.key);
      await cryptoService.decrypt(await cryptoService.encrypt(data, key.key), key.key);

      const encryptEntries = cryptoService.getAuditLog({ operation: 'encrypt' });
      const decryptEntries = cryptoService.getAuditLog({ operation: 'decrypt' });

      expect(encryptEntries.length).toBeGreaterThan(0);
      expect(decryptEntries.length).toBeGreaterThan(0);
      expect(encryptEntries.every(entry => entry.operation === 'encrypt')).toBe(true);
      expect(decryptEntries.every(entry => entry.operation === 'decrypt')).toBe(true);
    });

    it('should filter audit log by time range', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      const startTime = new Date().toISOString();
      await cryptoService.encrypt(data, key.key);
      const endTime = new Date().toISOString();

      const recentEntries = cryptoService.getAuditLog({
        startTime,
        endTime,
      });

      expect(recentEntries.length).toBeGreaterThan(0);
      expect(recentEntries.every(entry => 
        entry.timestamp >= startTime && entry.timestamp <= endTime
      )).toBe(true);
    });

    it('should export audit log as CSV', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      await cryptoService.encrypt(data, key.key);

      const csvExport = cryptoService.exportAuditLog('csv');
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('Timestamp,Operation,KeyID');
    });

    it('should export audit log as JSON', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      await cryptoService.encrypt(data, key.key);

      const jsonExport = cryptoService.exportAuditLog('json');
      expect(Array.isArray(jsonExport)).toBe(true);
      expect(jsonExport.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', async () => {
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

    it('should preserve existing configuration when updating', async () => {
      const originalConfig = cryptoService.getConfig();
      
      cryptoService.updateConfig({
        defaultAlgorithm: 'aes-256-gcm',
      });

      const updatedConfig = cryptoService.getConfig();
      expect(updatedConfig.defaultAlgorithm).toBe('aes-256-gcm');
      expect(updatedConfig.auditLogging).toBe(originalConfig.auditLogging);
      expect(updatedConfig.performanceMonitoring).toBe(originalConfig.performanceMonitoring);
    });
  });

  describe('Error Handling', () => {
    it('should throw EncryptionError for invalid data', async () => {
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      await expect(cryptoService.encrypt(null as any, key.key))
        .rejects
        .toThrow(EncryptionError);
    });

    it('should throw DecryptionError for invalid encrypted data', async () => {
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      
      await expect(cryptoService.decrypt(null as any, key.key))
        .rejects
        .toThrow(DecryptionError);
    });

    it('should throw KeyError for invalid key', async () => {
      const data = Buffer.from('test data');
      
      await expect(cryptoService.encrypt(data, null as any))
        .rejects
        .toThrow(KeyError);
    });
  });

  describe('Security Features', () => {
    it('should generate secure random bytes', async () => {
      const randomBytes = cryptoService.generateRandomBytes(32);
      expect(randomBytes.length).toBe(32);
      expect(Buffer.isBuffer(randomBytes)).toBe(true);
    });

    it('should perform timing-safe comparison', async () => {
      const data1 = Buffer.from('test data');
      const data2 = Buffer.from('test data');
      const data3 = Buffer.from('different data');

      expect(cryptoService.timingSafeEqual(data1, data2)).toBe(true);
      expect(cryptoService.timingSafeEqual(data1, data3)).toBe(false);
    });

    it('should generate different random bytes each time', async () => {
      const random1 = cryptoService.generateRandomBytes(16);
      const random2 = cryptoService.generateRandomBytes(16);
      
      expect(random1).not.toEqual(random2);
    });
  });

  describe('Algorithm Support', () => {
    it('should support AES-256-GCM', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      const encrypted = await cryptoService.encrypt(data, key.key, { algorithm: 'aes-256-gcm' });
      expect(encrypted.algorithm).toBe('aes-256-gcm');

      const decrypted = await cryptoService.decrypt(encrypted, key.key);
      expect(decrypted.plaintext).toEqual(data);
    });

    it('should support AES-128-GCM', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-128-gcm');

      const encrypted = await cryptoService.encrypt(data, key.key, { algorithm: 'aes-128-gcm' });
      expect(encrypted.algorithm).toBe('aes-128-gcm');

      const decrypted = await cryptoService.decrypt(encrypted, key.key);
      expect(decrypted.plaintext).toEqual(data);
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent encryption operations', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');

      const promises = Array.from({ length: 10 }, () => 
        cryptoService.encrypt(data, key.key)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      expect(results.every(result => result.success)).toBe(true);
    });

    it('should handle concurrent decryption operations', async () => {
      const data = Buffer.from('test data');
      const key = await cryptoService.generateSecretKey('aes-256-gcm');
      const encrypted = await cryptoService.encrypt(data, key.key);

      const promises = Array.from({ length: 10 }, () => 
        cryptoService.decrypt(encrypted, key.key)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      expect(results.every(result => result.success)).toBe(true);
      expect(results.every(result => result.plaintext.equals(data))).toBe(true);
    });
  });
});
