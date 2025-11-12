# Principal Engineer Scrutiny Checklist

Use this checklist before opening pull requests. All items must pass to feel like internal enterprise work.

## Readability and maintainability
1. Names are explicit and discoverable
2. Control flow is shallow with early returns
3. Comments explain rationale and invariants only

## Debuggability
1. Errors carry structured context and clear action
2. Logs include request id and user id when available
3. Traces exist for critical paths and metrics cover core signals
4. Mean time to diagnose target is under thirty minutes

## Type safety and contracts
1. Zero type errors and no any in published code
2. Public API types are minimal and documented
3. Validators and schemas compose under strict mode

## Performance and scalability
1. Hot paths avoid needless allocations and repeated work
2. Async boundaries are explicit and streaming applies backpressure
3. Caching and idempotency are applied where appropriate

## Security and privacy
1. No secrets in code and use env or secret managers only
2. Tokens and cookies follow secure defaults and rotation
3. Inputs validated and outputs sanitized where needed

## Package boundaries and DX
1. No deep imports across package internals
2. Use forRoot and forFeature patterns for configurable modules
3. Examples and docs are accurate and minimal and typed

## See also
1. `.cursor/rules/CI_ENFORCEMENT.md` (machine enforced checks)
