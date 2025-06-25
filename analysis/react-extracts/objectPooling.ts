/**
 * Object Pooling for Performance Optimization
 * 
 * React uses object pooling for high-frequency objects to reduce GC pressure
 */

// Actual code pattern from React's internal pooling mechanisms
// This is similar to how React handles events and other frequently created objects

// A simple pooled object interface
interface PooledObject {
  init: (...args: any[]) => void;
  reset: () => void;
}

// Generic object pool implementation based on React's pattern
class ObjectPool<T extends PooledObject> {
  private readonly size: number;
  private readonly createFn: () => T;
  private readonly pool: T[];
  private freeIndex: number;
  
  constructor(createFn: () => T, initialSize: number) {
    this.size = initialSize;
    this.createFn = createFn;
    this.pool = Array(initialSize).fill(null).map(() => createFn());
    this.freeIndex = 0;
  }
  
  get(): T {
    if (this.freeIndex === this.size) {
      // Pool is exhausted, create new object
      // React would warn about this in development
      const newObject = this.createFn();
      return newObject;
    }
    
    return this.pool[this.freeIndex++];
  }
  
  release(obj: T): void {
    if (this.freeIndex === 0) {
      // If pool is already full, just let the object be garbage collected
      return;
    }
    
    // Reset the object and add it back to the pool
    obj.reset();
    this.pool[--this.freeIndex] = obj;
  }
}

// Repurposable areas or scenarios
// - High-frequency object creation in games/animations
// - Event systems and handlers
// - DOM operations with frequent temporary objects
// - Data processing pipelines
// - Network request managers
// - Worker thread communication
// - File system operations
// - Real-time data visualization

// Code example: Pooled events for a game engine
interface Vector2D {
  x: number;
  y: number;
}

class PooledEvent implements PooledObject {
  type: string = '';
  timestamp: number = 0;
  position: Vector2D = { x: 0, y: 0 };
  target: any = null;
  data: any = null;
  
  init(type: string, position: Vector2D, target: any, data?: any): void {
    this.type = type;
    this.timestamp = Date.now();
    this.position.x = position.x;
    this.position.y = position.y;
    this.target = target;
    this.data = data;
  }
  
  reset(): void {
    this.type = '';
    this.timestamp = 0;
    this.position.x = 0;
    this.position.y = 0;
    this.target = null;
    this.data = null;
  }
}

export class EventManager {
  private readonly eventPool: ObjectPool<PooledEvent>;
  private readonly listeners: Map<string, Array<(event: PooledEvent) => void>> = new Map();
  private activeEvents: Set<PooledEvent> = new Set();
  
  constructor(poolSize: number = 50) {
    this.eventPool = new ObjectPool(() => new PooledEvent(), poolSize);
  }
  
  addEventListener(type: string, callback: (event: PooledEvent) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(callback);
  }
  
  removeEventListener(type: string, callback: (event: PooledEvent) => void): void {
    if (!this.listeners.has(type)) return;
    
    const listeners = this.listeners.get(type)!;
    const index = listeners.indexOf(callback);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }
  
  dispatchEvent(type: string, position: Vector2D, target: any, data?: any): void {
    const event = this.eventPool.get();
    event.init(type, position, target, data);
    this.activeEvents.add(event);
    
    // Dispatch to listeners
    const callbacks = this.listeners.get(type);
    if (callbacks) {
      callbacks.forEach(callback => callback(event));
    }
    
    // Return to pool after all listeners have processed it
    this.activeEvents.delete(event);
    this.eventPool.release(event);
  }
  
  clearAllListeners(): void {
    this.listeners.clear();
  }
}