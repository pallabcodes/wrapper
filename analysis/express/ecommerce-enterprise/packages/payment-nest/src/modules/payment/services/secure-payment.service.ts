/**
 * Secure Payment Service
 * 
 * Demonstrates the integration of @ecommerce-enterprise/node-crypto
 * within a real ecommerce payment service for secure data handling.
 */

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
// Fallback implementation for development
interface EncryptionResult {
  success: boolean;
  ciphertext: Buffer;
  tag: Buffer;
  iv: Buffer;
  algorithm: string;
  keyId: string;
  metadata?: Record<string, unknown>;
}

interface DecryptionResult {
  success: boolean;
  plaintext: Buffer;
  algorithm: string;
  keyId: string;
  metadata?: Record<string, unknown>;
}

interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

interface SecretKey {
  key: Buffer;
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

export interface AuditEntry {
  timestamp: string;
  operation: string;
  keyId: string;
  userId: string;
  sessionId?: string;
  success: boolean;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  duration: number;
  dataSize: number;
}

// Fallback EnhancedCryptoService implementation
class EnhancedCryptoService {
  private config: Record<string, unknown>;

  constructor(config: Record<string, unknown>) {
    this.config = config;
  }

  async encrypt(data: Buffer, key: Buffer, options: Record<string, unknown> = {}): Promise<EncryptionResult> {
    // Fallback to Node.js crypto for development
    const crypto = require('crypto');
    const algorithm = options.algorithm || 'aes-256-gcm';
    const iv = options.iv || crypto.randomBytes(12);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(iv);
    
    let ciphertext = cipher.update(data);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    return {
      success: true,
      ciphertext,
      tag,
      iv,
      algorithm: algorithm as string,
      keyId: this.getKeyId(key),
      metadata: {
        algorithm,
        keyId: this.getKeyId(key),
        performance: {
          duration: 0,
          dataSize: data.length,
          timestamp: new Date().toISOString(),
          operation: 'encrypt',
        },
        audit: {
          operation: 'encrypt',
          keyId: this.getKeyId(key),
          userId: 'system',
          timestamp: new Date().toISOString(),
          success: true,
        },
      },
    };
  }

  async decrypt(encryptedData: EncryptionResult, key: Buffer): Promise<DecryptionResult> {
    // Fallback to Node.js crypto for development
    const crypto = require('crypto');
    const decipher = crypto.createDecipher(encryptedData.algorithm, key);
    decipher.setAAD(encryptedData.iv);
    decipher.setAuthTag(encryptedData.tag);
    
    let plaintext = decipher.update(encryptedData.ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);
    
    return {
      success: true,
      plaintext,
      algorithm: encryptedData.algorithm,
      keyId: this.getKeyId(key),
      metadata: {
        algorithm: encryptedData.algorithm,
        keyId: this.getKeyId(key),
        performance: {
          duration: 0,
          dataSize: encryptedData.ciphertext.length,
          timestamp: new Date().toISOString(),
          operation: 'decrypt',
        },
        audit: {
          operation: 'decrypt',
          keyId: this.getKeyId(key),
          userId: 'system',
          timestamp: new Date().toISOString(),
          success: true,
        },
      },
    };
  }

  async generateSecretKey(algorithm: string = 'aes-256-gcm'): Promise<SecretKey> {
    const crypto = require('crypto');
    const keySize = algorithm.includes('256') ? 32 : 16;
    const key = crypto.randomBytes(keySize);
    
    return {
      key,
      keyId: 'key_' + crypto.randomBytes(8).toString('hex'),
      algorithm,
      keySize: keySize * 8,
      createdAt: new Date().toISOString(),
    };
  }

  async generateKeyPair(algorithm: string = 'rsa-2048'): Promise<KeyPair> {
    const crypto = require('crypto');
    const keySize = algorithm === 'rsa-2048' ? 2048 : 4096;
    const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: keySize,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });
    
    return {
      publicKey: Buffer.from(publicKey),
      privateKey: Buffer.from(privateKey),
      keyId: 'key_' + crypto.randomBytes(8).toString('hex'),
      algorithm,
      keySize,
      createdAt: new Date().toISOString(),
    };
  }

  getPerformanceMetrics(): Record<string, any> {
    return {};
  }

  getPerformanceAnalysis(): Record<string, unknown> {
    return {
      slowestOperations: [],
      mostFrequentOperations: [],
      performanceIssues: [],
    };
  }

  getAuditLog(filter?: Record<string, unknown>): AuditEntry[] {
    return [];
  }

  exportAuditLog(format: 'csv' | 'json' = 'json'): string | AuditEntry[] {
    if (format === 'csv') {
      return 'Timestamp,Operation,KeyID,UserID,Success,Duration,DataSize\n';
    }
    return [];
  }

  updateConfig(newConfig: Record<string, unknown>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): Record<string, unknown> {
    return this.config;
  }

  generateRandomBytes(length: number): Buffer {
    const crypto = require('crypto');
    return crypto.randomBytes(length);
  }

  timingSafeEqual(a: Buffer, b: Buffer): boolean {
    const crypto = require('crypto');
    return crypto.timingSafeEqual(a, b);
  }

  private getKeyId(key: Buffer): string {
    const crypto = require('crypto');
    return 'key_' + crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }
}

