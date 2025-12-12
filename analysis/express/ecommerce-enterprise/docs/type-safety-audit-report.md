# Type Safety Audit Report

Generated: 2025-12-11T12:33:35.814Z

## Summary

- **Total `any` types found**: 619
- **Files affected**: 172
- **Categories**: 12

## By Category

### Controllers (159 instances)

#### packages/payment-nest/src/modules/payment/controllers/enhanced-streams-demo.controller.ts (108 instances)

- Line 103: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 104: `enableEncryption: (config as any).enableEncryption || false,`
- Line 105: `enableCompression: (config as any).enableCompression || false,`
- Line 106: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 107: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 108: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 109: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 110: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 111: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 112: `retryDelay: (config as any).retryDelay || 1000,`
- Line 113: `timeout: (config as any).timeout || 30000,`
- Line 114: `userId: (config as any).userId,`
- Line 115: `compliance: (config as any).compliance || [],`
- Line 147: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 148: `enableEncryption: (config as any).enableEncryption || false,`
- Line 149: `enableCompression: (config as any).enableCompression || false,`
- Line 150: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 151: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 152: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 153: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 154: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 155: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 156: `retryDelay: (config as any).retryDelay || 1000,`
- Line 157: `timeout: (config as any).timeout || 30000,`
- Line 158: `userId: (config as any).userId,`
- Line 159: `compliance: (config as any).compliance || [],`
- Line 191: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 192: `enableEncryption: (config as any).enableEncryption || false,`
- Line 193: `enableCompression: (config as any).enableCompression || false,`
- Line 194: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 195: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 196: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 197: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 198: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 199: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 200: `retryDelay: (config as any).retryDelay || 1000,`
- Line 201: `timeout: (config as any).timeout || 30000,`
- Line 202: `userId: (config as any).userId,`
- Line 203: `compliance: (config as any).compliance || [],`
- Line 235: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 236: `encryptionKey: Buffer.from((config as any).encryptionKey || 'default-key-32-char...`
- Line 237: `enableIntegrityCheck: (config as any).enableIntegrityCheck !== false,`
- Line 239: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 240: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 241: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 242: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 243: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 244: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 245: `retryDelay: (config as any).retryDelay || 1000,`
- Line 246: `timeout: (config as any).timeout || 30000,`
- Line 247: `userId: (config as any).userId,`
- Line 248: `compliance: (config as any).compliance || [],`
- Line 281: `algorithm: (config as any).algorithm || 'gzip',`
- Line 282: `compressionLevel: (config as any).compressionLevel || 6,`
- Line 283: `enableDictionary: (config as any).enableDictionary !== false,`
- Line 285: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 286: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 287: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 288: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 289: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 290: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 291: `retryDelay: (config as any).retryDelay || 1000,`
- Line 292: `timeout: (config as any).timeout || 30000,`
- Line 293: `userId: (config as any).userId,`
- Line 294: `compliance: (config as any).compliance || [],`
- Line 333: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 334: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 335: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 336: `.forUser((config as any).userId || 'system')`
- Line 337: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 338: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 339: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 340: `.withTimeout((config as any).timeout || 30000)`
- Line 374: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 375: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 376: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 377: `.forUser((config as any).userId || 'system')`
- Line 378: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 379: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 380: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 381: `.withTimeout((config as any).timeout || 30000)`
- Line 415: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 416: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 417: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 418: `.forUser((config as any).userId || 'system')`
- Line 419: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 420: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 421: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 422: `.withTimeout((config as any).timeout || 30000)`
- Line 456: `.withEncryption((config as any).algorithm || 'aes-256-gcm', Buffer.from((config ...`
- Line 457: `.forUser((config as any).userId || 'system')`
- Line 458: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 459: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 460: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 461: `.withTimeout((config as any).timeout || 30000)`
- Line 496: `.withAlgorithm((config as any).algorithm || 'gzip')`
- Line 497: `.withCompressionLevel((config as any).compressionLevel || 6)`
- Line 498: `.forUser((config as any).userId || 'system')`
- Line 499: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 500: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 501: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 502: `.withTimeout((config as any).timeout || 30000)`
- Line 811: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 812: `enableEncryption: (config as any).enableEncryption || false,`
- Line 845: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 846: `enableCompression: (config as any).enableCompression || false,`
- Line 879: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 880: `enableEncryption: (config as any).enableEncryption || false,`

#### packages/payment-nest/src/modules/payment/controllers/dynamic-validation-demo.controller.ts (19 instances)

- Line 30: `customFields: z.record(z.string(), z.any()).optional(),`
- Line 113: `schema: (req as any).user?.role === 'admin' ? AdminPaymentSchema : BasicPaymentS...`
- Line 173: `}) as any,`
- Line 176: `}) as any,`
- Line 178: `} as any)`
- Line 199: `}) as any,`
- Line 200: `'legacy-payment-flow': BasicPaymentSchema as any,`
- Line 201: `} as any)`
- Line 219: `condition: (data) => (data as any).amount > 10000,`
- Line 224: `condition: (data) => (data as any).priority === 'high',`
- Line 229: `condition: (data) => (data as any).customFields !== undefined,`
- Line 261: `context?.user?.role === 'premium' && (data as any).amount > 1000,`
- Line 315: `condition: (data) => (data as any).paymentMethod !== undefined,`
- Line 320: `condition: (data) => (data as any).amount > 1000,`
- Line 332: `condition: (data) => (data as any).currency === 'USD',`
- Line 358: `user: (req as any).user || {`
- Line 405: `(context?.request as any)?.headers?.['content-type']?.includes('application/json...`
- Line 411: `(context?.request as any)?.headers?.['content-type']?.includes('application/xml'...`
- Line 419: `(context?.request as any)?.headers?.['content-type']?.includes('multipart/form-d...`

#### packages/core/src/testing/unit/authController.test.ts (6 instances)

