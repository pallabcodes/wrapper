 /**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Effect Cleanup Queue
 * 
 * Directly adapted from React's effects cleanup implementation in ReactFiberCommitWork.js.
 * React uses a specialized approach for handling effect cleanup functions in concurrent mode.
 * Instead of immediately executing cleanup functions when components unmount, React enqueues
 * them in a specialized data structure and executes them at a precise moment in the commit phase.
 * This prevents race conditions, ensures proper state visibility, and enables unmounting during
 * suspended renders.
 *
 * Why React does it this way:
 * - Cleanup timing is critical - must execute after DOM updates but before layout effects
 * - Concurrent mode introduces complex lifecycle timing issues with suspense/error boundaries
 * - Must batch cleanups for performance while preserving execution order
 * - Must handle cleanups during aborted renders and interrupted rendering
 * 
 * What makes it hacky/ingenious/god mode:
 * - Centralizes all effect disposal in a specialized queue with precise execution timing
 * - Decouples effect cleanup from the component lifecycle
 * - Handles both synchronous and deferred cleanup with the same mechanism
 * - Can be repurposed in any system needing robust cleanup of async resources
 */

// Core queue types from React Fiber
type CleanupQueue = {
  // First cleanup function in the queue
  first: CleanupNode | null;
  // Last cleanup function in the queue
  last: CleanupNode | null;
  // Whether the queue is currently being processed
  hasForceUpdate: boolean;
};

// Node representing a single cleanup function in the queue
type CleanupNode = {
  // The actual cleanup function to execute
  tag: 0 | 1; // 0 = layout effect, 1 = passive effect
  cleanup: () => void;
  // Fiber instance this cleanup belongs to (for debugging)
  fiber: any;
  // Next cleanup in the queue
  next: CleanupNode | null;
};

// Global cleanup queues
const pendingPassiveEffectCleanups: CleanupQueue = {
  first: null,
  last: null,
  hasForceUpdate: false,
};

const pendingLayoutEffectCleanups: CleanupQueue = {
  first: null,
  last: null,
  hasForceUpdate: false,
};

// Enqueue a cleanup function to be executed later
function enqueueCleanup(
  queue: CleanupQueue, 
  tag: 0 | 1, 
  cleanup: () => void, 
  fiber: any
): void {
  // Create a new cleanup node
  const cleanupNode: CleanupNode = {
    tag,
    cleanup,
    fiber,
    next: null,
  };
  
  // Fast path optimization: if queue is empty, set both first and last
  if (queue.first === null) {
    queue.first = queue.last = cleanupNode;
  } else {
    // Append to the end of the queue
    queue.last!.next = cleanupNode;
    queue.last = cleanupNode;
  }
}

// Schedule a passive effect cleanup (useEffect)
function schedulePassiveEffectCleanup(cleanup: () => void, fiber: any): void {
  enqueueCleanup(pendingPassiveEffectCleanups, 1, cleanup, fiber);
}

// Schedule a layout effect cleanup (useLayoutEffect)
function scheduleLayoutEffectCleanup(cleanup: () => void, fiber: any): void {
  enqueueCleanup(pendingLayoutEffectCleanups, 0, cleanup, fiber);
}

// Execute all cleanups in a queue in sequence
function flushCleanupQueue(queue: CleanupQueue): void {
  // Mark queue as being processed to handle recursive updates
  queue.hasForceUpdate = true;

  try {
    // Temporary variable to track the current node
    let currentCleanup = queue.first;
    
    // Process all cleanups in the queue
    while (currentCleanup !== null) {
      const { cleanup, fiber } = currentCleanup;
      
      try {
        // Execute the cleanup function
        cleanup();
      } catch (error) {
        // Handle errors in cleanup functions
        console.error(
          `Error in cleanup function for component ${fiber?.type?.name || 'Unknown'}:`, 
          error
        );
      }
      
      // Move to the next cleanup
      currentCleanup = currentCleanup.next;
    }
    
    // Reset the queue
    queue.first = queue.last = null;
  } finally {
    // Mark queue as no longer processing
    queue.hasForceUpdate = false;
  }
}

// Flush passive effect cleanups (called during commit phase)
function flushPassiveEffectCleanups(): void {
  flushCleanupQueue(pendingPassiveEffectCleanups);
}

// Flush layout effect cleanups (called during commit phase)
function flushLayoutEffectCleanups(): void {
  flushCleanupQueue(pendingLayoutEffectCleanups);
}

// The core commit phase that handles cleanups
function commitRootImpl(root: any, commitFlags: number): void {
  // Before mutations phase
  // ...
  
  // Mutations phase (DOM updates happen here)
  // ...
  
  // Execute all layout effect cleanups before new layout effects
  // This ensures proper cleanup ordering
  flushLayoutEffectCleanups();
  
  // Layout effects phase
  // (new layout effects run here)
  // ...
  
  // Schedule passive effect cleanups to run after a delay
  // This is the core concurrent mode optimization
  if (pendingPassiveEffectCleanups.first !== null) {
    scheduleCallback(NormalPriority, () => {
      flushPassiveEffectCleanups();
      return null;
    });
  }
}

// Simplified scheduler priority constants
type Priority = 0 | 1 | 2 | 3 | 4 | 5;
const ImmediatePriority = 1;
const UserBlockingPriority = 2;
const NormalPriority = 3;
const LowPriority = 4;
const IdlePriority = 5;

// Simplified scheduler interface
function scheduleCallback(priority: Priority, callback: () => any) {
  // In real React, this would schedule the callback with Scheduler
  setTimeout(callback, 0);
}

