
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

@Controller()
export class PaymentEventsController {
    private readonly logger = new Logger(PaymentEventsController.name);

    @EventPattern('payment.created')
    async handlePaymentCreated(@Payload() data: any, @Ctx() context: KafkaContext) {
        this.logger.log(`Received payment.created event: ${JSON.stringify(data)}`);
        // TODO: Call SendNotificationUseCase (e.g. "Payment Initiated" email)
    }

    @EventPattern('payment.completed')
    async handlePaymentCompleted(@Payload() data: any, @Ctx() context: KafkaContext) {
        this.logger.log(`Received payment.completed event: ${JSON.stringify(data)}`);

        const { userId, amount, currency } = data.payload || data; // Handle domain event structure

        this.logger.log(`Processing Receipt for User ${userId}, Amount: ${amount} ${currency}`);
        // TODO: Call SendNotificationUseCase (Receipt email)
    }

    @EventPattern('payment.failed')
    async handlePaymentFailed(@Payload() data: any, @Ctx() context: KafkaContext) {
        this.logger.warn(`Received payment.failed event: ${JSON.stringify(data)}`);
        // TODO: Call SendNotificationUseCase (Retry prompt)
    }
}
