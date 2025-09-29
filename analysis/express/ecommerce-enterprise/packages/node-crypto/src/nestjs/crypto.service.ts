/**
 * NestJS Crypto Service
 * 
 * Service wrapper for the enhanced crypto functionality
 * in NestJS applications.
 */

import { EnhancedCryptoService } from '../index';
import { CryptoConfig } from '../types/crypto.types';

export class CryptoService {
  private cryptoService: EnhancedCryptoService;

  constructor(config: Partial<CryptoConfig> = {}) {
    this.cryptoService = new EnhancedCryptoService(config);
  }

  // Core encryption methods
  async encrypt(data: Buffer, key: Buffer, options: any = {}) {
    return this.cryptoService.encrypt(data, key, options);
  }

  async decrypt(encryptedData: any, key: Buffer) {
    return this.cryptoService.decrypt(encryptedData, key);
  }

  // Key management
  async generateKeyPair(algorithm: string = 'rsa-2048') {
    return this.cryptoService.generateKeyPair(algorithm as any);
  }

  async generateSecretKey(algorithm: string = 'aes-256-gcm') {
    return this.cryptoService.generateSecretKey(algorithm as any);
  }

  // Performance and audit
  getPerformanceMetrics() {
    return this.cryptoService.getPerformanceMetrics();
  }

  getPerformanceAnalysis() {
    return this.cryptoService.getPerformanceAnalysis();
  }

  getAuditLog(filter?: any) {
    return this.cryptoService.getAuditLog(filter);
  }

  exportAuditLog(format: 'csv' | 'json' = 'json') {
    return this.cryptoService.exportAuditLog(format);
  }

  getAuditLogStats() {
    return this.cryptoService.getAuditLogStats();
  }

  // Configuration
  updateConfig(config: Partial<CryptoConfig>) {
    return this.cryptoService.updateConfig(config);
  }

  getConfig() {
    return this.cryptoService.getConfig();
  }

  // Utility methods
  generateRandomBytes(length: number): Buffer {
    return this.cryptoService.generateRandomBytes(length);
  }

  timingSafeEqual(a: Buffer, b: Buffer): boolean {
    return this.cryptoService.timingSafeEqual(a, b);
  }
}