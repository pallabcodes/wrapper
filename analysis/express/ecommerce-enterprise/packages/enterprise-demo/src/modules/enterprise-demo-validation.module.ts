import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { EnterpriseDemoValidationController } from '../controllers/enterprise-demo-validation.controller';
import { EnterpriseDemoValidationService } from '../validation/enterprise-demo-validation.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ZodModule
  ],
  controllers: [EnterpriseDemoValidationController],
  providers: [EnterpriseDemoValidationService],
  exports: [EnterpriseDemoValidationService]
})
export class EnterpriseDemoValidationModule {}