// Create a detached cleanup (for aborted effects)
function createDetachedCleanup(cleanup: () => void): () => void {
  // Return a function that can be called later to execute the cleanup
  // even though it's not in the normal queue
  return () => {
    try {
      cleanup();
    } catch (error) {
      console.error('Error in detached cleanup:', error);
    }
  };
}

/**
 * REPURPOSED: ResourceCleanupScheduler
 * 
 * This pattern can be applied to any system that needs to manage cleanup 
 * of resources in a coordinated, batched manner with precise timing.
 * Examples include:
 * 
 * - Event listeners in complex UI systems
 * - WebSocket/network connection management
 * - WebGL/Canvas resource disposal
 * - Worker thread lifecycle management
 * - Animation cleanup
 */
class ResourceCleanupScheduler {
  // Two queues with different timing guarantees
  private immediateCleanups: CleanupQueue = {
    first: null,
    last: null,
    hasForceUpdate: false,
  };

  private deferredCleanups: CleanupQueue = {
    first: null,
    last: null,
    hasForceUpdate: false,
  };

  // Register an immediate cleanup (executes synchronously during next phase)
  registerImmediateCleanup(
    cleanup: () => void, 
    context: object | string = 'unknown'
  ): void {
    enqueueCleanup(this.immediateCleanups, 0, cleanup, context);
  }

  // Register a deferred cleanup (executes asynchronously)
  registerDeferredCleanup(
    cleanup: () => void, 
    context: object | string = 'unknown'
  ): void {
    enqueueCleanup(this.deferredCleanups, 1, cleanup, context);
  }

  // Execute all immediate cleanups now
  flushImmediateCleanups(): void {
    flushCleanupQueue(this.immediateCleanups);
  }

  // Schedule deferred cleanups to run later
  scheduleDeferredCleanups(): void {
    if (this.deferredCleanups.first !== null) {
      // Use requestIdleCallback if available, otherwise setTimeout
      const scheduleIdle = 
        typeof requestIdleCallback !== 'undefined'
          ? requestIdleCallback
          : (fn: any) => setTimeout(fn, 0);
      
      scheduleIdle(() => {
        flushCleanupQueue(this.deferredCleanups);
      });
    }
  }

  // Process a rendering/update cycle
  processUpdateCycle(): void {
    // First handle any immediate cleanups
    this.flushImmediateCleanups();
    
    // Then schedule deferred cleanups
    this.scheduleDeferredCleanups();
  }
}

/**
 * Example application: WebGL Resource Manager
 * 
 * This shows how to apply the cleanup queue pattern to WebGL resource
 * management, ensuring proper timing of GPU resource disposal.
 */
class WebGLResourceManager {
  private gl: WebGLRenderingContext;
  private cleanupScheduler = new ResourceCleanupScheduler();
  private resources: Map<string, { 
    resource: WebGLBuffer | WebGLTexture | WebGLProgram; 
    type: 'buffer' | 'texture' | 'program';
  }> = new Map();
  
  constructor(canvas: HTMLCanvasElement) {
    this.gl = canvas.getContext('webgl')!;
    
    // Ensure cleanups run before page unloads
    window.addEventListener('beforeunload', () => {
      this.cleanupScheduler.flushImmediateCleanups();
    });
  }
  
  // Create a buffer with automatic cleanup
  createBuffer(data: Float32Array, id: string): WebGLBuffer {
    const buffer = this.gl.createBuffer()!;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, data, this.gl.STATIC_DRAW);
    
    // Store the resource
    this.resources.set(id, { resource: buffer, type: 'buffer' });
    
    return buffer;
  }
  
  // Create a texture with automatic cleanup
  createTexture(image: HTMLImageElement, id: string): WebGLTexture {
    const texture = this.gl.createTexture()!;
    this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
    this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
    this.gl.generateMipmap(this.gl.TEXTURE_2D);
    
    // Store the resource
    this.resources.set(id, { resource: texture, type: 'texture' });
    
    return texture;
  }
  
  // Delete a resource, scheduling its cleanup
  deleteResource(id: string): void {
    const resource = this.resources.get(id);
    if (!resource) return;
    
    // Schedule the cleanup based on the resource type
    switch (resource.type) {
      case 'buffer':
        this.cleanupScheduler.registerImmediateCleanup(() => {
          this.gl.deleteBuffer(resource.resource as WebGLBuffer);
        }, `Buffer ${id}`);
        break;
        
      case 'texture':
        // Textures can be cleaned up in the deferred queue
        // because they're typically larger and more expensive
        this.cleanupScheduler.registerDeferredCleanup(() => {
          this.gl.deleteTexture(resource.resource as WebGLTexture);
        }, `Texture ${id}`);
        break;
        
      case 'program':
        // Programs should be cleaned up immediately to free GPU resources
        this.cleanupScheduler.registerImmediateCleanup(() => {
          this.gl.deleteProgram(resource.resource as WebGLProgram);
        }, `Program ${id}`);
        break;
    }
    
    // Remove from tracking
    this.resources.delete(id);
  }
  
  // Process a frame render
  renderFrame(): void {
    // Clear the canvas
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Render objects
    // ...
    
    // Process any pending cleanups after rendering
    this.cleanupScheduler.processUpdateCycle();
  }
  
  // Clear all resources
  dispose(): void {
    // Delete all tracked resources
    for (const [id] of this.resources) {
      this.deleteResource(id);
    }
    
    // Force immediate cleanup of everything
    this.cleanupScheduler.flushImmediateCleanups();
    this.cleanupScheduler.flushImmediateCleanups(); // Ensure deferred items get processed
  }
}