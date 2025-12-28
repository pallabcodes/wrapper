import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';

export enum PaymentStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    SUCCEEDED = 'SUCCEEDED',
    FAILED = 'FAILED',
    REFUNDED = 'REFUNDED',
}

registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

@ObjectType()
export class Payment {
    @Field(() => ID)
    id: string;

    @Field()
    userId: string;

    @Field()
    amount: number;

    @Field()
    currency: string;

    @Field(() => PaymentStatus)
    status: PaymentStatus;

    @Field({ nullable: true })
    stripePaymentIntentId?: string;

    @Field()
    createdAt: Date;

    @Field()
    updatedAt: Date;
}
