import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ProfileModule } from './profile/profile.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [ProfileModule, NotificationModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
