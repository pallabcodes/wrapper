import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { DisasterRecoveryValidationController } from '../controllers/disaster-recovery-validation.controller';
import { DisasterRecoveryValidationService } from '../validation/disaster-recovery-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ZodModule
  ],
  controllers: [DisasterRecoveryValidationController],
  providers: [DisasterRecoveryValidationService],
  exports: [DisasterRecoveryValidationService]
})
export class DisasterRecoveryValidationModule {}
