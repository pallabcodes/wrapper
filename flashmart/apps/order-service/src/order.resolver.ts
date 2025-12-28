import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderService } from './order.service';
import { InputType, Field, Float, Int } from '@nestjs/graphql';

@InputType()
export class OrderItemInput {
    @Field()
    productId: string;

    @Field(() => Int)
    quantity: number;

    @Field(() => Float)
    price: number;
}

@Resolver()
export class OrderResolver {
    constructor(private readonly orderService: OrderService) { }

    @Query(() => Order, { nullable: true })
    async order(@Args('id', { type: () => ID }) id: string) {
        return this.orderService.findById(id);
    }

    @Query(() => [Order])
    async ordersByUser(@Args('userId') userId: string) {
        return this.orderService.findByUserId(userId);
    }

    @Mutation(() => Order)
    async createOrder(@Args('userId') userId: string, @Args('items', { type: () => [OrderItemInput] }) items: OrderItemInput[]) {
        return this.orderService.createOrder(userId, items);
    }

    @Mutation(() => Order)
    async updateOrderStatus(
        @Args('orderId') orderId: string,
        @Args('status', { type: () => OrderStatus }) status: OrderStatus,
        @Args('paymentId', { nullable: true }) paymentId?: string,
    ) {
        return this.orderService.updateStatus(orderId, status, paymentId);
    }
}
