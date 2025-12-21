import { Product } from './product.entity';

describe('Product Entity', () => {
    it('should create a valid product', () => {
        const product = Product.create('Test Product', 'Desc', 100);
        expect(product.id).toBeDefined();
        expect(product.price).toBe(100);
    });

    it('should throw error for negative price', () => {
        expect(() => {
            Product.create('Bad Product', 'Desc', -10);
        }).toThrow('Price cannot be negative');
    });
});
