
import { Controller, Logger } from '@nestjs/common';
import { EventPattern, Payload, Ctx, KafkaContext } from '@nestjs/microservices';

@Controller()
export class UserEventsController {
    private readonly logger = new Logger(UserEventsController.name);

    @EventPattern('user.registered')
    async handleUserRegistered(@Payload() data: any, @Ctx() context: KafkaContext) {
        this.logger.log(`Received user.registered event: ${JSON.stringify(data)}`);

        // Structure depends on DomainEvent.toJSON()
        // data might be the full event object including metadata
        const { email, username } = data.payload || data;

        this.logger.log(`Sending Welcome Email to ${email} (User: ${username})`);
        // TODO: Call SendNotificationUseCase
    }
}
