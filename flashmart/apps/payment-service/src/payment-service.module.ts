import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { StripeModule } from './stripe/stripe.module';
import { PaymentResolver } from './payment.resolver';
import { PaymentService } from './payment.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentEntity } from './entities/payment.orm-entity';
import { EventsModule, KafkaEventBus } from '@flashmart/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: {
        federation: 2,
      },
    }),
    DatabaseModule,
    StripeModule,
    EventsModule,
    TypeOrmModule.forFeature([PaymentEntity]),
  ],
  providers: [PaymentResolver, PaymentService],
})
export class PaymentServiceModule { }