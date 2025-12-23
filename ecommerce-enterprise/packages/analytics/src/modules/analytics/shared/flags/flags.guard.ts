import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FLAG_REQUIRED } from './flag.decorator';
import { FlagsService } from './flags.module';

@Injectable()
export class FlagsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly flags: FlagsService) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const cls = context.getClass();
    const meta = this.reflector.getAllAndOverride<{ name: string; defaultEnabled: boolean } | undefined>(
      FLAG_REQUIRED,
      [handler, cls],
    );
    if (!meta) return true;
    return this.flags.isEnabled(meta.name, meta.defaultEnabled);
  }
}


