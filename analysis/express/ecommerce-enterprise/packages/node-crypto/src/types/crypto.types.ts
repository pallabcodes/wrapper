/**
 * Enhanced Node.js Crypto Types
 * 
 * Comprehensive TypeScript types for the enhanced crypto module
 * with enterprise features, audit trails, and performance monitoring.
 */

export interface CryptoOperationResult {
  success: boolean;
  data?: Buffer;
  error?: string;
  metadata?: CryptoMetadata;
}

export interface CryptoMetadata {
  algorithm: string;
  keyId: string;
  performance: PerformanceMetrics;
  audit: AuditInfo;
}

export interface PerformanceMetrics {
  duration: number;
  dataSize: number;
  timestamp: string;
  operation: string;
}

export interface AuditInfo {
  operation: string;
  keyId: string;
  userId: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  success: boolean;
  details?: string;
}

// Encryption/Decryption Types
export interface EncryptionResult extends CryptoOperationResult {
  ciphertext: Buffer;
  tag: Buffer;
  iv: Buffer;
  algorithm: 'aes-256-gcm';
}

export interface DecryptionResult extends CryptoOperationResult {
  plaintext: Buffer;
  algorithm: 'aes-256-gcm';
}

// Key Management Types
export interface KeyPair {
  publicKey: Buffer;
  privateKey: Buffer;
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

export interface SecretKey {
  key: Buffer;
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  expiresAt?: string;
}

export interface KeyMetadata {
  keyId: string;
  algorithm: string;
  keySize: number;
  createdAt: string;
  expiresAt?: string;
  usage: KeyUsage[];
  status: 'active' | 'expired' | 'revoked';
  rotationCount: number;
  lastUsed?: string;
}

export type KeyUsage = 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'derive';

// Digital Signature Types
export interface SignatureResult extends CryptoOperationResult {
  signature: Buffer;
  algorithm: string;
  keyId: string;
}

export interface VerificationResult extends CryptoOperationResult {
  valid: boolean;
  algorithm: string;
  keyId: string;
}

// Hash Types
export interface HashResult extends CryptoOperationResult {
  hash: Buffer;
  algorithm: string;
  length: number;
}

export interface HMACResult extends CryptoOperationResult {
  hmac: Buffer;
  algorithm: string;
  keyId: string;
}

// Key Derivation Types
export interface KeyDerivationResult extends CryptoOperationResult {
  derivedKey: Buffer;
  algorithm: string;
  salt: Buffer;
  iterations?: number;
}

// Random Generation Types
export interface RandomResult extends CryptoOperationResult {
  randomBytes: Buffer;
  length: number;
  entropy: 'low' | 'medium' | 'high';
}

// Audit Trail Types
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

export interface AuditLog {
  entries: AuditEntry[];
  totalCount: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface AuditFilter {
  userId?: string;
  keyId?: string;
  operation?: string;
  startTime?: string;
  endTime?: string;
  success?: boolean;
  limit?: number;
  offset?: number;
}

// Performance Monitoring Types
export interface PerformanceMetric {
  operation: string;
  totalDuration: number;
  callCount: number;
  averageDuration: number;
  minDuration: number;
  maxDuration: number;
  totalDataSize: number;
  averageDataSize: number;
  lastCall: string;
  firstCall: string;
}

export interface PerformanceAnalysis {
  slowestOperations: Array<{
    operation: string;
    averageDuration: number;
  }>;
  mostFrequentOperations: Array<{
    operation: string;
    callCount: number;
  }>;
  performanceIssues: Array<{
    operation: string;
    issue: string;
    averageDuration: number;
  }>;
}

export interface PerformanceReport {
  summary: {
    totalOperations: number;
    totalCalls: number;
    totalDuration: number;
    averageDuration: number;
    totalDataSize: number;
  };
  analysis: PerformanceAnalysis;
  recommendations: Array<{
    operation: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  generatedAt: string;
}

// Configuration Types
export interface CryptoConfig {
  defaultAlgorithm: string;
  keyRotationInterval: number; // days
  auditRetentionDays: number;
  performanceMonitoring: boolean;
  auditLogging: boolean;
  fileLogging: boolean;
  auditFilePath: string;
  maxMemoryEntries: number;
}

export interface PerformanceThresholds {
  [operation: string]: {
    maxDuration: number;
    maxDataSize: number;
    alertEnabled: boolean;
  };
}

// Error Types
export interface CryptoError extends Error {
  code: string;
  operation: string;
  keyId?: string;
  details?: any;
}

export class EncryptionError extends Error implements CryptoError {
  code = 'ENCRYPTION_ERROR';
  operation: string;
  keyId?: string;
  details?: any;

