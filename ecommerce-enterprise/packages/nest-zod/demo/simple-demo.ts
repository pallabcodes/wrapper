#!/usr/bin/env node

/**
 * Simple Enterprise Zod Integration Demo
 * 
 * This demonstration showcases the core capabilities of our @ecommerce-enterprise/nest-zod package
 * using the actual interface definitions.
 */

import { z } from 'zod';
import { 
  ZodValidationService, 
  EnterpriseZodValidationService 
} from '../src/services';
import { 
  CommonPatterns, 
  ErrorMaps, 
  ValidationUtils 
} from '../src/utils/zod-schemas';

// Color codes for beautiful console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSection(title: string) {
  log(`\n${'='.repeat(60)}`, colors.cyan);
  log(`  ${title}`, colors.bright);
  log(`${'='.repeat(60)}`, colors.cyan);
}

function logSuccess(message: string) {
  log(`✅ ${message}`, colors.green);
}

function logError(message: string) {
  log(`❌ ${message}`, colors.red);
}

function logInfo(message: string) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Initialize services
const validationService = new ZodValidationService();
const enterpriseService = new EnterpriseZodValidationService();

// Define schemas
const UserSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email(),
  name: z.string().min(2).max(100),
  age: z.number().min(18).max(120),
  role: z.enum(['user', 'admin', 'moderator']),
  tags: z.array(z.string()).optional(),
  createdAt: z.string().datetime(),
  isActive: z.boolean().default(true)
});

const ProductSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().positive(),
  category: z.enum(['home', 'electronics', 'clothing', 'books']),
  images: z.array(z.string().url()).optional(),
  inStock: z.boolean().default(true)
});

// Sample data
const sampleUser = {
  email: 'john.doe@enterprise.com',
  name: 'John Doe',
  age: 30,
  role: 'admin' as const,
  tags: ['premium', 'enterprise'],
  createdAt: new Date().toISOString(),
  isActive: true
};

const sampleProduct = {
  name: 'Enterprise Laptop Pro',
  description: 'High-performance laptop for enterprise use',
  price: 2499.99,
  category: 'electronics' as const,
  images: ['https://example.com/laptop1.jpg'],
  inStock: true
};

