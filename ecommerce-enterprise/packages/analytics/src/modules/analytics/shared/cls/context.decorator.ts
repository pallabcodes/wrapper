import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ContextService } from './context.module';

export const Context = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request = ctx.switchToHttp().getRequest();
    const contextService: ContextService = request.app?.get?.(ContextService);
    if (!contextService) return undefined;
    if (!data) return contextService.getAll();
    return contextService.get(data as any);
  },
);