  constructor(message: string, operation: string, keyId?: string, details?: any) {
    super(message);
    this.name = 'EncryptionError';
    this.operation = operation;
    if (keyId !== undefined) {
      this.keyId = keyId;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class DecryptionError extends Error implements CryptoError {
  code = 'DECRYPTION_ERROR';
  operation: string;
  keyId?: string;
  details?: any;

  constructor(message: string, operation: string, keyId?: string, details?: any) {
    super(message);
    this.name = 'DecryptionError';
    this.operation = operation;
    if (keyId !== undefined) {
      this.keyId = keyId;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class KeyError extends Error implements CryptoError {
  code = 'KEY_ERROR';
  operation: string;
  keyId?: string;
  details?: any;

  constructor(message: string, operation: string, keyId?: string, details?: any) {
    super(message);
    this.name = 'KeyError';
    this.operation = operation;
    if (keyId !== undefined) {
      this.keyId = keyId;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

export class AuditError extends Error implements CryptoError {
  code = 'AUDIT_ERROR';
  operation: string;
  keyId?: string;
  details?: any;

  constructor(message: string, operation: string, keyId?: string, details?: any) {
    super(message);
    this.name = 'AuditError';
    this.operation = operation;
    if (keyId !== undefined) {
      this.keyId = keyId;
    }
    if (details !== undefined) {
      this.details = details;
    }
  }
}

// Algorithm Types
export type SymmetricAlgorithm = 'aes-256-gcm' | 'aes-128-gcm' | 'aes-256-cbc' | 'aes-128-cbc';
export type AsymmetricAlgorithm = 'rsa-2048' | 'rsa-4096' | 'ec-p256' | 'ec-p384' | 'ec-p521';
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'sha3-256' | 'sha3-384' | 'sha3-512';
export type HMACAlgorithm = 'hmac-sha256' | 'hmac-sha384' | 'hmac-sha512';

// Utility Types
export type BufferLike = Buffer | Uint8Array | ArrayBuffer | string;
export type KeyLike = Buffer | string | KeyPair | SecretKey;

// Event Types
export interface CryptoEvents {
  'operation:start': (operation: string, keyId: string) => void;
  'operation:complete': (operation: string, keyId: string, duration: number) => void;
  'operation:error': (operation: string, keyId: string, error: Error) => void;
  'key:created': (keyId: string, algorithm: string) => void;
  'key:rotated': (keyId: string, newKeyId: string) => void;
  'key:revoked': (keyId: string, reason: string) => void;
  'audit:entry': (entry: AuditEntry) => void;
  'performance:alert': (operation: string, metric: PerformanceMetric) => void;
}

// Compliance Types
export interface ComplianceReport {
  standard: 'SOX' | 'GDPR' | 'HIPAA' | 'PCI-DSS';
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalOperations: number;
    compliantOperations: number;
    violations: number;
    complianceRate: number;
  };
  violations: Array<{
    operation: string;
    violation: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: string;
    details: string;
  }>;
  recommendations: Array<{
    area: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
  generatedAt: string;
}

// Security Types
export interface SecurityAnalysis {
  riskScore: number;
  threats: Array<{
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }>;
  anomalies: Array<{
    type: string;
    description: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recommendations: Array<{
    area: string;
    recommendation: string;
    priority: 'low' | 'medium' | 'high';
  }>;
}

// Types are already exported as interfaces above
