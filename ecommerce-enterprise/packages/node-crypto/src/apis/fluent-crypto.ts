/**
 * Fluent Crypto API
 * 
 * Provides a chainable, fluent interface for crypto operations
 * with enterprise features built-in.
 */

import { CryptoAPI, SimpleEncryptionResult, SimpleDecryptionResult, CryptoStats, CryptoAPIConfig } from './crypto-api';
import type { SymmetricAlgorithm, AsymmetricAlgorithm } from '../types/crypto.types';

export interface FluentCryptoConfig {
  algorithm?: SymmetricAlgorithm | AsymmetricAlgorithm | undefined;
  enableAudit?: boolean;
  enablePerformanceMonitoring?: boolean;
  compliance?: string[] | undefined;
  userId?: string | undefined;
  expiresIn?: number | undefined; // hours
  validateExpiration?: boolean | undefined;
  keySize?: number | undefined;
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
      validateExpiration: false,
      ...config,
    };

    type AlgorithmOption = NonNullable<CryptoAPIConfig['algorithm']>;
    const algorithm: AlgorithmOption = (this.config.algorithm ?? 'aes-256-gcm') as AlgorithmOption;

    this.api = new CryptoAPI({
      algorithm,
      enableAudit: this.config.enableAudit,
      enablePerformanceMonitoring: this.config.enablePerformanceMonitoring,
    } as CryptoAPIConfig);
  }

  /**
   * 🔐 Start encryption operation
   */
  encrypt(data: unknown): FluentEncryption {
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
  async test(options: { iterations?: number; dataSize?: number } = {}): Promise<unknown> {
    return this.api.test(options);
  }
}

/**
 * Fluent Encryption Builder
 */
export class FluentEncryption {
  private api: CryptoAPI;
  private data: unknown;
  private config: FluentCryptoConfig;

  constructor(api: CryptoAPI, data: unknown, config: FluentCryptoConfig) {
    this.api = api;
    this.data = data;
    this.config = config;
  }

  /**
   * Set algorithm
   */
  withAlgorithm(algorithm: string): FluentEncryption {
    this.config.algorithm = algorithm as FluentCryptoConfig['algorithm'];
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
    const encryptOptions: {
      algorithm?: SymmetricAlgorithm;
      expiresIn?: number;
      userId?: string;
      compliance?: string[];
    } = {};
    if (this.config.algorithm !== undefined) encryptOptions.algorithm = this.config.algorithm as SymmetricAlgorithm;
    if (this.config.expiresIn !== undefined) encryptOptions.expiresIn = this.config.expiresIn;
    if (this.config.userId !== undefined) encryptOptions.userId = this.config.userId;
    if (this.config.compliance !== undefined) encryptOptions.compliance = this.config.compliance;

    return this.api.encrypt(this.data, encryptOptions);
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
    return this.api.decrypt(this.encryptedData, this.keyId);
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
    this.config.algorithm = algorithm as FluentCryptoConfig['algorithm'];
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
    const generateOptions: {
      algorithm?: SymmetricAlgorithm | AsymmetricAlgorithm;
      keySize?: number;
      expiresIn?: number;
    } = {};
    if (this.config.algorithm !== undefined) generateOptions.algorithm = this.config.algorithm;
    if (this.config.keySize !== undefined) generateOptions.keySize = this.config.keySize;
    if (this.config.expiresIn !== undefined) generateOptions.expiresIn = this.config.expiresIn;

    return this.api.generateKey(this.type, generateOptions);
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
  encrypt(data: unknown): FluentEncryption {
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
