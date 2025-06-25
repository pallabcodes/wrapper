/**
 * Symbol-based Type Tagging System
 * 
 * This pattern is used throughout React for creating unique, cross-realm type identifiers
 * that can be compared efficiently using reference equality.
 */

// Actual code from React
const symbolFor = Symbol.for;
export const REACT_ELEMENT_TYPE = symbolFor('react.element');
export const REACT_PORTAL_TYPE = symbolFor('react.portal');
export const REACT_FRAGMENT_TYPE = symbolFor('react.fragment');
export const REACT_STRICT_MODE_TYPE = symbolFor('react.strict_mode');
export const REACT_PROFILER_TYPE = symbolFor('react.profiler');
export const REACT_PROVIDER_TYPE = symbolFor('react.provider');
export const REACT_CONTEXT_TYPE = symbolFor('react.context');
export const REACT_FORWARD_REF_TYPE = symbolFor('react.forward_ref');
export const REACT_SUSPENSE_TYPE = symbolFor('react.suspense');
export const REACT_SUSPENSE_LIST_TYPE = symbolFor('react.suspense_list');
export const REACT_MEMO_TYPE = symbolFor('react.memo');
export const REACT_LAZY_TYPE = symbolFor('react.lazy');

/**
 * React uses Symbol.for instead of just Symbol() for type tags because:
 * 1. Symbol.for creates a symbol in the global registry
 * 2. Calling Symbol.for() with the same string returns the same symbol
 * 3. This allows cross-realm/iframe type comparisons to work correctly
 * 4. It's essential for packages used across multiple versions
 */

// Repurposable areas or scenarios
// - Type identification system for complex object hierarchies
// - Runtime type checking without inheritance
// - Safe cross-realm/iframe type comparisons
// - Building extensible plugin architectures
// - Creating type-safe enums that work across module boundaries

// Code example 1: Type identification for a pluggable system
export const TypeRegistry = {
  COMPONENT: symbolFor('app.component'),
  MIDDLEWARE: symbolFor('app.middleware'),
  STORE: symbolFor('app.store'),
  REDUCER: symbolFor('app.reducer'),
  EFFECT: symbolFor('app.effect')
};

export function isOfType(obj: any, typeSymbol: Symbol): boolean {
  return obj && obj.$$typeOf === typeSymbol;
}

export function createTyped<T>(typeSymbol: Symbol, data: T): T & { $$typeOf: Symbol } {
  return { 
    $$typeOf: typeSymbol,
    ...data 
  };
}

// Example usage
// const store = createTyped(TypeRegistry.STORE, { state: {} });
// if (isOfType(store, TypeRegistry.STORE)) { /* do something */ }