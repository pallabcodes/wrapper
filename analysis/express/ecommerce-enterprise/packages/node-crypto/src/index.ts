/**
 * @ecommerce-enterprise/node-crypto
 * 
 * Enhanced Node.js crypto module with enterprise features:
 * - High-performance native C++ crypto operations
 * - Comprehensive audit trails for compliance
 * - Real-time performance monitoring
 * - Advanced key management
 * - TypeScript-first design
 * - NestJS integration
 */

// Import types first
import {
  EncryptionResult,
  DecryptionResult,
  AsymmetricAlgorithm,
  KeyPair,
  SymmetricAlgorithm,
  SecretKey,
  SignatureResult,
  VerificationResult,
  HashAlgorithm,
  HashResult,
  HMACAlgorithm,
  HMACResult,
  KeyDerivationResult,
  RandomResult,
  PerformanceMetric,
  AuditEntry,
  CryptoConfig,
  BufferLike,
  EncryptionError,
  PerformanceAnalysis,
  AuditFilter,
} from './types/crypto.types';

// Re-export all types
export * from './types/crypto.types';

// Native addon interface
export interface NativeCryptoAddon {
  // Core crypto operations
  encryptAES256GCM(data: Buffer, key: Buffer, iv: Buffer): EncryptionResult;
  decryptAES256GCM(ciphertext: Buffer, key: Buffer, iv: Buffer, tag: Buffer): DecryptionResult;
  generateKeyPair(algorithm: AsymmetricAlgorithm, keySize?: number): KeyPair;
  generateSecretKey(algorithm: SymmetricAlgorithm, keySize?: number): SecretKey;
  signData(data: Buffer, privateKey: Buffer, algorithm: string): SignatureResult;
  verifySignature(data: Buffer, signature: Buffer, publicKey: Buffer, algorithm: string): VerificationResult;
  hashData(data: Buffer, algorithm: HashAlgorithm): HashResult;
  hmacData(data: Buffer, key: Buffer, algorithm: HMACAlgorithm): HMACResult;
  deriveKey(password: string, salt: Buffer, iterations: number, keyLength: number): KeyDerivationResult;
  generateRandomBytes(length: number): RandomResult;
  generateSecureRandom(length: number): RandomResult;
  
  // Key management
  rotateKey(keyId: string): KeyPair | SecretKey;
  validateKey(key: Buffer, algorithm: string): boolean;
  exportKey(key: Buffer, format: 'pem' | 'der' | 'jwk'): string | Buffer;
  importKey(keyData: string | Buffer, format: 'pem' | 'der' | 'jwk'): Buffer;
  
  // Performance monitoring
  getPerformanceMetrics(): Record<string, PerformanceMetric>;
  getOperationMetrics(operation: string): PerformanceMetric | null;
  getOverallMetrics(): {
    totalOperations: number;
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    totalDataSize: number;
  };
  resetMetrics(): boolean;
  
  // Audit trail
  logOperation(operation: string, keyId: string, userId: string, success: boolean, details?: string): void;
  recordOperation(operation: string, duration: number, success: boolean, dataSize?: number): void;
  getAuditLog(): AuditEntry[];
  getAuditLogByUser(userId: string): AuditEntry[];
  getAuditLogByKey(keyId: string): AuditEntry[];
  getAuditLogByOperation(operation: string): AuditEntry[];
  getAuditLogByTimeRange(startTime: string, endTime: string): AuditEntry[];
  exportAuditLogCSV(): string;
  exportAuditLogJSON(): AuditEntry[];
  getAuditLogStats(): {
    totalEntries: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    totalDataSize: number;
    operationCounts: Record<string, number>;
    userCounts: Record<string, number>;
  };
  
  // Security utilities
  timingSafeEqual(a: Buffer, b: Buffer): boolean;
  constantTimeCompare(a: Buffer, b: Buffer): boolean;
}

// Load the native addon
let nativeAddon: NativeCryptoAddon;

