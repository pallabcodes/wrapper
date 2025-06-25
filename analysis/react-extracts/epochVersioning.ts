/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a React-specific hack: Epoch Versioning
 * 
 * Directly adapted from React Server Components implementation.
 * React uses an "epoch" versioning system for server components to manage server-client data synchronization.
 * When a server component tree is rendered, it assigns an epoch identifier to the entire tree. This epoch
 * is then used to determine which client-side cache values are still valid and which need to be updated.
 * It's a brilliant way to do coarse-grained invalidation without fine-grained dependency tracking.
 *
 * Why React does it this way:
 * - Server-client synchronization needs invalidation but can't use normal dependency tracking
 * - Fine-grained invalidation would be too expensive across network boundaries
 * - Need to handle partial tree updates without invalidating the entire application
 * - Must handle race conditions between concurrent server renders
 *
 * What makes it hacky/ingenious/god mode:
 * - Uses a single version identifier to represent an entire tree's coherency
 * - Enables cheap invalidation with minimal metadata
 * - Solves the hard distributed systems problem of data coherence across boundaries
 * - Can be repurposed for any system needing efficient invalidation across boundaries
 */

// The brilliance is in the simplicity of the epoch concept
type Epoch = {
  id: number;        // Unique identifier for this rendering pass
  status: 'pending' | 'complete' | 'aborted';  // Status of the epoch
  timestamp: number; // When this epoch was created
};

// The global epoch registry
class EpochManager {
  private currentEpoch: Epoch | null = null;
  private completedEpochs: Epoch[] = [];
  private nextEpochId = 1;
  
  // Start a new epoch - this is called when server rendering begins
  startEpoch(): Epoch {
    // Abort any pending epoch (if one exists)
    if (this.currentEpoch && this.currentEpoch.status === 'pending') {
      this.currentEpoch.status = 'aborted';
    }
    
    // Create a new epoch
    const newEpoch: Epoch = {
      id: this.nextEpochId++,
      status: 'pending',
      timestamp: Date.now()
    };
    
    this.currentEpoch = newEpoch;
    return newEpoch;
  }
  
  // Complete the current epoch - called when server rendering is done
  completeEpoch(): void {
    if (!this.currentEpoch) return;
    
    this.currentEpoch.status = 'complete';
    this.completedEpochs.push(this.currentEpoch);
    this.currentEpoch = null;
    
    // Only keep recent epochs (optimization)
    if (this.completedEpochs.length > 5) {
      this.completedEpochs.shift(); // Remove oldest
    }
  }
  
  // Get the current epoch
  getCurrentEpoch(): Epoch | null {
    return this.currentEpoch;
  }
  
  // Check if a given epoch is still valid
  isEpochValid(epochId: number): boolean {
    // Current epoch is always valid
    if (this.currentEpoch && this.currentEpoch.id === epochId) {
      return true;
    }
    
    // Check completed epochs
    return this.completedEpochs.some(epoch => 
      epoch.id === epochId && epoch.status === 'complete'
    );
  }
  
  // Get the latest completed epoch
  getLatestCompletedEpoch(): Epoch | null {
    if (this.completedEpochs.length === 0) {
      return null;
    }
    return this.completedEpochs[this.completedEpochs.length - 1];
  }
}

// Global instance for the application
const epochManager = new EpochManager();

// The cache that uses epoch versioning
class EpochCache<K, V> {
  private cache = new Map<K, { value: V; epochId: number }>();
  
  // Set a value in the cache with current epoch
  set(key: K, value: V): void {
    const currentEpoch = epochManager.getCurrentEpoch();
    if (!currentEpoch) {
      throw new Error("Cannot set cache value outside an epoch");
    }
    
    this.cache.set(key, {
      value,
      epochId: currentEpoch.id
    });
  }
  
  // Get a value if it's from a valid epoch
  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    // Check if the entry's epoch is still valid
    if (epochManager.isEpochValid(entry.epochId)) {
      return entry.value;
    }
    
