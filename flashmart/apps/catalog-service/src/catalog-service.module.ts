import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { CatalogResolver } from './catalog.resolver';
import { CatalogService } from './catalog.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity, CategoryEntity } from './entities/product.orm-entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    GraphQLModule.forRoot<ApolloFederationDriverConfig>({
      driver: ApolloFederationDriver,
      autoSchemaFile: { federation: 2 },
    }),
    DatabaseModule,
    TypeOrmModule.forFeature([ProductEntity, CategoryEntity]),
  ],
  providers: [CatalogResolver, CatalogService],
})
export class CatalogServiceModule { }
