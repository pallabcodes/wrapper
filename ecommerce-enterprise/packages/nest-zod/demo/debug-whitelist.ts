#!/usr/bin/env node

import { z } from 'zod';

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

const sampleUser = {
  email: 'john.doe@enterprise.com',
  name: 'John Doe',
  age: 30,
  role: 'admin' as const,
  tags: ['premium', 'enterprise'],
  createdAt: new Date().toISOString(),
  isActive: true
};

if (UserSchema instanceof z.ZodObject) {
  console.log('Schema shape keys:', Object.keys(UserSchema.shape));
}

// Test whitelisting logic
function extractSchemaProperties(schema: z.ZodSchema): string[] {
  if (schema instanceof z.ZodObject) {
    return Object.keys(schema.shape);
  }
  return [];
}

function filterProperties(data: unknown, allowedProperties: string[]): Record<string, unknown> {
  if (typeof data !== 'object' || data === null) {
    return {};
  }
  
  const result: Record<string, unknown> = {};
  for (const prop of allowedProperties) {
    if (prop in data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      result[prop] = (data as Record<string, unknown>)[prop];
    }
  }
  return result;
}

const allowedProperties = extractSchemaProperties(UserSchema);
console.log('Allowed properties:', allowedProperties);

const filteredData = filterProperties(sampleUser, allowedProperties);
console.log('Filtered data:', filteredData);

// Test validation on filtered data
try {
  const result = UserSchema.parse(filteredData);
  console.log('Validation SUCCESS:', result);
} catch (error) {
  console.log('Validation FAILED:', error);
}
