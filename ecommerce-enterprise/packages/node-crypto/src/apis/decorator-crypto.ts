/**
 * Decorator-Based Crypto API
 * 
 * Provides decorators for automatic crypto operations
 * with enterprise features built-in.
 */

import { CryptoAPI, CryptoAPIConfig } from './crypto-api';
import type { SymmetricAlgorithm, AsymmetricAlgorithm } from '../types/crypto.types';

export interface CryptoDecoratorOptions {
  algorithm?: SymmetricAlgorithm | AsymmetricAlgorithm | undefined;
  enableAudit?: boolean;
  enablePerformanceMonitoring?: boolean;
  compliance?: string[] | undefined;
  expiresIn?: number | undefined;
  userId?: string | undefined;
  keyId?: string;
  keySize?: number | undefined;
  validateExpiration?: boolean | undefined;
}

type MethodDecorator = (
  target: unknown,
  propertyKey: string,
  descriptor: PropertyDescriptor
) => PropertyDescriptor;

/**
 * 🔐 Encrypt method result automatically
 * 
 * @param options - Encryption options
 * @returns Method decorator
 */
export function EncryptResult(options: CryptoDecoratorOptions = {}): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: (options.algorithm as CryptoAPIConfig['algorithm']) ?? 'aes-256-gcm',
      enableAudit: options.enableAudit ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    });

    descriptor.value = async function (...args: unknown[]) {
      const result = await originalMethod.apply(this, args);

      const encryptOptions: {
        algorithm?: SymmetricAlgorithm;
        expiresIn?: number;
        userId?: string;
        compliance?: string[];
      } = {};
      if (options.algorithm !== undefined) encryptOptions.algorithm = options.algorithm as SymmetricAlgorithm;
      if (options.expiresIn !== undefined) encryptOptions.expiresIn = options.expiresIn;
      if (options.userId !== undefined) encryptOptions.userId = options.userId;
      if (options.compliance !== undefined) encryptOptions.compliance = options.compliance;

      const encrypted = await api.encrypt(result, encryptOptions);
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
export function DecryptParam(options: CryptoDecoratorOptions = {}): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: (options.algorithm as CryptoAPIConfig['algorithm']) ?? 'aes-256-gcm',
      enableAudit: options.enableAudit ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    });

    descriptor.value = async function (...args: unknown[]) {
      // Decrypt the first parameter if it's an encrypted string
      if (args.length > 0 && typeof args[0] === 'string' && options.keyId) {
        try {
          const decrypted = await api.decrypt(args[0], options.keyId);
          args[0] = decrypted.data as unknown;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to decrypt parameter: ${errorMessage}`);
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
export function EncryptParam(options: CryptoDecoratorOptions = {}): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: (options.algorithm as CryptoAPIConfig['algorithm']) ?? 'aes-256-gcm',
      enableAudit: options.enableAudit ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    });

    descriptor.value = async function (...args: unknown[]) {
      // Encrypt the first parameter if it's not already encrypted
      if (args.length > 0 && typeof args[0] === 'object' && args[0] !== null && !('keyId' in args[0])) {
        try {
          const encryptOptions: {
            algorithm?: SymmetricAlgorithm;
            expiresIn?: number;
            userId?: string;
            compliance?: string[];
          } = {};
          if (options.algorithm !== undefined) encryptOptions.algorithm = options.algorithm as SymmetricAlgorithm;
          if (options.expiresIn !== undefined) encryptOptions.expiresIn = options.expiresIn;
          if (options.userId !== undefined) encryptOptions.userId = options.userId;
          if (options.compliance !== undefined) encryptOptions.compliance = options.compliance;

          const encrypted = await api.encrypt(args[0], encryptOptions);
          args[0] = encrypted as unknown;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          throw new Error(`Failed to encrypt parameter: ${errorMessage}`);
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
export function GenerateKey(options: CryptoDecoratorOptions = {}): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const api = new CryptoAPI({
      algorithm: (options.algorithm as CryptoAPIConfig['algorithm']) ?? 'aes-256-gcm',
      enableAudit: options.enableAudit ?? true,
      enablePerformanceMonitoring: options.enablePerformanceMonitoring ?? true,
    });

    descriptor.value = async function (...args: unknown[]) {
      // Generate key before method execution
      const key = await api.generateKey('secret', {
        ...(options.algorithm !== undefined ? { algorithm: options.algorithm as SymmetricAlgorithm | AsymmetricAlgorithm } : {}),
        ...(options.keySize !== undefined ? { keySize: options.keySize } : {}),
        ...(options.expiresIn !== undefined ? { expiresIn: options.expiresIn } : {}),
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
} = {}): MethodDecorator {
  return function (_target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const operation = options.operation || propertyKey;
    const threshold = options.threshold || 100; // ms

    descriptor.value = async function (...args: unknown[]) {
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
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`❌ ${operation} failed after ${duration}ms: ${errorMessage}`);
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
export function Compliance(compliance: string[]): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // Log compliance requirements
      console.log(`🔒 Compliance requirements: ${compliance.join(', ')}`);
      
      // Add compliance metadata to result
      const result = await originalMethod.apply(this, args);
      
      if (result && typeof result === 'object' && result !== null) {
        (result as Record<string, unknown>)['compliance'] = compliance;
        (result as Record<string, unknown>)['complianceCheckedAt'] = new Date().toISOString();
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
} = {}): MethodDecorator {
  return function (_target: unknown, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      // Validate and sanitize input
      if (options.validateInput || options.sanitizeInput) {
        const sanitizedArgs = args.map(arg => {
          if (typeof arg === 'string') {
            let sanitized = arg;
            // Basic sanitization
            if (options.sanitizeInput) {
              sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
            }
            // Basic validation
            if (options.validateInput && sanitized.length > 10000) {
              throw new Error('Input too large');
            }
            return sanitized;
          }
          return arg;
        });
        args.length = 0;
        args.push(...sanitizedArgs);
      }
      
      const result = await originalMethod.apply(this, args);
      
      // Validate and sanitize output
      if (options.validateOutput || options.sanitizeOutput) {
        if (typeof result === 'string') {
          let sanitized = result;
          // Basic sanitization
          if (options.sanitizeOutput) {
            sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
          }
          // Basic validation
          if (options.validateOutput && sanitized.length > 10000) {
            throw new Error('Output too large');
          }
          return sanitized;
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
export function CombineDecorators(...decorators: MethodDecorator[]): MethodDecorator {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    let currentDescriptor = descriptor;
    
    // Apply decorators in reverse order
    for (let i = decorators.length - 1; i >= 0; i--) {
      const decorator = decorators[i];
      if (!decorator) {
        continue;
      }
      currentDescriptor = decorator(target, propertyKey, currentDescriptor);
    }
    
    return currentDescriptor;
  };
}
