/**
 * Symbol-based Type Tagging System
 * 
 * Extracted from React's internal type identification system
 * that uses Symbol.for to create unique, cross-realm type identifiers.
 */

// Create a type-tagging system for your application
export const TypeSymbols = {
  USER: Symbol.for('app.type.user'),
  POST: Symbol.for('app.type.post'),
  COMMENT: Symbol.for('app.type.comment'),
  NOTIFICATION: Symbol.for('app.type.notification')
};

export function createTypedObject<T>(typeSymbol: Symbol, data: T) {
  return { 
    $$typeOf: typeSymbol,
    ...data 
  };
}

export function isOfType(obj: any, typeSymbol: Symbol): boolean {
  return obj && obj.$$typeOf === typeSymbol;
}