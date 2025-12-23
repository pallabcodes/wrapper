import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ZodModule } from '@ecommerce-enterprise/nest-zod';
import { EnterpriseIntegrationValidationService } from '../validation/enterprise-integration-validation.service';
import { EnterpriseIntegrationValidationController } from '../controllers/enterprise-integration-validation.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ZodModule,
  ],
  controllers: [EnterpriseIntegrationValidationController],
  providers: [EnterpriseIntegrationValidationService],
  exports: [EnterpriseIntegrationValidationService],
})
export class EnterpriseIntegrationValidationModule {}
