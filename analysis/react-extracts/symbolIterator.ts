/**
 * Symbol.iterator Pattern
 * 
 * React's implementation of cross-environment iterables with fallbacks
 */

// Actual code from React
// Used for safely handling iterables across different JS environments
const MAYBE_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
const FAUX_ITERATOR_SYMBOL = '@@iterator';

export function getIteratorFn(maybeIterable: any): (() => Iterator<any>) | null {
  if (maybeIterable === null || typeof maybeIterable !== 'object') {
    return null;
  }
  
  const maybeIterator =
    (MAYBE_ITERATOR_SYMBOL && maybeIterable[MAYBE_ITERATOR_SYMBOL]) ||
    maybeIterable[FAUX_ITERATOR_SYMBOL];
    
  if (typeof maybeIterator === 'function') {
    return maybeIterator;
  }
  
  return null;
}

// Used to make an object iterable in any environment
export function makeIterable<T>(items: T[]): { [Symbol.iterator](): Iterator<T> } {
  const iterableObj: any = {
    // For modern environments with Symbol support
    [Symbol.iterator]: function() {
      let index = 0;
      return {
        next() {
          return index < items.length 
            ? { value: items[index++], done: false }
            : { value: undefined, done: true };
        }
      };
    }
  };
  
  // For older environments without Symbol support
  iterableObj[FAUX_ITERATOR_SYMBOL] = iterableObj[Symbol.iterator];
  
  return iterableObj;
}

// Repurposable areas or scenarios
// - Cross-browser/environment iterables
// - Custom iterable data structures
// - Legacy environment support
// - Making third-party objects iterable
// - Iterator protocol implementations
// - Custom collection types
// - Generator function polyfills
// - Streaming data interfaces

// Code example: Custom iterable data structure with cross-environment support
export class CircularBuffer<T> {
  private buffer: T[];
  private head: number = 0;
  private tail: number = 0;
  private size: number = 0;
  
  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }
  
  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    
    if (this.size < this.capacity) {
      this.size++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }
  
  pop(): T | undefined {
    if (this.size === 0) return undefined;
    
    const item = this.buffer[this.head];
    this.head = (this.head + 1) % this.capacity;
    this.size--;
    
    return item;
  }
  
  isEmpty(): boolean {
    return this.size === 0;
  }
  
  isFull(): boolean {
    return this.size === this.capacity;
  }
  
  // Make iterable in any environment
  [Symbol.iterator](): Iterator<T> {
    let index = 0;
    let currentPosition = this.head;
    
    return {
      next: () => {
        if (index < this.size) {
          const value = this.buffer[currentPosition];
          currentPosition = (currentPosition + 1) % this.capacity;
          index++;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      }
    };
  }
}

// For older environments
CircularBuffer.prototype[FAUX_ITERATOR_SYMBOL] = 
  CircularBuffer.prototype[Symbol.iterator];