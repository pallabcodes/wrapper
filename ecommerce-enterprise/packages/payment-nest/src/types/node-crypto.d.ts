declare module '@ecommerce-enterprise/node-crypto' {
  // Extend Buffer interface to include additional properties
  interface Buffer {
    algorithm?: string;
    keySize?: number;
    expiresAt?: Date;
    expiresIn?: string;
  }
  export interface CryptoConfig {
    algorithm?: string;
    keyLength?: number;
    enableAudit?: boolean;
    enablePerformance?: boolean;
    enablePerformanceMonitoring?: boolean;
    enableSecurityValidation?: boolean;
    enableCompliance?: boolean;
    complianceStandards?: string[];
    securityLevel?: string;
    compliance?: {
      standards?: string[];
      level?: string;
      sox?: boolean;
      gdpr?: boolean;
      pci?: boolean;
      pciDss?: boolean;
    };
  }

  export interface EncryptionResult {
    ciphertext: Buffer;
    tag: Buffer;
    iv: Buffer;
    algorithm: string;
    keyId: string;
    metadata?: Record<string, unknown>;
    expiresAt?: Date;
    expiresIn?: string;
    data?: Record<string, unknown>;
    decryptedAt?: Date;
    keySize?: number;
  }

  export interface DecryptionResult {
    plaintext: Buffer;
    algorithm: string;
    keyId: string;
    metadata?: Record<string, unknown>;
    data?: Record<string, unknown>;
    decryptedAt?: Date;
  }

  export interface AuditEntry {
    id: string;
    operation: string;
    timestamp: Date;
    userId?: string;
    details: Record<string, unknown>;
  }

  export interface PerformanceMetrics {
    operation: string;
    duration: number;
    memoryUsage: number;
    timestamp: Date;
  }

  export class CryptoService {
    constructor(config?: CryptoConfig);
    encrypt(data: Buffer, key: Buffer, options?: Record<string, unknown>): Promise<EncryptionResult>;
    encrypt(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<EncryptionResult>;
    decrypt(encryptedData: EncryptionResult, key: Buffer, options?: Record<string, unknown>): Promise<DecryptionResult>;
    generateKey(algorithm?: string): Promise<Buffer>;
    getAuditLog(filter?: Record<string, unknown>): AuditEntry[];
    getPerformanceMetrics(): PerformanceMetrics[];
    getPerformanceAnalysis(): Record<string, unknown>;
    updateConfig(newConfig: Record<string, unknown>): void;
    getConfig(): Record<string, unknown>;
    getStats(): Record<string, unknown>;
    test(): Promise<Record<string, unknown>>;
    test(options: Record<string, unknown>): Promise<Record<string, unknown>>;
    rotateKeys(): Promise<Record<string, unknown>>;
    rotateKeys(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  }

  export class SimpleCryptoService {
    constructor(config?: CryptoConfig);
    encrypt(data: Buffer, key: Buffer): Promise<EncryptionResult>;
    encrypt(data: Buffer, options: Record<string, unknown>): Promise<EncryptionResult>;
    encrypt(data: Record<string, unknown>, options: Record<string, unknown>): Promise<EncryptionResult>;
    decrypt(encryptedData: EncryptionResult, key: Buffer): Promise<DecryptionResult>;
    decrypt(encryptedData: Record<string, unknown>, key: string, options?: Record<string, unknown>): Promise<DecryptionResult>;
    generateKey(): Promise<Buffer>;
    generateKey(algorithm: string, options?: Record<string, unknown>): Promise<Buffer>;
    generateKey(algorithm: string, options: Record<string, unknown>): Promise<Buffer>;
  }

  export class FluentCryptoService {
    constructor(config?: CryptoConfig);
    encrypt(data: Buffer): FluentCryptoService;
    encrypt(data: Record<string, unknown>): FluentCryptoService;
    decrypt(encryptedData: EncryptionResult): FluentCryptoService;
    decrypt(encryptedData: Record<string, unknown>): FluentCryptoService;
    decrypt(encryptedData: Record<string, unknown>, key: string): FluentCryptoService;
    withKey(key: Buffer): FluentCryptoService;
    withAlgorithm(algorithm: string): FluentCryptoService;
    withOptions(options: Record<string, unknown>): FluentCryptoService;
    withExpiresIn(expiresIn: string): FluentCryptoService;
    withPerformanceMonitoring(enable: boolean): FluentCryptoService;
    withSecurityValidation(level: string): FluentCryptoService;
    withCompliance(standards: string[]): FluentCryptoService;
    expiresIn(expiresIn: number): FluentCryptoService;
    forUser(userId: string): FluentCryptoService;
    withAudit(enable: boolean): FluentCryptoService;
    withPerformance(enable: boolean): FluentCryptoService;
    validateExpiration(validate: boolean): FluentCryptoService;
    validateExpiration(): FluentCryptoService;
    generateKey(): FluentCryptoService;
    generateKey(algorithm: string): FluentCryptoService;
    generateKey(algorithm: string, options: Record<string, unknown>): FluentCryptoService;
    withKeySize(size: number): FluentCryptoService;
    execute(): Promise<EncryptionResult>;
    execute(): Promise<DecryptionResult>;
    execute(): Promise<Buffer>;
  }

  export class QuickCryptoService {
    static encrypt(data: Buffer, key: Buffer, options?: Record<string, unknown>): Promise<EncryptionResult>;
    static encrypt(data: Record<string, unknown>, options?: Record<string, unknown>): Promise<EncryptionResult>;
    static decrypt(encryptedData: EncryptionResult, key: Buffer, options?: Record<string, unknown>): Promise<DecryptionResult>;
    static decrypt(encryptedData: Record<string, unknown>, key: string, options?: Record<string, unknown>): Promise<DecryptionResult>;
    static decrypt(encryptedData: Record<string, unknown>, key: string, options: Record<string, unknown>): Promise<DecryptionResult>;
    static generateKey(algorithm?: string): Promise<Buffer>;
  }

  export const crypto: CryptoService;
  export const simple: SimpleCryptoService;
  export const fluent: FluentCryptoService;
  export const quick: typeof QuickCryptoService;

  // Additional exports for decorators and utilities
  export function createCryptoAPI(config?: CryptoConfig): CryptoService;
  export function createFluentCrypto(config?: CryptoConfig): FluentCryptoService;
  export function createSimpleCrypto(config?: CryptoConfig): SimpleCryptoService;
  export function createQuickCrypto(): typeof QuickCryptoService;

  // Decorator types
  export interface EncryptResult extends EncryptionResult {
    // Additional properties for decorators
  }

  export interface DecryptParam {
    encryptedData: EncryptionResult;
    key: Buffer;
    options?: Record<string, unknown>;
  }

  export function MonitorPerformance(options?: Record<string, unknown>): MethodDecorator;
  export function Compliance(standards: string[]): MethodDecorator;
  export function SecurityValidation(level: string): MethodDecorator;
  export function SecurityValidation(options: Record<string, unknown>): MethodDecorator;
  export function EncryptResult(options?: Record<string, unknown>): MethodDecorator;
  export function DecryptParam(options?: Record<string, unknown>): MethodDecorator;
}
