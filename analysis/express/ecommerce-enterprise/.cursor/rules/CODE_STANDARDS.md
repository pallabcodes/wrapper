# Code Standards

## Naming and structure
1. Descriptive names for variables and functions. No two letter names.
2. Exports must be intentional through index files.
3. One module per file where reasonable.

## Control flow
1. Prefer early returns over deep nesting.
2. Avoid broad try and catch. Catch only where meaningful handling exists.
3. No silent error swallowing.

## Comments
1. Only add comments for rationale, invariants, or caveats.
2. Avoid narrative comments that restate code.
3. Keep comments concise.

## Imports
1. No deep imports across package internals.
2. Group and order imports consistently.
3. Use type only imports when importing types in TypeScript.

## Examples policy
1. Example snippets must be Java or Golang.
2. No Python in examples.
3. Avoid emoji and hyphen in code and comments.
