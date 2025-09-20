import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SimpleMobileApiDemoController } from './simple-mobile-api-demo.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [SimpleMobileApiDemoController],
  providers: [],
})
export class SimpleAppModule {}