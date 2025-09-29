/**
 * Fluent Crypto API
 * 
 * Provides a chainable, fluent interface for crypto operations
 * with enterprise features built-in.
 */

import { CryptoAPI, SimpleEncryptionResult, SimpleDecryptionResult, CryptoStats } from './crypto-api';

export interface FluentCryptoConfig {
  algorithm?: 'aes-256-gcm' | 'aes-128-gcm' | 'rsa-2048' | 'rsa-4096' | 'ec-p256' | 'ec-p384';
  enableAudit?: boolean;
  enablePerformanceMonitoring?: boolean;
  compliance?: string[];
  userId?: string;
  expiresIn?: number; // hours
}

/**
 * Fluent Crypto Builder
 * 
 * Provides a chainable interface for crypto operations
 */
export class FluentCrypto {
  private api: CryptoAPI;
  private config: FluentCryptoConfig;

  constructor(config: FluentCryptoConfig = {}) {
    this.config = {
      algorithm: 'aes-256-gcm',
      enableAudit: true,
      enablePerformanceMonitoring: true,
      compliance: [],
      ...config,
    };

    this.api = new CryptoAPI({
      algorithm: this.config.algorithm,
      enableAudit: this.config.enableAudit,
      enablePerformanceMonitoring: this.config.enablePerformanceMonitoring,
    });
  }

  /**
   * 🔐 Start encryption operation
   */
  encrypt(data: any): FluentEncryption {
    return new FluentEncryption(this.api, data, this.config);
  }

  /**
   * 🔓 Start decryption operation
   */
  decrypt(encryptedData: string, keyId: string): FluentDecryption {
    return new FluentDecryption(this.api, encryptedData, keyId, this.config);
  }

  /**
   * 🔑 Start key generation
   */
  generateKey(type: 'secret' | 'keypair' = 'secret'): FluentKeyGeneration {
    return new FluentKeyGeneration(this.api, type, this.config);
  }

  /**
   * 📊 Get statistics
   */
  async getStats(): Promise<CryptoStats> {
    return this.api.getStats();
  }

  /**
   * 🧪 Run performance test
   */
  async test(options: { iterations?: number; dataSize?: number } = {}): Promise<any> {
    return this.api.test(options);
  }
}

/**
 * Fluent Encryption Builder
 */
export class FluentEncryption {
  private api: CryptoAPI;
  private data: any;
  private config: FluentCryptoConfig;

  constructor(api: CryptoAPI, data: any, config: FluentCryptoConfig) {
    this.api = api;
    this.data = data;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: string): FluentEncryption {
    this.config.algorithm = algorithm as any;
    return this;
  }

  /**
   * Set expiration time
   */
  expiresIn(hours: number): FluentEncryption {
    this.config.expiresIn = hours;
    return this;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentEncryption {
    this.config.userId = userId;
    return this;
  }

  /**
   * Add compliance requirements
   */
  withCompliance(compliance: string[]): FluentEncryption {
    this.config.compliance = [...(this.config.compliance || []), ...compliance];
    return this;
  }

  /**
   * Execute encryption
   */
  async execute(): Promise<SimpleEncryptionResult> {
    return this.api.encrypt(this.data, {
      algorithm: this.config.algorithm,
      expiresIn: this.config.expiresIn,
      userId: this.config.userId,
      compliance: this.config.compliance,
    });
  }
}

/**
 * Fluent Decryption Builder
 */
export class FluentDecryption {
  private api: CryptoAPI;
  private encryptedData: string;
  private keyId: string;
  private config: FluentCryptoConfig;

  constructor(api: CryptoAPI, encryptedData: string, keyId: string, config: FluentCryptoConfig) {
    this.api = api;
    this.encryptedData = encryptedData;
    this.keyId = keyId;
    this.config = config;
  }

  /**
   * Set user ID for audit
   */
  forUser(userId: string): FluentDecryption {
    this.config.userId = userId;
    return this;
  }

  /**
   * Validate expiration
   */
  validateExpiration(): FluentDecryption {
    this.config.validateExpiration = true;
    return this;
  }

  /**
   * Execute decryption
   */
  async execute(): Promise<SimpleDecryptionResult> {
    return this.api.decrypt(this.encryptedData, this.keyId, {
      userId: this.config.userId,
      validateExpiration: this.config.validateExpiration,
    });
  }
}

/**
 * Fluent Key Generation Builder
 */
export class FluentKeyGeneration {
  private api: CryptoAPI;
  private type: 'secret' | 'keypair';
  private config: FluentCryptoConfig;

  constructor(api: CryptoAPI, type: 'secret' | 'keypair', config: FluentCryptoConfig) {
    this.api = api;
    this.type = type;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: string): FluentKeyGeneration {
    this.config.algorithm = algorithm as any;
    return this;
  }

  /**
   * Set key size
   */
  withKeySize(keySize: number): FluentKeyGeneration {
    this.config.keySize = keySize;
    return this;
  }

  /**
   * Set expiration time
   */
  expiresIn(days: number): FluentKeyGeneration {
    this.config.expiresIn = days * 24; // Convert days to hours
    return this;
  }

  /**
   * Execute key generation
   */
  async execute(): Promise<{ keyId: string; algorithm: string; keySize: number; expiresAt?: string }> {
    return this.api.generateKey(this.type, {
      algorithm: this.config.algorithm,
      keySize: this.config.keySize,
      expiresIn: this.config.expiresIn,
    });
  }
}

/**
 * 🚀 Create a fluent crypto instance
 */
export function createFluentCrypto(config: FluentCryptoConfig = {}): FluentCrypto {
  return new FluentCrypto(config);
}

/**
 * 🎯 Quick fluent crypto operations
 */
export const fluentCrypto = {
  /**
   * Start encryption
   */
  encrypt(data: any): FluentEncryption {
    const crypto = createFluentCrypto();
    return crypto.encrypt(data);
  },

  /**
   * Start decryption
   */
  decrypt(encryptedData: string, keyId: string): FluentDecryption {
    const crypto = createFluentCrypto();
    return crypto.decrypt(encryptedData, keyId);
  },

  /**
   * Start key generation
   */
  generateKey(type: 'secret' | 'keypair' = 'secret'): FluentKeyGeneration {
    const crypto = createFluentCrypto();
    return crypto.generateKey(type);
  },

  /**
   * Get stats
   */
  async getStats(): Promise<CryptoStats> {
    const crypto = createFluentCrypto();
    return crypto.getStats();
  },
};