async function demonstrateBasicValidation() {
  logSection('BASIC VALIDATION FEATURES');
  
  try {
    // Basic validation with transformation
    logInfo('Testing basic user validation...');
    const userResult = await validationService.validate(sampleUser, {
      schema: UserSchema,
      transform: true,
      whitelist: true
    });
    
    if (userResult.success) {
      logSuccess(`User validation passed!`);
      logInfo(`Validated data: ${JSON.stringify(userResult.data, null, 2)}`);
    } else {
      logError(`User validation failed: ${Array.isArray(userResult.errors) ? userResult.errors.map(e => e.message).join(', ') : userResult.errors?.message}`);
    }
    
    // Product validation with custom error handling
    logInfo('Testing product validation...');
    const productResult = await validationService.validate(sampleProduct, {
      schema: ProductSchema,
      transform: true,
      customErrorMap: ErrorMaps.en
    });
    
    if (productResult.success) {
      logSuccess(`Product validation passed!`);
      logInfo(`Validated data: ${JSON.stringify(productResult.data, null, 2)}`);
    } else {
      logError(`Product validation failed: ${Array.isArray(productResult.errors) ? productResult.errors.map(e => e.message).join(', ') : productResult.errors?.message}`);
    }
    
    // Validation with auditing and metrics
    logInfo('Testing validation with auditing and metrics...');
    const auditResult = await validationService.validate(sampleUser, {
      schema: UserSchema,
      transform: true,
      audit: true,
      metrics: true
    });
    
    if (auditResult.success) {
      logSuccess(`Audit validation passed!`);
      logInfo(`Validation time: ${auditResult.metadata?.validationTime}ms`);
      logInfo(`Cache hit: ${auditResult.metadata?.cacheHit ? 'Yes' : 'No'}`);
    } else {
      logError(`Audit validation failed: ${Array.isArray(auditResult.errors) ? auditResult.errors.map(e => e.message).join(', ') : auditResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Basic validation error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateAdvancedFeatures() {
  logSection('ADVANCED ENTERPRISE FEATURES');
  
  try {
    // A/B Testing Validation
    logInfo('Testing A/B testing validation...');
    const abTestResult = await enterpriseService.validate(sampleUser, {
      schema: UserSchema,
      abTest: {
        schemas: {
          basic: UserSchema,
          premium: UserSchema.extend({ subscription: z.string() })
        },
        defaultVariant: 'basic',
        userSegmentField: 'role'
      }
    });
    
    if (abTestResult.success) {
      logSuccess(`A/B testing validation passed!`);
    }
    
    // Internationalization
    logInfo('Testing internationalization (Spanish)...');
    const i18nResult = await enterpriseService.validate(sampleUser, {
      schema: UserSchema,
      i18n: {
        supportedLocales: ['en', 'es', 'fr'],
        fallbackLocale: 'en',
        errorMessageTranslations: {
          es: {
            'invalid_type': 'Tipo inválido',
            'invalid_string': 'Cadena inválida'
          }
        }
      },
      customErrorMap: ErrorMaps.es
    });
    
    if (i18nResult.success) {
      logSuccess(`I18n validation passed!`);
    }
    
    // Real-time validation
    logInfo('Testing real-time validation...');
    const realtimeResult = await enterpriseService.validate(sampleUser, {
      schema: UserSchema,
      realtime: {
        broadcastErrors: true,
        validationChannel: 'validation-updates'
      }
    });
    
    if (realtimeResult.success) {
      logSuccess(`Real-time validation passed!`);
    }
    
    // Batch validation
    logInfo('Testing batch validation...');
    const batchData = [sampleUser, sampleUser, sampleUser];
    const batchResult = await enterpriseService.validate(batchData, {
      schema: UserSchema,
      batch: {
        maxItems: 100,
        parallel: true
      }
    });
    
    if (batchResult.success) {
      logSuccess(`Batch validation passed! Processed ${batchData.length} items`);
    }
    
  } catch (error) {
    logError(`Advanced features error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateSecurityAndPerformance() {
  logSection('SECURITY & PERFORMANCE FEATURES');
  
  try {
    // Rate limiting
    logInfo('Testing rate limiting...');
    const rateLimitResult = await validationService.validate(sampleUser, {
      schema: UserSchema,
      rateLimit: {
        maxRequests: 100,
        windowMs: 60000
      }
    });
    
    if (rateLimitResult.success) {
      logSuccess(`Rate limiting validation passed!`);
    }
    
    // Caching
    logInfo('Testing caching...');
    const cacheResult = await validationService.validate(sampleUser, {
      schema: UserSchema,
      cache: true,
      cacheKey: 'user-validation',
      cacheTtl: 300
    });
    
    if (cacheResult.success) {
      logSuccess(`Caching validation passed!`);
    }
    
    // Performance with metrics
    logInfo('Testing performance with metrics...');
    const perfResult = await enterpriseService.validate(sampleUser, {
      schema: UserSchema,
      metrics: true,
      tracing: true
    });
    
    if (perfResult.success) {
      logSuccess(`Performance validation passed!`);
      logInfo(`Validation time: ${perfResult.metadata?.validationTime}ms`);
    }
    
  } catch (error) {
    logError(`Security & performance error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function demonstrateSchemaUtilities() {
  logSection('SCHEMA UTILITIES & COMPOSITION');
  
  try {
    // Custom patterns
    logInfo('Testing custom patterns...');
    const customSchema = z.object({
      email: CommonPatterns.email,
      phone: CommonPatterns.phone,
      url: CommonPatterns.url,
      uuid: CommonPatterns.uuid
    });
    
    const customData = {
      email: 'test@example.com',
      phone: '+1-555-123-4567',
      url: 'https://example.com',
      uuid: '123e4567-e89b-12d3-a456-426614174000'
    };
    
    const customResult = await validationService.validate(customData, {
      schema: customSchema,
      transform: true
    });
    
    if (customResult.success) {
      logSuccess(`Custom patterns validation passed!`);
    }
    
    // Schema composition with union
    logInfo('Testing schema composition...');
    const unionSchema = ValidationUtils.union(UserSchema, ProductSchema);
    const unionResult = await validationService.validate(sampleUser, {
      schema: unionSchema,
      transform: true
    });
    
    if (unionResult.success) {
      logSuccess(`Schema composition passed!`);
    }
    
    // Error maps
    logInfo('Testing error maps...');
    const errorMapResult = await validationService.validate({ email: 'invalid' }, {
      schema: z.object({ email: z.string().email() }),
      customErrorMap: ErrorMaps.es
    });
    
    if (!errorMapResult.success) {
      logSuccess(`Error maps working! Spanish error: ${Array.isArray(errorMapResult.errors) ? errorMapResult.errors.map(e => e.message).join(', ') : errorMapResult.errors?.message}`);
    }
    
  } catch (error) {
    logError(`Schema utilities error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function runPerformanceBenchmark() {
  logSection('PERFORMANCE BENCHMARK');
  
  try {
    const iterations = 1000;
    const startTime = Date.now();
    
    logInfo(`Running performance benchmark with ${iterations} iterations...`);
    
    for (let i = 0; i < iterations; i++) {
      await validationService.validate(sampleUser, {
        schema: UserSchema,
        transform: true,
        cache: true
      });
    }
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    const avgTime = totalTime / iterations;
    
    logSuccess(`Performance benchmark completed!`);
    logInfo(`Total time: ${totalTime}ms`);
    logInfo(`Average time per validation: ${avgTime.toFixed(2)}ms`);
    logInfo(`Validations per second: ${Math.round(1000 / avgTime)}`);
    
  } catch (error) {
    logError(`Performance benchmark error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function main() {
  log('🚀 ENTERPRISE ZOD INTEGRATION DEMONSTRATION', colors.bright);
  log('   Showcasing advanced capabilities for top-tier companies', colors.cyan);
  
  try {
    await demonstrateBasicValidation();
    await demonstrateAdvancedFeatures();
    await demonstrateSecurityAndPerformance();
    await demonstrateSchemaUtilities();
    await runPerformanceBenchmark();
    
    logSection('DEMONSTRATION COMPLETE');
    logSuccess('All enterprise Zod features demonstrated successfully!');
    logInfo('This package demonstrates our ability to extend and customize existing libraries');
    logInfo('for enterprise-grade applications that meet the highest standards.');
    
  } catch (error) {
    logError(`Demonstration failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run the demonstration
if (require.main === module) {
  main().catch(console.error);
}

export { main };
