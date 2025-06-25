/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Starvation Detection and Priority Bumping
 *
 * Directly adapted from React Fiber's work scheduling logic (react-reconciler/src/ReactFiberWorkLoop.js).
 * React's scheduler dynamically detects when a root or lane has been "starved" (waiting too long without
 * being processed) and bumps its priority to ensure it eventually gets CPU time. This prevents lower-priority
 * work from being indefinitely blocked by higher-priority work streams, ensuring fairness and preventing
 * UI freezes or unresponsiveness.
 *
 * Why React does it this way:
 * - In concurrent rendering, some roots/lanes may be blocked by higher-priority work.
 * - Without intervention, lower-priority updates might wait indefinitely.
 * - Priority bumping ensures all roots eventually make progress.
 * - It balances urgent vs. non-urgent work without complex synchronization or yielding.
 *
 * What makes it hacky/ingenious/god mode:
 * - Dynamically adjusts scheduling priorities based on observed starvation.
 * - Avoids global locks or complex scheduling policies.
 * - Uses time-based heuristics to rebalance priorities adaptively.
 * - Can be repurposed in any concurrent system needing starvation prevention.
 */

// Adapted from ReactFiberWorkLoop.js
type Lane = number;
type Lanes = number;
type LanePriority = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

// Lane constants (simplified from React)
const SyncLane: Lane = 0b0000000000000000000000000000001;
const InputContinuousLane: Lane = 0b0000000000000000000000000000100;
const DefaultLane: Lane = 0b0000000000000000000000000010000;
const TransitionLane: Lane = 0b0000000000000000000000100000000;
const IdleLane: Lane = 0b0100000000000000000000000000000;
const NoLane: Lane = 0b0000000000000000000000000000000;
const NoLanes: Lanes = 0b0000000000000000000000000000000;

// Priority mapping (simplified from React)
const NoLanePriority: LanePriority = 0;
const SyncLanePriority: LanePriority = 10;
const InputContinuousLanePriority: LanePriority = 9;
const DefaultLanePriority: LanePriority = 8;
const TransitionPriority: LanePriority = 6;
const IdleLanePriority: LanePriority = 2;

class FiberRoot {
  // Root-specific state
  pendingLanes: Lanes = NoLanes;
  expiredLanes: Lanes = NoLanes;
  finishedLanes: Lanes = NoLanes;
  
  // Starvation tracking
  earliestPendingTime: number = 0;
  latestPendingTime: number = 0;
  
  constructor() {
    // Initialize with current time
    const now = performance.now();
    this.earliestPendingTime = now;
    this.latestPendingTime = now;
  }
  
  // Add lanes to this root
  addPendingLanes(lanes: Lanes): void {
    this.pendingLanes |= lanes;
    
    // Update starvation tracking
    const now = performance.now();
    if (this.earliestPendingTime === 0) {
      this.earliestPendingTime = now;
    }
    this.latestPendingTime = now;
  }
  
  // Mark lanes as finished
  finishLanes(lanes: Lanes): void {
    this.finishedLanes |= lanes;
    this.pendingLanes &= ~lanes;
    
    // Reset starvation tracking if all work is done
    if (this.pendingLanes === NoLanes) {
      this.earliestPendingTime = 0;
      this.latestPendingTime = 0;
    }
  }
  
  // Get the next lanes to work on, considering starvation
  getNextLanes(): Lanes {
    const pendingLanes = this.pendingLanes;
    
    if (pendingLanes === NoLanes) {
      return NoLanes;
    }
    
    // Start with highest priority lanes
    let nextLanes = getHighestPriorityLanes(pendingLanes);
    
    // Check for starvation
    const now = performance.now();
    if (
      this.earliestPendingTime > 0 &&
      now - this.earliestPendingTime > STARVATION_THRESHOLD_MS
    ) {
      // Starvation detected! Include all pending lanes
      // This effectively bumps priority of all starved lanes
      nextLanes = pendingLanes;
      
      // In real React, this might be more selective about which
      // lanes get bumped based on starvation time and initial priority
    }
    
    return nextLanes;
  }
}

// Constants
const STARVATION_THRESHOLD_MS = 500; // ms before considering work starved

// Get the highest priority lanes from a lanes bitmask
function getHighestPriorityLanes(lanes: Lanes): Lanes {
  // In actual React, this has a complex implementation
  // We'll simplify for demonstration
  if (lanes & SyncLane) {
    return SyncLane;
  } else if (lanes & InputContinuousLane) {
    return InputContinuousLane;
  } else if (lanes & DefaultLane) {
    return DefaultLane;
  } else if (lanes & TransitionLane) {
    return TransitionLane;
  } else if (lanes & IdleLane) {
    return IdleLane;
  }
  return NoLanes;
}

