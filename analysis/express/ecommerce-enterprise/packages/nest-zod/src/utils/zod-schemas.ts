import { z } from 'zod';

/**
 * Enterprise-grade Zod schema utilities and common schemas
 */

// Common validation patterns
export const CommonPatterns = {
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format'),
  url: z.string().url('Invalid URL format'),
  uuid: z.string().uuid('Invalid UUID format'),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  creditCard: z.string().regex(/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/, 'Invalid credit card format'),
  ipAddress: z.string().ip('Invalid IP address format'),
  dateTime: z.string().datetime('Invalid datetime format'),
  json: z.string().refine((val) => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, 'Invalid JSON format'),
};

// Pagination schemas
export const PaginationSchemas = {
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
};

export const PaginationQuerySchema = z.object({
  page: PaginationSchemas.page,
  limit: PaginationSchemas.limit,
  sort: PaginationSchemas.sort,
  order: PaginationSchemas.order,
  search: PaginationSchemas.search,
});

// Common entity schemas
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  deletedAt: z.date().optional(),
});

export const TimestampSchema = z.object({
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

// User-related schemas
export const UserRoleSchema = z.enum(['admin', 'user', 'moderator', 'guest']);
export const UserStatusSchema = z.enum(['active', 'inactive', 'suspended', 'pending']);

export const UserSchema = BaseEntitySchema.extend({
  email: CommonPatterns.email,
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  role: UserRoleSchema,
  status: UserStatusSchema,
  isEmailVerified: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  profile: z.object({
    avatar: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    phone: CommonPatterns.phone.optional(),
    address: z.object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      zipCode: z.string().optional(),
    }).optional(),
  }).optional(),
});

// Product schemas
export const ProductCategorySchema = z.enum(['electronics', 'clothing', 'books', 'home', 'sports']);
export const ProductStatusSchema = z.enum(['active', 'inactive', 'discontinued', 'draft']);

export const ProductSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  price: z.number().positive(),
  currency: z.string().length(3).default('USD'),
  category: ProductCategorySchema,
  status: ProductStatusSchema,
  sku: z.string().min(1).max(50),
  stock: z.number().int().min(0).default(0),
  images: z.array(z.string().url()).default([]),
  tags: z.array(z.string()).default([]),
  specifications: z.record(z.string(), z.any()).optional(),
  dimensions: z.object({
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
    depth: z.number().positive().optional(),
    weight: z.number().positive().optional(),
  }).optional(),
});

// Order schemas
export const OrderStatusSchema = z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']);
export const PaymentStatusSchema = z.enum(['pending', 'paid', 'failed', 'refunded', 'partially_refunded']);

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
  total: z.number().positive(),
});

export const OrderSchema = BaseEntitySchema.extend({
  userId: z.string().uuid(),
  items: z.array(OrderItemSchema).min(1),
  status: OrderStatusSchema,
  paymentStatus: PaymentStatusSchema,
  subtotal: z.number().positive(),
  tax: z.number().min(0).default(0),
  shipping: z.number().min(0).default(0),
  total: z.number().positive(),
  shippingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().min(1),
    phone: CommonPatterns.phone.optional(),
  }),
  billingAddress: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    country: z.string().min(1),
    zipCode: z.string().min(1),
    phone: CommonPatterns.phone.optional(),
  }).optional(),
  notes: z.string().max(1000).optional(),
});

// API Response schemas
export const ApiResponseSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
    }).optional(),
    metadata: z.object({
      timestamp: z.string().datetime(),
      requestId: z.string().optional(),
      version: z.string().optional(),
    }).optional(),
  });

export const PaginatedResponseSchema = <T extends z.ZodSchema>(dataSchema: T) =>
  ApiResponseSchema(z.object({
    items: z.array(dataSchema),
    pagination: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().min(0),
      pages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
    }),
  }));

