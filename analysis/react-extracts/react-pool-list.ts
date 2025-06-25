/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Object Pool (free list pattern)
 *
 * Extracted from React's event pooling and synthetic event system (react-dom/src/events/EventPropagators.js, shared/PooledClass.js),
 * this pattern maintains a pool (free list) of reusable objects to reduce garbage collection pressure
 * and improve performance for frequently created/disposed objects (like events).
 *
 * React chooses this way because:
 * - It avoids frequent allocations and deallocations of short-lived objects.
 * - It reduces GC overhead in hot paths (like event dispatch).
 * - It enables recycling of objects with predictable memory usage.
 * - It is ideal for high-frequency, low-lifetime object scenarios.
 */

// Actual code pattern from React (TypeScript-ified)
export class PoolList<T extends { reset(): void }> {
  private pool: T[] = [];
  private readonly create: () => T;
  private readonly maxSize: number;

  constructor(create: () => T, maxSize: number = 10) {
    this.create = create;
    this.maxSize = maxSize;
  }

  acquire(): T {
    return this.pool.length > 0 ? this.pool.pop()! : this.create();
  }

  release(obj: T): void {
    obj.reset();
    if (this.pool.length < this.maxSize) {
      this.pool.push(obj);
    }
    // else let GC collect it
  }
}

// Repurposable areas or scenarios
// - Event pooling in UI frameworks
// - Game engines (particle, bullet, or entity pooling)
// - Network packet or buffer reuse
// - Database connection pooling
// - Thread or worker pool management
// - Memory-constrained environments (IoT, embedded)
// - High-frequency data processing pipelines

// Repurposable areas or scenarios # code example 1

// Usage: Pooling synthetic events
class SyntheticEvent {
  type: string = '';
  target: any = null;
  reset() {
    this.type = '';
    this.target = null;
  }
}

const eventPool = new PoolList(() => new SyntheticEvent(), 20);

function handleEvent(type: string, target: any) {
  const evt = eventPool.acquire();
  evt.type = type;
  evt.target = target;
  // ...dispatch event...
  eventPool.release(evt);
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add statistics for pool usage/hits/misses
// - Could support async acquire/release for resource pools
// - Could allow dynamic resizing of the pool
// - Could add debugging hooks for pool