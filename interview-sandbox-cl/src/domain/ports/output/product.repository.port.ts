import { Product } from '../../entities/product.entity';

export const PRODUCT_REPOSITORY_PORT = Symbol('PRODUCT_REPOSITORY_PORT');

export interface ProductRepositoryPort {
    save(product: Product): Promise<void>;
    findById(id: string): Promise<Product | null>;
}
