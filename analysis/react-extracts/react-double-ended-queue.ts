/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Double-Ended Queue (Deque)
 *
 * Extracted from React's internal scheduler (react-reconciler/src/Scheduler.js), this is a
 * custom double-ended queue implementation. React uses this for managing work/task queues
 * where tasks can be added or removed from both ends efficiently.
 *
 * React chooses this way because:
 * - JavaScript arrays are not efficient for shift/unshift at scale.
 * - This implementation provides O(1) push/pop/shift/unshift.
 * - It avoids memory leaks and unnecessary array resizing.
 * - It is used for scheduling and managing concurrent work.
 */

// Based on React's Deque implementation
export class Deque<T> {
  private head: number = 0;
  private tail: number = 0;
  private capacity: number;
  private buffer: Array<T | undefined>;

  constructor(initialCapacity: number = 32) {
    this.capacity = initialCapacity;
    this.buffer = new Array(this.capacity);
  }

  size(): number {
    return this.tail - this.head;
  }

  isEmpty(): boolean {
    return this.size() === 0;
  }

  push(item: T): void {
    if (this.tail === this.capacity) this.grow();
    this.buffer[this.tail++] = item;
  }

  pop(): T | undefined {
    if (this.isEmpty()) return undefined;
    const value = this.buffer[--this.tail];
    this.buffer[this.tail] = undefined;
    return value;
  }

  unshift(item: T): void {
    if (this.head === 0) this.grow();
    this.buffer[--this.head] = item;
  }

  shift(): T | undefined {
    if (this.isEmpty()) return undefined;
    const value = this.buffer[this.head];
    this.buffer[this.head++] = undefined;
    return value;
  }

  private grow(): void {
    const oldBuffer = this.buffer;
    this.capacity *= 2;
    this.buffer = new Array(this.capacity);
    for (let i = this.head; i < this.tail; i++) {
      this.buffer[i - this.head] = oldBuffer[i];
    }
    this.tail -= this.head;
    this.head = 0;
  }
}

// Repurposable areas or scenarios
// - Task/work queues in schedulers
// - Undo/redo stacks
// - Animation frame management
// - Real-time event processing
// - Message passing systems
// - Browser history/state stacks
// - Producer-consumer queues
// - Any system needing fast O(1) queue/stack operations at both ends

// Repurposable areas or scenarios # code example 1

// Usage: Undo/redo stack
const history = new Deque<string>();
history.push('state1');
history.push('state2');
console.log(history.pop()); // state2
history.unshift('initial');
console.log(history.shift()); // initial

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support iteration over elements
// - Could add a clear() method
// - Could expose a peekFront/peekBack for inspection
// - Could be made circular for fixed-size buffer