# Release Policy

## Versioning
1. Follow semantic versioning with major and minor and patch
2. Public API changes that break compatibility require a major
3. Additive features and compatible changes use a minor
4. Bug fixes use a patch

## Deprecation
1. Announce deprecations in change log and mark deprecated in docs
2. Provide replacement path with examples
3. Maintain deprecated surface for at least two minors
4. Remove deprecated items only with a major

## Change log
1. Maintain a change log per package with sections for added and changed and fixed and removed
2. Link to related issues and pull requests
3. Keep entries concise and actionable

## Release checklist
1. All CI checks pass including type and lint and tests and build
2. Docs and examples updated
3. Version bump and change log prepared
4. Tags and release notes created
