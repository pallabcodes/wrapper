import { Module, DynamicModule } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';

export interface EnterpriseAuthOptions {
  jwt: JwtModuleOptions;
  defaultStrategy?: string;
}

@Module({})
export class EnterpriseAuthModule {
  static forRoot(options: EnterpriseAuthOptions): DynamicModule {
    return {
      module: EnterpriseAuthModule,
      imports: [
        PassportModule.register({ defaultStrategy: options.defaultStrategy ?? 'jwt' }),
        JwtModule.register(options.jwt),
      ],
      exports: [PassportModule, JwtModule],
    };
  }

  static forFeature(providers: unknown[] = []): DynamicModule {
    return {
      module: EnterpriseAuthModule,
      providers: providers as any[],
      exports: providers as any[],
    };
  }
}

