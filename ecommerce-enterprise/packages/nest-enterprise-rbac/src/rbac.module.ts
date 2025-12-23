import { DynamicModule, Module } from '@nestjs/common';
import { RbacGuard } from './rbac.guard';

@Module({})
export class RbacModule {
  static forRoot(): DynamicModule {
    return {
      module: RbacModule,
      providers: [RbacGuard],
      exports: [RbacGuard],
    };
  }

  static forFeature(): DynamicModule {
    return {
      module: RbacModule,
      providers: [RbacGuard],
      exports: [RbacGuard],
    };
  }
}
