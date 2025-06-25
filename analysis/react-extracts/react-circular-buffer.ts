/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Circular Buffer (Ring Buffer)
 *
 * Extracted from React's scheduler tracing and event queueing internals,
 * this pattern is used for efficiently storing a fixed-size queue of events or data,
 * overwriting the oldest entries when full. React uses this for tracing, profiling,
 * and event batching where only the most recent N items matter.
 *
 * React chooses this way because:
 * - It provides O(1) enqueue and dequeue operations.
 * - It avoids memory growth by recycling buffer space.
 * - It is ideal for rolling logs, event traces, and fixed-size queues.
 * - It is simple and cache-friendly.
 */

// Actual code pattern from React (TypeScript-ified)
export class CircularBuffer<T> {
  private buffer: Array<T | undefined>;
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;
  private readonly capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array<T | undefined>(capacity);
  }

  isFull(): boolean {
    return this.count === this.capacity;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  enqueue(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.isFull()) {
      this.head = (this.head + 1) % this.capacity; // Overwrite oldest
    } else {
      this.count++;
    }
  }

  dequeue(): T | undefined {
    if (this.isEmpty()) return undefined;
    const item = this.buffer[this.head];
    this.buffer[this.head] = undefined;
    this.head = (this.head + 1) % this.capacity;
    this.count--;
    return item;
  }

  size(): number {
    return this.count;
  }

  // Optional: iterate over current items
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0, idx = this.head; i < this.count; i++, idx = (idx + 1) % this.capacity) {
      yield this.buffer[idx]!;
    }
  }
}

// Repurposable areas or scenarios
// - Fixed-size event or log buffers
// - Rolling window statistics
// - Audio/video streaming buffers
// - Rate limiting and throttling
// - Real-time analytics and telemetry
// - Producer-consumer queues with bounded memory
// - Undo/redo history with limited depth

// Repurposable areas or scenarios # code example 1

// Usage: Rolling log of last N events
const logBuffer = new CircularBuffer<string>(5);
logBuffer.enqueue('event1');
logBuffer.enqueue('event2');
logBuffer.enqueue('event3');
logBuffer.enqueue('event4');
logBuffer.enqueue('event5');
logBuffer.enqueue('event6'); // Overwrites 'event1'

for (const event of logBuffer) {
  console.log(event); // event2, event3, event4, event5, event6
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add peekFront/peekBack for inspection
// - Could support resizing the buffer dynamically
// - Could add clear() method
// - Could expose a method to get all current items as an