import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/user.orm-entity';

@Module({
    imports: [
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
                schema: 'user_service', // Separate schema per service
                entities: [UserEntity],
                synchronize: config.get('NODE_ENV', 'development') === 'development',
                logging: config.get('DB_LOGGING', 'false') === 'true',
            }),
        }),
        TypeOrmModule.forFeature([UserEntity]),
    ],
    exports: [TypeOrmModule],
})
export class DatabaseModule { }
