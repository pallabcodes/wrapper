import { SequelizeModuleOptions } from '@nestjs/sequelize';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): SequelizeModuleOptions => {
  return {
    dialect: 'mysql',
    host: configService.get<string>('database.host'),
    port: configService.get<number>('database.port'),
    username: configService.get<string>('database.username'),
    password: configService.get<string>('database.password'),
    database: configService.get<string>('database.database'),
    autoLoadModels: true,
    synchronize: false, // Use migrations in production
    logging: configService.get<string>('app.env') === 'development' ? console.log : false,
    pool: configService.get('database.pool'),
    retry: configService.get('database.retry'),
  };
};

