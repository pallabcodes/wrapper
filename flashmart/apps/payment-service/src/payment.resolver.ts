import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { Payment } from './entities/payment.entity';
import { PaymentService } from './payment.service';
import { CreatePaymentInput } from './dto/create-payment.input';

@Resolver(() => Payment)
export class PaymentResolver {
    constructor(private readonly paymentService: PaymentService) { }

    @Query(() => Payment, { nullable: true })
    async payment(@Args('id') id: string): Promise<Payment | null> {
        return this.paymentService.findById(id);
    }

    @Query(() => [Payment])
    async paymentsByUser(@Args('userId') userId: string): Promise<Payment[]> {
        return this.paymentService.findByUserId(userId);
    }

    @Mutation(() => Payment)
    async createPayment(@Args('input') input: CreatePaymentInput): Promise<Payment> {
        return this.paymentService.create(input);
    }

    @Mutation(() => Payment)
    async confirmPayment(@Args('id') id: string): Promise<Payment> {
        return this.paymentService.confirm(id);
    }
}
