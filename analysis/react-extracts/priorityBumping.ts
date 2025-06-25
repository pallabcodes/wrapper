/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Interleaved Update Queue for Concurrent Scheduling
 *
 * Directly adapted from react-reconciler/src/ReactFiberConcurrentUpdates.js.
 * React uses a linked list for the main update queue, and a separate "interleaved" queue
 * for updates scheduled during concurrent rendering. At commit, the interleaved queue is
 * atomically merged into the main queue, ensuring no updates are lost or duplicated.
 *
 * Why React does it this way:
 * - Avoids mutating the main queue during concurrent work.
 * - Ensures atomic, race-free merging of updates.
 * - Enables time-slicing, interruption, and batching.
 *
 * What makes it hacky/ingenious/god mode:
 * - Uses pointer manipulation to "splice" two linked lists together in O(1).
 * - Avoids locking, copying, or array allocations.
 * - Can be repurposed for any system needing transactional, concurrent-safe update staging.
 */

// Adapted from ReactFiberConcurrentUpdates.js
type Update<T> = {
  payload: T;
  next: Update<T> | null;
};

class UpdateQueue<T> {
  baseQueue: Update<T> | null = null;
  interleaved: Update<T> | null = null;

  enqueueUpdate(update: Update<T>, concurrent: boolean = false) {
    if (concurrent) {
      // Add to interleaved queue (circular linked list)
      if (this.interleaved === null) {
        update.next = update;
        this.interleaved = update;
      } else {
        update.next = this.interleaved.next;
        this.interleaved.next = update;
        this.interleaved = update;
      }
    } else {
      // Add to base queue (circular linked list)
      if (this.baseQueue === null) {
        update.next = update;
        this.baseQueue = update;
      } else {
        update.next = this.baseQueue.next;
        this.baseQueue.next = update;
        this.baseQueue = update;
      }
    }
  }

  // Atomically merge interleaved queue into base queue
  mergeInterleaved() {
    if (this.interleaved !== null) {
      if (this.baseQueue === null) {
        this.baseQueue = this.interleaved;
      } else {
        // Splice the two circular lists together
        const baseFirst = this.baseQueue.next!;
        const interleavedFirst = this.interleaved.next!;
        this.baseQueue.next = interleavedFirst;
        this.interleaved.next = baseFirst;
        this.baseQueue = this.interleaved;
      }
      this.interleaved = null;
    }
  }

  // Consume all updates in base queue
  consumeAll(): T[] {
    this.mergeInterleaved();
    const result: T[] = [];
    if (this.baseQueue !== null) {
      let node = this.baseQueue.next!;
      do {
        result.push(node.payload);
        node = node.next!;
      } while (node !== this.baseQueue.next);
      this.baseQueue = null;
    }
    return result;
  }
}

// Repurposable areas or scenarios # code example 1

// Usage: Transactional event sourcing with staged/committed event queues
class EventSourcingSystem {
  private queue = new UpdateQueue<string>();

  // Stage events during a transaction (concurrent = true)
  stageEvent(event: string) {
    this.queue.enqueueUpdate({ payload: event, next: null }, true);
  }

  // Commit events immediately (concurrent = false)
  commitEvent(event: string) {
    this.queue.enqueueUpdate({ payload: event, next: null }, false);
  }

  // At the end of a transaction, atomically merge and process all events
  commitTransaction() {
    const allEvents = this.queue.consumeAll();
    for (const evt of allEvents) {
      console.log('Processing event:', evt);
      // ...process event...
    }
  }
}

// Example usage:
const system = new EventSourcingSystem();
system.commitEvent('user:created');
system.stageEvent('user:updated');
system.stageEvent('user:emailed');
system.commitEvent('user:deleted');
system.commitTransaction();
// Output:
// Processing event: user:created
// Processing event: user:deleted
// Processing event: user:updated
// Processing event: user:emailed

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could support priority-based merging or ordering
// - Could expose hooks for pre/post-merge events
// - Could add statistics for staged vs. committed updates
// - Could integrate with devtools for queue inspection