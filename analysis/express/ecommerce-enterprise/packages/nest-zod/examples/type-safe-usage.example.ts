/**
 * Type-Safe @nest-zod Usage Examples
 * 
 * This file demonstrates how to use the new type-safe APIs
 * that eliminate the need for `any` assertions while maintaining
 * full compatibility with Zod's internal architecture.
 */

import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { z } from 'zod';
import {
  TypeSafeSchemaComposer,
  typeSafePick,
  // typeSafeOmit, // Not used in this example
  typeSafePartial,
  // typeSafeRequired, // Not used in this example
  typeSafeMerge,
  analyzeZodError,
  formatZodErrorForUser,
  formatZodErrorForAPI,
  getSafeSchemaType,
  isZodObjectSchema,
  getSafeSchemaShape,
  attemptZodErrorRecovery,
} from '../src';

// ============================================================================
// Example Schemas
// ============================================================================

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  age: z.number().min(18).max(120),
  role: z.enum(['user', 'admin', 'moderator']),
  preferences: z.object({
    theme: z.enum(['light', 'dark']),
    notifications: z.boolean(),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

const ProductSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  price: z.number().positive(),
  category: z.string(),
  inStock: z.boolean(),
  tags: z.array(z.string()),
});

// ============================================================================
// Type-Safe Schema Composition Examples
// ============================================================================

@Controller('type-safe-examples')
export class TypeSafeExamplesController {
  