    // Epoch is invalid, delete the entry
    this.cache.delete(key);
    return undefined;
  }
  
  // Clear all entries from invalid epochs
  pruneInvalidEntries(): void {
    for (const [key, entry] of this.cache.entries()) {
      if (!epochManager.isEpochValid(entry.epochId)) {
        this.cache.delete(key);
      }
    }
  }
}

// Simplified React Server Component payload builder
class RSCPayloadBuilder {
  private chunks: any[] = [];
  private currentEpoch: Epoch;
  private moduleCache = new EpochCache<string, any>();
  
  constructor() {
    // Start a new epoch for this payload
    this.currentEpoch = epochManager.startEpoch();
  }
  
  // Add a component chunk to the payload
  addComponentChunk(id: string, component: any): void {
    this.chunks.push({
      id,
      component,
      epochId: this.currentEpoch.id
    });
    
    // Cache the module reference for future use
    this.moduleCache.set(id, component);
  }
  
  // Complete building the payload
  finalize(): any {
    epochManager.completeEpoch();
    
    return {
      epochId: this.currentEpoch.id,
      chunks: this.chunks
    };
  }
  
  // Try to get a cached module
  getCachedModule(id: string): any {
    return this.moduleCache.get(id);
  }
}

// Client-side RSC payload processor
class RSCPayloadProcessor {
  private moduleCache = new EpochCache<string, any>();
  private currentEpochId: number | null = null;
  
  // Process an incoming payload
  processPayload(payload: any): void {
    this.currentEpochId = payload.epochId;
    
    // Process all chunks
    for (const chunk of payload.chunks) {
      // Verify chunk belongs to this epoch 
      if (chunk.epochId === this.currentEpochId) {
        // Cache the module
        this.moduleCache.set(chunk.id, chunk.component);
      }
    }
  }
  
  // Get a component by ID if it's from a valid epoch
  getComponent(id: string): any {
    return this.moduleCache.get(id);
  }
}

// Repurposable areas or scenarios
// - Distributed caching systems
// - Real-time data synchronization
// - Optimistic UI with invalidation
// - Multi-user collaborative editing
// - Version control for shared data
// - Any system where multiple sources need to remain coherent

/**
 * Repurposed: Distributed Cache with Epoch-Based Invalidation
 * 
 * This shows how the epoch versioning pattern can be applied to a distributed
 * cache system, such as a CDN or microservices architecture.
 */
class DistributedCacheNode<T> {
  private cache = new Map<string, { value: T; epochId: number }>();
  private highestSeenEpochId = 0;
  
  // The key insight: Epochs provide coherence without coordination
  
  // Process an update from the central authority
  processUpdate(key: string, value: T, epochId: number): void {
    // Update our tracking of the highest epoch we've seen
    if (epochId > this.highestSeenEpochId) {
      this.highestSeenEpochId = epochId;
    }
    
    // Store the value with its epoch
    this.cache.set(key, { value, epochId });
  }
  
  // Get a value if it's from a current epoch
  getValue(key: string, minValidEpochId: number): T | null {
    const entry = this.cache.get(key);
    
    // Return null if we have no entry or the entry is stale
    if (!entry || entry.epochId < minValidEpochId) {
      return null;
    }
    
    return entry.value;
  }
  
  // Get highest epoch we've seen
  getHighestEpochId(): number {
    return this.highestSeenEpochId;
  }
}

/**
 * Central coordination for a distributed cache system
 */
class DistributedCacheCoordinator<T> {
  private nodes: DistributedCacheNode<T>[] = [];
  private currentEpochId = 1;
  
  // Register a node with the coordinator
  registerNode(node: DistributedCacheNode<T>): void {
    this.nodes.push(node);
  }
  
  // Start a new epoch (e.g., on major data change)
  startNewEpoch(): number {
    return ++this.currentEpochId;
  }
  
  // Update a value across all nodes
  updateValue(key: string, value: T): void {
    // Use the current epoch for this update
    for (const node of this.nodes) {
      node.processUpdate(key, value, this.currentEpochId);
    }
  }
  
