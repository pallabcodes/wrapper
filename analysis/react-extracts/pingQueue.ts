/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Ping Queue for Suspense Wakeups in Concurrent Rendering
 *
 * Directly adapted from react-reconciler/src/ReactFiberWorkLoop.js and ReactFiberSuspenseComponent.js.
 * React uses a ping queue to track which suspended boundaries (waiting on Promises) have resolved ("pinged").
 * When a Promise resolves, it "pings" the queue, which triggers React to retry rendering the suspended boundary.
 * This enables React to efficiently coordinate wakeups and retries without polling or redundant work.
 *
 * Why React does it this way:
 * - Suspense boundaries can suspend on async resources (promises).
 * - When a resource resolves, React needs to know which boundaries to retry.
 * - The ping queue efficiently tracks and batches wakeups for concurrent rendering.
 * - Avoids polling, redundant retries, and race conditions.
 *
 * What makes it hacky/ingenious/god mode:
 * - Repurposes a Set as a wakeup/event notification system for async resources.
 * - Enables batching and deduplication of wakeups for high concurrency.
 * - Integrates with concurrent scheduling for efficient retries.
 * - Can be repurposed in any async system needing coordinated wakeups or retries.
 */

// Adapted from ReactFiberWorkLoop.js
type SuspenseBoundary = { id: string; retry: () => void };

class PingQueue {
  private queue: Set<SuspenseBoundary> = new Set();

  add(boundary: SuspenseBoundary) {
    this.queue.add(boundary);
  }

  pingAll() {
    for (const boundary of this.queue) {
      boundary.retry();
    }
    this.queue.clear();
  }

  // Called when a promise resolves
  ping(boundary: SuspenseBoundary) {
    if (this.queue.has(boundary)) {
      boundary.retry();
      this.queue.delete(boundary);
    }
  }
}

// Repurposable areas or scenarios
// - Async resource coordination in concurrent systems
// - Event-driven wakeup queues for promises or futures
// - Batching and deduplication of async retries
// - Real-time collaborative editing (batched notifications)
// - Any system needing efficient, coordinated wakeups for async boundaries

// Repurposable areas or scenarios # code example 1

// Usage: Batched notification system for async jobs in a distributed worker pool
class WorkerPoolPingQueue extends PingQueue {}

const poolQueue = new WorkerPoolPingQueue();
const jobA = { id: 'A', retry: () => console.log('Retry job A') };
const jobB = { id: 'B', retry: () => console.log('Retry job B') };

// Add jobs that are waiting for resources
poolQueue.add(jobA);
poolQueue.add(jobB);

// When a resource becomes available, ping the job
poolQueue.ping(jobA); // Output: Retry job A

// Or, batch wakeup all waiting jobs (e.g., on a global event)
poolQueue.pingAll(); // Output: Retry job B

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support priority-based wakeups or throttling
// - Could add statistics for ping frequency and batching
// - Could integrate with devtools for ping queue inspection
// - Could expose hooks for ping lifecycle events