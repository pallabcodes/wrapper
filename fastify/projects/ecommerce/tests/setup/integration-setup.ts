/**
 * Integration Test Setup
 * Configure testing environment for integration tests with real database
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import Redis from 'redis';

let prisma: PrismaClient;
let redis: ReturnType<typeof Redis.createClient>;

beforeAll(async () => {
  console.log('🔧 Setting up integration test environment...');
  
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db';
  process.env.REDIS_URL = 'redis://localhost:6380/1';
  
  try {
    // Setup test database
    console.log('📊 Setting up test database...');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    
    // Initialize Prisma client
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    });
    
    await prisma.$connect();
    
    // Initialize Redis client
    redis = Redis.createClient({
      url: process.env.REDIS_URL
    });
    
    await redis.connect();
    
    console.log('✅ Integration test environment ready');
    
  } catch (error) {
    console.error('❌ Failed to setup integration test environment:', error);
    throw error;
  }
});

afterAll(async () => {
  console.log('🧹 Cleaning up integration test environment...');
  
  try {
    // Clean up database
    await prisma.$executeRaw`TRUNCATE TABLE "User", "Product", "Order", "OrderItem" CASCADE`;
    await prisma.$disconnect();
    
    // Clean up Redis
    await redis.flushAll();
    await redis.disconnect();
    
    console.log('✅ Integration test cleanup complete');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
});

beforeEach(async () => {
  // Clean database before each test
  await prisma.$executeRaw`TRUNCATE TABLE "User", "Product", "Order", "OrderItem" CASCADE`;
  
  // Clean Redis cache
  await redis.flushAll();
});

afterEach(async () => {
  // Additional cleanup if needed
});

// Export test utilities
export const testDb = {
  get prisma() {
    return prisma;
  },
  
  get redis() {
    return redis;
  },
  
  async createTestUser(data: any = {}) {
    return await prisma.user.create({
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'hashedpassword',
        role: 'customer',
        ...data
      }
    });
  },
  
  async createTestProduct(data: any = {}) {
    return await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 99.99,
        sku: 'TEST001',
        category: 'Electronics',
        inventory: 10,
        status: 'active',
        ...data
      }
    });
  },
  
  async createTestOrder(userId: string, data: any = {}) {
    return await prisma.order.create({
      data: {
        userId,
        status: 'pending',
        total: 99.99,
        ...data
      }
    });
  }
};

export {};
