import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ComplianceModule } from '@ecommerce-enterprise/nest-compliance';
import { ComplianceDemoController } from './compliance-demo.controller';
import { ComplianceDemoService } from './compliance-demo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ComplianceModule
  ],
  controllers: [ComplianceDemoController],
  providers: [ComplianceDemoService],
})
export class AppModule {}