// Get the priority level of a lane
function getLanePriority(lane: Lane): LanePriority {
  if (lane === SyncLane) {
    return SyncLanePriority;
  } else if (lane === InputContinuousLane) {
    return InputContinuousLanePriority;
  } else if (lane === DefaultLane) {
    return DefaultLanePriority;
  } else if (lane === TransitionLane) {
    return TransitionPriority;
  } else if (lane === IdleLane) {
    return IdleLanePriority;
  }
  return NoLanePriority;
}

// Main scheduler that processes work for roots
class Scheduler {
  private roots: FiberRoot[] = [];
  
  addRoot(root: FiberRoot): void {
    this.roots.push(root);
  }
  
  // Process work for all roots
  performWork(): void {
    // Process all roots, checking for starvation
    for (const root of this.roots) {
      const lanes = root.getNextLanes();
      
      if (lanes !== NoLanes) {
        console.log(`Processing lanes: ${lanes.toString(2)} for root`);
        
        // In real React, this would do the actual rendering work
        // For simulation, we'll just mark lanes as finished
        root.finishLanes(lanes);
      }
    }
  }
}

// Repurposable areas or scenarios
// - Concurrent task schedulers
// - Real-time systems with mixed priority workloads
// - Game engines with multiple subsystems (physics, AI, rendering)
// - Event handling in UI frameworks
// - Background processing queues
// - Any system with potential starvation issues

// Repurposable areas or scenarios # code example 1

// Usage: A game engine task scheduler with starvation prevention
class GameTaskScheduler {
  private tasks: Map<string, {
    priority: number;
    handler: () => void;
    queueTime: number;
  }> = new Map();
  
  private readonly STARVATION_MS = 100; // Shorter for games to maintain responsiveness
  
  constructor() {
    // Start the processing loop
    this.processLoop();
  }
  
  // Add a task with a priority (higher number = higher priority)
  addTask(id: string, priority: number, handler: () => void): void {
    this.tasks.set(id, {
      priority,
      handler,
      queueTime: performance.now()
    });
  }
  
  // Process all pending tasks
  private processLoop(): void {
    // Process tasks, considering starvation
    this.processTasks();
    
    // Schedule next frame
    requestAnimationFrame(() => this.processLoop());
  }
  
  private processTasks(): void {
    if (this.tasks.size === 0) return;
    
    // Get current time for starvation check
    const now = performance.now();
    
    // Find highest priority task, considering starvation
    let highestPriorityTask: {id: string, priority: number, handler: () => void} | null = null;
    let highestAdjustedPriority = -Infinity;
    
    for (const [id, task] of this.tasks.entries()) {
      const starvationTime = now - task.queueTime;
      
      // Calculate adjusted priority based on starvation
      // The longer it waits, the higher its adjusted priority becomes
      const starvationBoost = Math.floor(starvationTime / this.STARVATION_MS);
      const adjustedPriority = task.priority + starvationBoost;
      
      if (adjustedPriority > highestAdjustedPriority) {
        highestAdjustedPriority = adjustedPriority;
        highestPriorityTask = {
          id, 
          priority: task.priority,
          handler: task.handler
        };
      }
    }
    
    // Execute highest priority task
    if (highestPriorityTask) {
      console.log(
        `Executing task ${highestPriorityTask.id} with base priority ${highestPriorityTask.priority} ` +
        `and adjusted priority ${highestAdjustedPriority}`
      );
      
      // Remove from queue
      this.tasks.delete(highestPriorityTask.id);
      
      // Execute
      highestPriorityTask.handler();
    }
  }
}

// Example usage
const gameScheduler = new GameTaskScheduler();

// Add tasks with different priorities
gameScheduler.addTask('physics', 10, () => console.log('Physics update'));
gameScheduler.addTask('ai', 5, () => console.log('AI update'));
gameScheduler.addTask('sound', 3, () => console.log('Sound update'));
gameScheduler.addTask('particles', 1, () => console.log('Particle update'));

// Even though 'particles' has the lowest priority, it will eventually
// get processed due to starvation detection and priority bumping

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could implement more sophisticated starvation detection algorithms
// - Could add priority classes or bands for different types of work
// - Could integrate with system load metrics for adaptive scheduling
// - Could add statistical tracking to optimize starvation thresholds
// - Could implement priority decay for very long-running