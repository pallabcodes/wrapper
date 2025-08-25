/**
 * Product Domain Logic Unit Tests
 * Testing business rules and domain logic in isolation
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock domain types and classes for demonstration
interface ProductData {
  id: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  inventory: number;
  status: 'active' | 'inactive' | 'discontinued';
}

class MockProductAggregate {
  constructor(private data: ProductData) {}

  static create(data: Omit<ProductData, 'status'>): MockProductAggregate {
    // Validate business rules
    if (data.price <= 0) {
      throw new Error('Price must be positive');
    }
    if (!data.sku || data.sku.length < 6) {
      throw new Error('SKU must be at least 6 characters');
    }
    if (!data.name.trim()) {
      throw new Error('Product name is required');
    }
    
    return new MockProductAggregate({
      ...data,
      status: 'active'
    });
  }

  getId(): string {
    return this.data.id;
  }

  getName(): string {
    return this.data.name;
  }

  getPrice(): number {
    return this.data.price;
  }

  getSKU(): string {
    return this.data.sku;
  }

  getCategory(): string {
    return this.data.category;
  }

  getInventory(): number {
    return this.data.inventory;
  }

  getStatus(): string {
    return this.data.status;
  }

  updatePrice(newPrice: number): void {
    if (newPrice <= 0) {
      throw new Error('Price must be positive');
    }
    this.data.price = newPrice;
  }

  updateName(newName: string): void {
    if (!newName.trim()) {
      throw new Error('Product name is required');
    }
    this.data.name = newName;
  }

  increaseInventory(amount: number): void {
    if (amount <= 0) {
      throw new Error('Amount must be positive');
    }
    this.data.inventory += amount;
  }

  decreaseInventory(amount: number): void {
    if (this.data.inventory < amount) {
      throw new Error('Insufficient inventory');
    }
    this.data.inventory -= amount;
  }

  deactivate(): void {
    this.data.status = 'inactive';
  }

  activate(): void {
    this.data.status = 'active';
  }

  markAsDiscontinued(): void {
    this.data.status = 'discontinued';
  }

  isActive(): boolean {
    return this.data.status === 'active';
  }

  isDiscontinued(): boolean {
    return this.data.status === 'discontinued';
  }
}

describe('MockProductAggregate', () => {
  let productData: Omit<ProductData, 'status'>;

  beforeEach(() => {
    productData = {
      id: 'prod_123',
      name: 'Test Product',
      price: 99.99,
      sku: 'TEST001',
      category: 'Electronics',
      inventory: 10
    };
  });

  describe('creation', () => {
    it('should create a new product with valid data', () => {
      const product = MockProductAggregate.create(productData);
      
      expect(product.getId()).toBe('prod_123');
      expect(product.getName()).toBe('Test Product');
      expect(product.getPrice()).toBe(99.99);
      expect(product.getSKU()).toBe('TEST001');
      expect(product.getCategory()).toBe('Electronics');
      expect(product.getInventory()).toBe(10);
      expect(product.getStatus()).toBe('active');
    });

    it('should throw error for invalid price', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          price: -10
        });
      }).toThrow('Price must be positive');
    });

    it('should throw error for invalid SKU', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          sku: 'SHORT'
        });
      }).toThrow('SKU must be at least 6 characters');
    });

    it('should throw error for empty name', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          name: ''
        });
      }).toThrow('Product name is required');
    });
  });

  describe('updating', () => {
    let product: MockProductAggregate;

    beforeEach(() => {
      product = MockProductAggregate.create(productData);
    });

    it('should update product name', () => {
      product.updateName('Updated Product');
      expect(product.getName()).toBe('Updated Product');
    });

    it('should not allow empty name update', () => {
      expect(() => {
        product.updateName('');
      }).toThrow('Product name is required');
    });

    it('should update product price', () => {
      product.updatePrice(149.99);
      expect(product.getPrice()).toBe(149.99);
    });

    it('should not allow updating to negative price', () => {
      expect(() => {
        product.updatePrice(-50);
      }).toThrow('Price must be positive');
    });
  });

  describe('inventory management', () => {
    let product: MockProductAggregate;

    beforeEach(() => {
      product = MockProductAggregate.create(productData);
    });

    it('should increase inventory', () => {
      product.increaseInventory(5);
      expect(product.getInventory()).toBe(15);
    });

    it('should not allow negative inventory increase', () => {
      expect(() => {
        product.increaseInventory(-5);
      }).toThrow('Amount must be positive');
    });

    it('should decrease inventory', () => {
      product.decreaseInventory(3);
      expect(product.getInventory()).toBe(7);
    });

    it('should not allow decreasing more than available', () => {
      expect(() => {
        product.decreaseInventory(15);
      }).toThrow('Insufficient inventory');
    });
  });

  describe('status management', () => {
    let product: MockProductAggregate;

    beforeEach(() => {
      product = MockProductAggregate.create(productData);
    });

    it('should deactivate product', () => {
      product.deactivate();
      expect(product.getStatus()).toBe('inactive');
      expect(product.isActive()).toBe(false);
    });

    it('should activate product', () => {
      product.deactivate();
      product.activate();
      expect(product.getStatus()).toBe('active');
      expect(product.isActive()).toBe(true);
    });

    it('should mark product as discontinued', () => {
      product.markAsDiscontinued();
      expect(product.getStatus()).toBe('discontinued');
      expect(product.isDiscontinued()).toBe(true);
    });
  });

  describe('business rules validation', () => {
    it('should validate SKU length', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          sku: 'SHORT'
        });
      }).toThrow('SKU must be at least 6 characters');
    });

    it('should validate required fields', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          name: '   '
        });
      }).toThrow('Product name is required');
    });

    it('should validate positive price', () => {
      expect(() => {
        MockProductAggregate.create({
          ...productData,
          price: 0
        });
      }).toThrow('Price must be positive');
    });
  });

  describe('complex business scenarios', () => {
    it('should handle inventory operations correctly', () => {
      const product = MockProductAggregate.create(productData);
      
      // Multiple operations
      product.increaseInventory(10); // 20 total
      product.decreaseInventory(5);  // 15 total
      product.increaseInventory(3);  // 18 total
      
      expect(product.getInventory()).toBe(18);
    });

    it('should maintain data consistency', () => {
      const product = MockProductAggregate.create(productData);
      
      const originalId = product.getId();
      const originalSKU = product.getSKU();
      
      // Update multiple fields
      product.updateName('New Name');
      product.updatePrice(199.99);
      product.increaseInventory(5);
      
      // Core identifiers should remain unchanged
      expect(product.getId()).toBe(originalId);
      expect(product.getSKU()).toBe(originalSKU);
      
      // Updated fields should reflect changes
      expect(product.getName()).toBe('New Name');
      expect(product.getPrice()).toBe(199.99);
      expect(product.getInventory()).toBe(15);
    });
  });
});