// Validation utilities
export const ValidationUtils = {
  /**
   * Create a schema that validates against multiple schemas (union)
   */
  union: (...schemas: z.ZodSchema[]) => {
    if (schemas.length < 2) {
      throw new Error('Union requires at least 2 schemas');
    }
    return z.union([schemas[0], schemas[1], ...schemas.slice(2)] as [z.ZodSchema, z.ZodSchema, ...z.ZodSchema[]]);
  },

  /**
   * Create a schema that validates against any of the provided schemas
   */
  anyOf: <T extends z.ZodSchema[]>(...schemas: T) => z.any().refine(
    (val) => schemas.some(schema => {
      try { schema.parse(val); return true; } catch { return false; }
    }),
    'Value must match at least one of the provided schemas'
  ),

  /**
   * Create a conditional schema based on a condition
   */
  conditional: <T extends z.ZodSchema, U extends z.ZodSchema>(
    condition: (val: any) => boolean,
    trueSchema: T,
    falseSchema: U
  ) => z.any().refine(
    (val) => {
      const schema = condition(val) ? trueSchema : falseSchema;
      try { schema.parse(val); return true; } catch { return false; }
    },
    'Value must match the conditional schema'
  ),

  /**
   * Create a schema with custom error messages
   */
  withCustomErrors: <T extends z.ZodSchema>(
    schema: T,
    errorMap: Record<string, string>
  ) => {
    return schema.transform((data) => {
      try {
        return schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const customErrors = error.errors.map(issue => {
            const key = `${issue.code}_${issue.path.join('.')}`;
            const message = errorMap[key] || errorMap[issue.code] || issue.message;
            return { ...issue, message };
          });
          throw new z.ZodError(customErrors);
        }
        throw error;
      }
    });
  },

  /**
   * Create a schema that validates async
   */
  async: <T extends z.ZodSchema>(
    schema: T,
    asyncValidator: (val: z.infer<T>) => Promise<boolean>,
    errorMessage?: string
  ) => schema.refine(asyncValidator, errorMessage),

  /**
   * Create a schema with caching
   */
  cached: <T extends z.ZodSchema>(
    schema: T,
    cacheKey?: (val: any) => string
  ) => {
    const cache = new Map<string, any>();
    
    return schema.transform((val) => {
      const key = cacheKey ? cacheKey(val) : JSON.stringify(val);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = schema.parse(val);
      cache.set(key, result);
      return result;
    });
  },
};

// Common error maps for different locales
export const ErrorMaps = {
  en: z.defaultErrorMap,
  es: (issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx) => {
    const messages: Record<string, string> = {
      'invalid_type': 'Tipo inválido',
      'invalid_string': 'Cadena inválida',
      'too_small': 'Valor muy pequeño',
      'too_big': 'Valor muy grande',
      'invalid_enum_value': 'Valor de enumeración inválido',
      'custom': 'Validación personalizada fallida',
    };
    return { message: messages[issue.code] || ctx.defaultError || 'Error de validación' };
  },
  fr: (issue: z.ZodIssueOptionalMessage, ctx: z.ErrorMapCtx) => {
    const messages: Record<string, string> = {
      'invalid_type': 'Type invalide',
      'invalid_string': 'Chaîne invalide',
      'too_small': 'Valeur trop petite',
      'too_big': 'Valeur trop grande',
      'invalid_enum_value': 'Valeur d\'énumération invalide',
      'custom': 'Validation personnalisée échouée',
    };
    return { message: messages[issue.code] || ctx.defaultError || 'Erreur de validation' };
  },
};

// Schema composition utilities
export const SchemaComposition = {
  /**
   * Merge multiple schemas into one
   */
  merge: <T extends z.ZodSchema[]>(...schemas: T) => {
    return schemas.reduce((acc, schema) => {
      if (acc instanceof z.ZodObject && schema instanceof z.ZodObject) {
        return acc.merge(schema);
      }
      return acc.and(schema);
    });
  },

  /**
   * Pick specific fields from a schema
   */
  pick: <T extends z.ZodObject<any>, K extends keyof T['shape']>(
    schema: T,
    keys: K[]
  ) => schema.pick(keys.reduce((acc, key) => ({ ...acc, [key]: true }), {}) as any),

  /**
   * Omit specific fields from a schema
   */
  omit: <T extends z.ZodObject<any>, K extends keyof T['shape']>(
    schema: T,
    keys: K[]
  ) => schema.omit(keys.reduce((acc, key) => ({ ...acc, [key]: true }), {}) as any),

  /**
   * Create a partial schema
   */
  partial: <T extends z.ZodObject<any>>(schema: T) => schema.partial(),

  /**
   * Create a required schema
   */
  required: <T extends z.ZodObject<any>>(schema: T) => schema.required(),
};
