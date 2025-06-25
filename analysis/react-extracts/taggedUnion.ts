/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is a DSA: Tagged Union (Discriminated Union) for Node Type Encoding
 *
 * Extracted from React Fiber's architecture (react-reconciler/src/ReactWorkTags.js, ReactFiber.js),
 * this pattern encodes the "type" of each Fiber node using a numeric tag (e.g., FunctionComponent, HostComponent, etc.).
 * This enables fast type checks and switch-based dispatch, supporting efficient reconciliation and scheduling.
 *
 * React chooses this way because:
 * - It allows O(1) type checks using integer comparison.
 * - It enables switch-based dispatch for fast branching.
 * - It avoids costly instanceof or string-based type checks.
 * - It is memory- and cache-friendly for large trees.
 * - It is essential for high-performance, extensible tree structures.
 */

// Actual code pattern from React Fiber (TypeScript-ified)
export enum FiberTag {
  FunctionComponent = 0,
  ClassComponent = 1,
  IndeterminateComponent = 2,
  HostRoot = 3,
  HostPortal = 4,
  HostComponent = 5,
  HostText = 6,
  // ...many more tags in React
}

// Example Fiber node with tag
export class FiberNode<T = any> {
  public tag: FiberTag;
  public child: FiberNode<T> | null = null;
  public sibling: FiberNode<T> | null = null;
  public return: FiberNode<T> | null = null;
  public value: T;

  constructor(tag: FiberTag, value: T) {
    this.tag = tag;
    this.value = value;
  }
}

// Helper: Switch-based dispatch on tag
export function processFiber<T>(fiber: FiberNode<T>) {
  switch (fiber.tag) {
    case FiberTag.FunctionComponent:
      // Handle function component
      break;
    case FiberTag.HostComponent:
      // Handle host component
      break;
    // ...other cases
  }
}

// Repurposable areas or scenarios
// - Fast type dispatch in tree or graph structures
// - AST node type encoding in compilers/interpreters
// - Tagged unions for protocol/message parsing
// - State machines with discriminated states
// - Serialization/deserialization with type tags
// - Extensible plugin or component systems

// Repurposable areas or scenarios # code example 1

// Usage: AST node type dispatch
enum AstTag { Literal, Identifier, BinaryExpr }
class AstNode {
  constructor(public tag: AstTag, public value: any) {}
}
function evalAst(node: AstNode) {
  switch (node.tag) {
    case AstTag.Literal: return node.value;
    case AstTag.Identifier: /* ... */ break;
    case AstTag.BinaryExpr: /* ... */ break;
  }
}

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could generate tag enums/types automatically for large systems
// - Could add runtime validation for tag correctness
// - Could support tagged unions with payload validation
// - Could expose utilities for tag-to-string mapping for