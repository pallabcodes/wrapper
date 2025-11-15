import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ApiGatewayController } from './controllers/api-gateway.controller';
import { ApiGatewayService } from './services/api-gateway.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ApiGatewayController],
  providers: [ApiGatewayService],
})
export class AppModule {}

