# Error and Logging Schema

## Error taxonomy
1. Define canonical error codes and classes
2. Map validation and auth and rbac and transport errors to codes
3. Provide user safe messages and internal debug details

## Logging schema
1. Fields include timestamp and level and message and request id and user id and code
2. PII handling rules define redaction and hashing where required
3. Logs avoid secrets and reduce noisy payloads

## API error format
1. Use a standard envelope with code and message and details
2. Include correlation id for support
3. Align with nest zod formatting where applicable
