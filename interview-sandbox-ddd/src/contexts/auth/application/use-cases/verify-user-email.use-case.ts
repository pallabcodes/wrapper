import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';
import { UserRegistrationDomainService } from '../../domain/domain-services/user-registration.service';

export interface VerifyUserEmailCommand {
  userId: string;
}

@Injectable()
export class VerifyUserEmailUseCase {
  constructor(
    private readonly userRegistrationDomainService: UserRegistrationDomainService,
    private readonly eventBus: EventBus,
  ) { }

  async execute(command: VerifyUserEmailCommand): Promise<void> {
    try {
      // Domain service handles the business logic and persistence
      await this.userRegistrationDomainService.verifyUserEmail(command.userId);

      // The domain service already publishes events through the repository
      // No additional event publishing needed here

    } catch (error) {
      console.error('Error in VerifyUserEmailUseCase:', error);
      throw error;
    }
  }
}
