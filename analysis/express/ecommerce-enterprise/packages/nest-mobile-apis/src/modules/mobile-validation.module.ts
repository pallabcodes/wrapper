/**
 * Mobile Validation Module
 * 
 * This module integrates our enterprise Zod validation into the mobile APIs
 * with device-aware validation and mobile-specific optimizations.
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { MobileValidationService } from '../validation/mobile-validation.service';
import { MobileValidationController } from '../controllers/mobile-validation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ZodModule
  ],
  controllers: [MobileValidationController],
  providers: [MobileValidationService],
  exports: [MobileValidationService]
})
export class MobileValidationModule {}