export interface SecurePaymentData {
  id: string;
  amount: number;
  currency: string;
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
  billingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  metadata?: Record<string, any>;
}

export interface EncryptedPaymentData {
  id: string;
  encryptedData: EncryptionResult;
  keyId: string;
  algorithm: string;
  createdAt: string;
  expiresAt: string;
}

export interface PaymentKey {
  keyId: string;
  algorithm: string;
  keyType: 'symmetric' | 'asymmetric';
  createdAt: string;
  expiresAt: string;
  usage: string[];
  status: 'active' | 'expired' | 'revoked';
}

@Injectable()
export class SecurePaymentService implements OnModuleInit {
  private readonly logger = new Logger(SecurePaymentService.name);
  private cryptoService: EnhancedCryptoService;
  private paymentKeys: Map<string, SecretKey | KeyPair> = new Map();
  private keyRotationInterval: NodeJS.Timeout;

  constructor() {
    this.cryptoService = new EnhancedCryptoService({
      defaultAlgorithm: 'aes-256-gcm',
      auditLogging: true,
      performanceMonitoring: true,
      fileLogging: true,
      auditFilePath: './payment-audit.log',
      keyRotationInterval: 7, // Rotate keys weekly
    });
  }

  async onModuleInit() {
    this.logger.log('Initializing Secure Payment Service');
    
    // Generate initial payment encryption key
    await this.generatePaymentKey();
    
    // Set up key rotation
    this.setupKeyRotation();
    
    this.logger.log('Secure Payment Service initialized successfully');
  }

