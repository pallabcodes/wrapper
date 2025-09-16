import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark routes as public (no authentication required)
 * Used for endpoints that should be accessible without JWT tokens
 *
 * @example
 * ```typescript
 * @Public()
 * @Post('track')
 * async trackEvent(@Body() dto: CreateAnalyticsEventDto) {
 *   // This endpoint doesn't require authentication
 * }
 * ```
 */
export const Public = () => SetMetadata('isPublic', true);

/**
 * Decorator to mark routes as requiring specific roles
 * Extends the basic role-based access control
 *
 * @param roles - Array of roles that can access this route
 * @example
 * ```typescript
 * @RequireRoles(['admin', 'analyst'])
 * @Get('admin/metrics')
 * async getAdminMetrics() {
 *   // Only admin and analyst roles can access
 * }
 * ```
 */
export const RequireRoles = (...roles: string[]) =>
  SetMetadata('roles', roles);

/**
 * Decorator to mark routes as requiring specific permissions
 * More granular access control than roles
 *
 * @param permissions - Array of permissions required
 * @example
 * ```typescript
 * @RequirePermissions(['analytics:read', 'reports:export'])
 * @Get('reports/export')
 * async exportReport() {
 *   // Requires specific permissions
 * }
 * ```
 */
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

/**
 * Decorator to specify rate limiting for individual routes
 * Overrides global rate limiting settings
 *
 * @param options - Rate limiting configuration
 * @example
 * ```typescript
 * @RateLimit({ ttl: 60, limit: 1000 })
 * @Post('bulk-track')
 * async bulkTrackEvents(@Body() events: CreateAnalyticsEventDto[]) {
 *   // High rate limit for bulk operations
 * }
 * ```
 */
export const RateLimit = (options: { ttl: number; limit: number }) =>
  SetMetadata('rateLimit', options);

/**
 * Decorator to enable caching for routes
 * Uses Redis cache with configurable TTL
 *
 * @param ttl - Cache TTL in seconds (default: 300)
 * @example
 * ```typescript
 * @CacheRoute(600) // Cache for 10 minutes
 * @Get('metrics/realtime')
 * async getRealtimeMetrics() {
 *   // Response will be cached
 * }
 * ```
 */
export const CacheRoute = (ttl: number = 300) =>
  SetMetadata('cacheTtl', ttl);

/**
 * Decorator to disable caching for specific routes
 * Useful for dynamic or real-time data
 *
 * @example
 * ```typescript
 * @NoCache()
 * @Get('metrics/live')
 * async getLiveMetrics() {
 *   // Never cache this response
 * }
 * ```
 */
export const NoCache = () => SetMetadata('noCache', true);

/**
 * Decorator to add audit logging for sensitive operations
 * Automatically logs who performed what action
 *
 * @param action - Description of the action being performed
 * @example
 * ```typescript
 * @AuditLog('exported analytics report')
 * @Post('reports/export')
 * async exportReport() {
 *   // Action will be logged for audit purposes
 * }
 * ```
 */
export const AuditLog = (action: string) =>
  SetMetadata('auditAction', action);

/**
 * Decorator to specify API version for routes
 * Enables version-based routing
 *
 * @param version - API version (e.g., 'v1', 'v2')
 * @example
 * ```typescript
 * @ApiVersion('v2')
 * @Get('metrics')
 * async getMetricsV2() {
 *   // Only available in v2 API
 * }
 * ```
 */
export const ApiVersion = (version: string) =>
  SetMetadata('apiVersion', version);

/**
 * Decorator to mark routes as experimental
 * Adds warning headers and documentation
 *
 * @param message - Optional message about the experimental nature
 * @example
 * ```typescript
 * @Experimental('This endpoint may change without notice')
 * @Get('experimental/feature')
 * async experimentalFeature() {
 *   // Marked as experimental
 * }
 * ```
 */
export const Experimental = (message?: string) =>
  SetMetadata('experimental', message || 'This endpoint is experimental');

/**
 * Decorator to specify response time SLA for routes
 * Used for monitoring and alerting
 *
 * @param maxResponseTime - Maximum allowed response time in milliseconds
 * @example
 * ```typescript
 * @SLA(5000) // 5 second SLA
 * @Get('complex-report')
 * async generateComplexReport() {
 *   // Must respond within 5 seconds
 * }
 * ```
 */
export const SLA = (maxResponseTime: number) =>
  SetMetadata('sla', maxResponseTime);

/**
 * Decorator to enable request/response logging for routes
 * Adds detailed logging for debugging
 *
 * @param level - Logging level ('debug', 'info', 'warn', 'error')
 * @example
 * ```typescript
 * @LogRequests('debug')
 * @Post('sensitive-operation')
 * async sensitiveOperation() {
 *   // All requests and responses will be logged
 * }
 * ```
 */
export const LogRequests = (level: string = 'info') =>
  SetMetadata('logLevel', level);

/**
 * Decorator to specify custom validation groups for DTOs
 * Enables conditional validation based on context
 *
 * @param groups - Validation groups to apply
 * @example
 * ```typescript
 * @ValidationGroups(['create', 'analytics'])
 * @Post()
 * async createEvent(@Body() dto: CreateAnalyticsEventDto) {
 *   // Uses specific validation groups
 * }
 * ```
 */
export const ValidationGroups = (...groups: string[]) =>
  SetMetadata('validationGroups', groups);

/**
 * Decorator to enable response compression for routes
 * Useful for large response payloads
 *
 * @param level - Compression level (1-9, default: 6)
 * @example
 * ```typescript
 * @CompressResponse(9)
 * @Get('large-dataset')
 * async getLargeDataset() {
 *   // Response will be highly compressed
 * }
 * ```
 */
export const CompressResponse = (level: number = 6) =>
  SetMetadata('compressionLevel', level);
