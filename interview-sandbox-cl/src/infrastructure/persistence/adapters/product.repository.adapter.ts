import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ProductRepositoryPort } from '@domain/ports/output/product.repository.port';
import { Product, ProductProps } from '@domain/entities/product.entity';
import { ProductModel } from '../models/product.model';

@Injectable()
export class SequelizeProductRepositoryAdapter implements ProductRepositoryPort {
    constructor(
        @InjectModel(ProductModel)
        private readonly productModel: typeof ProductModel,
    ) { }

    async save(product: Product): Promise<void> {
        await this.productModel.create({
            id: product.id,
            name: product.name,
            description: product.description,
            price: product.price,
            createdAt: product.createdAt,
            updatedAt: product.updatedAt,
        } as any);
    }

    async findById(id: string): Promise<Product | null> {
        const model = await this.productModel.findByPk(id);
        if (!model) return null;
        return this.toDomain(model);
    }

    private toDomain(model: ProductModel): Product {
        const props: ProductProps = {
            id: model.id,
            name: model.name,
            description: model.description,
            price: model.price,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        };
        return Product.reconstitute(props);
    }
}