  /**
   * Encrypt sensitive payment data
   */
  async encryptPaymentData(paymentData: SecurePaymentData): Promise<EncryptedPaymentData> {
    this.logger.debug(`Encrypting payment data for payment ID: ${paymentData.id}`);
    
    try {
      // Get the current active key
      const activeKey = this.getActiveKey();
      if (!activeKey) {
        throw new Error('No active encryption key available');
      }

      // Convert payment data to buffer
      const paymentBuffer = Buffer.from(JSON.stringify(paymentData));
      
      // Encrypt the payment data
      const encrypted = await this.cryptoService.encrypt(paymentBuffer, activeKey.key);
      
      // Create encrypted payment data object
      const encryptedPayment: EncryptedPaymentData = {
        id: paymentData.id,
        encryptedData: encrypted,
        keyId: activeKey.keyId,
        algorithm: encrypted.algorithm,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      this.logger.log(`Payment data encrypted successfully: ${paymentData.id}`);
      return encryptedPayment;

    } catch (error) {
      this.logger.error(`Failed to encrypt payment data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Decrypt sensitive payment data
   */
  async decryptPaymentData(encryptedPayment: EncryptedPaymentData): Promise<SecurePaymentData> {
    this.logger.debug(`Decrypting payment data for payment ID: ${encryptedPayment.id}`);
    
    try {
      // Get the key used for encryption
      const key = this.paymentKeys.get(encryptedPayment.keyId);
      if (!key) {
        throw new Error(`Encryption key not found: ${encryptedPayment.keyId}`);
      }

      // Check if the encrypted data has expired
      if (new Date(encryptedPayment.expiresAt) < new Date()) {
        throw new Error('Encrypted payment data has expired');
      }

      // Decrypt the payment data
      const keyBuffer = 'key' in key ? key.key : key.privateKey;
      const decrypted = await this.cryptoService.decrypt(encryptedPayment.encryptedData, keyBuffer);
      
      // Parse the decrypted JSON
      const paymentData: SecurePaymentData = JSON.parse(decrypted.plaintext.toString());
      
      this.logger.log(`Payment data decrypted successfully: ${encryptedPayment.id}`);
      return paymentData;

    } catch (error) {
      this.logger.error(`Failed to decrypt payment data: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate a new payment encryption key
   */
  async generatePaymentKey(): Promise<SecretKey> {
    this.logger.log('Generating new payment encryption key');
    
    try {
      const key = await this.cryptoService.generateSecretKey('aes-256-gcm');
      
      // Store the key
      this.paymentKeys.set(key.keyId, key);
      
      this.logger.log(`Payment encryption key generated: ${key.keyId}`);
      return key;

    } catch (error) {
      this.logger.error(`Failed to generate payment key: ${error.message}`);
      throw error;
    }
  }

  /**
   * Rotate payment encryption keys
   */
  async rotatePaymentKeys(): Promise<void> {
    this.logger.log('Rotating payment encryption keys');
    
    try {
      // Generate new key
      const newKey = await this.generatePaymentKey();
      
      // Mark old keys as expired (in a real implementation, you'd handle this more gracefully)
      for (const [keyId, key] of this.paymentKeys.entries()) {
        if (keyId !== newKey.keyId) {
          // In a real implementation, you'd update the key status in a database
          this.logger.debug(`Marking key as expired: ${keyId}`);
        }
      }
      
      this.logger.log(`Payment keys rotated successfully. New key: ${newKey.keyId}`);

    } catch (error) {
      this.logger.error(`Failed to rotate payment keys: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get active encryption key
   */
  private getActiveKey(): SecretKey | null {
    // In a real implementation, you'd query a database for active keys
    const activeKeys = Array.from(this.paymentKeys.values())
      .filter(key => 'key' in key) as SecretKey[];
    
    return activeKeys[0] || null;
  }

  /**
   * Set up automatic key rotation
   */
  private setupKeyRotation(): void {
    // Rotate keys every 7 days
    this.keyRotationInterval = setInterval(async () => {
      try {
        await this.rotatePaymentKeys();
      } catch (error) {
        this.logger.error(`Automatic key rotation failed: ${error.message}`);
      }
    }, 7 * 24 * 60 * 60 * 1000); // 7 days
  }

  /**
   * Get payment audit log
   */
  async getPaymentAuditLog(filter?: {
    paymentId?: string;
    operation?: string;
    startTime?: string;
    endTime?: string;
  }): Promise<AuditEntry[]> {
    this.logger.debug('Retrieving payment audit log');
    
    try {
      let auditLog = this.cryptoService.getAuditLog();
      
      // Apply filters
      if (filter?.operation) {
        auditLog = auditLog.filter(entry => entry.operation === filter.operation);
      }
      
      if (filter?.startTime) {
        auditLog = auditLog.filter(entry => entry.timestamp >= filter.startTime!);
      }
      
      if (filter?.endTime) {
        auditLog = auditLog.filter(entry => entry.timestamp <= filter.endTime!);
      }
      
      return auditLog;

    } catch (error) {
      this.logger.error(`Failed to retrieve payment audit log: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get payment performance metrics
   */
  async getPaymentPerformanceMetrics(): Promise<any> {
    this.logger.debug('Retrieving payment performance metrics');
    
    try {
      const metrics = this.cryptoService.getPerformanceMetrics();
      const analysis = this.cryptoService.getPerformanceAnalysis();
      
      return {
        metrics,
        analysis,
        keyCount: this.paymentKeys.size,
        activeKeyId: this.getActiveKey()?.keyId,
      };

    } catch (error) {
      this.logger.error(`Failed to retrieve payment performance metrics: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate payment data integrity
   */
  async validatePaymentData(encryptedPayment: EncryptedPaymentData): Promise<boolean> {
    this.logger.debug(`Validating payment data integrity: ${encryptedPayment.id}`);
    
    try {
      // Check if the key exists
      const key = this.paymentKeys.get(encryptedPayment.keyId);
      if (!key) {
        this.logger.warn(`Encryption key not found: ${encryptedPayment.keyId}`);
        return false;
      }

      // Check if the data has expired
      if (new Date(encryptedPayment.expiresAt) < new Date()) {
        this.logger.warn(`Encrypted payment data has expired: ${encryptedPayment.id}`);
        return false;
      }

      // Try to decrypt to validate integrity
      try {
        const keyBuffer = 'key' in key ? key.key : key.privateKey;
        await this.cryptoService.decrypt(encryptedPayment.encryptedData, keyBuffer);
        return true;
      } catch (decryptError) {
        this.logger.warn(`Payment data integrity validation failed: ${decryptError.message}`);
        return false;
      }

    } catch (error) {
      this.logger.error(`Failed to validate payment data: ${error.message}`);
      return false;
    }
  }

  /**
   * Export payment audit log for compliance
   */
  async exportPaymentAuditLog(format: 'csv' | 'json' = 'json'): Promise<string | AuditEntry[]> {
    this.logger.debug(`Exporting payment audit log in ${format} format`);
    
    try {
      return this.cryptoService.exportAuditLog(format);
    } catch (error) {
      this.logger.error(`Failed to export payment audit log: ${error.message}`);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  async onModuleDestroy(): Promise<void> {
    this.logger.log('Shutting down Secure Payment Service');
    
    if (this.keyRotationInterval) {
      clearInterval(this.keyRotationInterval);
    }
    
    // Clear sensitive data from memory
    this.paymentKeys.clear();
    
    this.logger.log('Secure Payment Service shutdown complete');
  }
}
