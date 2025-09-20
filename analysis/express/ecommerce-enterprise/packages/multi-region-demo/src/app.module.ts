import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MultiRegionModule } from '@ecommerce-enterprise/nest-multi-region';
import { MultiRegionDemoController } from './multi-region-demo.controller';
import { MultiRegionDemoService } from './multi-region-demo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MultiRegionModule
  ],
  controllers: [MultiRegionDemoController],
  providers: [MultiRegionDemoService],
})
export class AppModule {}
