# Security and Supply Chain

## Threat modeling
1. Identify assets and entry points and trust boundaries
2. Document primary threats and mitigations
3. Review on significant changes

## Supply chain
1. Generate SBOM for each release
2. Run SCA scans on dependencies and lock files
3. Pin versions and track updates on a regular cadence

## Integrity and secrets
1. Sign commits and tags where supported
2. Run secret scans on all changes
3. Use minimum permissions for tokens and deploy keys

## Dependency policy
1. Prefer well maintained libraries with clear licenses
2. Audit critical dependencies monthly
3. Replace unmaintained dependencies with alternatives
