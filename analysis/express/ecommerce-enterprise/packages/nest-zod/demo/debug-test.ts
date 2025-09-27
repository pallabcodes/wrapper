#!/usr/bin/env node

import { z } from 'zod';
import { ZodValidationService } from '../src/services';

const validationService = new ZodValidationService();

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

console.log('Sample user data:', JSON.stringify(sampleUser, null, 2));

// Test direct Zod validation
console.log('\n--- Direct Zod validation ---');
try {
  const directResult = UserSchema.parse(sampleUser);
  console.log('Direct validation SUCCESS:', directResult);
} catch (error) {
  console.log('Direct validation FAILED:', error);
}

// Test our service validation
console.log('\n--- Service validation ---');
validationService.validate(sampleUser, {
  schema: UserSchema,
  transform: true,
  whitelist: true
}).then(result => {
  console.log('Service validation result:', result);
}).catch(error => {
  console.log('Service validation error:', error);
});
