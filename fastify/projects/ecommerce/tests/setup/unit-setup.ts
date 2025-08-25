/**
 * Unit Test Setup
 * Configure testing environment for isolated unit tests
 */

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';

// Mock external dependencies
vi.mock('@prisma/client', () => ({
  PrismaClient: vi.fn(() => ({
    $connect: vi.fn(),
    $disconnect: vi.fn(),
    product: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    order: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    user: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }))
}));

// Mock Redis
vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    flushAll: vi.fn()
  }))
}));

// Mock external services
vi.mock('stripe', () => ({
  default: vi.fn(() => ({
    paymentIntents: {
      create: vi.fn(),
      retrieve: vi.fn(),
      confirm: vi.fn()
    },
    customers: {
      create: vi.fn(),
      retrieve: vi.fn()
    }
  }))
}));

// Mock file system operations
vi.mock('fs', () => ({
  createReadStream: vi.fn(),
  createWriteStream: vi.fn(),
  existsSync: vi.fn(() => true),
  readFile: vi.fn(),
  writeFile: vi.fn()
}));

// Mock worker threads for testing
vi.mock('worker_threads', () => ({
  Worker: vi.fn(),
  isMainThread: true,
  parentPort: null,
  workerData: {}
}));

// Global test configuration
beforeAll(async () => {
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-secret-key';
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

  console.log('🧪 Setting up unit test environment...');
});

afterAll(async () => {
  console.log('🧹 Cleaning up unit test environment...');
  vi.clearAllMocks();
  vi.resetAllMocks();
});

beforeEach(() => {
  // Clear all mocks before each test
  vi.clearAllMocks();
});

afterEach(() => {
  // Additional cleanup after each test
  vi.restoreAllMocks();
});

// Global test utilities
declare global {
  var testUtils: {
    createMockProduct: () => any;
    createMockUser: () => any;
    createMockOrder: () => any;
  };
}

globalThis.testUtils = {
  createMockProduct: () => ({
    id: 'prod_123',
    name: 'Test Product',
    price: 99.99,
    sku: 'TEST001',
    category: 'Electronics',
    inventory: 10,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockUser: () => ({
    id: 'user_123',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'customer',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }),

  createMockOrder: () => ({
    id: 'order_123',
    userId: 'user_123',
    status: 'pending',
    total: 199.98,
    items: [
      {
        productId: 'prod_123',
        quantity: 2,
        price: 99.99
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  })
};

// Mock console methods for cleaner test output
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: originalConsole.error // Keep errors visible
};

export {};
