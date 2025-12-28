import { ObjectType, Field, ID, Float, Int, registerEnumType } from '@nestjs/graphql';

export enum OrderStatus {
    PENDING = 'PENDING',
    PAYMENT_PENDING = 'PAYMENT_PENDING',
    CONFIRMED = 'CONFIRMED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@ObjectType()
export class OrderItem {
    @Field()
    productId: string;

    @Field(() => Int)
    quantity: number;

    @Field(() => Float)
    price: number;
}

@ObjectType()
export class Order {
    @Field(() => ID)
    id: string;

    @Field()
    userId: string;

    @Field(() => [OrderItem])
    items: OrderItem[];

    @Field(() => Float)
    totalAmount: number;

    @Field(() => OrderStatus)
    status: OrderStatus;

    @Field({ nullable: true })
    paymentId?: string;

    @Field()
    createdAt: Date;
}
