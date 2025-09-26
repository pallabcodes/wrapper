import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MobileApiDemoController } from './mobile-api-demo.controller';
import { MobileApiDemoService } from './mobile-api-demo.service';
import { MobileApiModule } from '@ecommerce-enterprise/nest-mobile-apis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MobileApiModule.forRoot({
      enableCompression: true,
      enableCaching: true,
      enableOptimization: true,
      rateLimit: { windowMs: 60000, max: 50 },
    }),
  ],
  controllers: [MobileApiDemoController],
  providers: [MobileApiDemoService],
})
export class AppModule {}
