import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsPositive, IsUUID, Length, IsOptional } from 'class-validator';

@InputType()
export class CreatePaymentInput {
    @Field()
    @IsUUID()
    userId: string;

    @Field()
    @IsPositive()
    amount: number;

    @Field()
    @Length(3, 3)
    currency: string;

    @Field({ nullable: true })
    @IsOptional()
    @IsUUID()
    orderId?: string;
}
