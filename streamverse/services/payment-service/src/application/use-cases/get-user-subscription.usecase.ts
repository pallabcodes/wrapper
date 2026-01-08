
import { Inject, Injectable } from '@nestjs/common';
import { ISubscriptionRepository, SUBSCRIPTION_REPOSITORY } from '../../domain/ports/subscription-repository.port';
import { Subscription } from '../../domain/entities/payment.entity';

@Injectable()
export class GetUserSubscriptionUseCase {
    constructor(
        @Inject(SUBSCRIPTION_REPOSITORY)
        private readonly subscriptionRepository: ISubscriptionRepository,
    ) { }

    async execute(userId: string): Promise<Subscription | null> {
        return this.subscriptionRepository.findByUserId(userId);
    }
}
