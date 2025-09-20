import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DisasterRecoveryDemoController } from './disaster-recovery-demo.controller';
import { DisasterRecoveryDemoService } from './disaster-recovery-demo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [DisasterRecoveryDemoController],
  providers: [DisasterRecoveryDemoService],
})
export class AppModule {}
