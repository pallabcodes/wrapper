/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Interleaved Update Queue for Concurrent Scheduling
 *
 * Extracted from React Fiber's concurrent scheduling internals (react-reconciler/src/ReactFiberConcurrentUpdates.js),
 * this pattern uses an "interleaved" queue to stage updates that are scheduled during concurrent rendering.
 * Instead of immediately mutating the main update queue, updates are pushed to an interleaved queue,
 * which is later merged atomically. This enables React to support concurrent rendering, interruption,
 * and batching without race conditions or lost updates.
 *
 * Why React does it this way:
 * - JavaScript is single-threaded, but concurrent rendering can interleave work and updates.
 * - Staging updates in a separate queue avoids corrupting the main queue during concurrent work.
 * - Enables atomic merging of updates at commit time, ensuring consistency.
 * - Supports time-slicing, interruption, and batching for high-performance UIs.
 *
 * What makes it hacky/ingenious/god mode:
 * - Repurposes a simple queue as a transactional staging area for concurrent updates.
 * - Avoids locking or complex synchronization by using queue swapping and atomic merge.
 * - Enables React to "pause" and "resume" work without losing updates.
 * - Can be repurposed in any system needing transactional, concurrent-safe update staging.
 */

// Example pattern (TypeScript-ified, based on React Fiber internals)
type Update<T> = { payload: T; next: Update<T> | null };

class InterleavedQueue<T> {
  private mainQueue: Update<T> | null = null;
  private interleavedQueue: Update<T> | null = null;

  enqueue(payload: T, concurrent: boolean = false) {
    const update: Update<T> = { payload, next: null };
    if (concurrent) {
      // Stage in interleaved queue
      if (!this.interleavedQueue) {
        this.interleavedQueue = update;
      } else {
        let last = this.interleavedQueue;
        while (last.next) last = last.next;
        last.next = update;
      }
    } else {
      // Immediate enqueue in main queue
      if (!this.mainQueue) {
        this.mainQueue = update;
      } else {
        let last = this.mainQueue;
        while (last.next) last = last.next;
        last.next = update;
      }
    }
  }

  // Atomically merge interleaved queue into main queue
  mergeInterleaved() {
    if (!this.interleavedQueue) return;
    if (!this.mainQueue) {
      this.mainQueue = this.interleavedQueue;
    } else {
      let last = this.mainQueue;
      while (last.next) last = last.next;
      last.next = this.interleavedQueue;
    }
    this.interleavedQueue = null;
  }

  // Consume all updates
  consumeAll(): T[] {
    this.mergeInterleaved();
    const result: T[] = [];
    let node = this.mainQueue;
    while (node) {
      result.push(node.payload);
      node = node.next;
    }
    this.mainQueue = null;
    return result;
  }
}

// Repurposable areas or scenarios
// - Transactional update staging in concurrent systems
// - Batching and atomic commit in UI frameworks or databases
// - Event sourcing with staged/committed event queues
// - Real-time collaborative editing (staging local vs. remote ops)
– Any system needing safe, atomic merging of staged updates

// Repurposable areas or scenarios # code example 1

// Usage: Staging updates during concurrent work
const queue = new InterleavedQueue<string>();
queue.enqueue('sync1');
queue.enqueue('concurrent1', true);
queue.enqueue('concurrent2', true);
queue.enqueue('sync2');
console.log(queue.consumeAll()); // ['sync1', 'sync2', 'concurrent1', 'concurrent2']

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support priority-based merging or ordering
// - Could expose hooks for pre/post-merge events
// - Could add statistics for staged vs. committed updates
// - Could integrate with devtools