try {
  nativeAddon = require('./build/Release/node_crypto_addon.node');
} catch (error) {
  // Fallback for development or if addon is not built
  console.warn('Native crypto addon not available, using fallback implementation');
  nativeAddon = {} as NativeCryptoAddon;
}

// Enhanced Crypto Service
export class EnhancedCryptoService {
  private config: CryptoConfig;

  constructor(config: Partial<CryptoConfig> = {}) {
    this.config = {
      defaultAlgorithm: 'aes-256-gcm',
      keyRotationInterval: 90,
      auditRetentionDays: 2555, // 7 years
      performanceMonitoring: true,
      auditLogging: true,
      fileLogging: true,
      auditFilePath: './audit.log',
      maxMemoryEntries: 10000,
      ...config,
    };
  }

  // Core encryption methods
  async encrypt(data: BufferLike, key: Buffer, options: {
    algorithm?: SymmetricAlgorithm;
    iv?: Buffer;
    additionalData?: Buffer;
  } = {}): Promise<EncryptionResult> {
    const startTime = performance.now();
    
    try {
      const dataBuffer = this.toBuffer(data);
      const algorithm = options.algorithm || this.config.defaultAlgorithm as SymmetricAlgorithm;
      const iv = options.iv || this.generateIV(algorithm);
      
      if (algorithm === 'aes-256-gcm') {
        const result = nativeAddon.encryptAES256GCM?.(dataBuffer, key, iv) || this.fallbackEncrypt(dataBuffer, key, iv);
        
        if (this.config.auditLogging) {
          this.logOperation('encrypt', this.getKeyId(key), 'system', true, 
            `Algorithm: ${algorithm}, DataSize: ${dataBuffer.length}`);
        }
        
        if (this.config.performanceMonitoring) {
          this.recordPerformance('encrypt', performance.now() - startTime, dataBuffer.length);
        }
        
        return result;
      }
      
      throw new EncryptionError(`Unsupported algorithm: ${algorithm}`, 'encrypt');
    } catch (error) {
      if (this.config.auditLogging) {
        this.logOperation('encrypt', this.getKeyId(key), 'system', false, 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  async decrypt(encryptedData: EncryptionResult, key: Buffer): Promise<DecryptionResult> {
    const startTime = performance.now();
    
    try {
      const result = nativeAddon.decryptAES256GCM?.(encryptedData.ciphertext, key, encryptedData.iv, encryptedData.tag) 
        || this.fallbackDecrypt(encryptedData, key);
      
      if (this.config.auditLogging) {
        this.logOperation('decrypt', this.getKeyId(key), 'system', true, 
          `Algorithm: ${encryptedData.algorithm}, DataSize: ${encryptedData.ciphertext.length}`);
      }
      
      if (this.config.performanceMonitoring) {
        this.recordPerformance('decrypt', performance.now() - startTime, encryptedData.ciphertext.length);
      }
      
      return result;
    } catch (error) {
      if (this.config.auditLogging) {
        this.logOperation('decrypt', this.getKeyId(key), 'system', false, 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  // Key management
  async generateKeyPair(algorithm: AsymmetricAlgorithm = 'rsa-2048'): Promise<KeyPair> {
    const startTime = performance.now();
    
    try {
      const result = nativeAddon.generateKeyPair?.(algorithm) || this.fallbackGenerateKeyPair(algorithm);
      
      if (this.config.auditLogging) {
        this.logOperation('generateKeyPair', result.keyId, 'system', true, 
          `Algorithm: ${algorithm}, KeySize: ${result.keySize}`);
      }
      
      if (this.config.performanceMonitoring) {
        this.recordPerformance('generateKeyPair', performance.now() - startTime, result.keySize);
      }
      
      return result;
    } catch (error) {
      if (this.config.auditLogging) {
        this.logOperation('generateKeyPair', 'unknown', 'system', false, 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  async generateSecretKey(algorithm: SymmetricAlgorithm = 'aes-256-gcm'): Promise<SecretKey> {
    const startTime = performance.now();
    
    try {
      const result = nativeAddon.generateSecretKey?.(algorithm) || this.fallbackGenerateSecretKey(algorithm);
      
      if (this.config.auditLogging) {
        this.logOperation('generateSecretKey', result.keyId, 'system', true, 
          `Algorithm: ${algorithm}, KeySize: ${result.keySize}`);
      }
      
      if (this.config.performanceMonitoring) {
        this.recordPerformance('generateSecretKey', performance.now() - startTime, result.keySize);
      }
      
      return result;
    } catch (error) {
      if (this.config.auditLogging) {
        this.logOperation('generateSecretKey', 'unknown', 'system', false, 
          `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      throw error;
    }
  }

  // Performance monitoring
  getPerformanceMetrics(): Record<string, PerformanceMetric> {
    return nativeAddon.getPerformanceMetrics?.() || {};
  }

  getPerformanceAnalysis(): PerformanceAnalysis {
    const metrics = this.getPerformanceMetrics();
    const operations = Object.values(metrics);
    
    const slowestOperations = operations
      .sort((a, b) => b.averageDuration - a.averageDuration)
      .slice(0, 5)
      .map(op => ({
        operation: op.operation,
        averageDuration: op.averageDuration,
      }));
    
    const mostFrequentOperations = operations
      .sort((a, b) => b.callCount - a.callCount)
      .slice(0, 5)
      .map(op => ({
        operation: op.operation,
        callCount: op.callCount,
      }));
    
    const performanceIssues = operations
      .filter(op => op.averageDuration > 100) // Over 100ms
      .map(op => ({
        operation: op.operation,
        issue: 'High average duration',
        averageDuration: op.averageDuration,
      }));
    
    return {
      slowestOperations,
      mostFrequentOperations,
      performanceIssues,
    };
  }

  // Audit trail
  getAuditLog(filter?: AuditFilter): AuditEntry[] {
    let entries = nativeAddon.getAuditLog?.() || [];
    
    if (filter) {
      if (filter.userId) {
        entries = entries.filter(entry => entry.userId === filter.userId);
      }
      if (filter.keyId) {
        entries = entries.filter(entry => entry.keyId === filter.keyId);
      }
      if (filter.operation) {
        entries = entries.filter(entry => entry.operation === filter.operation);
      }
      if (filter.success !== undefined) {
        entries = entries.filter(entry => entry.success === filter.success);
      }
      if (filter.startTime) {
        entries = entries.filter(entry => entry.timestamp >= filter.startTime!);
      }
      if (filter.endTime) {
        entries = entries.filter(entry => entry.timestamp <= filter.endTime!);
      }
      if (filter.limit) {
        entries = entries.slice(0, filter.limit);
      }
      if (filter.offset) {
        entries = entries.slice(filter.offset);
      }
    }
    
    return entries;
  }

  exportAuditLog(format: 'csv' | 'json' = 'json'): string | AuditEntry[] {
    if (format === 'csv') {
      return nativeAddon.exportAuditLogCSV?.() || '';
    }
    return nativeAddon.exportAuditLogJSON?.() || [];
  }

  // Configuration
  updateConfig(newConfig: Partial<CryptoConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  getConfig(): CryptoConfig {
    return { ...this.config };
  }

  // Private helper methods
  private toBuffer(data: BufferLike): Buffer {
    if (Buffer.isBuffer(data)) {
      return data;
    }
    if (data instanceof Uint8Array) {
      return Buffer.from(data);
    }
    if (data instanceof ArrayBuffer) {
      return Buffer.from(data);
    }
    if (typeof data === 'string') {
      return Buffer.from(data, 'utf8');
    }
    throw new Error('Invalid data type');
  }

  private generateIV(algorithm: SymmetricAlgorithm): Buffer {
    switch (algorithm) {
      case 'aes-256-gcm':
      case 'aes-128-gcm':
        return this.generateRandomBytes(12);
      case 'aes-256-cbc':
      case 'aes-128-cbc':
        return this.generateRandomBytes(16);
      default:
        throw new Error(`Unsupported algorithm: ${algorithm}`);
    }
  }

  // Public methods
  generateRandomBytes(length: number): Buffer {
    const result = nativeAddon.generateRandomBytes?.(length);
    if (result?.randomBytes) {
      return result.randomBytes;
    }
    // Fallback to Node.js crypto
    const crypto = require('crypto');
    return crypto.randomBytes(length);
  }

  timingSafeEqual(a: Buffer, b: Buffer): boolean {
    return nativeAddon.timingSafeEqual?.(a, b) ?? this.fallbackTimingSafeEqual(a, b);
  }

  getAuditLogStats(): {
    totalEntries: number;
    successCount: number;
    failureCount: number;
    successRate: number;
    averageDuration: number;
    totalDataSize: number;
    operationCounts: Record<string, number>;
    userCounts: Record<string, number>;
  } {
    return nativeAddon.getAuditLogStats?.() ?? this.fallbackGetAuditLogStats();
  }

  private fallbackTimingSafeEqual(a: Buffer, b: Buffer): boolean {
    const crypto = require('crypto');
    return crypto.timingSafeEqual(a, b);
  }

  private fallbackGetAuditLogStats() {
    return {
      totalEntries: 0,
      successCount: 0,
      failureCount: 0,
      successRate: 0,
      averageDuration: 0,
      totalDataSize: 0,
      operationCounts: {},
      userCounts: {},
    };
  }

  private getKeyId(key: Buffer): string {
    const crypto = require('crypto');
    return 'key_' + crypto.createHash('sha256').update(key).digest('hex').substring(0, 16);
  }

  private logOperation(operation: string, keyId: string, userId: string, success: boolean, details?: string): void {
    nativeAddon.logOperation?.(operation, keyId, userId, success, details);
  }

  private recordPerformance(operation: string, duration: number, dataSize: number): void {
    nativeAddon.recordOperation?.(operation, duration, true, dataSize);
  }

  // Fallback implementations (for when native addon is not available)
  private fallbackEncrypt(data: Buffer, key: Buffer, iv: Buffer): EncryptionResult {
    const crypto = require('crypto');
    const cipher = crypto.createCipher('aes-256-gcm', key);
    cipher.setAAD(iv);
    
    let ciphertext = cipher.update(data);
    ciphertext = Buffer.concat([ciphertext, cipher.final()]);
    
    const tag = cipher.getAuthTag();
    
    return {
      success: true,
      ciphertext,
      tag,
      iv,
      algorithm: 'aes-256-gcm',
      metadata: {
        algorithm: 'aes-256-gcm',
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

  private fallbackDecrypt(encryptedData: EncryptionResult, key: Buffer): DecryptionResult {
    const crypto = require('crypto');
    const decipher = crypto.createDecipher('aes-256-gcm', key);
    decipher.setAAD(encryptedData.iv);
    decipher.setAuthTag(encryptedData.tag);
    
    let plaintext = decipher.update(encryptedData.ciphertext);
    plaintext = Buffer.concat([plaintext, decipher.final()]);
    
    return {
      success: true,
      plaintext,
      algorithm: 'aes-256-gcm',
      metadata: {
        algorithm: 'aes-256-gcm',
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

  private fallbackGenerateKeyPair(algorithm: AsymmetricAlgorithm): KeyPair {
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

  private fallbackGenerateSecretKey(algorithm: SymmetricAlgorithm): SecretKey {
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
}

// Export the main service
export default EnhancedCryptoService;

// Export high-level APIs for better DX
export * from './apis/crypto-api';
export * from './apis/fluent-crypto';
export * from './apis/decorator-crypto';
