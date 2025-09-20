import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobileApiDemoController } from './mobile-api-demo.controller';
import { MobileApiDemoService } from './mobile-api-demo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [MobileApiDemoController],
  providers: [MobileApiDemoService],
})
export class AppModule {}
