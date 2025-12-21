import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { ProductRepositoryPort, PRODUCT_REPOSITORY_PORT } from '../../domain/ports/output/product.repository.port';
import { ProductDto } from '../dto/product.dto';
import { ProductMapper } from '../mappers/product.mapper';

@Injectable()
export class GetProductUseCase {
    constructor(
        @Inject(PRODUCT_REPOSITORY_PORT)
        private readonly productRepo: ProductRepositoryPort,
    ) { }

    async execute(id: string): Promise<ProductDto> {
        const product = await this.productRepo.findById(id);
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return ProductMapper.toDto(product);
    }
}
