import { Product } from '../../domain/entities/product.entity';
import { ProductDto } from '../dto/product.dto';

export class ProductMapper {
    static toDto(product: Product): ProductDto {
        return new ProductDto(
            product.id,
            product.name,
            product.description,
            product.price,
        );
    }
}