  // Get the minimum valid epoch across all nodes
  getMinValidEpochId(): number {
    // In a real system, this would involve communication
    // This is a simplified version
    let minEpochId = this.currentEpochId;
    
    for (const node of this.nodes) {
      const nodeEpochId = node.getHighestEpochId();
      // Nodes that have seen newer epochs mean older ones are invalid
      if (nodeEpochId < minEpochId && nodeEpochId > 0) {
        minEpochId = nodeEpochId;
      }
    }
    
    // Go back one epoch to ensure all nodes have this data
    return Math.max(1, minEpochId - 1);
  }
}

/**
 * Real-world Application: A collaborative document editor using epoch versioning
 * to ensure consistent rendering across multiple users.
 */
class CollaborativeDocumentSystem {
  // Central epoch management
  private epochManager = new EpochManager();
  
  // Document state with versioning
  private docState = new Map<string, {
    content: string;
    lastModifiedEpoch: number;
    author: string;
  }>();
  
  // Client connections
  private clients = new Map<string, {
    clientEpochId: number;
    lastSyncTime: number;
  }>();
  
  // Create a new document revision
  editDocument(docId: string, changes: string, author: string): void {
    // Start a new epoch for this operation
    const epoch = this.epochManager.startEpoch();
    
    try {
      // Apply changes
      const currentDoc = this.docState.get(docId) || {
        content: '',
        lastModifiedEpoch: 0,
        author: 'system'
      };
      
      // Update the document with this epoch
      this.docState.set(docId, {
        content: currentDoc.content + changes, // Simplified - real system would apply patches
        lastModifiedEpoch: epoch.id,
        author
      });
      
      // Complete the epoch
      this.epochManager.completeEpoch();
    } catch (error) {
      // Something went wrong - abort this epoch
      this.epochManager.getCurrentEpoch()!.status = 'aborted';
      throw error;
    }
  }
  
  // Client connection and sync
  connectClient(clientId: string): void {
    // New client gets the latest epoch
    const latestEpoch = this.epochManager.getLatestCompletedEpoch();
    
    this.clients.set(clientId, {
      clientEpochId: latestEpoch?.id || 0,
      lastSyncTime: Date.now()
    });
  }
  
  // Get document state for a specific client
  getDocumentForClient(clientId: string, docId: string): any {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error("Unknown client");
    }
    
    const doc = this.docState.get(docId);
    if (!doc) {
      return { content: '', author: 'system', epochId: 0 };
    }
    
    // If client's epoch is older than the doc's last modified epoch,
    // update the client's epoch
    if (client.clientEpochId < doc.lastModifiedEpoch) {
      client.clientEpochId = doc.lastModifiedEpoch;
      client.lastSyncTime = Date.now();
    }
    
    return {
      content: doc.content,
      author: doc.author,
      epochId: doc.lastModifiedEpoch
    };
  }
  
  // Client submits changes
  submitChanges(clientId: string, docId: string, changes: string): boolean {
    const client = this.clients.get(clientId);
    if (!client) {
      return false; // Unknown client
    }
    
    const doc = this.docState.get(docId);
    
    // Check if client has the latest version before allowing changes
    if (doc && client.clientEpochId < doc.lastModifiedEpoch) {
      return false; // Client needs to sync first
    }
    
    // Apply the changes
    this.editDocument(docId, changes, clientId);
    return true;
  }
  
  // Get sync status for diagnostics
  getSyncStatus(): any {
    const latestEpoch = this.epochManager.getLatestCompletedEpoch();
    const clientStatuses = Array.from(this.clients.entries()).map(([id, info]) => ({
      clientId: id,
      epochDifference: (latestEpoch?.id || 0) - info.clientEpochId,
      lastSyncTime: info.lastSyncTime
    }));
    
    return {
      currentEpoch: this.epochManager.getCurrentEpoch(),
      latestCompletedEpoch: latestEpoch,
      clientCount: this.clients.size,
      clientStatuses
    };
  }
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could implement automatic garbage collection for old epochs
// - Could add conflict resolution for concurrent modifications
// - Could optimize payload size by only sending changes
// - Could add rollback capability for failed epochs
// - Could implement hierarchical epochs for large systems