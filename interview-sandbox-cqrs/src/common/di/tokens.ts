/**
 * Symbol-based Token Identifiers for CQRS Architecture
 * 
 * Using Symbols for DI tokens in CQRS pattern ensures clean separation
 * between command handlers, query handlers, and infrastructure services.
 */

// Command Bus Token
export const COMMAND_BUS_TOKEN = Symbol('COMMAND_BUS');

// Query Bus Token
export const QUERY_BUS_TOKEN = Symbol('QUERY_BUS');

// Event Bus Token
export const EVENT_BUS_TOKEN = Symbol('EVENT_BUS');

// Write Repository Token (for write side)
export const WRITE_REPOSITORY_TOKEN = Symbol('WRITE_REPOSITORY');

// Read Repository Token (for read side)
export const READ_REPOSITORY_TOKEN = Symbol('READ_REPOSITORY');

// Projection Service Token
export const PROJECTION_SERVICE_TOKEN = Symbol('PROJECTION_SERVICE');

