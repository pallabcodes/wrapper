import { Module } from '@nestjs/common';
import { createJwtModule } from '@common/utils/module-helpers';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    createJwtModule(), // Use helper for consistency with AuthModule
    // ConfigModule not needed: isGlobal: true + createJwtModule() imports it internally
  ],
  providers: [NotificationsGateway, NotificationsService],
  exports: [NotificationsGateway, NotificationsService],
})
export class NotificationsModule {}

