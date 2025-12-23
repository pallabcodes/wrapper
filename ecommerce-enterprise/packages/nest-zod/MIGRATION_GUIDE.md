# Migration Guide: From `any` to Type-Safe @nest-zod

This guide helps you migrate from the previous `any`-heavy implementation to our new type-safe alternatives.

## Overview

We've eliminated 93 instances of `as any` assertions by creating type-safe alternatives that respect Zod's internal architecture while providing better developer experience.

## Key Improvements

### 1. Type-Safe Schema Composition

**Before (using `any`):**
```typescript
// Old way - lots of any assertions
const schema = SchemaComposer.create(userSchema)
  .transform('add-timestamps', (schema) => 
    schema.extend({ /* ... */ }) as any
  )
  .validate('email-uniqueness', (schema) => 
    schema.refine(/* ... */) as any
  )
  .build();
```

**After (type-safe):**
```typescript
// New way - fully type-safe
import { TypeSafeSchemaComposer } from './utils/type-safe-schema-composition';

const schema = TypeSafeSchemaComposer.create(userSchema)
  .transform((data) => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  .crossField((data) => data.email !== 'test@example.com', 'Email already exists')
  .build();
```

### 2. Type-Safe Error Handling

**Before (using `any`):**
```typescript
// Old way - unsafe property access
const expected = (issue as any).expected;
const received = (issue as any).received;
const validation = (issue as any).validation;
```

**After (type-safe):**
```typescript
// New way - safe property access
import { analyzeZodError, formatZodErrorForUser } from './utils/type-safe-error-handling';

const analysis = analyzeZodError(error);
const userMessage = formatZodErrorForUser(error, {
  includePath: true,
  includeContext: true,
  maxIssues: 5
});
```

### 3. Type-Safe Schema Registry

**Before (using `any`):**
```typescript
// Old way - unsafe internal access
const typeName = (schema._def as any).typeName;
const shape = (schema._def as any).shape;
```

**After (type-safe):**
```typescript
// New way - safe internal access
import { getSafeSchemaType, getSafeSchemaShape, isZodObjectSchema } from './types/zod-internal.types';

if (isZodObjectSchema(schema)) {
  const typeName = getSafeSchemaType(schema);
  const shape = getSafeSchemaShape(schema);
}
```

## Migration Steps

### Step 1: Update Imports

Replace old imports with new type-safe alternatives:

```typescript
// Old imports
import { SchemaComposer } from './utils/schema-composition';
import { analyzeError } from './utils/error-debugging';

// New imports
import { TypeSafeSchemaComposer } from './utils/type-safe-schema-composition';
import { analyzeZodError, formatZodErrorForUser } from './utils/type-safe-error-handling';
import { getSafeSchemaType, isZodObjectSchema } from './types/zod-internal.types';
```

### Step 2: Update Schema Composition

Replace `SchemaComposer` with `TypeSafeSchemaComposer`:

```typescript
// Before
const composer = new SchemaComposer(userSchema);
const result = composer
  .transform('add-timestamps', (schema) => schema.extend({ /* ... */ }) as any)
  .build();

// After
const composer = TypeSafeSchemaComposer.create(userSchema);
const result = composer
  .transform((data) => ({ ...data, timestamps: { /* ... */ } }))
  .build();
```

### Step 3: Update Error Handling

Replace manual error analysis with type-safe utilities:

```typescript
// Before
try {
  const result = schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const expected = (error.issues[0] as any).expected;
    const received = (error.issues[0] as any).received;
    // Manual error handling...
  }
}

// After
try {
  const result = schema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const analysis = analyzeZodError(error);
    const userMessage = formatZodErrorForUser(error);
    // Type-safe error handling...
  }
}
```

### Step 4: Update Schema Registry Operations

Replace unsafe property access with type-safe alternatives:

```typescript
// Before
const schemaDef = {
  type: (schema._def as any).typeName,
  shape: (schema._def as any).shape,
  // ...
};

// After
const schemaDef = {
  type: getSafeSchemaType(schema),
  shape: isZodObjectSchema(schema) ? getSafeSchemaShape(schema) : undefined,
  // ...
};
```

## Benefits of Migration

### 1. **Type Safety**
- No more `any` assertions
- Full TypeScript intellisense
- Compile-time error detection

### 2. **Better Developer Experience**
- Clear error messages
- Intuitive API design
- Better debugging capabilities

### 3. **Maintainability**
- Self-documenting code
- Easier refactoring
- Reduced runtime errors

### 4. **Performance**
- No runtime type checking overhead
- Better tree-shaking
- Optimized error handling

## Backward Compatibility

The old APIs are still available but deprecated. We recommend migrating to the new type-safe alternatives for better experience.

## Examples

### Complete Migration Example

```typescript
// Before - using any assertions
import { SchemaComposer } from './utils/schema-composition';
import { analyzeError } from './utils/error-debugging';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const composer = new SchemaComposer(userSchema);
const enhancedSchema = composer
  .transform('add-timestamps', (schema) => 
    schema.extend({
      createdAt: z.date().default(() => new Date()),
      updatedAt: z.date().default(() => new Date()),
    }) as any
  )
  .validate('email-uniqueness', (schema) => 
    schema.refine(
      async (data) => !data.email.includes('test@'),
      'Email already exists'
    ) as any
  )
  .build();

// Error handling
try {
  const result = enhancedSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const analysis = analyzeError(error);
    const expected = (error.issues[0] as any).expected;
    const received = (error.issues[0] as any).received;
    console.log(`Expected ${expected}, received ${received}`);
  }
}
```

```typescript
// After - type-safe
import { TypeSafeSchemaComposer } from './utils/type-safe-schema-composition';
import { analyzeZodError, formatZodErrorForUser } from './utils/type-safe-error-handling';

const userSchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

const composer = TypeSafeSchemaComposer.create(userSchema);
const enhancedSchema = composer
  .transform((data) => ({
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))
  .crossField(
    (data) => !data.email.includes('test@'),
    'Email already exists'
  )
  .build();

// Error handling
try {
  const result = enhancedSchema.parse(data);
} catch (error) {
  if (error instanceof z.ZodError) {
    const analysis = analyzeZodError(error);
    const userMessage = formatZodErrorForUser(error, {
      includePath: true,
      includeContext: true,
    });
    console.log(userMessage);
  }
}
```

## Support

If you encounter any issues during migration, please:

1. Check the type definitions in `src/types/zod-internal.types.ts`
2. Review the examples in `src/utils/type-safe-*.ts`
3. Open an issue with your specific use case

The new type-safe implementation provides the same functionality with better type safety and developer experience.
