import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity, CategoryEntity } from './entities/product.orm-entity';
import { Product, Category } from './entities/product.entity';

@Injectable()
export class CatalogService {
    constructor(
        @InjectRepository(ProductEntity)
        private readonly productRepo: Repository<ProductEntity>,
        @InjectRepository(CategoryEntity)
        private readonly categoryRepo: Repository<CategoryEntity>,
    ) { }

    // Products
    async findProductById(id: string): Promise<Product | null> {
        const entity = await this.productRepo.findOne({ where: { id } });
        return entity ? this.toProduct(entity) : null;
    }

    async findProducts(categoryId?: string, limit = 20): Promise<Product[]> {
        const query = this.productRepo.createQueryBuilder('p').where('p.isActive = true');
        if (categoryId) query.andWhere('p.categoryId = :categoryId', { categoryId });
        const entities = await query.limit(limit).getMany();
        return entities.map(e => this.toProduct(e));
    }

    async createProduct(input: Partial<ProductEntity>): Promise<Product> {
        const entity = this.productRepo.create(input);
        await this.productRepo.save(entity);
        return this.toProduct(entity);
    }

    // Categories
    async findCategoryById(id: string): Promise<Category | null> {
        const entity = await this.categoryRepo.findOne({ where: { id } });
        return entity ? this.toCategory(entity) : null;
    }

    async findCategories(): Promise<Category[]> {
        const entities = await this.categoryRepo.find();
        return entities.map(e => this.toCategory(e));
    }

    async createCategory(input: Partial<CategoryEntity>): Promise<Category> {
        const entity = this.categoryRepo.create(input);
        await this.categoryRepo.save(entity);
        return this.toCategory(entity);
    }

    private toProduct(e: ProductEntity): Product {
        return {
            id: e.id,
            name: e.name,
            description: e.description,
            price: Number(e.price),
            stock: e.stock,
            imageUrl: e.imageUrl,
            images: e.images,
            categoryId: e.categoryId,
            isActive: e.isActive,
            createdAt: e.createdAt,
        };
    }

    private toCategory(e: CategoryEntity): Category {
        return { id: e.id, name: e.name, description: e.description, imageUrl: e.imageUrl };
    }
}
