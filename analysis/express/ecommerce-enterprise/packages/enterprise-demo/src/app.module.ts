import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnterpriseDemoController } from './enterprise-demo.controller';
import { EnterpriseDemoService } from './enterprise-demo.service';
import { TestService } from './test.service';
import { MinimalController } from './minimal.controller';
import { WorkingController } from './working.controller';
import { WorkingService } from './working.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [EnterpriseDemoController, MinimalController, WorkingController],
  providers: [EnterpriseDemoService, TestService, WorkingService],
})
export class AppModule {}
