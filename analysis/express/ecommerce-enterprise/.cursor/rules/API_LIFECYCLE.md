# API Lifecycle

## Versioning and compatibility
1. Public APIs are versioned and changes are categorized as major and minor and patch
2. Backward compatibility is required for minors and patches
3. Additive options and new types are preferred over breaking moves

## Deprecation flow
1. Mark deprecated with clear replacement and timeline
2. Keep deprecated items for at least two minors
3. Remove only in a major

## Review criteria
1. API surface is minimal and consistent
2. Names are explicit and predictable
3. Types are strong and discoverable

## Documentation
1. Update API docs on every change
2. Provide examples for new features
3. Note breaking changes and migration steps
