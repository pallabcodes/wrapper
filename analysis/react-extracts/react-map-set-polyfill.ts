/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Map and Set Polyfill (ES6 collections)
 *
 * Extracted from React's shared/Map.js and shared/Set.js polyfills, this pattern provides
 * a fallback implementation for Map and Set in environments where ES6 collections are not available.
 * React uses this to ensure consistent behavior for keyed collections and uniqueness checks,
 * especially in environments like IE11 or older JavaScript engines.
 *
 * React chooses this way because:
 * - It needs to support environments without native Map/Set.
 * - It ensures correct key-based lookup and uniqueness.
 * - It avoids subtle bugs from missing or broken ES6 features.
 * - It is used for tracking unique keys, refs, and internal caches.
 */

// Actual code pattern from React (TypeScript-ified, simplified)
export class PolyfillMap<K, V> {
  private keys: K[] = [];
  private values: V[] = [];

  set(key: K, value: V): this {
    const idx = this.keys.indexOf(key);
    if (idx === -1) {
      this.keys.push(key);
      this.values.push(value);
    } else {
      this.values[idx] = value;
    }
    return this;
  }

  get(key: K): V | undefined {
    const idx = this.keys.indexOf(key);
    return idx === -1 ? undefined : this.values[idx];
  }

  has(key: K): boolean {
    return this.keys.indexOf(key) !== -1;
  }

  delete(key: K): boolean {
    const idx = this.keys.indexOf(key);
    if (idx === -1) return false;
    this.keys.splice(idx, 1);
    this.values.splice(idx, 1);
    return true;
  }

  clear(): void {
    this.keys = [];
    this.values = [];
  }

  size(): number {
    return this.keys.length;
  }
}

export class PolyfillSet<T> {
  private items: T[] = [];

  add(item: T): this {
    if (!this.has(item)) this.items.push(item);
    return this;
  }

  has(item: T): boolean {
    return this.items.indexOf(item) !== -1;
  }

  delete(item: T): boolean {
    const idx = this.items.indexOf(item);
    if (idx === -1) return false;
    this.items.splice(idx, 1);
    return true;
  }

  clear(): void {
    this.items = [];
  }

  size(): number {
    return this.items.length;
  }
}

// Repurposable areas or scenarios
// - Polyfilling ES6 collections in legacy browsers/environments
// - Keyed caches and lookup tables
// - Uniqueness tracking for refs, keys, or IDs
// - Internal caches for memoization or deduplication
// - Data structures for interpreters or transpilers
// - Testing environments that lack ES6 features

// Repurposable areas or scenarios # code example 1

// Usage: Tracking unique keys in a virtual DOM diff
const keySet = new PolyfillSet<string>();
keySet.add('a');
keySet.add('b');
console.log(keySet.has('a')); // true
keySet.delete('a');
console.log(keySet.has('a')); // false

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could optimize lookup with a hash map for large sets/maps
// - Could add iterator support for for...of compatibility
// - Could support custom equality/comparator functions
// - Could polyfill WeakMap/WeakSet for advanced