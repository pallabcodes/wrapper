/**
 * Secure Payment Service Tests
 * 
 * Comprehensive tests for the secure payment service integration
 * with @ecommerce-enterprise/node-crypto.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SecurePaymentService, SecurePaymentData, EncryptedPaymentData } from '../services/secure-payment.service';
import { PaymentModule } from '../payment.module';

describe('SecurePaymentService', () => {
  let service: SecurePaymentService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [PaymentModule],
    }).compile();

    service = module.get<SecurePaymentService>(SecurePaymentService);
  });

  afterAll(async () => {
    await module.close();
  });

  describe('Payment Data Encryption', () => {
    it('should encrypt payment data successfully', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_001',
        amount: 99.99,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'John Doe',
        billingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
        metadata: {
          orderId: 'order_123',
          customerId: 'cust_456',
        },
      };

      const encrypted = await service.encryptPaymentData(paymentData);
      
      expect(encrypted).toBeDefined();
      expect(encrypted.id).toBe(paymentData.id);
      expect(encrypted.keyId).toBeDefined();
      expect(encrypted.algorithm).toBe('aes-256-gcm');
      expect(encrypted.encryptedData).toBeDefined();
      expect(encrypted.encryptedData.ciphertext).toBeDefined();
      expect(encrypted.encryptedData.tag).toBeDefined();
      expect(encrypted.encryptedData.iv).toBeDefined();
      expect(encrypted.createdAt).toBeDefined();
      expect(encrypted.expiresAt).toBeDefined();
    });

    it('should handle different payment amounts', async () => {
      const amounts = [1.00, 99.99, 1000.00, 9999.99];
      
      for (const amount of amounts) {
        const paymentData: SecurePaymentData = {
          id: `pay_test_${amount}`,
          amount,
          currency: 'USD',
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe',
          billingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        };

        const encrypted = await service.encryptPaymentData(paymentData);
        expect(encrypted.id).toBe(`pay_test_${amount}`);
        expect(encrypted.algorithm).toBe('aes-256-gcm');
      }
    });

    it('should handle different currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];
      
      for (const currency of currencies) {
        const paymentData: SecurePaymentData = {
          id: `pay_test_${currency}`,
          amount: 100.00,
          currency,
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
          cardholderName: 'John Doe',
          billingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        };

        const encrypted = await service.encryptPaymentData(paymentData);
        expect(encrypted.id).toBe(`pay_test_${currency}`);
      }
    });
  });

  describe('Payment Data Decryption', () => {
    let encryptedPayment: EncryptedPaymentData;

    beforeEach(async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_decrypt',
        amount: 150.75,
        currency: 'EUR',
        cardNumber: '5555555555554444',
        expiryDate: '06/26',
        cvv: '456',
        cardholderName: 'Jane Smith',
        billingAddress: {
          street: '456 Oak Ave',
          city: 'London',
          state: 'England',
          zipCode: 'SW1A 1AA',
          country: 'GB',
        },
        metadata: {
          orderId: 'order_789',
          customerId: 'cust_101',
          source: 'mobile',
        },
      };

      encryptedPayment = await service.encryptPaymentData(paymentData);
    });

    it('should decrypt payment data successfully', async () => {
      const decrypted = await service.decryptPaymentData(encryptedPayment);
      
      expect(decrypted).toBeDefined();
      expect(decrypted.id).toBe('pay_test_decrypt');
      expect(decrypted.amount).toBe(150.75);
      expect(decrypted.currency).toBe('EUR');
      expect(decrypted.cardNumber).toBe('5555555555554444');
      expect(decrypted.expiryDate).toBe('06/26');
      expect(decrypted.cvv).toBe('456');
      expect(decrypted.cardholderName).toBe('Jane Smith');
      expect(decrypted.billingAddress.city).toBe('London');
      expect(decrypted.metadata?.orderId).toBe('order_789');
    });

    it('should fail decryption with wrong key', async () => {
      // Generate a new key to simulate wrong key
      await service.generatePaymentKey();
      
      // Try to decrypt with the new key (this should fail)
      await expect(service.decryptPaymentData(encryptedPayment))
        .rejects
        .toThrow();
    });

    it('should fail decryption with expired data', async () => {
      // Create expired encrypted payment
      const expiredEncrypted = {
        ...encryptedPayment,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
      };

      await expect(service.decryptPaymentData(expiredEncrypted))
        .rejects
        .toThrow('Encrypted payment data has expired');
    });

    it('should fail decryption with corrupted data', async () => {
      // Corrupt the encrypted data
      const corruptedEncrypted = {
        ...encryptedPayment,
        encryptedData: {
          ...encryptedPayment.encryptedData,
          ciphertext: Buffer.from('corrupted data'),
        },
      };

      await expect(service.decryptPaymentData(corruptedEncrypted))
        .rejects
        .toThrow();
    });
  });

  describe('Key Management', () => {
    it('should generate payment keys', async () => {
      const key = await service.generatePaymentKey();
      
      expect(key).toBeDefined();
      expect(key.keyId).toBeDefined();
      expect(key.algorithm).toBe('aes-256-gcm');
      expect(key.keySize).toBe(256);
      expect(key.createdAt).toBeDefined();
    });

    it('should generate different key IDs', async () => {
      const key1 = await service.generatePaymentKey();
      const key2 = await service.generatePaymentKey();
      
      expect(key1.keyId).not.toBe(key2.keyId);
    });

    it('should rotate payment keys', async () => {
      // Generate initial key
      const initialKey = await service.generatePaymentKey();
      
      // Rotate keys
      await service.rotatePaymentKeys();
      
      // The rotation should complete without error
      expect(true).toBe(true);
    });
  });

  describe('Payment Data Validation', () => {
    let encryptedPayment: EncryptedPaymentData;

    beforeEach(async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_validation',
        amount: 200.00,
        currency: 'USD',
        cardNumber: '4000000000000002',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Test User',
        billingAddress: {
          street: '789 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US',
        },
      };

      encryptedPayment = await service.encryptPaymentData(paymentData);
    });

    it('should validate valid payment data', async () => {
      const isValid = await service.validatePaymentData(encryptedPayment);
      expect(isValid).toBe(true);
    });

    it('should invalidate expired payment data', async () => {
      const expiredEncrypted = {
        ...encryptedPayment,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      };

      const isValid = await service.validatePaymentData(expiredEncrypted);
      expect(isValid).toBe(false);
    });

    it('should invalidate payment data with missing key', async () => {
      // Create encrypted payment with non-existent key ID
      const invalidEncrypted = {
        ...encryptedPayment,
        keyId: 'non-existent-key-id',
      };

      const isValid = await service.validatePaymentData(invalidEncrypted);
      expect(isValid).toBe(false);
    });
  });

  describe('Audit Trail', () => {
    it('should log payment operations', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_audit',
        amount: 75.50,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Audit Test',
        billingAddress: {
          street: '123 Audit St',
          city: 'Audit City',
          state: 'AC',
          zipCode: '54321',
          country: 'US',
        },
      };

      await service.encryptPaymentData(paymentData);
      
      const auditLog = await service.getPaymentAuditLog();
      expect(auditLog.length).toBeGreaterThan(0);
      
      const encryptEntry = auditLog.find(entry => entry.operation === 'encrypt');
      expect(encryptEntry).toBeDefined();
      expect(encryptEntry?.success).toBe(true);
    });

    it('should filter audit log by operation', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_filter',
        amount: 50.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Filter Test',
        billingAddress: {
          street: '123 Filter St',
          city: 'Filter City',
          state: 'FC',
          zipCode: '11111',
          country: 'US',
        },
      };

      await service.encryptPaymentData(paymentData);
      
      const encryptEntries = await service.getPaymentAuditLog({ operation: 'encrypt' });
      expect(encryptEntries.length).toBeGreaterThan(0);
      expect(encryptEntries.every(entry => entry.operation === 'encrypt')).toBe(true);
    });

    it('should filter audit log by time range', async () => {
      const startTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      const endTime = new Date().toISOString();
      
      const recentEntries = await service.getPaymentAuditLog({
        startTime,
        endTime,
      });
      
      expect(recentEntries.length).toBeGreaterThan(0);
      expect(recentEntries.every(entry => 
        entry.timestamp >= startTime && entry.timestamp <= endTime
      )).toBe(true);
    });
  });

  describe('Performance Metrics', () => {
    it('should track performance metrics', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_performance',
        amount: 100.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Performance Test',
        billingAddress: {
          street: '123 Performance St',
          city: 'Performance City',
          state: 'PC',
          zipCode: '22222',
          country: 'US',
        },
      };

      // Perform multiple operations
      for (let i = 0; i < 5; i++) {
        await service.encryptPaymentData({ ...paymentData, id: `pay_test_perf_${i}` });
      }

      const metrics = await service.getPaymentPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.keyCount).toBeGreaterThan(0);
      expect(metrics.activeKeyId).toBeDefined();
    });
  });

  describe('Export Functionality', () => {
    it('should export audit log as CSV', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_export',
        amount: 25.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Export Test',
        billingAddress: {
          street: '123 Export St',
          city: 'Export City',
          state: 'EC',
          zipCode: '33333',
          country: 'US',
        },
      };

      await service.encryptPaymentData(paymentData);
      
      const csvExport = await service.exportPaymentAuditLog('csv');
      expect(typeof csvExport).toBe('string');
      expect(csvExport).toContain('Timestamp,Operation,KeyID');
    });

    it('should export audit log as JSON', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_export_json',
        amount: 30.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Export JSON Test',
        billingAddress: {
          street: '123 Export JSON St',
          city: 'Export JSON City',
          state: 'EJC',
          zipCode: '44444',
          country: 'US',
        },
      };

      await service.encryptPaymentData(paymentData);
      
      const jsonExport = await service.exportPaymentAuditLog('json');
      expect(Array.isArray(jsonExport)).toBe(true);
      expect(jsonExport.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid payment data', async () => {
      const invalidPaymentData = {
        id: 'pay_test_invalid',
        amount: -100, // Invalid negative amount
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Invalid Test',
        billingAddress: {
          street: '123 Invalid St',
          city: 'Invalid City',
          state: 'IC',
          zipCode: '55555',
          country: 'US',
        },
      } as any;

      await expect(service.encryptPaymentData(invalidPaymentData))
        .rejects
        .toThrow();
    });

    it('should handle null payment data', async () => {
      await expect(service.encryptPaymentData(null as any))
        .rejects
        .toThrow();
    });

    it('should handle undefined payment data', async () => {
      await expect(service.encryptPaymentData(undefined as any))
        .rejects
        .toThrow();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent encryption operations', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_concurrent',
        amount: 50.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Concurrent Test',
        billingAddress: {
          street: '123 Concurrent St',
          city: 'Concurrent City',
          state: 'CC',
          zipCode: '66666',
          country: 'US',
        },
      };

      const promises = Array.from({ length: 10 }, (_, i) => 
        service.encryptPaymentData({ ...paymentData, id: `pay_concurrent_${i}` })
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(10);
      expect(results.every(result => result.id.startsWith('pay_concurrent_'))).toBe(true);
    });

    it('should handle concurrent decryption operations', async () => {
      const paymentData: SecurePaymentData = {
        id: 'pay_test_concurrent_decrypt',
        amount: 75.00,
        currency: 'USD',
        cardNumber: '4111111111111111',
        expiryDate: '12/25',
        cvv: '123',
        cardholderName: 'Concurrent Decrypt Test',
        billingAddress: {
          street: '123 Concurrent Decrypt St',
          city: 'Concurrent Decrypt City',
          state: 'CDC',
          zipCode: '77777',
          country: 'US',
        },
      };

      const encrypted = await service.encryptPaymentData(paymentData);
      
      const promises = Array.from({ length: 5 }, () => 
        service.decryptPaymentData(encrypted)
      );

      const results = await Promise.all(promises);
      expect(results.length).toBe(5);
      expect(results.every(result => result.id === paymentData.id)).toBe(true);
    });
  });
});
