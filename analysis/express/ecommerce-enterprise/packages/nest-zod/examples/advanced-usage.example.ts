import { z } from 'zod';
import {
  CommonPatterns
} from '../src/utils/zod-schemas';

// This is a demonstration file showing how to use the @ecommerce-enterprise/nest-zod package
// In a real NestJS application, you would import the necessary decorators from @nestjs/common

// Define schemas using Zod directly
const UserSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().min(18).max(120),
  role: z.enum(['user', 'admin', 'moderator']),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  isActive: z.boolean().default(true)
});

const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['home', 'electronics', 'clothing', 'books']),
  images: z.array(z.string().url()).optional(),
  inStock: z.boolean().default(true),
  metadata: z.record(z.unknown()).optional()
});

const OrderSchema = z.object({
  id: z.string().optional(),
  total: z.number().positive(),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  userId: z.string(),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string()
  }),
  products: z.array(z.object({
    productId: z.string(),
    quantity: z.number().positive(),
    price: z.number().positive()
  }))
});

// Example usage of our enterprise Zod validation decorators
export class AdvancedZodExamplesService {
  
  // Basic validation with transformation and auditing
  async createUser(userData: unknown) {
    // In a real NestJS controller, this would be decorated with @ValidateBody
    const validationResult = UserSchema.safeParse(userData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Advanced validation with custom error handling
  async createProduct(productData: unknown) {
    // In a real NestJS controller, this would be decorated with @AdvancedValidation
    const validationResult = ProductSchema.safeParse(productData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Conditional validation example
  async createUserWithRole(userData: unknown, userRole: string) {
    // In a real NestJS controller, this would use @ConditionalValidation
    const schema = userRole === 'admin' 
      ? UserSchema.extend({ permissions: z.array(z.string()) })
      : UserSchema;
    
    const validationResult = schema.safeParse(userData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Batch validation example
  async createMultipleProducts(productsData: unknown[]) {
    // In a real NestJS controller, this would use @BatchValidation
    const results = productsData.map((product, index) => {
      const validationResult = ProductSchema.safeParse(product);
      return {
        index,
        success: validationResult.success,
        data: validationResult.success ? validationResult.data : null,
        error: validationResult.success ? null : validationResult.error.message
      };
    });
    
    return { success: true, results };
  }

  // File upload validation example
  async uploadFile(uploadData: unknown) {
    // In a real NestJS controller, this would use @FileValidation
    const FileUploadSchema = z.object({
      file: z.object({
        fieldname: z.string(),
        originalname: z.string(),
        mimetype: z.string(),
        size: z.number().positive(),
        buffer: z.any() // Buffer type
      }),
      metadata: z.object({
        category: z.string(),
        description: z.string().optional()
      })
    });
    
    const validationResult = FileUploadSchema.safeParse(uploadData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Query parameter validation example
  async searchProducts(query: unknown) {
    // In a real NestJS controller, this would use @ValidateQuery
    const QuerySchema = z.object({
      page: z.number().positive().default(1),
      limit: z.number().positive().max(100).default(10),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).default('asc'),
      search: z.string().optional(),
      category: z.string().optional(),
      minPrice: z.number().positive().optional(),
      maxPrice: z.number().positive().optional(),
      inStock: z.boolean().optional()
    });
    
    const validationResult = QuerySchema.safeParse(query);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, query: validationResult.data };
  }

  // Complex validation with custom error messages
  async createOrderWithCustomErrors(orderData: unknown) {
    // In a real NestJS controller, this would use @AdvancedValidation with customErrorMap
    const CustomOrderSchema = OrderSchema.extend({
      email: CommonPatterns.email,
      phone: CommonPatterns.phone
    });
    
    const validationResult = CustomOrderSchema.safeParse(orderData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // A/B testing validation example
  async createUserWithABTesting(userData: unknown, variant: string) {
    // In a real NestJS controller, this would use @AdvancedValidation with A/B testing
    const baseSchema = UserSchema;
    const premiumSchema = baseSchema.extend({
      subscription: z.object({
        plan: z.enum(['basic', 'premium', 'enterprise']),
        features: z.array(z.string())
      })
    });
    
    const schema = variant === 'premium' ? premiumSchema : baseSchema;
    const validationResult = schema.safeParse(userData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Internationalization validation example
  async createUserWithI18n(userData: unknown, _locale: string) {
    // In a real NestJS controller, this would use @AdvancedValidation with i18n
    // The errorMap would be used in the decorator configuration based on locale
    const validationResult = UserSchema.safeParse(userData);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Cached validation example
  async getUserById(id: string) {
    // In a real NestJS controller, this would use @ValidateParams with caching
    const IdSchema = z.string().uuid();
    const validationResult = IdSchema.safeParse(id);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, id: validationResult.data };
  }

  // Rate limited validation example
  async processDataWithRateLimit(data: unknown) {
    // In a real NestJS controller, this would use @AdvancedValidation with rate limiting
    const DataSchema = z.object({
      data: z.string().min(1)
    });
    
    const validationResult = DataSchema.safeParse(data);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }

  // Real-time validation example
  async validateRealtimeData(data: unknown) {
    // In a real NestJS controller, this would use @AdvancedValidation with real-time features
    const RealtimeSchema = z.object({
      event: z.string(),
      timestamp: z.number(),
      payload: z.record(z.unknown())
    });
    
    const validationResult = RealtimeSchema.safeParse(data);
    
    if (!validationResult.success) {
      throw new Error(`Validation failed: ${validationResult.error.message}`);
    }
    
    return { success: true, data: validationResult.data };
  }
}

// Example of how to use the service
export async function demonstrateZodIntegration() {
  const service = new AdvancedZodExamplesService();
  
  try {
    // Test user creation
    const userResult = await service.createUser({
      email: 'test@example.com',
      name: 'John Doe',
      age: 30,
      role: 'user',
      createdAt: new Date().toISOString(),
      isActive: true
    });
    console.log('User created:', userResult);
    
    // Test product creation
    const productResult = await service.createProduct({
      name: 'Test Product',
      price: 99.99,
      category: 'electronics',
      inStock: true
    });
    console.log('Product created:', productResult);
    
    // Test batch validation
    const batchResult = await service.createMultipleProducts([
      { name: 'Product 1', price: 10.99, category: 'home' },
      { name: 'Product 2', price: 20.99, category: 'electronics' }
    ]);
    console.log('Batch validation:', batchResult);
    
  } catch (error) {
    console.error('Validation error:', error);
  }
}

// Export the schemas for use in other files
export {
  UserSchema,
  ProductSchema,
  OrderSchema
};