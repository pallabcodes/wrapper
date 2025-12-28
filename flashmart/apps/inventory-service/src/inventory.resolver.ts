import { Resolver, Query, Mutation, Args, Int, ObjectType, Field } from '@nestjs/graphql';
import { InventoryService, ReservationResult } from './inventory.service';

@ObjectType()
class StockReservationResult {
    @Field()
    success: boolean;

    @Field()
    productId: string;

    @Field(() => Int)
    quantity: number;

    @Field(() => Int)
    remaining: number;

    @Field({ nullable: true })
    message?: string;
}

@Resolver()
export class InventoryResolver {
    constructor(private readonly inventoryService: InventoryService) { }

    @Query(() => Int)
    async stockLevel(@Args('productId') productId: string): Promise<number> {
        return this.inventoryService.getStock(productId);
    }

    @Mutation(() => Boolean)
    async setStockLevel(
        @Args('productId') productId: string,
        @Args('quantity', { type: () => Int }) quantity: number,
    ): Promise<boolean> {
        await this.inventoryService.setStock(productId, quantity);
        return true;
    }

    @Mutation(() => StockReservationResult)
    async reserveStock(
        @Args('productId') productId: string,
        @Args('quantity', { type: () => Int }) quantity: number,
    ): Promise<ReservationResult> {
        return this.inventoryService.reserveStock(productId, quantity);
    }

    @Mutation(() => Boolean)
    async releaseStock(
        @Args('productId') productId: string,
        @Args('quantity', { type: () => Int }) quantity: number,
    ): Promise<boolean> {
        await this.inventoryService.releaseStock(productId, quantity);
        return true;
    }
}
