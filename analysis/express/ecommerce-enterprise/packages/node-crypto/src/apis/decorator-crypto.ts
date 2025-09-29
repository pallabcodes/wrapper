/**
 * Decorator-Based Crypto API
 * 
 * Provides decorators for automatic crypto operations
 * with enterprise features built-in.
 */

import { CryptoAPI, SimpleEncryptionResult, SimpleDecryptionResult } from './crypto-api';

export interface CryptoDecoratorOptions {
  algorithm?: 'aes-256-gcm' | 'aes-128-gcm' | 'rsa-2048' | 'rsa-4096' | 'ec-p256' | 'ec-p384';
  enableAudit?: boolean;
  enablePerformanceMonitoring?: boolean;
  compliance?: string[];
  expiresIn?: number; // hours
  userId?: string;
  keyId?: string;
}

/**
 * 🔐 Encrypt method result automatically
 * 
 * @param options - Encryption options
 * @returns Method decorator
 */
export function EncryptResult(options: CryptoDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: options.algorithm || 'aes-256-gcm',
      enableAudit: options.enableAudit !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
    });

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);
      
      // Encrypt the result
      const encrypted = await api.encrypt(result, {
        algorithm: options.algorithm,
        expiresIn: options.expiresIn,
        userId: options.userId,
        compliance: options.compliance,
      });
      
      return encrypted;
    };

    return descriptor;
  };
}

/**
 * 🔓 Decrypt method parameter automatically
 * 
 * @param options - Decryption options
 * @returns Method decorator
 */
export function DecryptParam(options: CryptoDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: options.algorithm || 'aes-256-gcm',
      enableAudit: options.enableAudit !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
    });

    descriptor.value = async function (...args: any[]) {
      // Decrypt the first parameter if it's an encrypted string
      if (args.length > 0 && typeof args[0] === 'string' && options.keyId) {
        try {
          const decrypted = await api.decrypt(args[0], options.keyId, {
            userId: options.userId,
            validateExpiration: true,
          });
          args[0] = decrypted.data;
        } catch (error) {
          throw new Error(`Failed to decrypt parameter: ${error.message}`);
        }
      }
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 🔐 Encrypt method parameter automatically
 * 
 * @param options - Encryption options
 * @returns Method decorator
 */
export function EncryptParam(options: CryptoDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: options.algorithm || 'aes-256-gcm',
      enableAudit: options.enableAudit !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
    });

    descriptor.value = async function (...args: any[]) {
      // Encrypt the first parameter if it's not already encrypted
      if (args.length > 0 && typeof args[0] === 'object' && !args[0].keyId) {
        try {
          const encrypted = await api.encrypt(args[0], {
            algorithm: options.algorithm,
            expiresIn: options.expiresIn,
            userId: options.userId,
            compliance: options.compliance,
          });
          args[0] = encrypted;
        } catch (error) {
          throw new Error(`Failed to encrypt parameter: ${error.message}`);
        }
      }
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 🔑 Generate key automatically
 * 
 * @param options - Key generation options
 * @returns Method decorator
 */
export function GenerateKey(options: CryptoDecoratorOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: options.algorithm || 'aes-256-gcm',
      enableAudit: options.enableAudit !== false,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring !== false,
    });

    descriptor.value = async function (...args: any[]) {
      // Generate key before method execution
      const key = await api.generateKey('secret', {
        algorithm: options.algorithm,
        keySize: options.keySize,
        expiresIn: options.expiresIn,
      });
      
      // Add key to arguments
      args.unshift(key);
      
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * 📊 Monitor performance automatically
 * 
 * @param options - Performance monitoring options
 * @returns Method decorator
 */
export function MonitorPerformance(options: { 
  operation?: string; 
  threshold?: number; 
  enableAudit?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || propertyKey;
    const threshold = options.threshold || 100; // ms

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        // Log performance if threshold exceeded
        if (duration > threshold) {
          console.warn(`⚠️  Performance warning: ${operation} took ${duration}ms (threshold: ${threshold}ms)`);
        }
        
        // Log success
        if (options.enableAudit !== false) {
          console.log(`✅ ${operation} completed in ${duration}ms`);
        }
        
        return result;
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        // Log error
        console.error(`❌ ${operation} failed after ${duration}ms: ${error.message}`);
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * 🔒 Add compliance requirements
 * 
 * @param compliance - Compliance requirements
 * @returns Method decorator
 */
export function Compliance(compliance: string[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Log compliance requirements
      console.log(`🔒 Compliance requirements: ${compliance.join(', ')}`);
      
      // Add compliance metadata to result
      const result = await originalMethod.apply(this, args);
      
      if (result && typeof result === 'object') {
        result.compliance = compliance;
        result.complianceCheckedAt = new Date().toISOString();
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * 🛡️ Add security validation
 * 
 * @param options - Security validation options
 * @returns Method decorator
 */
export function SecurityValidation(options: {
  validateInput?: boolean;
  validateOutput?: boolean;
  sanitizeInput?: boolean;
  sanitizeOutput?: boolean;
} = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Validate and sanitize input
      if (options.validateInput || options.sanitizeInput) {
        args = args.map(arg => {
          if (typeof arg === 'string') {
            // Basic sanitization
            if (options.sanitizeInput) {
              arg = arg.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
            // Basic validation
            if (options.validateInput && arg.length > 10000) {
              throw new Error('Input too large');
            }
          }
          return arg;
        });
      }
      
      const result = await originalMethod.apply(this, args);
      
      // Validate and sanitize output
      if (options.validateOutput || options.sanitizeOutput) {
        if (typeof result === 'string') {
          // Basic sanitization
          if (options.sanitizeOutput) {
            result.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          }
          // Basic validation
          if (options.validateOutput && result.length > 10000) {
            throw new Error('Output too large');
          }
        }
      }
      
      return result;
    };

    return descriptor;
  };
}

/**
 * 🎯 Combine multiple decorators
 * 
 * @param decorators - Array of decorators
 * @returns Combined decorator
 */
export function CombineDecorators(...decorators: any[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    let currentDescriptor = descriptor;
    
    // Apply decorators in reverse order
    for (let i = decorators.length - 1; i >= 0; i--) {
      const decorator = decorators[i];
      currentDescriptor = decorator(target, propertyKey, currentDescriptor);
    }
    
    return currentDescriptor;
  };
}
