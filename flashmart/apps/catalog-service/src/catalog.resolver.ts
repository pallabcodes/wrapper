import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Product, Category } from './entities/product.entity';
import { CatalogService } from './catalog.service';

@Resolver()
export class CatalogResolver {
    constructor(private readonly catalogService: CatalogService) { }

    @Query(() => Product, { nullable: true })
    async product(@Args('id', { type: () => ID }) id: string) {
        return this.catalogService.findProductById(id);
    }

    @Query(() => [Product])
    async products(
        @Args('categoryId', { nullable: true }) categoryId?: string,
        @Args('limit', { nullable: true, defaultValue: 20 }) limit?: number,
    ) {
        return this.catalogService.findProducts(categoryId, limit);
    }

    @Query(() => [Category])
    async categories() {
        return this.catalogService.findCategories();
    }

    @Mutation(() => Product)
    async createProduct(
        @Args('name') name: string,
        @Args('description') description: string,
        @Args('price') price: number,
        @Args('categoryId') categoryId: string,
        @Args('stock', { defaultValue: 0 }) stock: number,
    ) {
        return this.catalogService.createProduct({ name, description, price, categoryId, stock });
    }

    @Mutation(() => Category)
    async createCategory(@Args('name') name: string, @Args('description', { nullable: true }) description?: string) {
        return this.catalogService.createCategory({ name, description });
    }
}
