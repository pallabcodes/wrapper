import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SequelizeModule } from '@nestjs/sequelize';
import { AuthController } from './presentation/controllers/auth.controller';
import { RegisterUserUseCase } from './application/use-cases/register-user.use-case';
import { LoginUserUseCase } from './application/use-cases/login-user.use-case';
import { UserRepositoryPort, USER_REPOSITORY_PORT } from './domain/ports/output/user.repository.port';
import { SequelizeUserRepositoryAdapter } from './infrastructure/persistence/adapters/user.repository.adapter';
import { UserModel } from './infrastructure/persistence/models/user.model';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    SequelizeModule.forRoot({
      dialect: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'interview_db_cl',
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV !== 'production',
    }),
    SequelizeModule.forFeature([UserModel]),
  ],
  controllers: [AuthController],
  providers: [
    // Application Layer: Use Cases
    RegisterUserUseCase,
    LoginUserUseCase,

    // Infrastructure Layer: Adapters
    SequelizeUserRepositoryAdapter,

    // Dependency Inversion: Wire Ports to Adapters
    {
      provide: USER_REPOSITORY_PORT,
      useClass: SequelizeUserRepositoryAdapter,
    },
  ],
})
export class AppModule {}

