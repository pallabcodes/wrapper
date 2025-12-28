import { Injectable, PipeTransform } from '@nestjs/common';

/**
 * Global sanitization pipe to clean user inputs
 * Removes potentially dangerous content and normalizes input
 */
@Injectable()
export class SanitizationPipe implements PipeTransform {
  transform(value: any): any {
    if (typeof value === 'string') {
      return this.sanitizeString(value);
    }

    if (Array.isArray(value)) {
      return value.map(item => this.transform(item));
    }

    if (value && typeof value === 'object') {
      const sanitized = { ...value };
      for (const key in sanitized) {
        if (sanitized.hasOwnProperty(key)) {
          sanitized[key] = this.transform(sanitized[key]);
        }
      }
      return sanitized;
    }

    return value;
  }

  private sanitizeString(str: string): string {
    return str
      // Remove null bytes
      .replace(/\0/g, '')
      // Remove potential script injections
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/onload\s*=/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onclick\s*=/gi, '')
      // Remove HTML comments that might contain scripts
      .replace(/<!--[\s\S]*?-->/g, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim();
  }
}
