import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloFederationDriver, ApolloFederationDriverConfig } from '@nestjs/apollo';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoResolver } from './video.resolver';
import { VideoService } from './video.service';
import { VideoEntity } from './entities/video.orm-entity';
import { S3Service } from './storage/s3.service';
import { RekognitionService } from './ai/rekognition.service';

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
        entities: [VideoEntity],
        synchronize: config.get('NODE_ENV', 'development') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([VideoEntity]),
  ],
  providers: [VideoResolver, VideoService, S3Service, RekognitionService],
})
export class VideoServiceModule { }
