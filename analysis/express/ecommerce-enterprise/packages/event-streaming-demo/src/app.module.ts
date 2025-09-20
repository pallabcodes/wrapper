import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventStreamingDemoController } from './event-streaming-demo.controller';
import { SimpleEventDemoService } from './simple-event-demo.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [EventStreamingDemoController],
  providers: [SimpleEventDemoService],
})
export class AppModule {}
