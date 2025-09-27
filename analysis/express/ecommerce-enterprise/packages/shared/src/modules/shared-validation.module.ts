import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { SharedValidationService } from '../validation/shared-validation.service';
import { SharedValidationController } from '../controllers/shared-validation.controller';

@Module({
  imports: [
    ConfigModule,
    ZodModule,
  ],
  controllers: [SharedValidationController],
  providers: [SharedValidationService],
  exports: [SharedValidationService],
})
export class SharedValidationModule {}