  /**
   * Example 1: Basic Type-Safe Schema Composition
   */
  @Post('users')
  async createUser(@Body() data: unknown) {
    try {
      // Create a type-safe schema composer
      const userComposer = TypeSafeSchemaComposer.create(UserSchema, {
        name: 'user-creation',
        description: 'Enhanced user creation schema',
      });

      // Add transformations with full type safety
      const enhancedSchema = userComposer
        .transform((data) => ({
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
          // TypeScript knows the exact shape of data here
        }))
        .crossField(
          (data) => data.age >= 18 || data.role === 'admin',
          'Users must be 18+ or have admin role'
        )
        .crossField(
          (data) => !data.email.includes('test@'),
          'Test emails are not allowed'
        )
        .build();

      // Parse with full type safety
      const result = enhancedSchema.parse(data);
      
      return {
        success: true,
        data: result,
        // TypeScript knows the exact type of result
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Type-safe error handling
        const analysis = analyzeZodError(error);
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 5,
        });

        return {
          success: false,
          error: 'Validation failed',
          message: userMessage,
          details: analysis.summary,
        };
      }
      throw error;
    }
  }

  /**
   * Example 2: Schema Picking and Omitting
   */
  @Get('users/:id')
  async getUser(@Query() query: { fields?: string }) {
    try {
      const fields = (query.fields?.split(',') || ['id', 'name', 'email']) as string[];
      
      // Type-safe schema picking
      const publicUserSchema = typeSafePick(UserSchema, fields as (keyof z.infer<typeof UserSchema>)[]);
      
      // TypeScript knows the exact shape of the picked schema
      const userData = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'John Doe',
        email: 'john@example.com',
        // Only the picked fields are required
      };

      const result = publicUserSchema.parse(userData);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const apiResponse = formatZodErrorForAPI(error, {
          includeDetails: true,
          includeSuggestions: true,
        });
        
        return {
          success: false,
          ...apiResponse,
        };
      }
      throw error;
    }
  }

  /**
   * Example 3: Schema Partial and Required
   */
  @Post('users/:id/update')
  async updateUser(@Body() data: unknown) {
    try {
      // Create a partial schema for updates
      const updateSchema = typeSafePartial(UserSchema);
      
      // TypeScript knows this is a partial schema
      const result = updateSchema.parse(data);
      
      return {
        success: true,
        data: result,
        // TypeScript knows which fields are optional
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const analysis = analyzeZodError(error);
        
        return {
          success: false,
          error: 'Update validation failed',
          issues: analysis.issues,
          suggestions: analysis.suggestions,
        };
      }
      throw error;
    }
  }

  /**
   * Example 4: Schema Merging
   */
  @Post('products')
  async createProduct(@Body() data: unknown) {
    try {
      // Merge user and product schemas
      const userProductSchema = typeSafeMerge(UserSchema, ProductSchema);
      
      // TypeScript knows the merged shape
      const result = userProductSchema.parse(data);
      
      return {
        success: true,
        data: result,
        // TypeScript knows all fields from both schemas
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const userMessage = formatZodErrorForUser(error);
        
        return {
          success: false,
          error: 'Product creation failed',
          message: userMessage,
        };
      }
      throw error;
    }
  }

  /**
   * Example 5: Advanced Schema Composition
   */
  @Post('users/advanced')
  async createAdvancedUser(@Body() data: unknown) {
    try {
      const advancedComposer = TypeSafeSchemaComposer.create(UserSchema, {
        name: 'advanced-user',
        description: 'Advanced user creation with complex validation',
      });

      const advancedSchema = advancedComposer
        .transform((data) => {
          // Complex transformation with full type safety
          return {
            ...data,
            id: data.id || crypto.randomUUID(),
            createdAt: new Date(),
            updatedAt: new Date(),
            preferences: {
              theme: data.preferences?.theme || 'light',
              notifications: data.preferences?.notifications ?? true,
            },
          };
        })
        .crossField(
          (data) => {
            // Complex cross-field validation
            if (data.role === 'admin') {
              return data.age >= 21; // Admins must be 21+
            }
            return data.age >= 18; // Regular users must be 18+
          },
          'Age requirements not met for selected role'
        )
        .crossField(
          (data) => {
            // Email domain validation
            const allowedDomains = ['company.com', 'partner.com'];
            const domain = data.email.split('@')[1];
            return domain ? allowedDomains.includes(domain) : false;
          },
          'Email must be from allowed domain'
        )
        .objectValidation(
          (data) => {
            // Object-level validation
            return data.name.length >= 2 && data.name.length <= 50;
          },
          'Name must be between 2 and 50 characters'
        )
        .build();

      const result = advancedSchema.parse(data);
      
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const analysis = analyzeZodError(error);
        const userMessage = formatZodErrorForUser(error, {
          includePath: true,
          includeContext: true,
          maxIssues: 10,
        });

        return {
          success: false,
          error: 'Advanced user creation failed',
          message: userMessage,
          severity: analysis.summary.severity,
          issueTypes: analysis.summary.issueTypes,
          suggestions: analysis.suggestions,
        };
      }
      throw error;
    }
  }

  /**
   * Example 6: Schema Analysis and Introspection
   */
  @Get('schemas/analyze')
  async analyzeSchema(@Query() query: { schemaName: string }) {
    const schemas = {
      user: UserSchema,
      product: ProductSchema,
    };

    const schema = schemas[query.schemaName as keyof typeof schemas];
    
    if (!schema) {
      return {
        success: false,
        error: 'Schema not found',
      };
    }

    // Type-safe schema analysis
    const analysis = {
      type: getSafeSchemaType(schema),
      isObject: isZodObjectSchema(schema),
      shape: isZodObjectSchema(schema) ? getSafeSchemaShape(schema) : undefined,
      // No more any assertions needed!
    };

    return {
      success: true,
      analysis,
    };
  }

  /**
   * Example 7: Error Recovery
   */
  @Post('users/recover')
  async createUserWithRecovery(@Body() data: unknown) {
    try {
      const result = UserSchema.parse(data);
      return { success: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Attempt error recovery
        const recovery = attemptZodErrorRecovery(data, UserSchema, error);
        
        if (recovery.recovered) {
          return {
            success: true,
            data: recovery.data,
            recovered: true,
            message: 'Data was automatically corrected',
          };
        } else {
          const userMessage = formatZodErrorForUser(error);
          return {
            success: false,
            error: 'Validation failed and could not be recovered',
            message: userMessage,
            remainingErrors: recovery.remainingErrors?.issues.length || 0,
          };
        }
      }
      throw error;
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Helper function to demonstrate type-safe error handling
 */
function handleValidationError(error: z.ZodError, context: string) {
  const analysis = analyzeZodError(error);
  
  // Log for debugging
  console.error(`Validation error in ${context}:`, {
    severity: analysis.summary.severity,
    totalIssues: analysis.summary.totalIssues,
    issueTypes: analysis.summary.issueTypes,
  });

  // Return user-friendly message
  return formatZodErrorForUser(error, {
    includePath: true,
    includeContext: true,
  });
}

/**
 * Helper function to demonstrate schema introspection
 */
function introspectSchema(schema: z.ZodSchema) {
  const type = getSafeSchemaType(schema);
  
  if (isZodObjectSchema(schema)) {
    const shape = getSafeSchemaShape(schema);
    return {
      type,
      isObject: true,
      fields: Object.keys(shape || {}),
      fieldTypes: Object.entries(shape || {}).map(([key, fieldSchema]) => ({
        field: key,
        type: getSafeSchemaType(fieldSchema),
      })),
    };
  }
  
  return {
    type,
    isObject: false,
  };
}

// ============================================================================
// Export for testing
// ============================================================================

export {
  UserSchema,
  ProductSchema,
  handleValidationError,
  introspectSchema,
};
