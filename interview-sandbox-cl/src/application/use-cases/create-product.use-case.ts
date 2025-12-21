import { Injectable, Inject } from '@nestjs/common';
import { Product } from '../../domain/entities/product.entity';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/output/product.repository.port';
import { CreateProductDto } from '../dto/create-product.dto';
import { ProductDto } from '../dto/product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class CreateProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY_PORT)
        private readonly productRepo: ProductRepositoryPort,
    ) { }

    async execute(dto: CreateProductDto): Promise<ProductDto> {
        const product = Product.create(dto.name, dto.description, dto.price);
        await this.productRepo.save(product);
        return ProductMapper.toDto(product);
    }
}
