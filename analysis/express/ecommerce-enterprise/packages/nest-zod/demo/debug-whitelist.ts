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

console.log('Schema _def:', (UserSchema as any)._def);
console.log('Schema _def.shape:', (UserSchema as any)._def.shape);
console.log('Schema keys:', Object.keys((UserSchema as any)._def.shape));

// Test whitelisting logic
function extractSchemaProperties(schema: z.ZodSchema): string[] {
  if (schema._def && (schema._def as any).shape) {
    return Object.keys((schema._def as any).shape);
  }
  return [];
}

function filterProperties(data: any, allowedProperties: string[]): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const result: any = {};
  for (const prop of allowedProperties) {
    if (prop in data) {
      result[prop] = data[prop];
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
