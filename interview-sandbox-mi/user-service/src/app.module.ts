import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UserController } from './presentation/controllers/user.controller';
import { UserService } from './application/services/user.service';
import { UserRepositoryAdapter } from './infrastructure/persistence/user.repository.adapter';
import { RedisEventSubscriberAdapter } from './infrastructure/messaging/redis.event.subscriber.adapter';
import { USER_REPOSITORY_PORT } from './domain/ports/user.repository.port';
import { EVENT_SUBSCRIBER_PORT } from './domain/ports/event.subscriber.port';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [UserController],
  providers: [
    UserService,
    UserRepositoryAdapter,
    {
      provide: USER_REPOSITORY_PORT,
      useClass: UserRepositoryAdapter,
    },
    {
      provide: EVENT_SUBSCRIBER_PORT,
      useClass: RedisEventSubscriberAdapter,
    },
  ],
})
export class AppModule { }

