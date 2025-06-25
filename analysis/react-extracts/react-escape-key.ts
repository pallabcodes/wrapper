/**
 * Actual code i.e. extracted (what did it solve and why react choose to do this way?)
 *
 * This is functionality: Key escaping for object keys (used in React.Children and reconciliation)
 *
 * Extracted from React's escapeUserProvidedKey and escape functions (react/src/ReactChildren.js, shared/escapeUserProvidedKey.js).
 * This pattern escapes special characters in keys (like '=' and ':') to ensure keys are safe for use
 * in React's internal data structures and do not collide or break parsing.
 *
 * React chooses this way because:
 * - Keys are used to identify elements in lists for reconciliation.
 * - User-provided keys may contain special characters that conflict with React's internal format.
 * - Escaping ensures keys are unique, safe, and reversible.
 * - It prevents subtle bugs and collisions in the virtual DOM diffing algorithm.
 */

// Actual code from React (simplified and TypeScript-ified)
const userProvidedKeyEscapeRegex = /[=:]/g;
const userProvidedKeyEscaperLookup: Record<string, string> = {
  '=': '=0',
  ':': '=2',
};

export function escapeUserProvidedKey(text: string): string {
  return ('' + text).replace(
    userProvidedKeyEscapeRegex,
    match => userProvidedKeyEscaperLookup[match]
  );
}

// Repurposable areas or scenarios
// - Escaping keys/IDs in virtual DOM or diffing engines
// - Generating safe keys for data structures (maps, trees, etc.)
– Serializing user input for use as identifiers
// - Preventing injection or collision in key-based systems
// - Encoding/decoding data for storage or transmission
// - Building custom reconciliation or patching algorithms

// Repurposable areas or scenarios # code example 1

// Usage: Generating safe keys for a virtual DOM implementation
const userKey = 'foo=bar:baz';
const safeKey = escapeUserProvidedKey(userKey);
// safeKey: 'foo=0bar=2baz'

// Feedback: What could be better which can be added or optimized later (if applicable)
// - Could add unescape function for reversibility
// - Could support escaping additional special characters
// - Could optimize for performance in hot paths
// - Could expose as a general-purpose escaping utility