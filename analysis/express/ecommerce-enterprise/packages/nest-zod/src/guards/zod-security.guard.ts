import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { Request } from 'express';
import { ZOD_SECURITY_METADATA, ZodSecurityOptions } from '../interfaces/zod-validation.interface';

@Injectable()
export class ZodSecurityGuard implements CanActivate {
  private readonly logger = new Logger(ZodSecurityGuard.name);

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();

    const securityOptions = this.reflector.get<ZodSecurityOptions>(
      ZOD_SECURITY_METADATA,
      handler,
    );

    if (!securityOptions) {
      return true; // No security requirements
    }

    try {
      // Check request depth
      if (securityOptions.maxDepth) {
        this.validateRequestDepth(request.body, securityOptions.maxDepth);
      }

      // Check string lengths
      if (securityOptions.maxStringLength) {
        this.validateStringLengths(request.body, securityOptions.maxStringLength);
      }

      // Check allowed types
      if (securityOptions.allowedTypes.length > 0) {
        this.validateAllowedTypes(request.body, securityOptions.allowedTypes);
      }

      // Check blocked patterns
      if (securityOptions.blockedPatterns.length > 0) {
        this.validateBlockedPatterns(request.body, securityOptions.blockedPatterns);
      }

      // Check for injection attacks
      if (securityOptions.enableInjectionDetection) {
        this.detectInjectionAttacks(request.body);
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown security validation error';
      this.logger.warn(`Security validation failed: ${errorMessage}`);
      throw new ForbiddenException({
        message: 'Security validation failed',
        code: 'SECURITY_VALIDATION_FAILED',
        details: errorMessage,
      });
    }
  }

  private validateRequestDepth(obj: unknown, maxDepth: number, currentDepth = 0): void {
    if (currentDepth > maxDepth) {
      throw new Error(`Request depth exceeds maximum allowed depth of ${maxDepth}`);
    }

    if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          this.validateRequestDepth(value, maxDepth, currentDepth + 1);
        }
      }
    }
  }

  private validateStringLengths(obj: unknown, maxLength: number): void {
    if (typeof obj === 'string' && obj.length > maxLength) {
      throw new Error(`String length ${obj.length} exceeds maximum allowed length of ${maxLength}`);
    }

    if (obj && typeof obj === 'object') {
      for (const value of Object.values(obj)) {
        this.validateStringLengths(value, maxLength);
      }
    }
  }

  private validateAllowedTypes(obj: unknown, allowedTypes: string[]): void {
    const objType = this.getObjectType(obj);
    
    if (!allowedTypes.includes(objType)) {
      throw new Error(`Type '${objType}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const value of Object.values(obj)) {
        this.validateAllowedTypes(value, allowedTypes);
      }
    } else if (Array.isArray(obj)) {
      for (const item of obj) {
        this.validateAllowedTypes(item, allowedTypes);
      }
    }
  }

  private getObjectType(obj: unknown): string {
    if (obj === null) return 'null';
    if (obj === undefined) return 'undefined';
    if (typeof obj === 'string') return 'string';
    if (typeof obj === 'number') return 'number';
    if (typeof obj === 'boolean') return 'boolean';
    if (Array.isArray(obj)) return 'array';
    if (typeof obj === 'object') return 'object';
    if (typeof obj === 'function') return 'function';
    return 'unknown';
  }

  private validateBlockedPatterns(obj: unknown, blockedPatterns: RegExp[]): void {
    const objStr = JSON.stringify(obj);
    
    for (const pattern of blockedPatterns) {
      if (pattern.test(objStr)) {
        throw new Error(`Blocked pattern detected: ${pattern.source}`);
      }
    }
  }

  private detectInjectionAttacks(obj: unknown): void {
    const objStr = JSON.stringify(obj).toLowerCase();
    
    // SQL injection patterns
    const sqlPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bselect\b.*\bfrom\b)/i,
      /(\binsert\b.*\binto\b)/i,
      /(\bupdate\b.*\bset\b)/i,
      /(\bdelete\b.*\bfrom\b)/i,
      /(\bdrop\b.*\btable\b)/i,
      /(\balter\b.*\btable\b)/i,
      /(\bexec\b|\bexecute\b)/i,
      /(\bscript\b.*\b>)/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(objStr)) {
        throw new Error('Potential SQL injection attack detected');
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
      /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
    ];

    for (const pattern of xssPatterns) {
      if (pattern.test(objStr)) {
        throw new Error('Potential XSS attack detected');
      }
    }

    // Command injection patterns
    const commandPatterns = [
      /[;&|`$(){}[\]]/,
      /\b(cat|ls|pwd|whoami|id|uname|ps|netstat|ifconfig)\b/i,
      /\b(rm|del|mkdir|rmdir|chmod|chown)\b/i,
    ];

    for (const pattern of commandPatterns) {
      if (pattern.test(objStr)) {
        throw new Error('Potential command injection attack detected');
      }
    }
  }
}
