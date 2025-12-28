import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderResolver } from './order.resolver';
import { OrderService } from './order.service';
import { OrderEntity, OrderEventEntity } from './entities/order.orm-entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'flashmart'),
        password: config.get('DB_PASSWORD', 'flashmart_dev'),
        database: config.get('DB_NAME', 'flashmart'),
        schema: 'order_service', // Separate schema per service
        entities: [OrderEntity, OrderEventEntity],
        synchronize: config.get('NODE_ENV', 'development') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([OrderEntity, OrderEventEntity]),
  ],
  providers: [OrderResolver, OrderService],
})
export class OrderServiceModule { }
