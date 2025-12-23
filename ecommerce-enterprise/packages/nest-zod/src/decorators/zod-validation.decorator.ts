import { SetMetadata } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationOptions } from '../interfaces/zod-validation.interface';

export const ZOD_VALIDATION_METADATA = 'zod:validation';

/**
 * Decorator for applying Zod validation to controller methods
 * 
 * @example
 * ```typescript
 * @Post()
 * @ZodValidation({
 *   schema: CreateUserSchema,
 *   transform: true,
 *   whitelist: true,
 *   audit: true,
 *   metrics: true
 * })
 * async createUser(@Body() data: CreateUserDto) {
 *   return this.userService.create(data);
 * }
 * ```
 */
export function ZodValidation(options: ZodValidationOptions) {
  return SetMetadata(ZOD_VALIDATION_METADATA, options);
}

/**
 * Decorator for validating request body with Zod
 * 
 * @example
 * ```typescript
 * @Post()
 * @ValidateBody(CreateUserSchema, { transform: true, audit: true })
 * async createUser(@Body() data: CreateUserDto) {
 *   return this.userService.create(data);
 * }
 * ```
 */
export function ValidateBody<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>
) {
  return ZodValidation({
    schema,
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    audit: true,
    metrics: true,
    ...options,
  });
}

/**
 * Decorator for validating query parameters with Zod
 * 
 * @example
 * ```typescript
 * @Get()
 * @ValidateQuery(GetUsersQuerySchema, { transform: true })
 * async getUsers(@Query() query: GetUsersQueryDto) {
 *   return this.userService.findAll(query);
 * }
 * ```
 */
export function ValidateQuery<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>
) {
  return ZodValidation({
    schema,
    transform: true,
    whitelist: true,
    skipMissingProperties: true,
    audit: true,
    ...options,
  });
}

/**
 * Decorator for validating route parameters with Zod
 * 
 * @example
 * ```typescript
 * @Get(':id')
 * @ValidateParams(GetUserParamsSchema)
 * async getUser(@Param() params: GetUserParamsDto) {
 *   return this.userService.findOne(params.id);
 * }
 * ```
 */
export function ValidateParams<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>
) {
  return ZodValidation({
    schema,
    transform: true,
    whitelist: true,
    audit: true,
    ...options,
  });
}

/**
 * Decorator for validating headers with Zod
 * 
 * @example
 * ```typescript
 * @Get()
 * @ValidateHeaders(RequiredHeadersSchema)
 * async getData(@Headers() headers: RequiredHeadersDto) {
 *   return this.dataService.getData(headers);
 * }
 * ```
 */
export function ValidateHeaders<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>
) {
  return ZodValidation({
    schema,
    transform: true,
    whitelist: true,
    skipMissingProperties: true,
    audit: true,
    ...options,
  });
}

/**
 * Advanced decorator for complex validation scenarios
 * 
 * @example
 * ```typescript
 * @Post()
 * @AdvancedValidation({
 *   schema: CreateOrderSchema,
 *   transform: true,
 *   whitelist: true,
 *   forbidNonWhitelisted: true,
 *   audit: true,
 *   metrics: true,
 *   tracing: true,
 *   rateLimit: { maxRequests: 100, windowMs: 60000 },
 *   customErrorMap: customErrorMap,
 *   context: { version: 'v2', feature: 'orders' }
 * })
 * async createOrder(@Body() data: CreateOrderDto) {
 *   return this.orderService.create(data);
 * }
 * ```
 */
export function AdvancedValidation(options: ZodValidationOptions) {
  return ZodValidation(options);
}

/**
 * Decorator for conditional validation based on request context
 * 
 * @example
 * ```typescript
 * @Post()
 * @ConditionalValidation((req) => ({
 *   schema: req.user.role === 'admin' ? AdminCreateUserSchema : UserCreateUserSchema,
 *   transform: true,
 *   audit: true
 * }))
 * async createUser(@Body() data: CreateUserDto) {
 *   return this.userService.create(data);
 * }
 * ```
 */
export function BasicConditionalValidation(
  optionsFactory: (request: unknown) => ZodValidationOptions
) {
  return SetMetadata(ZOD_VALIDATION_METADATA, { conditional: true, optionsFactory });
}

/**
 * Decorator for async validation with custom business logic
 * 
 * @example
 * ```typescript
 * @Post()
 * @AsyncValidation({
 *   schema: CreateUserSchema,
 *   async: true,
 *   timeout: 5000,
 *   audit: true,
 *   context: { validateUniqueness: true }
 * })
 * async createUser(@Body() data: CreateUserDto) {
 *   return this.userService.create(data);
 * }
 * ```
 */
export function AsyncValidation<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions>
) {
  return ZodValidation({
    schema,
    async: true,
    timeout: 5000,
    audit: true,
    metrics: true,
    ...options,
  });
}

/**
 * Decorator for batch validation of arrays
 * 
 * @example
 * ```typescript
 * @Post('batch')
 * @BatchValidation(CreateUserSchema, { maxItems: 100, audit: true })
 * async createUsers(@Body() data: CreateUserDto[]) {
 *   return this.userService.createBatch(data);
 * }
 * ```
 */
export function BatchValidation<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions> & { maxItems?: number }
) {
  const { maxItems = 100, ...validationOptions } = options || {};
  
  return ZodValidation({
    schema: z.array(schema).max(maxItems),
    transform: true,
    whitelist: true,
    audit: true,
    metrics: true,
    context: { batchValidation: true, maxItems },
    ...validationOptions,
  });
}

/**
 * Decorator for file upload validation
 * 
 * @example
 * ```typescript
 * @Post('upload')
 * @FileValidation(FileUploadSchema, { 
 *   maxFileSize: 10 * 1024 * 1024,
 *   allowedTypes: ['image/jpeg', 'image/png']
 * })
 * async uploadFile(@UploadedFile() file: Express.Multer.File) {
 *   return this.fileService.upload(file);
 * }
 * ```
 */
export function FileValidation<T extends z.ZodSchema>(
  schema: T,
  options?: Partial<ZodValidationOptions> & { 
    maxFileSize?: number;
    allowedTypes?: string[];
  }
) {
  const { maxFileSize, allowedTypes, ...validationOptions } = options || {};
  
  return ZodValidation({
    schema,
    transform: true,
    whitelist: true,
    audit: true,
    metrics: true,
    context: { 
      fileValidation: true, 
      maxFileSize, 
      allowedTypes 
    },
    ...validationOptions,
  });
}