- Line 85: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 178: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 252: `mockRequest.user = undefined as any`
- Line 314: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 325: `mockRequest.user = undefined as any`
- Line 393: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`

#### packages/payment-nest/src/modules/payment/controllers/dx-improved-payment.controller.ts (5 instances)

- Line 48: `metadata: z.record(z.any()).optional(),`
- Line 230: `const decrypted = await (this.simpleCrypto as any).decrypt(`
- Line 231: `(encryptedData as any).data,`
- Line 232: `(encryptedData as any).keyId,`
- Line 266: `.decrypt((encryptedData as any).data as Record<string, unknown>, (encryptedData ...`

#### packages/payment-nest/src/modules/analytics/controllers/analytics.controller.ts (4 instances)

- Line 39: `): Promise<any> {`
- Line 57: `): Promise<any> {`
- Line 79: `): Promise<any> {`
- Line 101: `): Promise<any> {`

#### packages/payment-nest/src/modules/payment/controllers/three-phase-payment.controller.ts (4 instances)

- Line 53: `): Promise<any> {`
- Line 86: `): Promise<any> {`
- Line 119: `): Promise<any> {`
- Line 150: `): Promise<any> {`

#### packages/payment-nest/src/modules/health/controllers/health.controller.ts (3 instances)

- Line 13: `async getHealth(): Promise<any> {`
- Line 21: `async getReadiness(): Promise<any> {`
- Line 28: `async getLiveness(): Promise<any> {`

#### packages/core/src/modules/auth/authController.ts (2 instances)

- Line 46: `const userId = (req as any).user?.userId`
- Line 64: `const userId = (req as any).user?.userId`

#### packages/nest-serverless-api/src/hello.controller.ts (2 instances)

- Line 13: `@UseGuards(TypedJwtAuthGuard as any, RbacGuard)`
- Line 18: `const user = (req as any).user || (req as any).authContext?.user;`

#### packages/payment-nest/src/modules/payment/controllers/decorator-based-validation.controller.ts (2 instances)

- Line 72: `customFields: z.record(z.string(), z.any()).optional(),`
- Line 369: `const userRole = (req as any).user?.role || 'user';`

#### packages/payment-nest/src/modules/payment/controllers/secure-payment.controller.ts (1 instances)

- Line 80: `metadata: z.record(z.any()).optional(),`

#### packages/payment-nest/src/modules/payment/controllers/type-safe-validation-demo.controller.ts (1 instances)

- Line 150: `* the need for `any` assertions while providing full type safety.`

#### packages/service-mesh/src/gateway/mesh-gateway.controller.ts (1 instances)

- Line 39: `data?: any;`

#### packages/shared/src/controllers/shared-validation.controller.ts (1 instances)

- Line 76: `async validateBatch(@Body() data: { validations: Array<{ type: 'user' | 'product...`

### Services (151 instances)

#### packages/nest-compliance/src/services/compliance.service.ts (6 instances)

- Line 219: `async validateCompliance(data: any, context: { type: string; action: string; use...`
- Line 266: `async getComplianceStatus(): Promise<any> {`
- Line 305: `private isPersonalData(data: any): boolean {`
- Line 309: `private isFinancialData(data: any): boolean {`
- Line 313: `private isHealthData(data: any): boolean {`
- Line 354: `private async logComplianceEvent(event: string, data: any, context: any): Promis...`

#### packages/service-mesh/src/decorators/service-call.decorator.ts (6 instances)

- Line 26: `return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {`
- Line 29: `descriptor.value = async function (...args: any[]) {`
- Line 31: `const serviceMeshService = (this as any).serviceMeshService;`
- Line 55: `if (options.fallback && typeof (this as any)[options.fallback] === 'function') {`
- Line 56: `(this as any).logger?.warn(`Service call failed, using fallback: ${error instanc...`
- Line 57: `return (this as any)[options.fallback](...args);`

#### packages/shared/src/validation/shared-validation.service.ts (6 instances)

- Line 35: `metadata: z.record(z.any()).optional(),`
- Line 73: `metadata: z.record(z.any()).optional(),`
- Line 88: `metadata: z.record(z.any()).optional(),`
- Line 128: `metadata: z.record(z.any()).optional(),`
- Line 141: `changes: z.record(z.any()).optional(),`
- Line 145: `metadata: z.record(z.any()).optional(),`

#### packages/core/src/validation/enterprise-validation.service.ts (5 instances)

- Line 123: `customErrorMap: errorMap as any,`
- Line 144: `customErrorMap: errorMap as any,`
- Line 165: `customErrorMap: errorMap as any,`
- Line 186: `customErrorMap: errorMap as any,`
- Line 207: `customErrorMap: errorMap as any,`

#### packages/enterprise-demo/src/validation/enterprise-demo-validation.service.ts (5 instances)

- Line 160: `customErrorMap: errorMap as any,`
- Line 180: `customErrorMap: errorMap as any,`
- Line 200: `customErrorMap: errorMap as any,`
- Line 220: `customErrorMap: errorMap as any,`
- Line 240: `customErrorMap: errorMap as any,`

#### packages/nest-compliance/src/services/gdpr.service.ts (5 instances)

- Line 160: `async generateComplianceReport(period: { start: Date; end: Date }): Promise<any>...`
- Line 187: `private async encryptData(data: Record<string, any>): Promise<Record<string, any...`
- Line 193: `const encrypted: Record<string, any> = {};`
- Line 205: `private async collectUserData(_userId: string): Promise<Record<string, any>> {`
- Line 225: `private async preparePortableData(userId: string): Promise<Record<string, any>> ...`

#### packages/nest-database/src/database.service.ts (5 instances)

- Line 24: `async query<T = any>(sql: string, parameters?: any[]): Promise<T[]> {`
- Line 56: `async transaction<T>(fn: (manager: any) => Promise<T>): Promise<T> {`
- Line 73: `async getConnectionStats(): Promise<any> {`
- Line 77: `async getQueryStats(): Promise<any> {`
- Line 81: `async getMetrics(): Promise<any> {`

#### packages/nest-dev-tools/src/generation/code-generator.service.ts (5 instances)

- Line 40: `findAll(@Query() query: any): string {`
- Line 50: `create(@Body() create${name}Dto: any): string {`
- Line 55: `update(@Param('id') id: string, @Body() update${name}Dto: any): string {`
- Line 80: `create(create${name}Dto: any): string {`
- Line 84: `update(id: string, update${name}Dto: any): string {`

#### packages/nest-disaster-recovery/src/validation/disaster-recovery-validation.service.ts (5 instances)

- Line 221: `customErrorMap: errorMap as any,`
- Line 241: `customErrorMap: errorMap as any,`
- Line 261: `customErrorMap: errorMap as any,`
- Line 281: `customErrorMap: errorMap as any,`
- Line 301: `customErrorMap: errorMap as any,`

#### packages/nest-event-streaming/src/services/rabbitmq.service.ts (5 instances)

- Line 18: `private connection: any = null;`
- Line 19: `private channel: any = null;`
- Line 165: `await this.channel.consume(queue.queue, async (msg: any) => {`
- Line 236: `private async retryHandler(handler: EventHandler, message: EventMessage, _error:...`
- Line 258: `private async sendToDeadLetterQueue(queue: string, message: EventMessage, error:...`

#### packages/nest-mobile-apis/src/services/mobile-api.service.ts (5 instances)

- Line 197: `async setOfflineData(data: any, userId: string): Promise<void> {`
- Line 250: `credentials: any,`
- Line 260: `async encryptData(data: any, key?: string): Promise<string> {`
- Line 264: `async decryptData(encryptedData: string, key?: string): Promise<any> {`
- Line 309: `optimized.images = optimized.images.map((img: any) => ({`

#### packages/nest-mobile-apis/src/services/mobile-optimization.service.ts (5 instances)

- Line 16: `private imageCache: any;`
- Line 243: `async compressData(data: any): Promise<Buffer> {`
- Line 250: `zlib.gzip(buffer, (err: any, compressed: Buffer) => {`
- Line 260: `async decompressData(compressedBuffer: Buffer): Promise<any> {`
- Line 263: `zlib.gunzip(compressedBuffer, (err: any, decompressed: Buffer) => {`

#### packages/nest-mobile-apis/src/services/mobile-security.service.ts (5 instances)

- Line 199: `async encryptData(data: any, key?: string): Promise<string> {`
- Line 207: `async decryptData(encryptedData: string, key?: string): Promise<any> {`
- Line 250: `credentials: any,`
- Line 285: `private signToken(payload: any): string {`
- Line 299: `private verifyToken(token: string): any {`

#### packages/nest-mobile-apis/src/validation/mobile-validation.service.ts (5 instances)

- Line 188: `customErrorMap: errorMap as any,`
- Line 210: `customErrorMap: errorMap as any,`
- Line 232: `customErrorMap: errorMap as any,`
- Line 253: `customErrorMap: errorMap as any,`
- Line 274: `customErrorMap: errorMap as any,`

#### packages/node-crypto/src/nestjs/crypto.service.ts (5 instances)

- Line 19: `async encrypt(data: Buffer, key: Buffer, options: any = {}) {`
- Line 23: `async decrypt(encryptedData: any, key: Buffer) {`
- Line 29: `return this.cryptoService.generateKeyPair(algorithm as any);`
- Line 33: `return this.cryptoService.generateSecretKey(algorithm as any);`
- Line 45: `getAuditLog(filter?: any) {`

#### packages/authx/src/services/rebac.service.ts (4 instances)

- Line 23: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`
- Line 38: `await (this.client as any).sadd(k, tuple.subject);`
- Line 49: `await (this.client as any).srem(k, tuple.subject);`
- Line 58: `const exists = await (this.client as any).sismember(k, subject);`

#### packages/nest-disaster-recovery/src/services/disaster-recovery.service.ts (4 instances)

- Line 21: `async getOverallStatus(): Promise<any> {`
- Line 37: `private calculateOverallHealth(backupStats: any, restoreStats: any, drMetrics: a...`
- Line 200: `async testDisasterRecovery(planId: string, testType: 'tabletop' | 'simulation' |...`
- Line 257: `async generateDisasterRecoveryReport(): Promise<any> {`

#### packages/nest-mobile-apis/src/services/mobile-caching.service.ts (4 instances)

- Line 16: `private offlineCache: any;`
- Line 17: `private memoryCache: any;`
- Line 201: `.filter(data => (data as any)?.syncStatus === 'pending').length;`
- Line 228: `async warmupCache(keys: string[], dataFetcher: (key: string) => Promise<any>): P...`

#### packages/nest-orm/src/services/multi-orm.service.ts (4 instances)

- Line 46: `async query<T = any>(query: DatabaseQuery<T>): Promise<QueryResult<T>> {`
- Line 98: `async transaction<T = any>(`
- Line 106: `const result = await this.executeTransaction<any>(provider, queries, options);`
- Line 239: `private async executeTransaction<T = any>(`

#### packages/authx/src/services/oidc.service.ts (3 instances)

- Line 7: `constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}`
- Line 22: `const params: AuthorizationParameters = { scope: 'openid email profile', code_ch...`
- Line 23: `if (state !== undefined) (params as any).state = state as string;`

#### packages/nest-disaster-recovery/src/services/backup.service.ts (3 instances)

- Line 195: `private async collectBackupData(config: BackupConfig): Promise<{ data: Buffer; s...`
- Line 231: `private async uploadToDestination(backupData: any, destResult: BackupDestination...`
- Line 340: `async getBackupStatistics(): Promise<any> {`

#### packages/nest-event-streaming/src/services/kafka.service.ts (3 instances)

- Line 60: `sasl: this.config.kafka.sasl as any,`
- Line 238: `private async retryHandler(handler: EventHandler, message: EventMessage, _error:...`
- Line 260: `private async sendToDeadLetterQueue(queue: string, message: EventMessage, error:...`

#### packages/nest-multi-region/src/services/data-replication.service.ts (3 instances)

- Line 72: `data: any,`
- Line 198: `versions: { region: string; data: any; timestamp: Date }[]`
- Line 233: `finalData: any`

#### packages/node-crypto/src/__tests__/crypto.service.test.ts (3 instances)

- Line 313: `await expect(cryptoService.encrypt(null as any, key.key))`
- Line 321: `await expect(cryptoService.decrypt(null as any, key.key))`
- Line 329: `await expect(cryptoService.encrypt(data, null as any))`

#### packages/node-streams/src/nestjs/streams.service.ts (3 instances)

- Line 205: `async createMergerStream(config: StreamMergerConfig): Promise<any> {`
- Line 291: `async getConfig(): Promise<any> {`
- Line 304: `async getHealthStatus(): Promise<any> {`

#### packages/payment-nest/src/modules/health/services/health.service.ts (3 instances)

- Line 8: `async getHealth(): Promise<any> {`
- Line 31: `async getReadiness(): Promise<any> {`
- Line 61: `async getLiveness(): Promise<any> {`

#### packages/payment-nest/src/modules/payment/__tests__/secure-payment.service.test.ts (3 instances)

- Line 452: `} as any;`
- Line 460: `await expect(service.encryptPaymentData(null as any))`
- Line 466: `await expect(service.encryptPaymentData(undefined as any))`

#### packages/payment-nest/src/modules/payment/services/secure-payment.service.ts (3 instances)

- Line 178: `getPerformanceMetrics(): Record<string, any> {`
- Line 240: `metadata?: Record<string, any>;`
- Line 474: `async getPaymentPerformanceMetrics(): Promise<any> {`

#### packages/payment-nest/src/modules/payment/services/three-phase-payment.service.ts (3 instances)

- Line 55: `metadata: Record<string, any>;`
- Line 59: `data?: Record<string, any>;`
- Line 71: `metadata: Record<string, any>;`

#### packages/authx/src/services/jwt.service.ts (2 instances)

- Line 22: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`
- Line 107: `if (email !== undefined) (base as any).email = email;`

#### packages/authx/src/services/webauthn.service.ts (2 instances)

- Line 6: `constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}`
- Line 14: `generateAuthentication(allowCredentials: { id: string; transports?: any[] }[]) {`

#### packages/enterprise-integration/src/services/sap.service.ts (2 instances)

- Line 93: `async queryOData(entitySet: string, filters?: Record<string, any>, options?: {`
- Line 98: `}): Promise<any[]> {`

#### packages/nest-microservices-demo/src/client/client.grpc.ts (2 instances)

- Line 13: `const pkg = loadPackageDefinition(packageDef) as unknown as { demo: { Demo: new ...`
- Line 21: `function callUnary<TReq, TRes>(client: any, method: string, req: TReq): Promise<...`

#### packages/nest-multi-region/src/services/region-manager.service.ts (2 instances)

- Line 249: `private async simulateHealthCheck(_region: RegionConfig): Promise<any> {`
- Line 326: `private emitEvent(type: RegionEvent['type'], regionId: string, data: any): void ...`

#### packages/service-mesh/src/service-mesh.module.ts (2 instances)

- Line 48: `useFactory: (...args: any[]) => Promise<ServiceMeshOptions> | ServiceMeshOptions...`
- Line 49: `inject?: any[];`

#### packages/authx/src/services/decision-audit.service.ts (1 instances)

- Line 6: `principal?: any;`

#### packages/authx/src/services/otp.service.ts (1 instances)

- Line 33: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`

#### packages/authx/src/services/policy.service.ts (1 instances)

- Line 6: `type PolicyPredicate = (ctx: { principal: any; req: any }) => boolean | Promise<...`

#### packages/authx/src/services/session.store.ts (1 instances)

- Line 12: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`

#### packages/authx/src/services/tenant.service.ts (1 instances)

- Line 5: `resolve(req: any): string {`

#### packages/core/src/testing/unit/productService.test.ts (1 instances)

- Line 78: `await productService.createProduct(invalidProductData as any)`

#### packages/nest-dev-tools/src/debugging/debug.service.ts (1 instances)

- Line 7: `logRequest(method: string, url: string, body?: any): void {`

#### packages/nest-disaster-recovery/src/services/disaster-recovery-plan.service.ts (1 instances)

- Line 395: `async getDRMetrics(): Promise<any> {`

#### packages/nest-disaster-recovery/src/services/restore.service.ts (1 instances)

- Line 174: `async getRestoreStatistics(): Promise<any> {`

#### packages/nest-zod/src/services/schema-registry.service.ts (1 instances)

- Line 166: `throw new Error(`Schema '${name}' not found in any version`);`

#### packages/payment-nest/src/modules/payment/services/fraud-detection.service.ts (1 instances)

- Line 560: `private async getRecentTransactions(userId: string, email: string, hours: number...`

#### packages/payment-nest/src/modules/payment/services/payment-monitoring.service.ts (1 instances)

- Line 126: `metadata?: Record<string, any>;`

#### packages/payment-nest/src/shared/queue/queue.service.ts (1 instances)

- Line 34: `async getQueueStats(): Promise<any> {`

#### packages/service-mesh/src/interfaces/service-instance.interface.ts (1 instances)

- Line 9: `metadata?: Record<string, any>;`

#### packages/service-mesh/src/interfaces/service-mesh-options.interface.ts (1 instances)

- Line 75: `metadata?: Record<string, any>;`

### Other (146 instances)

#### packages/core/src/testing/unit/responseWrapper.test.ts (42 instances)

- Line 43: `timestamp: expect.any(String),`
- Line 46: `environment: expect.any(String)`
- Line 66: `timestamp: expect.any(String),`
- Line 69: `environment: expect.any(String)`
- Line 87: `timestamp: expect.any(String),`
- Line 90: `environment: expect.any(String)`
- Line 108: `timestamp: expect.any(String),`
- Line 111: `environment: expect.any(String)`
- Line 129: `timestamp: expect.any(String),`
- Line 132: `environment: expect.any(String)`
- Line 154: `timestamp: expect.any(String),`
- Line 159: `environment: expect.any(String)`
- Line 176: `timestamp: expect.any(String),`
- Line 181: `environment: expect.any(String)`
- Line 199: `timestamp: expect.any(String),`
- Line 204: `environment: expect.any(String)`
- Line 221: `timestamp: expect.any(String),`
- Line 226: `environment: expect.any(String)`
- Line 242: `timestamp: expect.any(String),`
- Line 247: `environment: expect.any(String)`
- Line 261: `timestamp: expect.any(String),`
- Line 266: `environment: expect.any(String)`
- Line 288: `timestamp: expect.any(String),`
- Line 296: `environment: expect.any(String)`
- Line 313: `timestamp: expect.any(String),`
- Line 318: `environment: expect.any(String)`
- Line 334: `timestamp: expect.any(String),`
- Line 339: `environment: expect.any(String)`
- Line 353: `timestamp: expect.any(String),`
- Line 358: `environment: expect.any(String)`
- Line 374: `timestamp: expect.any(String),`
- Line 379: `environment: expect.any(String)`
- Line 393: `timestamp: expect.any(String),`
- Line 398: `environment: expect.any(String)`
- Line 414: `timestamp: expect.any(String),`
- Line 419: `environment: expect.any(String)`
- Line 437: `timestamp: expect.any(String),`
- Line 442: `environment: expect.any(String)`
- Line 458: `timestamp: expect.any(String),`
- Line 463: `environment: expect.any(String)`
- Line 477: `timestamp: expect.any(String),`
- Line 482: `environment: expect.any(String)`

#### packages/nest-zod/examples/advanced-performance-example.ts (14 instances)

- Line 94: `async (data: any) => {`
- Line 101: `(data: any) => data.age >= 18 && data.age <= 120,`
- Line 115: `filters: z.record(z.string(), z.any()).optional(),`
- Line 120: `(data: any) => !data.price || (data.price >= 0 && data.price <= 10000),`
- Line 135: `async validateUser(@Body() userData: any) {`
- Line 179: `async validateUsersBatch(@Body() usersData: any[]) {`
- Line 222: `async validateMixedEntities(@Body() entitiesData: any[]) {`
- Line 227: `const schemaSelector = (entity: any) => {`
- Line 257: `async validateOrderPipeline(@Body() orderData: any) {`
- Line 268: `condition: (data: any) => data.userId !== undefined,`
- Line 273: `condition: (data: any) => data.products && data.products.length > 0,`
- Line 278: `condition: (data: any) => data.total > 0,`
- Line 281: `products: z.array(z.any()).min(1),`
- Line 309: `async createEnhancedUser(@Body() userData: any) {`

#### packages/node-crypto/examples/dx-improvement.example.ts (13 instances)

- Line 26: `private auditLog: any[] = [];`
- Line 28: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 111: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 165: `getPerformanceMetrics(): any {`
- Line 195: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 205: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 214: `async getPerformanceMetrics(): Promise<any> {`
- Line 230: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 241: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 250: `async generatePaymentKey(): Promise<any> {`
- Line 277: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 288: `async decryptPaymentData(encryptedData: string): Promise<any> {`
- Line 300: `async generatePaymentKey(): Promise<any> {`

#### packages/nest-zod/demo/debug-whitelist.ts (7 instances)

- Line 26: `console.log('Schema _def:', (UserSchema as any)._def);`
- Line 27: `console.log('Schema _def.shape:', (UserSchema as any)._def.shape);`
- Line 28: `console.log('Schema keys:', Object.keys((UserSchema as any)._def.shape));`
- Line 32: `if (schema._def && (schema._def as any).shape) {`
- Line 33: `return Object.keys((schema._def as any).shape);`
- Line 38: `function filterProperties(data: any, allowedProperties: string[]): any {`
- Line 43: `const result: any = {};`

#### packages/nest-zod/examples/monitoring-observability-example.ts (7 instances)

- Line 219: `async validateUserMonitored(@Body() userData: any) {`
- Line 298: `async validateBatchMonitored(@Body() data: { items: any[]; schemaName: string })...`
- Line 364: `} as any);`
- Line 425: `async validateCached(@Body() data: { userData: any; useCache: boolean }) {`
- Line 596: `async searchTraces(@Query() query: any) {`
- Line 604: `async getLogs(@Query() query: any) {`
- Line 683: `async updateMonitoringConfig(@Body() config: any) {`

#### packages/core/src/testing/integration/auth.integration.test.ts (6 instances)

- Line 22: `accessToken: expect.any(String),`
- Line 23: `refreshToken: expect.any(String),`
- Line 24: `expiresIn: expect.any(Number)`
- Line 54: `accessToken: expect.any(String),`
- Line 55: `refreshToken: expect.any(String),`
- Line 56: `expiresIn: expect.any(Number)`

#### packages/core/src/testing/setup.ts (6 instances)

- Line 90: `const res = {} as any`
- Line 98: `export const expectError = async (fn: () => Promise<any>, expectedMessage: strin...`
- Line 134: `export const measurePerformance = async (fn: () => Promise<any>, iterations = 10...`
- Line 151: `export const loadTest = async (fn: () => Promise<any>, concurrency = 10, duratio...`
- Line 153: `const results: any[] = []`
- Line 191: `export const testInputValidation = async (validator: (input: any) => boolean, va...`

#### packages/payment-nest/demo/secure-payment-demo.ts (5 instances)

- Line 137: `console.log(`     Calls: ${(metric as any).callCount || 0}`);`
- Line 138: `console.log(`     Avg Duration: ${((metric as any).averageDuration || 0).toFixed...`
- Line 139: `console.log(`     Min Duration: ${((metric as any).minDuration || 0).toFixed(2)}...`
- Line 140: `console.log(`     Max Duration: ${((metric as any).maxDuration || 0).toFixed(2)}...`
- Line 141: `console.log(`     Data Processed: ${(metric as any).totalDataSize || 0} bytes`);`

#### packages/nest-compliance/src/interfaces/compliance.interface.ts (4 instances)

- Line 78: `data: Record<string, any>;`
- Line 111: `details: Record<string, any>;`
- Line 126: `data: Record<string, any>;`
- Line 128: `responseData?: Record<string, any>;`

#### packages/nest-multi-region/src/interfaces/multi-region.interface.ts (4 instances)

- Line 52: `data: any;`
- Line 143: `data: any;`
- Line 150: `finalData: any;`
- Line 175: `data: any;`

#### packages/core/src/monitoring/health.ts (3 instances)

- Line 25: `details?: Record<string, any>`
- Line 385: `async liveness(_req: any, res: any) {`
- Line 409: `async readiness(_req: any, res: any) {`

#### packages/nest-cli/src/commands/test.command.ts (3 instances)

- Line 17: `.action(async (options: any) => {`
- Line 33: `.action(async (options: any) => {`
- Line 48: `.action(async (options: any) => {`

#### packages/node-crypto/src/__tests__/nestjs.integration.test.ts (3 instances)

- Line 47: `async decryptData(@Body() encryptedData: any) {`
- Line 247: `const invalidData = null as any;`
- Line 257: `const invalidEncryptedData = null as any;`

#### packages/core/src/monitoring/metrics.ts (2 instances)

- Line 291: `return (req: any, res: any, next: any) => {`
- Line 296: `res.end = function(chunk?: any, encoding?: any) {`

#### packages/core/src/swagger/SwaggerBuilder.ts (2 instances)

- Line 64: `addZodSchema(name: string, zodSchema: any): this {`
- Line 85: `addSecuritySchemes(schemes: Record<string, any>): this {`

#### packages/core/src/testing/unit/logger.test.ts (2 instances)

- Line 130: `logger.info(null as any)`
- Line 138: `logger.info(undefined as any)`

#### packages/nest-cli/src/commands/build.command.ts (2 instances)

- Line 16: `.action(async (options: any) => {`
- Line 31: `.action(async (options: any) => {`

#### packages/nest-database/src/monitoring/query-profiler.ts (2 instances)

- Line 8: `parameters?: any[];`
- Line 18: `startQuery(id: string, query: string, parameters?: any[]): void {`

#### packages/nest-disaster-recovery/src/interfaces/disaster-recovery.interface.ts (2 instances)

- Line 138: `parameters?: Record<string, any>;`
- Line 263: `config: Record<string, any>;`

#### packages/nest-event-streaming/src/interfaces/event-streaming.interface.ts (2 instances)

- Line 42: `data: any;`
- Line 52: `headers?: Record<string, any>;`

#### packages/analytics/src/main.ts (1 instances)

- Line 26: `}) as any,`

#### packages/analytics-sdk/src/index.ts (1 instances)

- Line 17: `const res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers: { ......`

#### packages/enterprise-integration/src/adapters/sap.adapter.ts (1 instances)

- Line 135: `async updateODataEntity(entitySet: string, key: string, data: Record<string, any...`

#### packages/enterprise-integration/src/interfaces/enterprise-options.interface.ts (1 instances)

- Line 132: `data: Record<string, any>;`

#### packages/nest-cache/src/interfaces/cache-options.interface.ts (1 instances)

- Line 9: `options?: any;`

#### packages/nest-cache/src/interfaces/cache-store.interface.ts (1 instances)

- Line 1: `export interface CacheEntry<T = any> {`

#### packages/nest-cache/src/stores/compressed.store.ts (1 instances)

- Line 36: `await this.store.set(key, value as any, ttl);`

#### packages/nest-cache/src/stores/encrypted.store.ts (1 instances)

- Line 45: `await this.store.set(key, value as any, ttl);`

#### packages/nest-cache/src/stores/redis-cluster.store.ts (1 instances)

- Line 329: `return await (this.redis as any).srem(fullKey, ...members);`

#### packages/nest-cli/src/cli.ts (1 instances)

- Line 11: `const program = new (commander as any).Command();`

#### packages/nest-enterprise-rbac/src/tokens.ts (1 instances)

- Line 2: `export type RbacUserSelector = (req: any) => { roles?: string[]; permissions?: s...`

#### packages/nest-mobile-apis/src/interfaces/mobile-api.interface.ts (1 instances)

- Line 130: `data: any;`

#### packages/nest-serverless-api/src/main.ts (1 instances)

- Line 16: `const app = await NestFactory.create(AppModule, adapter as any);`

#### packages/node-crypto/src/apis/crypto-api.ts (1 instances)

- Line 86: `* 🔐 Encrypt any data with a single method call`

#### packages/payment-nest/src/main.ts (1 instances)

- Line 18: `}) as any,`

### Utils (40 instances)

#### packages/core/src/utils/responseWrapper.ts (5 instances)

- Line 14: `export interface ApiResponse<T = any> {`
- Line 28: `details?: Record<string, any> | undefined`
- Line 60: `details?: Record<string, any>`
- Line 95: `details: Record<string, any>`
- Line 133: `details?: Record<string, any>`

#### packages/nest-dev-tools/src/testing/test-utils.ts (4 instances)

- Line 6: `static async createTestingModule(module: any): Promise<TestingModule> {`
- Line 10: `static async createNestApplication(module: any): Promise<INestApplication> {`
- Line 15: `static async makeRequest(app: INestApplication, method: string, url: string, dat...`
- Line 16: `const agent = (request as any)(app.getHttpServer());`

#### packages/notification/src/utils/logger.ts (4 instances)

- Line 67: `export const logInfo = (message: string, meta?: any) => logger.info(message, met...`
- Line 68: `export const logError = (message: string, meta?: any) => logger.error(message, m...`
- Line 69: `export const logWarn = (message: string, meta?: any) => logger.warn(message, met...`
- Line 70: `export const logDebug = (message: string, meta?: any) => logger.debug(message, m...`

#### packages/core/src/utils/events.ts (3 instances)

- Line 5: `export const createEventEmitter = <T extends Record<string, any>>() => {`
- Line 13: `listeners.get(event)!.push(listener as any)`
- Line 26: `const index = eventListeners.indexOf(listener as any)`

#### packages/nest-cache/src/utils/cache-compression.ts (3 instances)

- Line 8: `static async compress(data: any): Promise<Buffer> {`
- Line 13: `static async decompress(compressed: Buffer): Promise<any> {`
- Line 18: `static shouldCompress(data: any, threshold: number = 1024): boolean {`

#### packages/nest-zod/src/utils/dynamic-validation.ts (3 instances)

- Line 133: `'Data does not match any conditional validation rules'`
- Line 141: `return z.any().transform(async (data) => {`
- Line 264: `* Custom condition with any check`

#### packages/core/src/modules/auth/authUtils.ts (2 instances)

- Line 74: `export const sanitizeUser = (user: any): any => {`
- Line 93: `export const createUser = (data: any): any => {`

#### packages/core/src/modules/product/productUtils.ts (2 instances)

- Line 139: `let aValue: any = a[sortBy as keyof Product]`
- Line 140: `let bValue: any = b[sortBy as keyof Product]`

#### packages/core/src/utils/container.ts (2 instances)

- Line 6: `const services = new Map<string, any>()`
- Line 7: `const factories = new Map<string, () => any>()`

#### packages/nest-cache/src/utils/cache-encryption.ts (2 instances)

- Line 11: `async encrypt(data: any): Promise<string> {`
- Line 20: `async decrypt(encryptedData: string): Promise<any> {`

#### packages/nest-database/src/utils/connection-pool.ts (2 instances)

- Line 26: `async getConnection(): Promise<any> {`
- Line 30: `async releaseConnection(connection: any): Promise<void> {`

#### packages/nest-enterprise-auth/src/refresh/refresh-helpers.ts (2 instances)

- Line 68: `} as any;`
- Line 69: `return { name, strategy: JwtStrategy as any, options };`

#### packages/nest-zod/src/testing/schema-testing.utils.ts (2 instances)

- Line 289: `schema = (schema as z.ZodObject<any>).extend({`
- Line 297: `schema = (schema as z.ZodObject<any>).extend({`

#### packages/core/src/utils/functional.ts (1 instances)

- Line 28: `export const memoize = <T extends any[], R>(`

#### packages/core/src/utils/helpers.ts (1 instances)

- Line 79: `export const groupBy = <T, K extends keyof any>(array: T[], key: (item: T) => K)...`

#### packages/core/src/utils/responseTransformers.ts (1 instances)

- Line 34: `filters: Record<string, any>`

#### packages/nest-zod/src/utils/zod-schemas.ts (1 instances)

- Line 190: `* Create a schema that validates against any of the provided schemas`

### Middleware (37 instances)

#### packages/core/src/testing/unit/authMiddleware.test.ts (14 instances)

- Line 24: `let mockRequest: Partial<Request> & { user?: any }`
- Line 52: `mockJwt.verify.mockReturnValue(mockUser as any)`
- Line 59: `expect((mockRequest as any).user).toEqual(mockUser)`
- Line 129: `expect((mockRequest as any).user).toBeUndefined()`
- Line 150: `expect((mockRequest as any).user).toBeUndefined()`
- Line 171: `expect((mockRequest as any).user).toBeUndefined()`
- Line 193: `expect((mockRequest as any).user).toBeUndefined()`
- Line 201: `;(mockRequest as any).user = mockUser`
- Line 216: `;(mockRequest as any).user = mockUser`
- Line 231: `;(mockRequest as any).user = mockUser`
- Line 245: `;(mockRequest as any).user = undefined`
- Line 260: `;(mockRequest as any).user = mockUser`
- Line 275: `;(mockRequest as any).user = mockUser`
- Line 290: `;(mockRequest as any).user = mockUser`

#### packages/core/src/testing/unit/validationMiddleware.test.ts (12 instances)

- Line 79: `details: expect.any(Array)`
- Line 101: `details: expect.any(Array)`
- Line 119: `details: expect.any(Array)`
- Line 138: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`
- Line 193: `details: expect.any(Array)`
- Line 215: `details: expect.any(Array)`
- Line 233: `details: expect.any(Array)`
- Line 252: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`
- Line 300: `details: expect.any(Array)`
- Line 322: `details: expect.any(Array)`
- Line 340: `details: expect.any(Array)`
- Line 359: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`

#### packages/core/src/swagger/SwaggerMiddleware.ts (4 instances)

- Line 22: `setup: (_swaggerSpec: any) => {`
- Line 138: `schema: zodToOpenAPI(schema) as any`
- Line 159: `schema: zodToOpenAPI(schema) as any`
- Line 186: `schema: zodToOpenAPI(schema) as any`

#### packages/core/src/middleware/auth.ts (2 instances)

- Line 21: `;(req as any).user = user`
- Line 31: `const user = (req as any).user`

#### packages/core/src/middleware/validation.ts (2 instances)

- Line 32: `export const validateQuery = <T extends any>(schema: T) => {`
- Line 35: `const result = (schema as any).parse(req.query)`

#### packages/notification/src/middleware/requestLogger.ts (2 instances)

- Line 22: `res.end = function(chunk?: any, encoding?: any): any {`
- Line 56: `res.send = function(body: any) {`

#### packages/analytics/src/shared/middleware/analytics-logger.middleware.ts (1 instances)

- Line 25: `res.end = function(chunk?: any, encoding?: any): any {`

### Modules (34 instances)

#### packages/nest-event-streaming/src/event-streaming.module.ts (5 instances)

- Line 77: `imports?: any[];`
- Line 78: `useFactory: (...args: any[]) => Promise<EventStreamingModuleOptions> | EventStre...`
- Line 79: `inject?: any[];`
- Line 84: `useFactory: async (...args: any[]) => {`
- Line 92: `useFactory: async (...args: any[]) => {`

#### packages/nest-cache/src/cache.module.ts (4 instances)

- Line 50: `useFactory: (store: any) => new CompressedStore(store),`
- Line 58: `useFactory: (store: any) => new EncryptedStore(store, options.encryption?.key),`
- Line 71: `useFactory: (...args: any[]) => Promise<CacheOptions> | CacheOptions;`
- Line 72: `inject?: any[];`

#### packages/authx/src/module/authx.module.ts (3 instances)

- Line 27: `imports?: any[];`
- Line 28: `inject?: any[];`
- Line 29: `useFactory: (...args: any[]) => Promise<AuthXModuleOptions> | AuthXModuleOptions...`

#### packages/enterprise-integration/src/enterprise-integration.module.ts (3 instances)

- Line 41: `imports?: any[];`
- Line 42: `useFactory: (...args: any[]) => Promise<EnterpriseIntegrationOptions> | Enterpri...`
- Line 43: `inject?: any[];`

#### packages/nest-orm/src/nest-orm.module.ts (3 instances)

- Line 44: `imports?: any[];`
- Line 45: `useFactory: (...args: any[]) => Promise<ORMOptions> | ORMOptions;`
- Line 46: `inject?: any[];`

#### packages/analytics/src/modules/analytics/shared/rate-limit/memory-rate-limit.storage.spec.ts (2 instances)

- Line 27: `resetTime: expect.any(Number),`
- Line 75: `resetTime: expect.any(Number),`

#### packages/core/src/modules/product/productSchemas.ts (2 instances)

- Line 84: `data: z.any(),`
- Line 96: `products: z.array(z.any()),`

#### packages/nest-database/src/database.module.ts (2 instances)

- Line 50: `useFactory: (...args: any[]) => Promise<DatabaseOptions> | DatabaseOptions;`
- Line 51: `inject?: any[];`

#### packages/nest-enterprise-auth/src/module/enterprise-auth.module.ts (2 instances)

- Line 26: `providers: providers as any[],`
- Line 27: `exports: providers as any[],`

#### packages/nest-mobile-apis/src/mobile-api.module.ts (2 instances)

- Line 57: `store: redisStore as any,`
- Line 60: `} as any;`

#### packages/analytics/src/modules/analytics/shared/rate-limit/rate-limit.module.ts (1 instances)

- Line 28: `return new RedisRateLimitStorage(configService.get('redis') as any);`

#### packages/core/src/modules/auth/authResponseHandler.ts (1 instances)

- Line 12: `export const createSuccessResponse = (res: Response, data: any, message: string,...`

#### packages/core/src/modules/auth/authRoutes.ts (1 instances)

- Line 21: `const createAuthRoute = (path: string, method: 'get' | 'post' | 'put' | 'delete'...`

#### packages/core/src/modules/product/productRoutes.ts (1 instances)

- Line 23: `const createProductRoute = (path: string, method: 'get' | 'post' | 'put' | 'dele...`

#### packages/node-crypto/src/nestjs/crypto.module.ts (1 instances)

- Line 12: `config?: any;`

#### packages/payment-nest/src/modules/payment/strategies/refresh.strategy.ts (1 instances)

- Line 25: `validate(payload: any) {`

### Interceptors (16 instances)

#### packages/nest-mobile-apis/src/interceptors/mobile-optimization.interceptor.ts (4 instances)

- Line 28: `async intercept(context: ExecutionContext, next: CallHandler): Promise<Observabl...`
- Line 78: `private hasImages(data: any): boolean {`
- Line 84: `data: any,`
- Line 87: `): Promise<any> {`

#### packages/nest-compliance/src/interceptors/compliance.interceptor.ts (3 instances)

- Line 17: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 63: `private async logComplianceEvent(type: 'success' | 'error', event: any): Promise...`
- Line 83: `private sanitizeData(data: any): any {`

#### packages/nest-mobile-apis/src/interceptors/mobile-api.interceptor.ts (3 instances)

- Line 32: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 107: `const message = error instanceof HttpException ? (error.getResponse() as any)?.m...`
- Line 136: `private extractDeviceInfo(request: any): MobileDeviceInfo {`

#### packages/nest-database/src/interceptors/query-profile.interceptor.ts (2 instances)

- Line 23: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 40: `tap((_result: any) => {`

#### packages/nest-mobile-apis/src/interceptors/auth-context.interceptor.ts (2 instances)

- Line 6: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 7: `const request = context.switchToHttp().getRequest<any>();`

#### packages/nest-mobile-apis/src/interceptors/mobile-cache.interceptor.ts (2 instances)

- Line 19: `async intercept(context: ExecutionContext, next: CallHandler): Promise<Observabl...`
- Line 73: `private generateCacheKey(request: any, options: MobileCacheOptions): string {`

### Types (15 instances)

#### packages/nest-zod/src/decorators/type-safe-validation.decorator.ts (6 instances)

- Line 93: `return function (target: any) {`
- Line 112: `return function (target: any, propertyKey: string, _descriptor: PropertyDescript...`
- Line 132: `return function (target: any, propertyKey: string, descriptor: PropertyDescripto...`
- Line 264: `return function (_target: any, _propertyKey: string, descriptor: PropertyDescrip...`
- Line 327: `return function (_target: any, _propertyKey: string, descriptor: PropertyDescrip...`
- Line 371: `return function (target: any, propertyKey: string, descriptor: PropertyDescripto...`

#### packages/nest-zod/src/utils/type-safe-schema-composition.ts (2 instances)

- Line 113: `required(): TypeSafeSchemaComposer<z.ZodObject<any>> {`
- Line 118: `const newSchema = this.schema.required() as z.ZodObject<any>;`

#### packages/core/src/swagger/types.ts (1 instances)

- Line 74: `example?: any`

#### packages/nest-zod/examples/type-safe-usage.example.ts (1 instances)

- Line 5: `* that eliminate the need for `any` assertions while maintaining`

#### packages/node-streams/src/types/streams-custom.types.ts (1 instances)

- Line 4: `* Comprehensive type definitions to replace all 'any' types`

#### packages/payment-nest/demo/type-safe-validation-demo.ts (1 instances)

- Line 407: `console.log('✅ Zero `any` assertions');`

#### packages/payment-nest/src/types/payment-custom.types.ts (1 instances)

- Line 4: `* Comprehensive type definitions to replace all 'any' types`

#### packages/shared/src/types/index.ts (1 instances)

- Line 63: `export interface ApiResponse<T = any> {`

#### packages/types/src/index.ts (1 instances)

- Line 64: `export interface ApiResponse<T = any> {`

### Decorators (9 instances)

#### packages/authx/src/decorators/abac.decorator.ts (2 instances)

- Line 6: `principal: any;`
- Line 7: `req: any;`

#### packages/nest-enterprise-rbac/src/decorators.ts (2 instances)

- Line 8: `return ((target: any, key?: string | symbol, descriptor?: PropertyDescriptor) =>...`
- Line 9: `return (SetMetadata(RBAC_POLICY_KEY, policy) as any)(target, key as any, descrip...`

#### packages/payment-nest/demo/decorator-based-demo.ts (2 instances)

- Line 322: `console.log('   • Zero `any` assertions required');`
- Line 343: `console.log('✅ Zero `any` assertions');`

#### packages/analytics/src/modules/analytics/shared/cls/context.decorator.ts (1 instances)

- Line 10: `return contextService.get(data as any);`

#### packages/nest-enterprise-auth/src/decorators/auth.decorators.ts (1 instances)

- Line 15: `return data ? (user as any)[data] : user;`

#### packages/nest-mobile-apis/src/decorators/mobile-api.decorator.ts (1 instances)

- Line 250: `export function TrackEvent(eventName: string, properties?: Record<string, any>) ...`

### Guards (8 instances)

#### packages/analytics/src/modules/analytics/shared/rate-limit/rate-limit.guard.spec.ts (1 instances)

- Line 102: `expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(St...`

#### packages/analytics/src/shared/guards/analytics-throttler.guard.ts (1 instances)

- Line 31: `super(options as any, storageService as any, reflector);`

#### packages/authx/src/guards/abac.guard.ts (1 instances)

- Line 22: `const req = context.switchToHttp().getRequest<any>();`

#### packages/authx/src/guards/auth.guard.ts (1 instances)

- Line 17: `const req: any = ctx.switchToHttp().getRequest();`

#### packages/authx/src/guards/permissions.guard.ts (1 instances)

- Line 17: `const req = context.switchToHttp().getRequest<any>();`

#### packages/authx/src/guards/policies.guard.ts (1 instances)

- Line 15: `const req: any = ctx.switchToHttp().getRequest();`

#### packages/authx/src/guards/relation.guard.ts (1 instances)

- Line 16: `const req = context.switchToHttp().getRequest<any>();`

#### packages/nest-compliance/src/guards/compliance.guard.ts (1 instances)

- Line 53: `private extractDataType(url: string, body: any): string {`

### Dto (3 instances)

#### packages/payment-nest/src/modules/payment/dto/create-payment.dto.ts (1 instances)

- Line 47: `metadata?: Record<string, any>;`

#### packages/payment-nest/src/modules/payment/dto/payment-response.dto.ts (1 instances)

- Line 30: `metadata?: Record<string, any>;`

#### packages/payment-nest/src/modules/payment/dto/update-payment.dto.ts (1 instances)

- Line 18: `metadata?: Record<string, any>;`

### Entities (1 instances)

#### packages/payment-nest/src/modules/payment/entities/payment.entity.ts (1 instances)

- Line 66: `metadata?: Record<string, any>;`

## By File

### packages/payment-nest/src/modules/payment/controllers/enhanced-streams-demo.controller.ts (108 instances)

- Line 103 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 104 [controllers]: `enableEncryption: (config as any).enableEncryption || false,`
- Line 105 [controllers]: `enableCompression: (config as any).enableCompression || false,`
- Line 106 [controllers]: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 107 [controllers]: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 108 [controllers]: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 109 [controllers]: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 110 [controllers]: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 111 [controllers]: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 112 [controllers]: `retryDelay: (config as any).retryDelay || 1000,`
- Line 113 [controllers]: `timeout: (config as any).timeout || 30000,`
- Line 114 [controllers]: `userId: (config as any).userId,`
- Line 115 [controllers]: `compliance: (config as any).compliance || [],`
- Line 147 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 148 [controllers]: `enableEncryption: (config as any).enableEncryption || false,`
- Line 149 [controllers]: `enableCompression: (config as any).enableCompression || false,`
- Line 150 [controllers]: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 151 [controllers]: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 152 [controllers]: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 153 [controllers]: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 154 [controllers]: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 155 [controllers]: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 156 [controllers]: `retryDelay: (config as any).retryDelay || 1000,`
- Line 157 [controllers]: `timeout: (config as any).timeout || 30000,`
- Line 158 [controllers]: `userId: (config as any).userId,`
- Line 159 [controllers]: `compliance: (config as any).compliance || [],`
- Line 191 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 192 [controllers]: `enableEncryption: (config as any).enableEncryption || false,`
- Line 193 [controllers]: `enableCompression: (config as any).enableCompression || false,`
- Line 194 [controllers]: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 195 [controllers]: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 196 [controllers]: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 197 [controllers]: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 198 [controllers]: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 199 [controllers]: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 200 [controllers]: `retryDelay: (config as any).retryDelay || 1000,`
- Line 201 [controllers]: `timeout: (config as any).timeout || 30000,`
- Line 202 [controllers]: `userId: (config as any).userId,`
- Line 203 [controllers]: `compliance: (config as any).compliance || [],`
- Line 235 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 236 [controllers]: `encryptionKey: Buffer.from((config as any).encryptionKey || 'default-key-32-char...`
- Line 237 [controllers]: `enableIntegrityCheck: (config as any).enableIntegrityCheck !== false,`
- Line 239 [controllers]: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 240 [controllers]: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 241 [controllers]: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 242 [controllers]: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 243 [controllers]: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 244 [controllers]: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 245 [controllers]: `retryDelay: (config as any).retryDelay || 1000,`
- Line 246 [controllers]: `timeout: (config as any).timeout || 30000,`
- Line 247 [controllers]: `userId: (config as any).userId,`
- Line 248 [controllers]: `compliance: (config as any).compliance || [],`
- Line 281 [controllers]: `algorithm: (config as any).algorithm || 'gzip',`
- Line 282 [controllers]: `compressionLevel: (config as any).compressionLevel || 6,`
- Line 283 [controllers]: `enableDictionary: (config as any).enableDictionary !== false,`
- Line 285 [controllers]: `enableMonitoring: (config as any).enableMonitoring !== false,`
- Line 286 [controllers]: `enableBackpressure: (config as any).enableBackpressure !== false,`
- Line 287 [controllers]: `enableRateLimiting: (config as any).enableRateLimiting || false,`
- Line 288 [controllers]: `maxThroughput: (config as any).maxThroughput || 0,`
- Line 289 [controllers]: `maxConcurrency: (config as any).maxConcurrency || 0,`
- Line 290 [controllers]: `retryAttempts: (config as any).retryAttempts || 3,`
- Line 291 [controllers]: `retryDelay: (config as any).retryDelay || 1000,`
- Line 292 [controllers]: `timeout: (config as any).timeout || 30000,`
- Line 293 [controllers]: `userId: (config as any).userId,`
- Line 294 [controllers]: `compliance: (config as any).compliance || [],`
- Line 333 [controllers]: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 334 [controllers]: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 335 [controllers]: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 336 [controllers]: `.forUser((config as any).userId || 'system')`
- Line 337 [controllers]: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 338 [controllers]: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 339 [controllers]: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 340 [controllers]: `.withTimeout((config as any).timeout || 30000)`
- Line 374 [controllers]: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 375 [controllers]: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 376 [controllers]: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 377 [controllers]: `.forUser((config as any).userId || 'system')`
- Line 378 [controllers]: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 379 [controllers]: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 380 [controllers]: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 381 [controllers]: `.withTimeout((config as any).timeout || 30000)`
- Line 415 [controllers]: `.withAlgorithm((config as any).algorithm || 'aes-256-gcm')`
- Line 416 [controllers]: `.withEncryption((config as any).algorithm || 'aes-256-gcm')`
- Line 417 [controllers]: `.withCompression((config as any).compressionAlgorithm || 'gzip', (config as any)...`
- Line 418 [controllers]: `.forUser((config as any).userId || 'system')`
- Line 419 [controllers]: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 420 [controllers]: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 421 [controllers]: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 422 [controllers]: `.withTimeout((config as any).timeout || 30000)`
- Line 456 [controllers]: `.withEncryption((config as any).algorithm || 'aes-256-gcm', Buffer.from((config ...`
- Line 457 [controllers]: `.forUser((config as any).userId || 'system')`
- Line 458 [controllers]: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 459 [controllers]: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 460 [controllers]: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 461 [controllers]: `.withTimeout((config as any).timeout || 30000)`
- Line 496 [controllers]: `.withAlgorithm((config as any).algorithm || 'gzip')`
- Line 497 [controllers]: `.withCompressionLevel((config as any).compressionLevel || 6)`
- Line 498 [controllers]: `.forUser((config as any).userId || 'system')`
- Line 499 [controllers]: `.withCompliance((config as any).compliance || ['SOX', 'GDPR'])`
- Line 500 [controllers]: `.withLimits((config as any).maxThroughput || 1000000, (config as any).maxConcurr...`
- Line 501 [controllers]: `.withRetry((config as any).retryAttempts || 3, (config as any).retryDelay || 100...`
- Line 502 [controllers]: `.withTimeout((config as any).timeout || 30000)`
- Line 811 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 812 [controllers]: `enableEncryption: (config as any).enableEncryption || false,`
- Line 845 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 846 [controllers]: `enableCompression: (config as any).enableCompression || false,`
- Line 879 [controllers]: `algorithm: (config as any).algorithm || 'aes-256-gcm',`
- Line 880 [controllers]: `enableEncryption: (config as any).enableEncryption || false,`

### packages/core/src/testing/unit/responseWrapper.test.ts (42 instances)

- Line 43 [other]: `timestamp: expect.any(String),`
- Line 46 [other]: `environment: expect.any(String)`
- Line 66 [other]: `timestamp: expect.any(String),`
- Line 69 [other]: `environment: expect.any(String)`
- Line 87 [other]: `timestamp: expect.any(String),`
- Line 90 [other]: `environment: expect.any(String)`
- Line 108 [other]: `timestamp: expect.any(String),`
- Line 111 [other]: `environment: expect.any(String)`
- Line 129 [other]: `timestamp: expect.any(String),`
- Line 132 [other]: `environment: expect.any(String)`
- Line 154 [other]: `timestamp: expect.any(String),`
- Line 159 [other]: `environment: expect.any(String)`
- Line 176 [other]: `timestamp: expect.any(String),`
- Line 181 [other]: `environment: expect.any(String)`
- Line 199 [other]: `timestamp: expect.any(String),`
- Line 204 [other]: `environment: expect.any(String)`
- Line 221 [other]: `timestamp: expect.any(String),`
- Line 226 [other]: `environment: expect.any(String)`
- Line 242 [other]: `timestamp: expect.any(String),`
- Line 247 [other]: `environment: expect.any(String)`
- Line 261 [other]: `timestamp: expect.any(String),`
- Line 266 [other]: `environment: expect.any(String)`
- Line 288 [other]: `timestamp: expect.any(String),`
- Line 296 [other]: `environment: expect.any(String)`
- Line 313 [other]: `timestamp: expect.any(String),`
- Line 318 [other]: `environment: expect.any(String)`
- Line 334 [other]: `timestamp: expect.any(String),`
- Line 339 [other]: `environment: expect.any(String)`
- Line 353 [other]: `timestamp: expect.any(String),`
- Line 358 [other]: `environment: expect.any(String)`
- Line 374 [other]: `timestamp: expect.any(String),`
- Line 379 [other]: `environment: expect.any(String)`
- Line 393 [other]: `timestamp: expect.any(String),`
- Line 398 [other]: `environment: expect.any(String)`
- Line 414 [other]: `timestamp: expect.any(String),`
- Line 419 [other]: `environment: expect.any(String)`
- Line 437 [other]: `timestamp: expect.any(String),`
- Line 442 [other]: `environment: expect.any(String)`
- Line 458 [other]: `timestamp: expect.any(String),`
- Line 463 [other]: `environment: expect.any(String)`
- Line 477 [other]: `timestamp: expect.any(String),`
- Line 482 [other]: `environment: expect.any(String)`

### packages/payment-nest/src/modules/payment/controllers/dynamic-validation-demo.controller.ts (19 instances)

- Line 30 [controllers]: `customFields: z.record(z.string(), z.any()).optional(),`
- Line 113 [controllers]: `schema: (req as any).user?.role === 'admin' ? AdminPaymentSchema : BasicPaymentS...`
- Line 173 [controllers]: `}) as any,`
- Line 176 [controllers]: `}) as any,`
- Line 178 [controllers]: `} as any)`
- Line 199 [controllers]: `}) as any,`
- Line 200 [controllers]: `'legacy-payment-flow': BasicPaymentSchema as any,`
- Line 201 [controllers]: `} as any)`
- Line 219 [controllers]: `condition: (data) => (data as any).amount > 10000,`
- Line 224 [controllers]: `condition: (data) => (data as any).priority === 'high',`
- Line 229 [controllers]: `condition: (data) => (data as any).customFields !== undefined,`
- Line 261 [controllers]: `context?.user?.role === 'premium' && (data as any).amount > 1000,`
- Line 315 [controllers]: `condition: (data) => (data as any).paymentMethod !== undefined,`
- Line 320 [controllers]: `condition: (data) => (data as any).amount > 1000,`
- Line 332 [controllers]: `condition: (data) => (data as any).currency === 'USD',`
- Line 358 [controllers]: `user: (req as any).user || {`
- Line 405 [controllers]: `(context?.request as any)?.headers?.['content-type']?.includes('application/json...`
- Line 411 [controllers]: `(context?.request as any)?.headers?.['content-type']?.includes('application/xml'...`
- Line 419 [controllers]: `(context?.request as any)?.headers?.['content-type']?.includes('multipart/form-d...`

### packages/core/src/testing/unit/authMiddleware.test.ts (14 instances)

- Line 24 [middleware]: `let mockRequest: Partial<Request> & { user?: any }`
- Line 52 [middleware]: `mockJwt.verify.mockReturnValue(mockUser as any)`
- Line 59 [middleware]: `expect((mockRequest as any).user).toEqual(mockUser)`
- Line 129 [middleware]: `expect((mockRequest as any).user).toBeUndefined()`
- Line 150 [middleware]: `expect((mockRequest as any).user).toBeUndefined()`
- Line 171 [middleware]: `expect((mockRequest as any).user).toBeUndefined()`
- Line 193 [middleware]: `expect((mockRequest as any).user).toBeUndefined()`
- Line 201 [middleware]: `;(mockRequest as any).user = mockUser`
- Line 216 [middleware]: `;(mockRequest as any).user = mockUser`
- Line 231 [middleware]: `;(mockRequest as any).user = mockUser`
- Line 245 [middleware]: `;(mockRequest as any).user = undefined`
- Line 260 [middleware]: `;(mockRequest as any).user = mockUser`
- Line 275 [middleware]: `;(mockRequest as any).user = mockUser`
- Line 290 [middleware]: `;(mockRequest as any).user = mockUser`

### packages/nest-zod/examples/advanced-performance-example.ts (14 instances)

- Line 94 [other]: `async (data: any) => {`
- Line 101 [other]: `(data: any) => data.age >= 18 && data.age <= 120,`
- Line 115 [other]: `filters: z.record(z.string(), z.any()).optional(),`
- Line 120 [other]: `(data: any) => !data.price || (data.price >= 0 && data.price <= 10000),`
- Line 135 [other]: `async validateUser(@Body() userData: any) {`
- Line 179 [other]: `async validateUsersBatch(@Body() usersData: any[]) {`
- Line 222 [other]: `async validateMixedEntities(@Body() entitiesData: any[]) {`
- Line 227 [other]: `const schemaSelector = (entity: any) => {`
- Line 257 [other]: `async validateOrderPipeline(@Body() orderData: any) {`
- Line 268 [other]: `condition: (data: any) => data.userId !== undefined,`
- Line 273 [other]: `condition: (data: any) => data.products && data.products.length > 0,`
- Line 278 [other]: `condition: (data: any) => data.total > 0,`
- Line 281 [other]: `products: z.array(z.any()).min(1),`
- Line 309 [other]: `async createEnhancedUser(@Body() userData: any) {`

### packages/node-crypto/examples/dx-improvement.example.ts (13 instances)

- Line 26 [other]: `private auditLog: any[] = [];`
- Line 28 [other]: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 111 [other]: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 165 [other]: `getPerformanceMetrics(): any {`
- Line 195 [other]: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 205 [other]: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 214 [other]: `async getPerformanceMetrics(): Promise<any> {`
- Line 230 [other]: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 241 [other]: `async decryptPaymentData(encryptedData: any): Promise<any> {`
- Line 250 [other]: `async generatePaymentKey(): Promise<any> {`
- Line 277 [other]: `async encryptPaymentData(paymentData: any): Promise<any> {`
- Line 288 [other]: `async decryptPaymentData(encryptedData: string): Promise<any> {`
- Line 300 [other]: `async generatePaymentKey(): Promise<any> {`

### packages/core/src/testing/unit/validationMiddleware.test.ts (12 instances)

- Line 79 [middleware]: `details: expect.any(Array)`
- Line 101 [middleware]: `details: expect.any(Array)`
- Line 119 [middleware]: `details: expect.any(Array)`
- Line 138 [middleware]: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`
- Line 193 [middleware]: `details: expect.any(Array)`
- Line 215 [middleware]: `details: expect.any(Array)`
- Line 233 [middleware]: `details: expect.any(Array)`
- Line 252 [middleware]: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`
- Line 300 [middleware]: `details: expect.any(Array)`
- Line 322 [middleware]: `details: expect.any(Array)`
- Line 340 [middleware]: `details: expect.any(Array)`
- Line 359 [middleware]: `expect(mockNext).toHaveBeenCalledWith(expect.any(Error))`

### packages/nest-zod/demo/debug-whitelist.ts (7 instances)

- Line 26 [other]: `console.log('Schema _def:', (UserSchema as any)._def);`
- Line 27 [other]: `console.log('Schema _def.shape:', (UserSchema as any)._def.shape);`
- Line 28 [other]: `console.log('Schema keys:', Object.keys((UserSchema as any)._def.shape));`
- Line 32 [other]: `if (schema._def && (schema._def as any).shape) {`
- Line 33 [other]: `return Object.keys((schema._def as any).shape);`
- Line 38 [other]: `function filterProperties(data: any, allowedProperties: string[]): any {`
- Line 43 [other]: `const result: any = {};`

### packages/nest-zod/examples/monitoring-observability-example.ts (7 instances)

- Line 219 [other]: `async validateUserMonitored(@Body() userData: any) {`
- Line 298 [other]: `async validateBatchMonitored(@Body() data: { items: any[]; schemaName: string })...`
- Line 364 [other]: `} as any);`
- Line 425 [other]: `async validateCached(@Body() data: { userData: any; useCache: boolean }) {`
- Line 596 [other]: `async searchTraces(@Query() query: any) {`
- Line 604 [other]: `async getLogs(@Query() query: any) {`
- Line 683 [other]: `async updateMonitoringConfig(@Body() config: any) {`

### packages/core/src/testing/integration/auth.integration.test.ts (6 instances)

- Line 22 [other]: `accessToken: expect.any(String),`
- Line 23 [other]: `refreshToken: expect.any(String),`
- Line 24 [other]: `expiresIn: expect.any(Number)`
- Line 54 [other]: `accessToken: expect.any(String),`
- Line 55 [other]: `refreshToken: expect.any(String),`
- Line 56 [other]: `expiresIn: expect.any(Number)`

### packages/core/src/testing/setup.ts (6 instances)

- Line 90 [other]: `const res = {} as any`
- Line 98 [other]: `export const expectError = async (fn: () => Promise<any>, expectedMessage: strin...`
- Line 134 [other]: `export const measurePerformance = async (fn: () => Promise<any>, iterations = 10...`
- Line 151 [other]: `export const loadTest = async (fn: () => Promise<any>, concurrency = 10, duratio...`
- Line 153 [other]: `const results: any[] = []`
- Line 191 [other]: `export const testInputValidation = async (validator: (input: any) => boolean, va...`

### packages/core/src/testing/unit/authController.test.ts (6 instances)

- Line 85 [controllers]: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 178 [controllers]: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 252 [controllers]: `mockRequest.user = undefined as any`
- Line 314 [controllers]: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`
- Line 325 [controllers]: `mockRequest.user = undefined as any`
- Line 393 [controllers]: `expect(mockValidateSchema).toHaveBeenCalledWith(expect.any(Object), mockRequest....`

### packages/nest-compliance/src/services/compliance.service.ts (6 instances)

- Line 219 [services]: `async validateCompliance(data: any, context: { type: string; action: string; use...`
- Line 266 [services]: `async getComplianceStatus(): Promise<any> {`
- Line 305 [services]: `private isPersonalData(data: any): boolean {`
- Line 309 [services]: `private isFinancialData(data: any): boolean {`
- Line 313 [services]: `private isHealthData(data: any): boolean {`
- Line 354 [services]: `private async logComplianceEvent(event: string, data: any, context: any): Promis...`

### packages/nest-zod/src/decorators/type-safe-validation.decorator.ts (6 instances)

- Line 93 [types]: `return function (target: any) {`
- Line 112 [types]: `return function (target: any, propertyKey: string, _descriptor: PropertyDescript...`
- Line 132 [types]: `return function (target: any, propertyKey: string, descriptor: PropertyDescripto...`
- Line 264 [types]: `return function (_target: any, _propertyKey: string, descriptor: PropertyDescrip...`
- Line 327 [types]: `return function (_target: any, _propertyKey: string, descriptor: PropertyDescrip...`
- Line 371 [types]: `return function (target: any, propertyKey: string, descriptor: PropertyDescripto...`

### packages/service-mesh/src/decorators/service-call.decorator.ts (6 instances)

- Line 26 [services]: `return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {`
- Line 29 [services]: `descriptor.value = async function (...args: any[]) {`
- Line 31 [services]: `const serviceMeshService = (this as any).serviceMeshService;`
- Line 55 [services]: `if (options.fallback && typeof (this as any)[options.fallback] === 'function') {`
- Line 56 [services]: `(this as any).logger?.warn(`Service call failed, using fallback: ${error instanc...`
- Line 57 [services]: `return (this as any)[options.fallback](...args);`

### packages/shared/src/validation/shared-validation.service.ts (6 instances)

- Line 35 [services]: `metadata: z.record(z.any()).optional(),`
- Line 73 [services]: `metadata: z.record(z.any()).optional(),`
- Line 88 [services]: `metadata: z.record(z.any()).optional(),`
- Line 128 [services]: `metadata: z.record(z.any()).optional(),`
- Line 141 [services]: `changes: z.record(z.any()).optional(),`
- Line 145 [services]: `metadata: z.record(z.any()).optional(),`

### packages/core/src/utils/responseWrapper.ts (5 instances)

- Line 14 [utils]: `export interface ApiResponse<T = any> {`
- Line 28 [utils]: `details?: Record<string, any> | undefined`
- Line 60 [utils]: `details?: Record<string, any>`
- Line 95 [utils]: `details: Record<string, any>`
- Line 133 [utils]: `details?: Record<string, any>`

### packages/core/src/validation/enterprise-validation.service.ts (5 instances)

- Line 123 [services]: `customErrorMap: errorMap as any,`
- Line 144 [services]: `customErrorMap: errorMap as any,`
- Line 165 [services]: `customErrorMap: errorMap as any,`
- Line 186 [services]: `customErrorMap: errorMap as any,`
- Line 207 [services]: `customErrorMap: errorMap as any,`

### packages/enterprise-demo/src/validation/enterprise-demo-validation.service.ts (5 instances)

- Line 160 [services]: `customErrorMap: errorMap as any,`
- Line 180 [services]: `customErrorMap: errorMap as any,`
- Line 200 [services]: `customErrorMap: errorMap as any,`
- Line 220 [services]: `customErrorMap: errorMap as any,`
- Line 240 [services]: `customErrorMap: errorMap as any,`

### packages/nest-compliance/src/services/gdpr.service.ts (5 instances)

- Line 160 [services]: `async generateComplianceReport(period: { start: Date; end: Date }): Promise<any>...`
- Line 187 [services]: `private async encryptData(data: Record<string, any>): Promise<Record<string, any...`
- Line 193 [services]: `const encrypted: Record<string, any> = {};`
- Line 205 [services]: `private async collectUserData(_userId: string): Promise<Record<string, any>> {`
- Line 225 [services]: `private async preparePortableData(userId: string): Promise<Record<string, any>> ...`

### packages/nest-database/src/database.service.ts (5 instances)

- Line 24 [services]: `async query<T = any>(sql: string, parameters?: any[]): Promise<T[]> {`
- Line 56 [services]: `async transaction<T>(fn: (manager: any) => Promise<T>): Promise<T> {`
- Line 73 [services]: `async getConnectionStats(): Promise<any> {`
- Line 77 [services]: `async getQueryStats(): Promise<any> {`
- Line 81 [services]: `async getMetrics(): Promise<any> {`

### packages/nest-dev-tools/src/generation/code-generator.service.ts (5 instances)

- Line 40 [services]: `findAll(@Query() query: any): string {`
- Line 50 [services]: `create(@Body() create${name}Dto: any): string {`
- Line 55 [services]: `update(@Param('id') id: string, @Body() update${name}Dto: any): string {`
- Line 80 [services]: `create(create${name}Dto: any): string {`
- Line 84 [services]: `update(id: string, update${name}Dto: any): string {`

### packages/nest-disaster-recovery/src/validation/disaster-recovery-validation.service.ts (5 instances)

- Line 221 [services]: `customErrorMap: errorMap as any,`
- Line 241 [services]: `customErrorMap: errorMap as any,`
- Line 261 [services]: `customErrorMap: errorMap as any,`
- Line 281 [services]: `customErrorMap: errorMap as any,`
- Line 301 [services]: `customErrorMap: errorMap as any,`

### packages/nest-event-streaming/src/event-streaming.module.ts (5 instances)

- Line 77 [modules]: `imports?: any[];`
- Line 78 [modules]: `useFactory: (...args: any[]) => Promise<EventStreamingModuleOptions> | EventStre...`
- Line 79 [modules]: `inject?: any[];`
- Line 84 [modules]: `useFactory: async (...args: any[]) => {`
- Line 92 [modules]: `useFactory: async (...args: any[]) => {`

### packages/nest-event-streaming/src/services/rabbitmq.service.ts (5 instances)

- Line 18 [services]: `private connection: any = null;`
- Line 19 [services]: `private channel: any = null;`
- Line 165 [services]: `await this.channel.consume(queue.queue, async (msg: any) => {`
- Line 236 [services]: `private async retryHandler(handler: EventHandler, message: EventMessage, _error:...`
- Line 258 [services]: `private async sendToDeadLetterQueue(queue: string, message: EventMessage, error:...`

### packages/nest-mobile-apis/src/services/mobile-api.service.ts (5 instances)

- Line 197 [services]: `async setOfflineData(data: any, userId: string): Promise<void> {`
- Line 250 [services]: `credentials: any,`
- Line 260 [services]: `async encryptData(data: any, key?: string): Promise<string> {`
- Line 264 [services]: `async decryptData(encryptedData: string, key?: string): Promise<any> {`
- Line 309 [services]: `optimized.images = optimized.images.map((img: any) => ({`

### packages/nest-mobile-apis/src/services/mobile-optimization.service.ts (5 instances)

- Line 16 [services]: `private imageCache: any;`
- Line 243 [services]: `async compressData(data: any): Promise<Buffer> {`
- Line 250 [services]: `zlib.gzip(buffer, (err: any, compressed: Buffer) => {`
- Line 260 [services]: `async decompressData(compressedBuffer: Buffer): Promise<any> {`
- Line 263 [services]: `zlib.gunzip(compressedBuffer, (err: any, decompressed: Buffer) => {`

### packages/nest-mobile-apis/src/services/mobile-security.service.ts (5 instances)

- Line 199 [services]: `async encryptData(data: any, key?: string): Promise<string> {`
- Line 207 [services]: `async decryptData(encryptedData: string, key?: string): Promise<any> {`
- Line 250 [services]: `credentials: any,`
- Line 285 [services]: `private signToken(payload: any): string {`
- Line 299 [services]: `private verifyToken(token: string): any {`

### packages/nest-mobile-apis/src/validation/mobile-validation.service.ts (5 instances)

- Line 188 [services]: `customErrorMap: errorMap as any,`
- Line 210 [services]: `customErrorMap: errorMap as any,`
- Line 232 [services]: `customErrorMap: errorMap as any,`
- Line 253 [services]: `customErrorMap: errorMap as any,`
- Line 274 [services]: `customErrorMap: errorMap as any,`

### packages/node-crypto/src/nestjs/crypto.service.ts (5 instances)

- Line 19 [services]: `async encrypt(data: Buffer, key: Buffer, options: any = {}) {`
- Line 23 [services]: `async decrypt(encryptedData: any, key: Buffer) {`
- Line 29 [services]: `return this.cryptoService.generateKeyPair(algorithm as any);`
- Line 33 [services]: `return this.cryptoService.generateSecretKey(algorithm as any);`
- Line 45 [services]: `getAuditLog(filter?: any) {`

### packages/payment-nest/demo/secure-payment-demo.ts (5 instances)

- Line 137 [other]: `console.log(`     Calls: ${(metric as any).callCount || 0}`);`
- Line 138 [other]: `console.log(`     Avg Duration: ${((metric as any).averageDuration || 0).toFixed...`
- Line 139 [other]: `console.log(`     Min Duration: ${((metric as any).minDuration || 0).toFixed(2)}...`
- Line 140 [other]: `console.log(`     Max Duration: ${((metric as any).maxDuration || 0).toFixed(2)}...`
- Line 141 [other]: `console.log(`     Data Processed: ${(metric as any).totalDataSize || 0} bytes`);`

### packages/payment-nest/src/modules/payment/controllers/dx-improved-payment.controller.ts (5 instances)

- Line 48 [controllers]: `metadata: z.record(z.any()).optional(),`
- Line 230 [controllers]: `const decrypted = await (this.simpleCrypto as any).decrypt(`
- Line 231 [controllers]: `(encryptedData as any).data,`
- Line 232 [controllers]: `(encryptedData as any).keyId,`
- Line 266 [controllers]: `.decrypt((encryptedData as any).data as Record<string, unknown>, (encryptedData ...`

### packages/authx/src/services/rebac.service.ts (4 instances)

- Line 23 [services]: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`
- Line 38 [services]: `await (this.client as any).sadd(k, tuple.subject);`
- Line 49 [services]: `await (this.client as any).srem(k, tuple.subject);`
- Line 58 [services]: `const exists = await (this.client as any).sismember(k, subject);`

### packages/core/src/swagger/SwaggerMiddleware.ts (4 instances)

- Line 22 [middleware]: `setup: (_swaggerSpec: any) => {`
- Line 138 [middleware]: `schema: zodToOpenAPI(schema) as any`
- Line 159 [middleware]: `schema: zodToOpenAPI(schema) as any`
- Line 186 [middleware]: `schema: zodToOpenAPI(schema) as any`

### packages/nest-cache/src/cache.module.ts (4 instances)

- Line 50 [modules]: `useFactory: (store: any) => new CompressedStore(store),`
- Line 58 [modules]: `useFactory: (store: any) => new EncryptedStore(store, options.encryption?.key),`
- Line 71 [modules]: `useFactory: (...args: any[]) => Promise<CacheOptions> | CacheOptions;`
- Line 72 [modules]: `inject?: any[];`

### packages/nest-compliance/src/interfaces/compliance.interface.ts (4 instances)

- Line 78 [other]: `data: Record<string, any>;`
- Line 111 [other]: `details: Record<string, any>;`
- Line 126 [other]: `data: Record<string, any>;`
- Line 128 [other]: `responseData?: Record<string, any>;`

### packages/nest-dev-tools/src/testing/test-utils.ts (4 instances)

- Line 6 [utils]: `static async createTestingModule(module: any): Promise<TestingModule> {`
- Line 10 [utils]: `static async createNestApplication(module: any): Promise<INestApplication> {`
- Line 15 [utils]: `static async makeRequest(app: INestApplication, method: string, url: string, dat...`
- Line 16 [utils]: `const agent = (request as any)(app.getHttpServer());`

### packages/nest-disaster-recovery/src/services/disaster-recovery.service.ts (4 instances)

- Line 21 [services]: `async getOverallStatus(): Promise<any> {`
- Line 37 [services]: `private calculateOverallHealth(backupStats: any, restoreStats: any, drMetrics: a...`
- Line 200 [services]: `async testDisasterRecovery(planId: string, testType: 'tabletop' | 'simulation' |...`
- Line 257 [services]: `async generateDisasterRecoveryReport(): Promise<any> {`

### packages/nest-mobile-apis/src/interceptors/mobile-optimization.interceptor.ts (4 instances)

- Line 28 [interceptors]: `async intercept(context: ExecutionContext, next: CallHandler): Promise<Observabl...`
- Line 78 [interceptors]: `private hasImages(data: any): boolean {`
- Line 84 [interceptors]: `data: any,`
- Line 87 [interceptors]: `): Promise<any> {`

### packages/nest-mobile-apis/src/services/mobile-caching.service.ts (4 instances)

- Line 16 [services]: `private offlineCache: any;`
- Line 17 [services]: `private memoryCache: any;`
- Line 201 [services]: `.filter(data => (data as any)?.syncStatus === 'pending').length;`
- Line 228 [services]: `async warmupCache(keys: string[], dataFetcher: (key: string) => Promise<any>): P...`

### packages/nest-multi-region/src/interfaces/multi-region.interface.ts (4 instances)

- Line 52 [other]: `data: any;`
- Line 143 [other]: `data: any;`
- Line 150 [other]: `finalData: any;`
- Line 175 [other]: `data: any;`

### packages/nest-orm/src/services/multi-orm.service.ts (4 instances)

- Line 46 [services]: `async query<T = any>(query: DatabaseQuery<T>): Promise<QueryResult<T>> {`
- Line 98 [services]: `async transaction<T = any>(`
- Line 106 [services]: `const result = await this.executeTransaction<any>(provider, queries, options);`
- Line 239 [services]: `private async executeTransaction<T = any>(`

### packages/notification/src/utils/logger.ts (4 instances)

- Line 67 [utils]: `export const logInfo = (message: string, meta?: any) => logger.info(message, met...`
- Line 68 [utils]: `export const logError = (message: string, meta?: any) => logger.error(message, m...`
- Line 69 [utils]: `export const logWarn = (message: string, meta?: any) => logger.warn(message, met...`
- Line 70 [utils]: `export const logDebug = (message: string, meta?: any) => logger.debug(message, m...`

### packages/payment-nest/src/modules/analytics/controllers/analytics.controller.ts (4 instances)

- Line 39 [controllers]: `): Promise<any> {`
- Line 57 [controllers]: `): Promise<any> {`
- Line 79 [controllers]: `): Promise<any> {`
- Line 101 [controllers]: `): Promise<any> {`

### packages/payment-nest/src/modules/payment/controllers/three-phase-payment.controller.ts (4 instances)

- Line 53 [controllers]: `): Promise<any> {`
- Line 86 [controllers]: `): Promise<any> {`
- Line 119 [controllers]: `): Promise<any> {`
- Line 150 [controllers]: `): Promise<any> {`

### packages/authx/src/module/authx.module.ts (3 instances)

- Line 27 [modules]: `imports?: any[];`
- Line 28 [modules]: `inject?: any[];`
- Line 29 [modules]: `useFactory: (...args: any[]) => Promise<AuthXModuleOptions> | AuthXModuleOptions...`

### packages/authx/src/services/oidc.service.ts (3 instances)

- Line 7 [services]: `constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}`
- Line 22 [services]: `const params: AuthorizationParameters = { scope: 'openid email profile', code_ch...`
- Line 23 [services]: `if (state !== undefined) (params as any).state = state as string;`

### packages/core/src/monitoring/health.ts (3 instances)

- Line 25 [other]: `details?: Record<string, any>`
- Line 385 [other]: `async liveness(_req: any, res: any) {`
- Line 409 [other]: `async readiness(_req: any, res: any) {`

### packages/core/src/utils/events.ts (3 instances)

- Line 5 [utils]: `export const createEventEmitter = <T extends Record<string, any>>() => {`
- Line 13 [utils]: `listeners.get(event)!.push(listener as any)`
- Line 26 [utils]: `const index = eventListeners.indexOf(listener as any)`

### packages/enterprise-integration/src/enterprise-integration.module.ts (3 instances)

- Line 41 [modules]: `imports?: any[];`
- Line 42 [modules]: `useFactory: (...args: any[]) => Promise<EnterpriseIntegrationOptions> | Enterpri...`
- Line 43 [modules]: `inject?: any[];`

### packages/nest-cache/src/utils/cache-compression.ts (3 instances)

- Line 8 [utils]: `static async compress(data: any): Promise<Buffer> {`
- Line 13 [utils]: `static async decompress(compressed: Buffer): Promise<any> {`
- Line 18 [utils]: `static shouldCompress(data: any, threshold: number = 1024): boolean {`

### packages/nest-cli/src/commands/test.command.ts (3 instances)

- Line 17 [other]: `.action(async (options: any) => {`
- Line 33 [other]: `.action(async (options: any) => {`
- Line 48 [other]: `.action(async (options: any) => {`

### packages/nest-compliance/src/interceptors/compliance.interceptor.ts (3 instances)

- Line 17 [interceptors]: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 63 [interceptors]: `private async logComplianceEvent(type: 'success' | 'error', event: any): Promise...`
- Line 83 [interceptors]: `private sanitizeData(data: any): any {`

### packages/nest-disaster-recovery/src/services/backup.service.ts (3 instances)

- Line 195 [services]: `private async collectBackupData(config: BackupConfig): Promise<{ data: Buffer; s...`
- Line 231 [services]: `private async uploadToDestination(backupData: any, destResult: BackupDestination...`
- Line 340 [services]: `async getBackupStatistics(): Promise<any> {`

### packages/nest-event-streaming/src/services/kafka.service.ts (3 instances)

- Line 60 [services]: `sasl: this.config.kafka.sasl as any,`
- Line 238 [services]: `private async retryHandler(handler: EventHandler, message: EventMessage, _error:...`
- Line 260 [services]: `private async sendToDeadLetterQueue(queue: string, message: EventMessage, error:...`

### packages/nest-mobile-apis/src/interceptors/mobile-api.interceptor.ts (3 instances)

- Line 32 [interceptors]: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 107 [interceptors]: `const message = error instanceof HttpException ? (error.getResponse() as any)?.m...`
- Line 136 [interceptors]: `private extractDeviceInfo(request: any): MobileDeviceInfo {`

### packages/nest-multi-region/src/services/data-replication.service.ts (3 instances)

- Line 72 [services]: `data: any,`
- Line 198 [services]: `versions: { region: string; data: any; timestamp: Date }[]`
- Line 233 [services]: `finalData: any`

### packages/nest-orm/src/nest-orm.module.ts (3 instances)

- Line 44 [modules]: `imports?: any[];`
- Line 45 [modules]: `useFactory: (...args: any[]) => Promise<ORMOptions> | ORMOptions;`
- Line 46 [modules]: `inject?: any[];`

### packages/nest-zod/src/utils/dynamic-validation.ts (3 instances)

- Line 133 [utils]: `'Data does not match any conditional validation rules'`
- Line 141 [utils]: `return z.any().transform(async (data) => {`
- Line 264 [utils]: `* Custom condition with any check`

### packages/node-crypto/src/__tests__/crypto.service.test.ts (3 instances)

- Line 313 [services]: `await expect(cryptoService.encrypt(null as any, key.key))`
- Line 321 [services]: `await expect(cryptoService.decrypt(null as any, key.key))`
- Line 329 [services]: `await expect(cryptoService.encrypt(data, null as any))`

### packages/node-crypto/src/__tests__/nestjs.integration.test.ts (3 instances)

- Line 47 [other]: `async decryptData(@Body() encryptedData: any) {`
- Line 247 [other]: `const invalidData = null as any;`
- Line 257 [other]: `const invalidEncryptedData = null as any;`

### packages/node-streams/src/nestjs/streams.service.ts (3 instances)

- Line 205 [services]: `async createMergerStream(config: StreamMergerConfig): Promise<any> {`
- Line 291 [services]: `async getConfig(): Promise<any> {`
- Line 304 [services]: `async getHealthStatus(): Promise<any> {`

### packages/payment-nest/src/modules/health/controllers/health.controller.ts (3 instances)

- Line 13 [controllers]: `async getHealth(): Promise<any> {`
- Line 21 [controllers]: `async getReadiness(): Promise<any> {`
- Line 28 [controllers]: `async getLiveness(): Promise<any> {`

### packages/payment-nest/src/modules/health/services/health.service.ts (3 instances)

- Line 8 [services]: `async getHealth(): Promise<any> {`
- Line 31 [services]: `async getReadiness(): Promise<any> {`
- Line 61 [services]: `async getLiveness(): Promise<any> {`

### packages/payment-nest/src/modules/payment/__tests__/secure-payment.service.test.ts (3 instances)

- Line 452 [services]: `} as any;`
- Line 460 [services]: `await expect(service.encryptPaymentData(null as any))`
- Line 466 [services]: `await expect(service.encryptPaymentData(undefined as any))`

### packages/payment-nest/src/modules/payment/services/secure-payment.service.ts (3 instances)

- Line 178 [services]: `getPerformanceMetrics(): Record<string, any> {`
- Line 240 [services]: `metadata?: Record<string, any>;`
- Line 474 [services]: `async getPaymentPerformanceMetrics(): Promise<any> {`

### packages/payment-nest/src/modules/payment/services/three-phase-payment.service.ts (3 instances)

- Line 55 [services]: `metadata: Record<string, any>;`
- Line 59 [services]: `data?: Record<string, any>;`
- Line 71 [services]: `metadata: Record<string, any>;`

### packages/analytics/src/modules/analytics/shared/rate-limit/memory-rate-limit.storage.spec.ts (2 instances)

- Line 27 [modules]: `resetTime: expect.any(Number),`
- Line 75 [modules]: `resetTime: expect.any(Number),`

### packages/authx/src/decorators/abac.decorator.ts (2 instances)

- Line 6 [decorators]: `principal: any;`
- Line 7 [decorators]: `req: any;`

### packages/authx/src/services/jwt.service.ts (2 instances)

- Line 22 [services]: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`
- Line 107 [services]: `if (email !== undefined) (base as any).email = email;`

### packages/authx/src/services/webauthn.service.ts (2 instances)

- Line 6 [services]: `constructor(@Inject('AUTHX_OPTIONS') private readonly options: any) {}`
- Line 14 [services]: `generateAuthentication(allowCredentials: { id: string; transports?: any[] }[]) {`

### packages/core/src/middleware/auth.ts (2 instances)

- Line 21 [middleware]: `;(req as any).user = user`
- Line 31 [middleware]: `const user = (req as any).user`

### packages/core/src/middleware/validation.ts (2 instances)

- Line 32 [middleware]: `export const validateQuery = <T extends any>(schema: T) => {`
- Line 35 [middleware]: `const result = (schema as any).parse(req.query)`

### packages/core/src/modules/auth/authController.ts (2 instances)

- Line 46 [controllers]: `const userId = (req as any).user?.userId`
- Line 64 [controllers]: `const userId = (req as any).user?.userId`

### packages/core/src/modules/auth/authUtils.ts (2 instances)

- Line 74 [utils]: `export const sanitizeUser = (user: any): any => {`
- Line 93 [utils]: `export const createUser = (data: any): any => {`

### packages/core/src/modules/product/productSchemas.ts (2 instances)

- Line 84 [modules]: `data: z.any(),`
- Line 96 [modules]: `products: z.array(z.any()),`

### packages/core/src/modules/product/productUtils.ts (2 instances)

- Line 139 [utils]: `let aValue: any = a[sortBy as keyof Product]`
- Line 140 [utils]: `let bValue: any = b[sortBy as keyof Product]`

### packages/core/src/monitoring/metrics.ts (2 instances)

- Line 291 [other]: `return (req: any, res: any, next: any) => {`
- Line 296 [other]: `res.end = function(chunk?: any, encoding?: any) {`

### packages/core/src/swagger/SwaggerBuilder.ts (2 instances)

- Line 64 [other]: `addZodSchema(name: string, zodSchema: any): this {`
- Line 85 [other]: `addSecuritySchemes(schemes: Record<string, any>): this {`

### packages/core/src/testing/unit/logger.test.ts (2 instances)

- Line 130 [other]: `logger.info(null as any)`
- Line 138 [other]: `logger.info(undefined as any)`

### packages/core/src/utils/container.ts (2 instances)

- Line 6 [utils]: `const services = new Map<string, any>()`
- Line 7 [utils]: `const factories = new Map<string, () => any>()`

### packages/enterprise-integration/src/services/sap.service.ts (2 instances)

- Line 93 [services]: `async queryOData(entitySet: string, filters?: Record<string, any>, options?: {`
- Line 98 [services]: `}): Promise<any[]> {`

### packages/nest-cache/src/utils/cache-encryption.ts (2 instances)

- Line 11 [utils]: `async encrypt(data: any): Promise<string> {`
- Line 20 [utils]: `async decrypt(encryptedData: string): Promise<any> {`

### packages/nest-cli/src/commands/build.command.ts (2 instances)

- Line 16 [other]: `.action(async (options: any) => {`
- Line 31 [other]: `.action(async (options: any) => {`

### packages/nest-database/src/database.module.ts (2 instances)

- Line 50 [modules]: `useFactory: (...args: any[]) => Promise<DatabaseOptions> | DatabaseOptions;`
- Line 51 [modules]: `inject?: any[];`

### packages/nest-database/src/interceptors/query-profile.interceptor.ts (2 instances)

- Line 23 [interceptors]: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 40 [interceptors]: `tap((_result: any) => {`

### packages/nest-database/src/monitoring/query-profiler.ts (2 instances)

- Line 8 [other]: `parameters?: any[];`
- Line 18 [other]: `startQuery(id: string, query: string, parameters?: any[]): void {`

### packages/nest-database/src/utils/connection-pool.ts (2 instances)

- Line 26 [utils]: `async getConnection(): Promise<any> {`
- Line 30 [utils]: `async releaseConnection(connection: any): Promise<void> {`

### packages/nest-disaster-recovery/src/interfaces/disaster-recovery.interface.ts (2 instances)

- Line 138 [other]: `parameters?: Record<string, any>;`
- Line 263 [other]: `config: Record<string, any>;`

### packages/nest-enterprise-auth/src/module/enterprise-auth.module.ts (2 instances)

- Line 26 [modules]: `providers: providers as any[],`
- Line 27 [modules]: `exports: providers as any[],`

### packages/nest-enterprise-auth/src/refresh/refresh-helpers.ts (2 instances)

- Line 68 [utils]: `} as any;`
- Line 69 [utils]: `return { name, strategy: JwtStrategy as any, options };`

### packages/nest-enterprise-rbac/src/decorators.ts (2 instances)

- Line 8 [decorators]: `return ((target: any, key?: string | symbol, descriptor?: PropertyDescriptor) =>...`
- Line 9 [decorators]: `return (SetMetadata(RBAC_POLICY_KEY, policy) as any)(target, key as any, descrip...`

### packages/nest-event-streaming/src/interfaces/event-streaming.interface.ts (2 instances)

- Line 42 [other]: `data: any;`
- Line 52 [other]: `headers?: Record<string, any>;`

### packages/nest-microservices-demo/src/client/client.grpc.ts (2 instances)

- Line 13 [services]: `const pkg = loadPackageDefinition(packageDef) as unknown as { demo: { Demo: new ...`
- Line 21 [services]: `function callUnary<TReq, TRes>(client: any, method: string, req: TReq): Promise<...`

### packages/nest-mobile-apis/src/interceptors/auth-context.interceptor.ts (2 instances)

- Line 6 [interceptors]: `intercept(context: ExecutionContext, next: CallHandler): Observable<any> {`
- Line 7 [interceptors]: `const request = context.switchToHttp().getRequest<any>();`

### packages/nest-mobile-apis/src/interceptors/mobile-cache.interceptor.ts (2 instances)

- Line 19 [interceptors]: `async intercept(context: ExecutionContext, next: CallHandler): Promise<Observabl...`
- Line 73 [interceptors]: `private generateCacheKey(request: any, options: MobileCacheOptions): string {`

### packages/nest-mobile-apis/src/mobile-api.module.ts (2 instances)

- Line 57 [modules]: `store: redisStore as any,`
- Line 60 [modules]: `} as any;`

### packages/nest-multi-region/src/services/region-manager.service.ts (2 instances)

- Line 249 [services]: `private async simulateHealthCheck(_region: RegionConfig): Promise<any> {`
- Line 326 [services]: `private emitEvent(type: RegionEvent['type'], regionId: string, data: any): void ...`

### packages/nest-serverless-api/src/hello.controller.ts (2 instances)

- Line 13 [controllers]: `@UseGuards(TypedJwtAuthGuard as any, RbacGuard)`
- Line 18 [controllers]: `const user = (req as any).user || (req as any).authContext?.user;`

### packages/nest-zod/src/testing/schema-testing.utils.ts (2 instances)

- Line 289 [utils]: `schema = (schema as z.ZodObject<any>).extend({`
- Line 297 [utils]: `schema = (schema as z.ZodObject<any>).extend({`

### packages/nest-zod/src/utils/type-safe-schema-composition.ts (2 instances)

- Line 113 [types]: `required(): TypeSafeSchemaComposer<z.ZodObject<any>> {`
- Line 118 [types]: `const newSchema = this.schema.required() as z.ZodObject<any>;`

### packages/notification/src/middleware/requestLogger.ts (2 instances)

- Line 22 [middleware]: `res.end = function(chunk?: any, encoding?: any): any {`
- Line 56 [middleware]: `res.send = function(body: any) {`

### packages/payment-nest/demo/decorator-based-demo.ts (2 instances)

- Line 322 [decorators]: `console.log('   • Zero `any` assertions required');`
- Line 343 [decorators]: `console.log('✅ Zero `any` assertions');`

### packages/payment-nest/src/modules/payment/controllers/decorator-based-validation.controller.ts (2 instances)

- Line 72 [controllers]: `customFields: z.record(z.string(), z.any()).optional(),`
- Line 369 [controllers]: `const userRole = (req as any).user?.role || 'user';`

### packages/service-mesh/src/service-mesh.module.ts (2 instances)

- Line 48 [services]: `useFactory: (...args: any[]) => Promise<ServiceMeshOptions> | ServiceMeshOptions...`
- Line 49 [services]: `inject?: any[];`

### packages/analytics/src/main.ts (1 instances)

- Line 26 [other]: `}) as any,`

### packages/analytics/src/modules/analytics/shared/cls/context.decorator.ts (1 instances)

- Line 10 [decorators]: `return contextService.get(data as any);`

### packages/analytics/src/modules/analytics/shared/rate-limit/rate-limit.guard.spec.ts (1 instances)

- Line 102 [guards]: `expect(mockResponse.setHeader).toHaveBeenCalledWith('Retry-After', expect.any(St...`

### packages/analytics/src/modules/analytics/shared/rate-limit/rate-limit.module.ts (1 instances)

- Line 28 [modules]: `return new RedisRateLimitStorage(configService.get('redis') as any);`

### packages/analytics/src/shared/guards/analytics-throttler.guard.ts (1 instances)

- Line 31 [guards]: `super(options as any, storageService as any, reflector);`

### packages/analytics/src/shared/middleware/analytics-logger.middleware.ts (1 instances)

- Line 25 [middleware]: `res.end = function(chunk?: any, encoding?: any): any {`

### packages/analytics-sdk/src/index.ts (1 instances)

- Line 17 [other]: `const res = await fetch(`${this.opts.baseUrl}${path}`, { ...init, headers: { ......`

### packages/authx/src/guards/abac.guard.ts (1 instances)

- Line 22 [guards]: `const req = context.switchToHttp().getRequest<any>();`

### packages/authx/src/guards/auth.guard.ts (1 instances)

- Line 17 [guards]: `const req: any = ctx.switchToHttp().getRequest();`

### packages/authx/src/guards/permissions.guard.ts (1 instances)

- Line 17 [guards]: `const req = context.switchToHttp().getRequest<any>();`

### packages/authx/src/guards/policies.guard.ts (1 instances)

- Line 15 [guards]: `const req: any = ctx.switchToHttp().getRequest();`

### packages/authx/src/guards/relation.guard.ts (1 instances)

- Line 16 [guards]: `const req = context.switchToHttp().getRequest<any>();`

### packages/authx/src/services/decision-audit.service.ts (1 instances)

- Line 6 [services]: `principal?: any;`

### packages/authx/src/services/otp.service.ts (1 instances)

- Line 33 [services]: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`

### packages/authx/src/services/policy.service.ts (1 instances)

- Line 6 [services]: `type PolicyPredicate = (ctx: { principal: any; req: any }) => boolean | Promise<...`

### packages/authx/src/services/session.store.ts (1 instances)

- Line 12 [services]: `constructor(@Inject('AUTHX_OPTIONS') options: any) {`

### packages/authx/src/services/tenant.service.ts (1 instances)

- Line 5 [services]: `resolve(req: any): string {`

### packages/core/src/modules/auth/authResponseHandler.ts (1 instances)

- Line 12 [modules]: `export const createSuccessResponse = (res: Response, data: any, message: string,...`

### packages/core/src/modules/auth/authRoutes.ts (1 instances)

- Line 21 [modules]: `const createAuthRoute = (path: string, method: 'get' | 'post' | 'put' | 'delete'...`

### packages/core/src/modules/product/productRoutes.ts (1 instances)

- Line 23 [modules]: `const createProductRoute = (path: string, method: 'get' | 'post' | 'put' | 'dele...`

### packages/core/src/swagger/types.ts (1 instances)

- Line 74 [types]: `example?: any`

### packages/core/src/testing/unit/productService.test.ts (1 instances)

- Line 78 [services]: `await productService.createProduct(invalidProductData as any)`

### packages/core/src/utils/functional.ts (1 instances)

- Line 28 [utils]: `export const memoize = <T extends any[], R>(`

### packages/core/src/utils/helpers.ts (1 instances)

- Line 79 [utils]: `export const groupBy = <T, K extends keyof any>(array: T[], key: (item: T) => K)...`

### packages/core/src/utils/responseTransformers.ts (1 instances)

- Line 34 [utils]: `filters: Record<string, any>`

### packages/enterprise-integration/src/adapters/sap.adapter.ts (1 instances)

- Line 135 [other]: `async updateODataEntity(entitySet: string, key: string, data: Record<string, any...`

### packages/enterprise-integration/src/interfaces/enterprise-options.interface.ts (1 instances)

- Line 132 [other]: `data: Record<string, any>;`

### packages/nest-cache/src/interfaces/cache-options.interface.ts (1 instances)

- Line 9 [other]: `options?: any;`

### packages/nest-cache/src/interfaces/cache-store.interface.ts (1 instances)

- Line 1 [other]: `export interface CacheEntry<T = any> {`

### packages/nest-cache/src/stores/compressed.store.ts (1 instances)

- Line 36 [other]: `await this.store.set(key, value as any, ttl);`

### packages/nest-cache/src/stores/encrypted.store.ts (1 instances)

- Line 45 [other]: `await this.store.set(key, value as any, ttl);`

### packages/nest-cache/src/stores/redis-cluster.store.ts (1 instances)

- Line 329 [other]: `return await (this.redis as any).srem(fullKey, ...members);`

### packages/nest-cli/src/cli.ts (1 instances)

- Line 11 [other]: `const program = new (commander as any).Command();`

### packages/nest-compliance/src/guards/compliance.guard.ts (1 instances)

- Line 53 [guards]: `private extractDataType(url: string, body: any): string {`

### packages/nest-dev-tools/src/debugging/debug.service.ts (1 instances)

- Line 7 [services]: `logRequest(method: string, url: string, body?: any): void {`

### packages/nest-disaster-recovery/src/services/disaster-recovery-plan.service.ts (1 instances)

- Line 395 [services]: `async getDRMetrics(): Promise<any> {`

### packages/nest-disaster-recovery/src/services/restore.service.ts (1 instances)

- Line 174 [services]: `async getRestoreStatistics(): Promise<any> {`

### packages/nest-enterprise-auth/src/decorators/auth.decorators.ts (1 instances)

- Line 15 [decorators]: `return data ? (user as any)[data] : user;`

### packages/nest-enterprise-rbac/src/tokens.ts (1 instances)

- Line 2 [other]: `export type RbacUserSelector = (req: any) => { roles?: string[]; permissions?: s...`

### packages/nest-mobile-apis/src/decorators/mobile-api.decorator.ts (1 instances)

- Line 250 [decorators]: `export function TrackEvent(eventName: string, properties?: Record<string, any>) ...`

### packages/nest-mobile-apis/src/interfaces/mobile-api.interface.ts (1 instances)

- Line 130 [other]: `data: any;`

### packages/nest-serverless-api/src/main.ts (1 instances)

- Line 16 [other]: `const app = await NestFactory.create(AppModule, adapter as any);`

### packages/nest-zod/examples/type-safe-usage.example.ts (1 instances)

- Line 5 [types]: `* that eliminate the need for `any` assertions while maintaining`

### packages/nest-zod/src/services/schema-registry.service.ts (1 instances)

- Line 166 [services]: `throw new Error(`Schema '${name}' not found in any version`);`

### packages/nest-zod/src/utils/zod-schemas.ts (1 instances)

- Line 190 [utils]: `* Create a schema that validates against any of the provided schemas`

### packages/node-crypto/src/apis/crypto-api.ts (1 instances)

- Line 86 [other]: `* 🔐 Encrypt any data with a single method call`

### packages/node-crypto/src/nestjs/crypto.module.ts (1 instances)

- Line 12 [modules]: `config?: any;`

### packages/node-streams/src/types/streams-custom.types.ts (1 instances)

- Line 4 [types]: `* Comprehensive type definitions to replace all 'any' types`

### packages/payment-nest/demo/type-safe-validation-demo.ts (1 instances)

- Line 407 [types]: `console.log('✅ Zero `any` assertions');`

### packages/payment-nest/src/main.ts (1 instances)

- Line 18 [other]: `}) as any,`

### packages/payment-nest/src/modules/payment/controllers/secure-payment.controller.ts (1 instances)

- Line 80 [controllers]: `metadata: z.record(z.any()).optional(),`

### packages/payment-nest/src/modules/payment/controllers/type-safe-validation-demo.controller.ts (1 instances)

- Line 150 [controllers]: `* the need for `any` assertions while providing full type safety.`

### packages/payment-nest/src/modules/payment/dto/create-payment.dto.ts (1 instances)

- Line 47 [dto]: `metadata?: Record<string, any>;`

### packages/payment-nest/src/modules/payment/dto/payment-response.dto.ts (1 instances)

- Line 30 [dto]: `metadata?: Record<string, any>;`

### packages/payment-nest/src/modules/payment/dto/update-payment.dto.ts (1 instances)

- Line 18 [dto]: `metadata?: Record<string, any>;`

### packages/payment-nest/src/modules/payment/entities/payment.entity.ts (1 instances)

- Line 66 [entities]: `metadata?: Record<string, any>;`

### packages/payment-nest/src/modules/payment/services/fraud-detection.service.ts (1 instances)

- Line 560 [services]: `private async getRecentTransactions(userId: string, email: string, hours: number...`

### packages/payment-nest/src/modules/payment/services/payment-monitoring.service.ts (1 instances)

- Line 126 [services]: `metadata?: Record<string, any>;`

### packages/payment-nest/src/modules/payment/strategies/refresh.strategy.ts (1 instances)

- Line 25 [modules]: `validate(payload: any) {`

### packages/payment-nest/src/shared/queue/queue.service.ts (1 instances)

- Line 34 [services]: `async getQueueStats(): Promise<any> {`

### packages/payment-nest/src/types/payment-custom.types.ts (1 instances)

- Line 4 [types]: `* Comprehensive type definitions to replace all 'any' types`

### packages/service-mesh/src/gateway/mesh-gateway.controller.ts (1 instances)

- Line 39 [controllers]: `data?: any;`

### packages/service-mesh/src/interfaces/service-instance.interface.ts (1 instances)

- Line 9 [services]: `metadata?: Record<string, any>;`

### packages/service-mesh/src/interfaces/service-mesh-options.interface.ts (1 instances)

- Line 75 [services]: `metadata?: Record<string, any>;`

### packages/shared/src/controllers/shared-validation.controller.ts (1 instances)

- Line 76 [controllers]: `async validateBatch(@Body() data: { validations: Array<{ type: 'user' | 'product...`

### packages/shared/src/types/index.ts (1 instances)

- Line 63 [types]: `export interface ApiResponse<T = any> {`

### packages/types/src/index.ts (1 instances)

- Line 64 [types]: `export interface ApiResponse<T = any> {`

## Priority Recommendations

1. **Fix public API types first** (183 instances in guards, interceptors, controllers)
2. **Fix service layer types** (151 instances)
3. **Fix remaining internal types** (146 instances)

