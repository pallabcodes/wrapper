import { Transform } from 'class-transformer';

/**
 * Decorator to sanitize string inputs
 * Removes potentially dangerous content and normalizes input
 */
export function Sanitize() {
  return Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    return value
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
  });
}
