/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Stack (LIFO data structure)
 *
 * Extracted from React's reconciler and context stack internals (react-reconciler/src/ReactFiberStack.js, ReactFiberContext.js),
 * this pattern implements a classic stack for managing context, effect, and state stacks during
 * rendering and reconciliation. React uses this for:
 * - Context propagation (push/pop context)
 * - Effect and update stack management
 * - Traversal of nested render phases
 *
 * React chooses this way because:
 * - It provides O(1) push/pop operations.
 * - It is ideal for managing nested scopes and temporary state.
 * - It is simple, fast, and memory-efficient.
 * - It matches the recursive nature of React's rendering and context propagation.
 */

// Actual code pattern from React (TypeScript-ified)
export class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T | undefined {
    return this.items.pop();
  }

  peek(): T | undefined {
    return this.items.length > 0 ? this.items[this.items.length - 1] : undefined;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  size(): number {
    return this.items.length;
  }
}

// Repurposable areas or scenarios
// - Context and scope management in interpreters/compilers
// - Undo/redo stacks in editors
// - Traversal of nested structures (XML, JSON, ASTs)
– Effect and transaction management
// - Backtracking algorithms (DFS, pathfinding)
// - Call stack simulation in virtual machines
// - UI navigation/history stacks

// Repurposable areas or scenarios # code example 1

// Usage: Context stack for a template engine
const contextStack = new Stack<object>();
contextStack.push({ theme: 'dark' });
contextStack.push({ theme: 'light', lang: 'en' });
console.log(contextStack.peek()); // { theme: 'light', lang: 'en' }
contextStack.pop();
console.log(contextStack.peek()); // { theme: 'dark' }

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add clear() method for stack reset
// - Could support max size or bounded stack
// - Could expose iterator for stack traversal
// - Could add event hooks for push/pop for debugging